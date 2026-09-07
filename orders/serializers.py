from rest_framework import serializers
from .models import Order, OrderItem


class CheckoutSerializer(serializers.Serializer):
    """
    Validates the shipping form submitted at checkout.
    Deliberately NOT a ModelSerializer tied to Order: the order object is
    created with server-side computed totals, not with client input.
    """
    full_name = serializers.CharField(max_length=100)
    phone = serializers.CharField(max_length=15)
    email = serializers.EmailField(max_length=50)
    address_line_1 = serializers.CharField(max_length=100)
    address_line_2 = serializers.CharField(max_length=100, required=False, allow_blank=True)
    city = serializers.CharField(max_length=50)
    state = serializers.CharField(max_length=50)
    country = serializers.CharField(max_length=50)
    pincode = serializers.CharField(max_length=10)

    def validate_phone(self, value):
        if not value.isdigit() or len(value) != 10:
            raise serializers.ValidationError(
                'Phone number must be exactly 10 digits.'
            )
        return value


class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(
        source='variant.product_color.product.product_name', read_only=True
    )
    color = serializers.CharField(source='variant.product_color.color.name', read_only=True)
    size = serializers.CharField(source='variant.size.name', read_only=True)
    subtotal = serializers.SerializerMethodField()

    class Meta:
        model = OrderItem
        fields = ['product_name', 'color', 'size', 'quantity', 'price', 'subtotal']

    def get_subtotal(self, obj):
        return obj.price * obj.quantity


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = ['id', 'order_number', 'full_name', 'phone', 'email',
                  'address_line_1', 'address_line_2', 'city', 'state',
                  'country', 'pincode', 'total', 'tax', 'grand_total',
                  'status', 'is_ordered', 'created_at', 'items']