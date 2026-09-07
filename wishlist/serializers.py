from rest_framework import serializers
from .models import WishlistItem


class WishlistItemSerializer(serializers.ModelSerializer):
    """Read-only representation of a wishlist item with full variant details."""
    variant_id = serializers.IntegerField(source='variant.id', read_only=True)
    product_name = serializers.CharField(source='variant.product_color.product.product_name', read_only=True)
    product_slug = serializers.CharField(source='variant.product_color.product.slug', read_only=True)
    color = serializers.CharField(source='variant.product_color.color.name', read_only=True)
    size = serializers.CharField(source='variant.size.name', read_only=True)
    price = serializers.IntegerField(source='variant.price', read_only=True)
    stock = serializers.IntegerField(source='variant.stock', read_only=True)
    image = serializers.SerializerMethodField()

    class Meta:
        model = WishlistItem
        fields = [
            'id', 'variant_id', 'product_name', 'product_slug',
            'color', 'size', 'price', 'stock', 'image', 'created_at'
        ]

    def get_image(self, obj):
        request = self.context.get('request')
        first_color = obj.variant.product_color
        img = first_color.images.filter(is_primary=True).first() or first_color.images.first()
        if img:
            return request.build_absolute_uri(img.image.url) if request else img.image.url
        return None