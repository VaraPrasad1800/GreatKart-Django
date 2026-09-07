from django.urls import path
from . import views

urlpatterns = [
    path("",views.store,name="store"),
    path('category/<slug:category_slug>/',views.store,name="products_by_category"),
    path('category/<slug:category_slug>/<slug:product_slug>/',views.product_details,name="product_details"),
    path('search/',views.search,name='search'),

    # ===== API endpoints =====
    # NOTE: reviews comes before the <slug> detail so "atx-jeans/reviews/" is not
    # swallowed by the single-segment detail pattern (same as DRF router ordering).
    path('api/products/<slug:product_slug>/reviews/', views.ProductReviewListCreateView.as_view(), name='api_product_reviews'),
    path('api/products/', views.ProductListView.as_view(), name='api_product_list'),
    path('api/products/<slug:slug>/', views.ProductDetailView.as_view(), name='api_product_detail'),
]
