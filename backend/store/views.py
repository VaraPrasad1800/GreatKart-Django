from django.shortcuts import render, get_object_or_404
from .models import Product, ProductColor, ProductVariant, ProductAttribute
from category.models import Category
from cart.models import CartItem
from cart.views import _cart_id
from django.core.paginator import Paginator
from django.http import HttpResponse
from django.db.models import Q, Prefetch, Min, Max, Avg, Count
from rest_framework import generics, filters
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from .serializers import (
    ProductListSerializer,
    ProductDetailSerializer,
    ReviewSerializer,
)
from store.variant_config import get_category_variants

# # Create your views here.
# def store(request, category_slug=None):
#     categories = None
#     products = None
#     if category_slug is not None:
#         categories = get_object_or_404(Category, slug=category_slug)
#         products = Product.objects.filter(category=categories, isAvailable=True)
#         paginator = Paginator(products, 3)
#         page_number = request.GET.get("page")
#         page_obj = paginator.get_page(page_number)
#         products_count = products.count()
#     else:
#         products = Product.objects.all().filter(isAvailable=True)
#         paginator = Paginator(products, 3)
#         page_number = request.GET.get("page")
#         page_obj = paginator.get_page(page_number)
#         products_count = products.count()

#     context = {
#         'products': page_obj,
#         'products_count': products_count,
#     }

#     return render(request, 'store/store.html', context)


# def product_details(request, category_slug, product_slug):
#     try:
#         single_product = Product.objects.get(category__slug=category_slug, slug=product_slug)

#         product_colors = ProductColor.objects.filter(product=single_product)

#         color_id = request.GET.get('color')
#         variant_id = request.GET.get('variant')

#         if color_id:
#             selected_color = product_colors.get(id=color_id)
#         else:
#             selected_color = product_colors.first()

#         variants = ProductVariant.objects.filter(
#             product_color=selected_color,
#             is_active=True
#         )

#         if variant_id:
#             try:
#                 selected_variant = variants.get(id=variant_id)
#             except ProductVariant.DoesNotExist:
#                 selected_variant = variants.first()
#         else:
#             selected_variant = variants.first()

#         in_cart = CartItem.objects.filter(cart__cart_id=_cart_id(request), variant=selected_variant).exists()
#     except Exception as e:
#         raise e

#     context = {
#         'single_product': single_product,
#         'in_cart': in_cart,
#         'product_colors': product_colors,
#         'selected_color': selected_color,
#         'variants': variants,
#         'selected_variant': selected_variant,
#     }
#     return render(request, 'store/product_details.html', context)


# def search(request):
#     if 'keyword' in request.GET:
#         keyword = request.GET['keyword']
#         if keyword:
#             products = Product.objects.order_by('-created_at').filter(
#                 Q(description__icontains=keyword) | Q(product_name__icontains=keyword)
#             )
#             products_count = products.count()

#     context = {
#         'products': products,
#         'products_count': products_count,
#     }
#     return render(request, 'store/store.html', context)


# ============================================================
# API views (Django REST Framework)
# ============================================================

class ProductListView(generics.ListAPIView):
    """
    GET /store/api/products/
    - ?category=<slug>       -> filter by category
    - ?search=<keyword>      -> search product name + description
    - ?brand=<brand>         -> filter by brand (exact match)
    - ?price_min=<int>       -> minimum price (any variant in range)
    - ?price_max=<int>       -> maximum price (any variant in range)
    - ?size=<size_name>      -> filter by size (comma-separated for multiple)
    - ?color=<color_name>    -> filter by color (comma-separated for multiple)
    - ?rating_min=<int>      -> minimum average rating (1-5)
    - ?in_stock=true         -> only products with stock > 0
    - ?on_sale=true          -> only products on sale
    - ?sort=price_asc|price_desc|newest|rating|popularity
    - paginated (9/page)     -> {"count", "next", "previous", "results": [...]}
    Public: anyone can browse products.
    """
    serializer_class = ProductListSerializer
    permission_classes = [AllowAny]
    filter_backends = [filters.SearchFilter]
    search_fields = ['product_name', 'description', 'brand']

    def get_queryset(self):
        # Default ordering keeps pagination stable when no sort is applied.
        products = Product.objects.filter(isAvailable=True).order_by('-created_at')
        params = self.request.query_params

        # Category filter
        category_slug = params.get('category')
        if category_slug:
            products = products.filter(category__slug=category_slug)

        # Brand filter
        brand = params.get('brand')
        if brand:
            products = products.filter(brand__iexact=brand)

        # On sale filter
        if params.get('on_sale') == 'true':
            products = products.filter(is_on_sale=True)

        # Rating filter (average rating >= rating_min)
        rating_min = params.get('rating_min')
        if rating_min:
            try:
                rating_min_val = int(rating_min)
                products = products.annotate(
                    avg_rating=Avg('reviews__rating')
                ).filter(avg_rating__gte=rating_min_val)
            except ValueError:
                pass

        # Price range filter (based on variant prices)
        # "any variant in range" logic: show product if ANY variant price is within [min, max]
        price_min = params.get('price_min')
        price_max = params.get('price_max')
        if price_min or price_max:
            variant_q = ProductVariant.objects.filter(is_active=True)
            if price_min:
                try:
                    variant_q = variant_q.filter(price__gte=int(price_min))
                except ValueError:
                    pass
            if price_max:
                try:
                    variant_q = variant_q.filter(price__lte=int(price_max))
                except ValueError:
                    pass
            # Products that have at least one variant in the price range
            variant_products = variant_q.values('product_color__product').distinct()
            products = products.filter(id__in=variant_products)

        # Size filter (comma-separated)
        size = params.get('size')
        if size:
            size_names = [s.strip() for s in size.split(',') if s.strip()]
            if size_names:
                size_variants = ProductVariant.objects.filter(
                    is_active=True,
                    size__name__in=size_names
                ).values('product_color__product').distinct()
                products = products.filter(id__in=size_variants)

        # Color filter (comma-separated)
        color = params.get('color')
        if color:
            color_names = [c.strip() for c in color.split(',') if c.strip()]
            if color_names:
                color_products = ProductColor.objects.filter(
                    color__name__in=color_names
                ).values('product').distinct()
                products = products.filter(id__in=color_products)

        # In stock filter (any variant with stock > 0)
        if params.get('in_stock') == 'true':
            in_stock_variants = ProductVariant.objects.filter(
                is_active=True,
                stock__gt=0
            ).values('product_color__product').distinct()
            products = products.filter(id__in=in_stock_variants)

        # Custom attribute filters: ?attr_<key>=<value>
        # Supports comma-separated values for multiselect
        for key, value in params.items():
            if key.startswith('attr_'):
                attr_key = key[5:]  # Remove 'attr_' prefix
                if value:
                    attr_values = [v.strip() for v in value.split(',') if v.strip()]
                    if attr_values:
                        attr_products = ProductAttribute.objects.filter(
                            key=attr_key,
                            value__in=attr_values,
                            is_filterable=True
                        ).values('product').distinct()
                        products = products.filter(id__in=attr_products)

        # Sorting
        sort = params.get('sort', '')
        if sort == 'price_asc':
            # Annotate with min variant price and order
            products = products.annotate(
                min_price=Min('product_colors__variants__price')
            ).order_by('min_price')
        elif sort == 'price_desc':
            products = products.annotate(
                min_price=Min('product_colors__variants__price')
            ).order_by('-min_price')
        elif sort == 'newest':
            products = products.order_by('-created_at')
        elif sort == 'rating':
            products = products.annotate(
                avg_rating=Avg('reviews__rating')
            ).order_by('-avg_rating')
        # 'popularity' would need a sales_count field - skip for now

        # Search (handled by SearchFilter, but we keep it for completeness)
        # The SearchFilter uses search_fields defined above

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
            'attributes',
            'reviews',
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
        return Product.objects.filter(isAvailable=True).select_related('category') \
            .prefetch_related(
                Prefetch(
                    'product_colors__variants',
                    queryset=ProductVariant.objects.filter(is_active=True),
                ),
                'product_colors__images',
                'reviews',
                'attributes',
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
        return [AllowAny()] if self.request.method == 'GET' else [IsAuthenticated()]

    def get_product(self):
        return get_object_or_404(Product, slug=self.kwargs['product_slug'])

    def get_queryset(self):
        return self.get_product().reviews.all()

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['product'] = self.get_product()
        return context


class ProductFilterOptionsView(generics.GenericAPIView):
    """
    GET /store/api/products/filter-options/?category=<slug>&search=<term>

    Returns available filter options scoped to the current product set.

    Facets with fewer than 2 distinct values in the result set are omitted
    (a single-value filter is never useful).  Universal facets (price_range,
    rating/availability in the frontend) always render; only the secondary
    facets here (brands, colors, sizes, attributes) are subject to the
    minimum-2 rule.

    The three sync-generated attributes that are already represented as
    dedicated universal sections in the FilterPanel (rating → Customer
    Reviews, availability → Availability, tags → category tags) are
    deliberately excluded from ``attributes`` to avoid duplicate sections
    and surface only genuine category-variant facets (material, shoe type,
    fit, wash, collar, etc.).
    """

    # These attribute keys are wholesale-generated for every product during
    # sync and are NOT category-variant facets — they duplicate the
    # hardcoded Rating / Availability / Tags sections in FilterPanel.
    _SYNC_GENERIC_KEYS = frozenset({'rating', 'availability', 'tags'})

    permission_classes = [AllowAny]

    def get(self, request):
        products = Product.objects.filter(isAvailable=True)

        category_slug = request.query_params.get('category')
        if category_slug:
            products = products.filter(category__slug=category_slug)

        search = request.query_params.get('search')
        if search:
            products = products.filter(
                Q(product_name__icontains=search) | Q(description__icontains=search)
            )

        product_ids = products.values_list('id', flat=True)

        # --- brands (≥2 distinct non-empty) -----------------------------------
        brands = list(
            products.exclude(brand='')
                    .values_list('brand', flat=True)
                    .distinct()
        )

        # --- colors (≥2 distinct) ---------------------------------------------
        colors_raw = list(
            ProductColor.objects.filter(product__in=product_ids)
                       .values('color__name')
                       .annotate(count=Count('product', distinct=True))
                       .order_by('-count')
        )
        colors = [{'name': c['color__name'], 'count': c['count']} for c in colors_raw]

        # --- sizes / variant dimension (≥2 distinct) --------------------------
        sizes_raw = list(
            ProductVariant.objects.filter(
                is_active=True,
                product_color__product__in=product_ids,
            ).values('size__name')
             .annotate(count=Count('product_color__product', distinct=True))
             .order_by('size__name')
        )
        sizes = [{'name': s['size__name'], 'count': s['count']} for s in sizes_raw]

        # --- price range (always present) -------------------------------------
        price_agg = ProductVariant.objects.filter(
            is_active=True,
            product_color__product__in=product_ids,
        ).aggregate(min_price=Min('price'), max_price=Max('price'))

        # --- variant dimension label -------------------------------------------
        variant_label = get_category_variants(
            # category_slug is None → 'Size' (the Group-5 default)
            category_slug
        )['label']

        # --- category-variant attributes (≥2 distinct values) -----------------
        from collections import defaultdict
        attr_data = ProductAttribute.objects.filter(
            product__in=product_ids,
            is_filterable=True,
        ).exclude(key__in=self._SYNC_GENERIC_KEYS) \
         .values('key', 'label', 'attribute_type')

        by_key: dict[str, dict] = defaultdict(
            lambda: {'labels': set(), 'types': set()}
        )
        for a in attr_data:
            by_key[a['key']]['labels'].add(a['label'])
            by_key[a['key']]['types'].add(a['attribute_type'])

        attributes = []
        for k, meta in sorted(by_key.items()):
            vals = list(
                ProductAttribute.objects.filter(
                    product__in=product_ids,
                    key=k,
                    is_filterable=True,
                ).values_list('value', flat=True).distinct()
            )
            if len(vals) < 2:
                continue                           # single-value facet → skip
            attributes.append({
                'key': k,
                'label': sorted(meta['labels'])[0],
                'type': sorted(meta['types'])[0],
                'values': vals,
            })

        # --- apply minimum-2 rule to all secondary facets ---------------------
        if len(brands) < 2:
            brands = []
        if len(colors) < 2:
            colors = []
        if len(sizes) < 2:
            sizes = []

        return Response({
            'variant_label': variant_label,
            'brands': brands,
            'colors': colors,
            'sizes': sizes,
            'price_range': {
                'min': price_agg['min_price'] or 0,
                'max': price_agg['max_price'] or 0,
            },
            'attributes': attributes,
        })