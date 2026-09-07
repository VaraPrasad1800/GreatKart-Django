from rest_framework import serializers
from rest_framework.exceptions import PermissionDenied
from django.db.models import Avg
from orders.models import OrderItem
from .models import Product, ProductColor, ProductVariant, ProductImage, Review


class VariantSerializer(serializers.ModelSerializer):
    """One purchasable unit: a color x size combination with price + stock."""
    size = serializers.CharField(source='size.name', read_only=True)

    class Meta:
        model = ProductVariant
        fields = ['id', 'sku', 'size', 'price', 'stock']


class ProductImageSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()

    class Meta:
        model = ProductImage
        fields = ['id', 'image', 'is_primary']

    def get_image(self, obj):
        # build_absolute_uri turns a stored path (photos/product/x.jpg) into a
        # full URL (http://localhost:8000/media/photos/product/x.jpg) so any
        # client (React, mobile) can load the image directly.
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(obj.image.url)
        return obj.image.url


class ProductColorSerializer(serializers.ModelSerializer):
    """A product's color, with its images and all size variants of that color."""
    color = serializers.CharField(source='color.name', read_only=True)
    images = ProductImageSerializer(many=True, read_only=True)
    variants = VariantSerializer(many=True, read_only=True)

    class Meta:
        model = ProductColor
        fields = ['id', 'color', 'images', 'variants']


class ProductListSerializer(serializers.ModelSerializer):
    """Compact view used in product lists/search - one product per item."""
    category = serializers.CharField(source='category.category_name', read_only=True)
    category_slug = serializers.CharField(source='category.slug', read_only=True)
    detail_url = serializers.HyperlinkedIdentityField(
        view_name='api_product_detail',
        lookup_field='slug',
        read_only=True,
    )
    price = serializers.SerializerMethodField()
    image = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = ['id', 'product_name', 'slug', 'description', 'category',
                  'category_slug', 'price', 'image', 'detail_url']

    def get_price(self, obj):
        # A product has no price field - price lives on its variants.
        # The view prefetches active variants; iterate the cached
        # relations instead of triggering fresh queries.
        prices = [
            v.price
            for pc in obj.product_colors.all()
            for v in pc.variants.all()
        ]
        return min(prices) if prices else None

    def get_image(self, obj):
        first_color = obj.product_colors.first()
        if not first_color:
            return None
        # Iterate prefetched images instead of .filter(...) which would
        # bypass the cache and hit DB per product.
        images = first_color.images.all()
        img = next((i for i in images if i.is_primary), None) or next(iter(images), None)
        request = self.context.get('request')
        if img:
            return request.build_absolute_uri(img.image.url) if request else img.image.url
        return None


class ReviewSerializer(serializers.ModelSerializer):
    """Rating + comment on a product.

    Create validates the business rule in `validate`: only a user whose
    order for THIS product is marked 'Completed' (delivered) may review,
    and only once.
    """
    user_name = serializers.CharField(source='user.first_name', read_only=True)
    product_name = serializers.CharField(source='product.product_name', read_only=True)

    class Meta:
        model = Review
        fields = ['id', 'user_name', 'product_name', 'rating', 'comment', 'created_at']

    def validate(self, attrs):
        product = self.context.get('product')
        user = self.context.get('request').user

        # BUSINESS RULE: must have bought this product AND the order must be
        # delivered (status 'Completed') before you can review it.
        bought_and_delivered = OrderItem.objects.filter(
            order__user=user,
            variant__product_color__product=product,
            order__status='Completed',
        ).exists()

        if not bought_and_delivered:
            raise PermissionDenied(
                'You can review only after your order for this product is delivered.'
            )

        if Review.objects.filter(user=user, product=product).exists():
            raise serializers.ValidationError(
                {'detail': 'You have already reviewed this product.'}
            )

        return attrs

    def create(self, validated_data):
        return Review.objects.create(
            user=self.context['request'].user,
            product=self.context['product'],
            **validated_data,
        )


class ProductDetailSerializer(serializers.ModelSerializer):
    """Full product view with complete color -> images -> variant hierarchy."""
    category = serializers.CharField(source='category.category_name', read_only=True)
    product_colors = ProductColorSerializer(many=True, read_only=True)
    reviews = ReviewSerializer(many=True, read_only=True)
    review_summary = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = ['id', 'product_name', 'slug', 'description', 'category',
                  'product_colors', 'reviews', 'review_summary', 'created_at']

    def get_review_summary(self, obj):
        reviews = obj.reviews.all()
        avg = reviews.aggregate(Avg('rating'))['rating__avg']
        return {
            'count': reviews.count(),
            'average_rating': round(avg, 2) if avg is not None else None,
            'rating_breakdown': {
                str(star): reviews.filter(rating=star).count() for star in range(1, 6)
            },
        }