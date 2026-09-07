from django.contrib.auth.decorators import login_required
from django.db import transaction
from django.db.models import Prefetch
from django.shortcuts import render, redirect, get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import generics, serializers, status
from rest_framework.permissions import IsAuthenticated
from cart.models import CartItem
from .models import Order, OrderItem
from .serializers import CheckoutSerializer, OrderSerializer
from .forms import CheckoutForm
from store.models import ProductVariant

# Create your views here.


# ============================================================
# HTML views (browser) - the MVT side of ordering. A logged-in
# user fills the checkout form, submits place_order, and lands on
# the order confirmation page. Order history is browsable too.
# ============================================================

def _cart_summary(cart_items):
    """Totals used by the HTML checkout page (mirrors the API totals)."""
    total = sum(item.subtotal() for item in cart_items)
    tax = round(2 * total / 100, 2)
    return total, tax, total + tax


@login_required
def checkout(request):
    """GET /orders/checkout/ -> show shipping form + order summary."""
    cart_items = CartItem.objects.filter(user=request.user, isAvailable=True) \
        .select_related('variant__product_color__product', 'variant__size')
    if not cart_items:
        return redirect('cart')

    total, tax, grand_total = _cart_summary(cart_items)
    form = CheckoutForm(initial={
        'full_name': f"{request.user.first_name} {request.user.last_name}".strip(),
        'email': request.user.email,
        'phone': getattr(request.user, 'phone_number', ''),
    })
    context = {
        'cart_items': cart_items,
        'total': total,
        'tax': tax,
        'grand_total': grand_total,
        'form': form,
    }
    return render(request, 'orders/checkout.html', context)


@login_required
def place_order(request):
    """POST /orders/place_order/ -> validate form, create the order, clear cart."""
    if request.method != 'POST':
        return redirect('checkout')

    form = CheckoutForm(request.POST)
    if not form.is_valid():
        # Re-render checkout with the error + current cart totals.
        cart_items = CartItem.objects.filter(user=request.user, isAvailable=True)
        total, tax, grand_total = _cart_summary(cart_items)
        return render(request, 'orders/checkout.html', {
            'cart_items': cart_items, 'total': total,
            'tax': tax, 'grand_total': grand_total, 'form': form,
        })

    cart_items = CartItem.objects.filter(user=request.user, isAvailable=True)
    if not cart_items:
        return redirect('cart')

    data = form.cleaned_data
    total, tax, grand_total = _cart_summary(cart_items)

    # transaction.atomic(): create order OR fail cleanly - never a partial order.
    try:
        with transaction.atomic():
            order = Order.objects.create(
                user=request.user,
                total=total,
                tax=tax,
                grand_total=grand_total,
                ip=request.META.get('REMOTE_ADDR', ''),
                **data,
            )
            for item in cart_items:
                variant = ProductVariant.objects.select_for_update().get(id=item.variant_id)
                if variant.stock < item.quantity:
                    # Atomic block will roll back everything already created.
                    raise serializers.ValidationError(
                        f'Not enough stock for {item.variant}. Only {variant.stock} left.'
                    )
                OrderItem.objects.create(
                    order=order, variant=variant,
                    quantity=item.quantity, price=variant.price,
                )
                variant.stock -= item.quantity
                variant.save()
            cart_items.delete()
    except serializers.ValidationError as e:
        # Rolled back. Re-show checkout with the stock error.
        cart_items = CartItem.objects.filter(user=request.user, isAvailable=True)
        total, tax, grand_total = _cart_summary(cart_items)
        form.add_error(None, str(e.detail[0]) if isinstance(e.detail, list) else str(e.detail))
        return render(request, 'orders/checkout.html', {
            'cart_items': cart_items, 'total': total,
            'tax': tax, 'grand_total': grand_total, 'form': form,
        })

    return render(request, 'orders/order_complete.html', {'order': order, 'order_number': order.order_number})


@login_required
def orders(request):
    """GET /orders/ -> current user's order history."""
    user_orders = Order.objects.filter(user=request.user) \
        .prefetch_related('items').order_by('-created_at')
    return render(request, 'orders/orders.html', {'orders': user_orders})


@login_required
def order_detail(request, order_number):
    """GET /orders/<order_number>/ -> a single order (owner only)."""
    order = get_object_or_404(Order, user=request.user, order_number=order_number)
    items = order.items.select_related('variant__product_color__product')
    return render(request, 'orders/order_detail.html', {'order': order, 'order_items': items})


class CheckoutView(APIView):
    """
    POST /orders/api/checkout/
    Body: shipping address (full_name, phone, email, address_line_1, ...)

    Flow (this is the heart of the order system):
      1. Validate the shipping form
      2. Load the user's cart
      3. Compute totals on the SERVER (never trust client-sent prices)
      4. Create the Order + OrderItems inside a transaction
      5. Decrement stock, clear the cart
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = CheckoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        cart_items = CartItem.objects.filter(user=request.user, isAvailable=True)
        if not cart_items:
            return Response(
                {'detail': 'Your cart is empty.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        total = sum(item.subtotal() for item in cart_items)
        tax = round(2 * total / 100, 2)
        grand_total = total + tax
        data = serializer.validated_data

        # transaction.atomic(): either EVERYTHING below succeeds, or nothing is
        # written. Prevents a half-created order if stock check fails midway.
        with transaction.atomic():
            order = Order.objects.create(
                user=request.user,
                total=total,
                tax=tax,
                grand_total=grand_total,
                ip=request.META.get('REMOTE_ADDR', ''),
                **data,
            )
            for item in cart_items:
                # select_for_update() LOCKS the variant row until this
                # transaction commits, so two simultaneous checkouts cannot
                # both read "stock=1" and both sell the last unit (oversell).
                variant = ProductVariant.objects.select_for_update().get(
                    id=item.variant_id
                )
                if variant.stock < item.quantity:
                    # A DRF exception (not a bare ValueError) so the API client
                    # gets a structured 400 JSON instead of a 500 traceback.
                    raise serializers.ValidationError(
                        f'Not enough stock for {item.variant}. '
                        f'Only {variant.stock} left.'
                    )
                OrderItem.objects.create(
                    order=order,
                    variant=variant,
                    quantity=item.quantity,
                    price=variant.price,  # price snapshot at purchase time
                )
                variant.stock -= item.quantity
                variant.save()

            cart_items.delete()

        return Response(
            {
                'detail': 'Order placed successfully.',
                'order': OrderSerializer(order).data,
            },
            status=status.HTTP_201_CREATED,
        )


class OrderListView(generics.ListAPIView):
    """GET /api/orders/  ->  current user's order history"""
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user) \
            .prefetch_related(
                Prefetch(
                    'items',
                    queryset=OrderItem.objects.select_related(
                        'variant__product_color__product',
                        'variant__product_color__color',
                        'variant__size',
                    ),
                )
            ).order_by('-created_at')


class OrderDetailView(generics.RetrieveAPIView):
    """
    GET /api/orders/<order_number>/
    Only the OWNER can read an order (scoped queryset = object-level auth).
    """
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'order_number'

    def get_queryset(self):
        # Same prefetch as OrderListView - the nested OrderItemSerializer
        # walks the variant FK chain, which would be N+1 without it.
        return Order.objects.filter(user=self.request.user) \
            .prefetch_related(
                Prefetch(
                    'items',
                    queryset=OrderItem.objects.select_related(
                        'variant__product_color__product',
                        'variant__product_color__color',
                        'variant__size',
                    ),
                )
            )