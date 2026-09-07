from django.shortcuts import render,get_object_or_404
from .models import Product,ProductColor,ProductVariant
from category.models import Category
from cart.models import CartItem
from cart.views import _cart_id
from django.core.paginator import Paginator
from django.http import HttpResponse
from django.db.models import Q, Prefetch
from rest_framework import generics, filters
from rest_framework.permissions import AllowAny, IsAuthenticated
from .serializers import (
    ProductListSerializer,
    ProductDetailSerializer,
    ReviewSerializer,
)

# Create your views here.
def store(request,category_slug = None):
    categories = None
    products = None
    if category_slug != None:
        categories = get_object_or_404(Category,slug = category_slug)
        products   = Product.objects.filter(category=categories,isAvailable = True)
        paginator   = Paginator(products,3)
        page_number = request.GET.get("page")
        page_obj    = paginator.get_page(page_number)
        products_count = products.count()
    else :
        products = Product.objects.all().filter(isAvailable = True)
        paginator   = Paginator(products,3)
        page_number = request.GET.get("page")
        page_obj    = paginator.get_page(page_number)
        products_count = products.count()


    
    context = {
        'products' : page_obj,
        'products_count' : products_count,
    }

    return render(request,'store/store.html',context)


def product_details(request,category_slug,product_slug):
    try:
        single_product = Product.objects.get(category__slug = category_slug,slug=product_slug)
        

        product_colors = ProductColor.objects.filter(product = single_product)

        color_id = request.GET.get('color')
        variant_id = request.GET.get('variant')

        if color_id:
            selected_color = product_colors.get(id=color_id)
        else:
            selected_color = product_colors.first()

        variants = ProductVariant.objects.filter(
            product_color=selected_color,
            is_active=True
        )

        if variant_id:
            try:
                selected_variant = variants.get(id = variant_id)
            except ProductVariant.DoesNotExist:
                selected_variant = variants.first()
        else:
            selected_variant = variants.first()



        in_cart = CartItem.objects.filter(cart__cart_id = _cart_id(request),variant = selected_variant).exists()
    except Exception as e:
        raise e

    context = {
        'single_product' : single_product,
        'in_cart' : in_cart,
        'product_colors': product_colors,
        'selected_color': selected_color,
        'variants': variants,
        'selected_variant' : selected_variant,
    }
    return render(request,'store/product_details.html',context)

def search(request):

    if 'keyword' in request.GET:
        keyword = request.GET['keyword']
        if keyword:
            products       = Product.objects.order_by('-created_at').filter(Q(description__icontains = keyword) | Q(product_name__icontains = keyword))
            products_count = products.count()

    context = {
        'products' : products,
        'products_count' : products_count,
    }
    return render(request,'store/store.html',context)


# ============================================================
# API views (Django REST Framework)
# ============================================================

class ProductListView(generics.ListAPIView):
    """
    GET /store/api/products/
    - ?category=<slug>   -> filter by category
    - ?search=<keyword>  -> search product name + description (DRF SearchFilter)
    - paginated (9/page) -> {"count", "next", "previous", "results": [...]}
    Public: anyone can browse products.
    """
    serializer_class = ProductListSerializer
    permission_classes = [AllowAny]
    filter_backends = [filters.SearchFilter]
    search_fields = ['product_name', 'description']


    def get_queryset(self):
        products = Product.objects.filter(isAvailable=True)
        category_slug = self.request.query_params.get('category')
        if category_slug:
            products = products.filter(category__slug=category_slug)
        return self._optimized(products)

    @staticmethod
    def _optimized(products):
        # Prefetch the color -> variant/image hierarchy so the nested
        # serializers never fire one query per product (N+1). Variants are
        # prefetched already filtered to active ones.
        return products.select_related('category').prefetch_related(
            Prefetch(
                'product_colors__variants',
                queryset=ProductVariant.objects.filter(is_active=True),
            ),
            'product_colors__images',
        )


class ProductDetailView(generics.RetrieveAPIView):
    """
    GET /store/api/products/<slug>/
    Returns the full product with colors, images, variants and reviews.
    """
    serializer_class = ProductDetailSerializer
    permission_classes = [AllowAny]
    lookup_field = 'slug'

    def get_queryset(self):
        # Same prefetch as the list view, plus the reviews (the detail
        # serializer embeds them and aggregates a summary).
        return Product.objects.filter(isAvailable=True).select_related('category') \
            .prefetch_related(
                Prefetch(
                    'product_colors__variants',
                    queryset=ProductVariant.objects.filter(is_active=True),
                ),
                'product_colors__images',
                'reviews',
            )


class ProductReviewListCreateView(generics.ListCreateAPIView):
    """
    GET  /store/api/products/<slug>/reviews/  -> public list of reviews
    POST /store/api/products/<slug>/reviews/  -> write a review (auth required)
         Body: {"rating": 1-5, "comment": "..."}
         Rejected (403) unless the user bought this product and their order
         is marked 'Completed' (delivered). One review per user per product.
    """
    serializer_class = ReviewSerializer

    def get_permissions(self):
        # GET is public; POST requires a logged-in (JWT) user.
        return [AllowAny()] if self.request.method == 'GET' else [IsAuthenticated()]

    def get_product(self):
        return get_object_or_404(Product, slug=self.kwargs['product_slug'])

    def get_queryset(self):
        return self.get_product().reviews.all()

    def get_serializer_context(self):
        # Give the serializer the product + request so its validate/create
        # can enforce the "delivered order required" rule and attach the author.
        context = super().get_serializer_context()
        context['product'] = self.get_product()
        return context 


