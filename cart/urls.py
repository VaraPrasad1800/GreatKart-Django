from django.urls import path
from . import views

urlpatterns = [
    path("",views.cart,name="cart"),
    path("add_cart/<int:variant_id>/",views.add_cart,name="add_cart"),
    path("remove_cart/<int:variant_id>/",views.remove_cart,name="remove_cart"),
    path("remove_cart_item/<int:variant_id>/",views.remove_cart_item,name="remove_cart_item"),

    # ===== API endpoints =====
    path('api/', views.CartDetailView.as_view(), name='api_cart'),
    path('api/add/<int:variant_id>/', views.AddToCartView.as_view(), name='api_cart_add'),
    path('api/remove/<int:variant_id>/', views.RemoveFromCartView.as_view(), name='api_cart_remove'),
    path('api/remove_item/<int:variant_id>/', views.RemoveCartItemView.as_view(), name='api_cart_remove_item'),
]