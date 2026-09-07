from django.urls import path
from . import views

urlpatterns = [
    # ===== HTML routes (browser) =====
    path('', views.wishlist, name='wishlist'),
    path('add/<int:variant_id>/', views.add_to_wishlist, name='add_to_wishlist'),
    path('remove/<int:variant_id>/', views.remove_wishlist, name='remove_wishlist'),

    # ===== API routes =====
    path('api/', views.WishlistListView.as_view(), name='api_wishlist_list'),
    path('api/add/<int:variant_id>/', views.WishlistAddView.as_view(), name='api_wishlist_add'),
    path('api/remove/<int:variant_id>/', views.WishlistRemoveView.as_view(), name='api_wishlist_remove'),
]
