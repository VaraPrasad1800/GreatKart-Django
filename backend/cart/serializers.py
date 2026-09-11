from rest_framework import serializers
from .models import CartItem


class CartItemSerializer(serializers.ModelSerializer):
    """
    One line in the cart, flattened for the API client:
    exposes the useful product/variant fields as plain JSON fields.
    """
    variant_id = serializers.IntegerField(source='variant.id', read_only=True)
    product_name = serializers.CharField(
        source='variant.product_color.product.product_name', read_only=True
    )
    product_slug = serializers.CharField(
        source='variant.product_color.product.slug', read_only=True
    )
    color = serializers.CharField(source='variant.product_color.color.name', read_only=True)
    size = serializers.CharField(source='variant.size.name', read_only=True)
    image = serializers.SerializerMethodField()
    unit_price = serializers.IntegerField(source='variant.price', read_only=True)
    subtotal = serializers.IntegerField(read_only=True)  # quantity * unit_price (model method)
    max_stock = serializers.IntegerField(source='variant.stock', read_only=True)

    class Meta:
        model = CartItem
        fields = ['variant_id', 'product_name', 'product_slug', 'color', 'size',
                  'image', 'quantity', 'unit_price', 'subtotal', 'max_stock']

    def get_image(self, obj):
        pc = obj.variant.product_color
        # Iterate the prefetched images in Python instead of .filter(...) -
        # a filtered query would bypass the prefetch cache and hit the DB
        # once per cart line (N+1).
        images = pc.images.all()
        img = next((i for i in images if i.is_primary), None) or next(iter(images), None)
        request = self.context.get('request')
        if img:
            return request.build_absolute_uri(img.image.url) if request else img.image.url
        return None


class CartSerializer(serializers.Serializer):
    """
    Full cart payload: the items plus the running order totals
    (mirrors what the old HTML cart view computed in its for-loop).
    """
    items = CartItemSerializer(many=True)
    total = serializers.SerializerMethodField()
    quantity = serializers.SerializerMethodField()
    tax = serializers.SerializerMethodField()
    grand_total = serializers.SerializerMethodField()

    class Meta:
        fields = ['items', 'total', 'quantity', 'tax', 'grand_total']

    def get_total(self, obj):
        return sum(item.subtotal() for item in obj['items'])

    def get_quantity(self, obj):
        return sum(item.quantity for item in obj['items'])

    def get_tax(self, obj):
        return round(2 * self.get_total(obj) / 100, 2)

    def get_grand_total(self, obj):
        return round(self.get_total(obj) + self.get_tax(obj), 2)