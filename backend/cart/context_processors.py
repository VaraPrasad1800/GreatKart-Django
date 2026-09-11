from . models import CartItem,Cart
from .views import _cart_id

def counter(request):
    cart_count = 0
    if 'admin' in request.path:
        return {}
    else :
        if request.user.is_authenticated:
            cart_items = CartItem.objects.all().filter(user = request.user)
        else:
            try:
                cart = Cart.objects.get(cart_id = _cart_id(request))
                cart_items = CartItem.objects.all().filter(cart = cart)
           
            except Cart.DoesNotExist:
                cart_count = 0
                return dict(cart_count = cart_count)

        for item in cart_items:
            cart_count += item.quantity
        return dict(cart_count = cart_count)
