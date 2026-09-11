from django.shortcuts import render,redirect
from .forms import RegisterForm,LoginForm
from .models import Account
from django.contrib.auth import authenticate, login,logout
from cart.models import CartItem,Cart
from cart.views import _cart_id
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode

from .serializers import (
    PasswordResetConfirmSerializer,
    PasswordResetRequestSerializer,
    RegisterSerializer,
    UserSerializer,
    get_user_from_reset_token,
)
from .utils import send_password_reset_email


# # Create your views here.
# def register(request):
#     if request.method == "POST":
#         form = RegisterForm(request.POST)
#         if form.is_valid():
#             first_name = form.cleaned_data['first_name']
#             last_name = form.cleaned_data['last_name']
#             phone_number = form.cleaned_data['phone_number']
#             email = form.cleaned_data['email']
#             password = form.cleaned_data['password']
#             username = email.split('@')[0]
#             user = Account.objects.create_user(
#                 email=email,
#                 password=password,
#                 username=username,
#                 first_name=first_name,
#                 last_name=last_name,
#             )
#             user.phone_number = phone_number

#             user.save()
#             return redirect('login')
#     else:
#         form = RegisterForm()
#     context = {
#         'form' : form,
#     }
#     return render(request,'accounts/register.html',context)

# def user_login(request):

#     if request.method == "POST":
#         form = LoginForm(request.POST)

#         if form.is_valid():
#             email = form.cleaned_data['email']
#             password = form.cleaned_data['password']

#             user = authenticate(
#                 request,
#                 username=email,
#                 password=password
#             )

#             print(user)

#             if user is not None:
#                 guest_cart = None
#                 try:
#                     guest_cart = Cart.objects.get(cart_id=_cart_id(request))
#                 except Cart.DoesNotExist:
#                     pass

#                 login(request,user)
#                 if guest_cart:
#                     guest_items = CartItem.objects.filter(cart=guest_cart)
#                     for guest_item in guest_items:
#                         existing = CartItem.objects.filter(
#                             user=user,
#                             variant=guest_item.variant
#                         ).first()

#                         if existing:
#                             existing.quantity += guest_item.quantity
#                             existing.save()

#                             guest_item.delete()
#                         else:
#                             guest_item.user = user
#                             guest_item.cart = None
#                             guest_item.save()
#                 return redirect('home')
#             else:
#                 form.add_error(None,"Invalid Email or Password.")
#     else :
#         form = LoginForm()

#     context = {
#         'form' : form,
#     }
#     return render(request,'accounts/login.html',context)

# def user_logout(request):
#     logout(request)
# return redirect('home')


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


# ============================================================
# Password reset API (forgot password)
# All three endpoints are public (AllowAny) — a user who forgot their
# password obviously can't authenticate, and these endpoints must not
# leak whether an email belongs to an account.
# ============================================================

class PasswordResetRequestView(generics.GenericAPIView):
    """
    POST /accounts/api/password-reset/
    Body: {"email": "someone@example.com"}
    Response: 200 always, with a generic message.

    If the email belongs to an account, we generate a one-time uid + token,
    build a reset link and email it. If it doesn't, we return the exact same
    generic message so attackers cannot use this endpoint to probe which
    emails are registered (account enumeration).
    """
    serializer_class = PasswordResetRequestSerializer
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']

        user = Account.objects.filter(email__iexact=email).first()

        if user is not None:
            # Build the one-time reset link the user clicks in the email.
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)
            reset_url = f"{settings.FRONTEND_URL}/reset-password/{uid}/{token}"
            send_password_reset_email(user, reset_url)

        # Identical response regardless of whether the account exists.
        return Response(
            {
                'message': (
                    "If an account with that email exists, we've sent a "
                    "password reset link. Please check your inbox."
                ),
            },
            status=status.HTTP_200_OK,
        )


class PasswordResetValidateView(generics.GenericAPIView):
    """
    GET /accounts/api/password-reset/validate/?uid=<uid>&token=<token>
    Response: {"valid": true} or 400 {"token": "..."}.

    Lightweight check used by the React reset page when it loads, so we can
    immediately tell the user "this link is invalid or expired" instead of
    having them type a new password and only then find out.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        uid = request.query_params.get('uid', '')
        token = request.query_params.get('token', '')

        # Shared decode + verify helper — the same check the confirm flow uses.
        user = get_user_from_reset_token(uid, token)
        if user is not None:
            return Response({'valid': True}, status=status.HTTP_200_OK)
        return Response(
            {'token': 'This reset link is invalid or has expired.'},
            status=status.HTTP_400_BAD_REQUEST,
        )


class PasswordResetConfirmView(generics.GenericAPIView):
    """
    POST /accounts/api/password-reset/confirm/
    Body: {"uid": "...", "token": "...", "new_password": "...",
           "confirm_password": "..."}
    Response: 200 {"message": "Password reset successfully. You can now log in."}

    Decodes the uid, verifies the one-time token (expiry + single-use
    enforced by Django's PasswordResetTokenGenerator), validates the new
    password, then sets it. After this the user logs in normally with the new
    password via /api/token/.
    """
    serializer_class = PasswordResetConfirmSerializer
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()  # Sets the new password on the verified user.
        return Response(
            {
                'message': (
                    'Password reset successfully. You can now log in with '
                    'your new password.'
                ),
            },
            status=status.HTTP_200_OK,
        )