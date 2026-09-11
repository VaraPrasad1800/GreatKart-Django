from django.urls import path
from . import views

urlpatterns = [
    # path('register/',views.register,name='register'),
    # path('login/',views.user_login,name='login'),
    # path('logout/',views.user_logout,name='logout'),

    # ===== API endpoints =====
    path('api/register/', views.RegisterView.as_view(), name='api_register'),
    path('api/profile/', views.UserProfileView.as_view(), name='api_profile'),

    # ===== Forgot password (password reset) =====
    path('api/password-reset/', views.PasswordResetRequestView.as_view(), name='api_password_reset'),
    path('api/password-reset/validate/', views.PasswordResetValidateView.as_view(), name='api_password_reset_validate'),
    path('api/password-reset/confirm/', views.PasswordResetConfirmView.as_view(), name='api_password_reset_confirm'),
]