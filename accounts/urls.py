from django.urls import path
from . import views

urlpatterns = [
    path('register/',views.register,name='register'),
    path('login/',views.user_login,name='login'),
    path('logout/',views.user_logout,name='logout'),

    # ===== API endpoints =====
    path('api/register/', views.RegisterView.as_view(), name='api_register'),
    path('api/profile/', views.UserProfileView.as_view(), name='api_profile'),
]