from django.urls import path
from . import views

urlpatterns = [
    # ===== API endpoints =====
    # NOTE: filter-options + reviews come before the <slug> detail so they are not
    # swallowed by the single-segment detail pattern.
    path('api/products/filter-options/', views.ProductFilterOptionsView.as_view(), name='api_product_filter_options'),
    path('api/products/<slug:product_slug>/reviews/', views.ProductReviewListCreateView.as_view(), name='api_product_reviews'),
    path('api/products/', views.ProductListView.as_view(), name='api_product_list'),
    path('api/products/<slug:slug>/', views.ProductDetailView.as_view(), name='api_product_detail'),
]
