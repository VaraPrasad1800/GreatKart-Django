from django.shortcuts import render,redirect,get_object_or_404
from store.models import Product,ProductVariant
from . models import Cart,CartItem
from django.core.exceptions import ObjectDoesNotExist
from django.http import HttpResponse
from rest_framework.views import APIView
from rest_framework import status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .serializers import CartItemSerializer, CartSerializer

# Create your views here.

def _cart_id(request):
    cart = request.session.session_key
    if not cart:
        cart = request.session.create()
    return cart

def add_cart(request,variant_id):
    variant = ProductVariant.objects.get(
        id = variant_id
    )

    if request.user.is_authenticated:
        try:
            cart_item = CartItem.objects.get(
                user=request.user,
                variant=variant
            )
            if cart_item.quantity   >= cart_item.variant.stock:
                return redirect('cart')
            else:
                cart_item.quantity += 1
                cart_item.save()

        except CartItem.DoesNotExist:
            CartItem.objects.create(
                user=request.user,
                variant=variant,
                quantity=1
            )
    else:
        try:
            cart=Cart.objects.get(cart_id = _cart_id(request))
        except Cart.DoesNotExist:
            cart = Cart.objects.create(
                cart_id = _cart_id(request),
            )
            cart.save()

        try:
            cart_item = CartItem.objects.get(variant=variant,cart=cart)
            cart_item.quantity += 1
            cart_item.save()
        except CartItem.DoesNotExist:
            cart_item = CartItem.objects.create(
                variant = variant,
                cart = cart,
                quantity = 1 
            )
            cart_item.save()

    return redirect('cart')

def remove_cart(request,variant_id):
    Variant = get_object_or_404(ProductVariant,id = variant_id)
    if request.user.is_authenticated:
        cart_item = get_object_or_404(
            CartItem,
            user=request.user,
            variant=Variant
        )
    else:
        cart = Cart.objects.get(cart_id = _cart_id(request))
        cart_item = CartItem.objects.get(variant=Variant,cart = cart)

    if cart_item.quantity > 1:
        cart_item.quantity -= 1
        cart_item.save()
    else :
        cart_item.delete()

    return redirect('cart')

def remove_cart_item(request,variant_id):
    Variant = get_object_or_404(ProductVariant,id = variant_id)

    if request.user.is_authenticated:
        cart_item = get_object_or_404(
            CartItem,
            user=request.user,
            variant=Variant
        )
    else:
        cart = Cart.objects.get(cart_id = _cart_id(request))
        cart_item = CartItem.objects.get(variant=Variant,cart = cart)

    cart_item.delete()

    return redirect('cart')

def cart(request,total = 0,quantity = 0,cart_items = None):
    tax = 0
    grand_total = 0
    try:
        if request.user.is_authenticated:
            cart_items = CartItem.objects.filter(
                user=request.user,
                isAvailable=True
            ) 
        else:         
            cart = Cart.objects.get(cart_id = _cart_id(request))
            cart_items = CartItem.objects.filter(cart = cart,isAvailable = True)

        for cart_item in cart_items :
            quantity +=  cart_item.quantity
            total    +=  (cart_item.variant.price * cart_item.quantity)

        tax = (2*total)/100
        grand_total = total + tax

    except ObjectDoesNotExist:
        pass

    context = {
        'total' : total,
        'quantity' : quantity,
        'cart_items' : cart_items,
        'tax' : tax,
        'grand_total' : grand_total
    }
    return  render(request,'store/cart.html',context)


# ============================================================
# API views (Django REST Framework)
#
# NOTE: The API cart is authenticated-user only. The guest/session
# cart (Cart.cart_id) still exists for the HTML website; APIs are
# consumed by logged-in clients (React/mobile), so we use the user's
# token instead of a browser session cookie.
# ============================================================

class CartDetailView(APIView):
    """GET /cart/api/  ->  current user's cart + order totals"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        items = CartItem.objects.filter(user=request.user, isAvailable=True) \
            .select_related(
                'variant__product_color__product',
                'variant__product_color__color',
                'variant__size',
            ).prefetch_related('variant__product_color__images')
        data = CartSerializer({'items': items}, context={'request': request}).data
        return Response(data)


class AddToCartView(APIView):
    """POST /cart/api/add/<variant_id>/  ->  add 1 unit (respects stock)"""
    permission_classes = [IsAuthenticated]

    def post(self, request, variant_id):
        variant = get_object_or_404(
            ProductVariant,
            id=variant_id,
            is_active=True,
        )
        # Stock is checked BEFORE creating a new line too: a variant can be
        # sold out (stock 0) even though it is still "active".
        if variant.stock <= 0:
            return Response(
                {'detail': 'This item is out of stock.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        cart_item, created = CartItem.objects.get_or_create(
            user=request.user,
            variant=variant,
            defaults={'quantity': 1},
        )
        if not created:
            if cart_item.quantity >= variant.stock:
                return Response(
                    {'detail': f'Only {variant.stock} in stock.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            cart_item.quantity += 1
            cart_item.save()

        return Response(
            {
                'detail': 'Added to cart.',
                'cart_item': CartItemSerializer(cart_item, context={'request': request}).data,
            },
            # 201 only when a new line was created; 200 when an existing
            # line's quantity was increased.
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )


class RemoveFromCartView(APIView):
    """POST /cart/api/remove/<variant_id>/  ->  remove 1 unit or drop the line"""
    permission_classes = [IsAuthenticated]

    def post(self, request, variant_id):
        cart_item = get_object_or_404(
            CartItem,
            user=request.user,
            variant_id=variant_id,
        )
        if cart_item.quantity > 1:
            cart_item.quantity -= 1
            cart_item.save()
        else:
            cart_item.delete()

        return Response({'detail': 'Cart updated.'})


class RemoveCartItemView(APIView):
    """DELETE /cart/api/remove_item/<variant_id>/  ->  remove the whole line"""
    permission_classes = [IsAuthenticated]

    def delete(self, request, variant_id):
        cart_item = get_object_or_404(
            CartItem,
            user=request.user,
            variant_id=variant_id,
        )
        cart_item.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
        

