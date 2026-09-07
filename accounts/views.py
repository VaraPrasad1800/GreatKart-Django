from django.shortcuts import render,redirect
from .forms import RegisterForm,LoginForm
from .models import Account
from django.contrib.auth import authenticate, login,logout
from cart.models import CartItem,Cart
from cart.views import _cart_id
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from .serializers import RegisterSerializer, UserSerializer


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


# ============================================================
# API views (Django REST Framework) - added alongside the
# existing HTML views above. The HTML pages keep working.
# ============================================================

class RegisterView(generics.CreateAPIView):
    """
    POST /accounts/api/register/
    Body: {first_name, last_name, phone_number, email, password, confirm_password}
    """
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(
            {
                'message': 'Registration successful. Please login.',
                'user': {
                    'id': user.id,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'email': user.email,
                },
            },
            status=status.HTTP_201_CREATED,
        )


class UserProfileView(generics.RetrieveAPIView):
    """
    GET /accounts/api/profile/  (protected)
    Header: Authorization: Bearer <access_token>
    Returns the currently logged-in user. This endpoint proves
    the JWT authentication is working.
    """
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user