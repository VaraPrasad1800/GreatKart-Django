from django.shortcuts import render,redirect,get_object_or_404
from store.models import Product,ProductVariant
from . models import Cart,CartItem
from django.core.exceptions import ObjectDoesNotExist
from django.http import HttpResponse

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
        cart_item = CartItem.objects.get(ProductVariant=Variant,cart = cart)

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
        

