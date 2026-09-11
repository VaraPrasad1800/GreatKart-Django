from django.urls import path
from . import views

urlpatterns = [
    # ===== HTML routes (browser) =====
    path('checkout/', views.checkout, name='checkout'),
    path('place_order/', views.place_order, name='place_order'),
    path('', views.orders, name='orders'),
    path('<str:order_number>/', views.order_detail, name='order_detail'),

    # ===== API routes =====
    path('api/checkout/', views.CheckoutView.as_view(), name='api_checkout'),
    path('api/orders/', views.OrderListView.as_view(), name='api_order_list'),
    path('api/orders/<str:order_number>/', views.OrderDetailView.as_view(), name='api_order_detail'),
]