from django.shortcuts import render,redirect
from .forms import RegisterForm,LoginForm
from .models import Account
from django.contrib.auth import authenticate, login,logout
from cart.models import CartItem,Cart
from cart.views import _cart_id


# Create your views here.
def register(request):
    if request.method == "POST":
        form = RegisterForm(request.POST)
        if form.is_valid():
            first_name = form.cleaned_data['first_name']
            last_name = form.cleaned_data['last_name']
            phone_number = form.cleaned_data['phone_number']
            email = form.cleaned_data['email']
            password = form.cleaned_data['password']
            username = email.split('@')[0]
            user = Account.objects.create_user(first_name=first_name,last_name=last_name,email=email,username=username,password=password)
            user.phone_number = phone_number

            user.save()
            return redirect('login')
    else:
        form = RegisterForm()
    context = {
        'form' : form,
    }
    return render(request,'accounts/register.html',context)

def user_login(request):

    if request.method == "POST":
        form = LoginForm(request.POST)

        if form.is_valid():
            email = form.cleaned_data['email']
            password = form.cleaned_data['password']

            user = authenticate(

                email = email,
                password = password
            )

            print(user)

            if user is not None:
                guest_cart = None
                try:
                    guest_cart = Cart.objects.get(cart_id=_cart_id(request))
                except Cart.DoesNotExist:
                    pass

                login(request,user)
                if guest_cart:
                    guest_items = CartItem.objects.filter(cart=guest_cart)
                    for guest_item in guest_items:
                        existing = CartItem.objects.filter(
                            user=user,
                            variant=guest_item.variant
                        ).first()

                        if existing:
                            existing.quantity += guest_item.quantity
                            existing.save()

                            guest_item.delete()
                        else:
                            guest_item.user = user
                            guest_item.cart = None
                            guest_item.save()
                return redirect('home')
            else:
                form.add_error(None,"Invalid Email or Password.")
    else :
        form = LoginForm()

    context = {
        'form' : form,
    }
    return render(request,'accounts/login.html',context)

def user_logout(request):
    logout(request)
    return redirect('home')