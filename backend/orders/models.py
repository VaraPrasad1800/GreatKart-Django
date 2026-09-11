import uuid
from django.db import models
from accounts.models import Account
from store.models import ProductVariant

# Create your models here.


class Order(models.Model):
    STATUS = [
        ('New', 'New'),
        ('Accepted', 'Accepted'),
        ('Completed', 'Completed'),
        ('Cancelled', 'Cancelled'),
    ]

    user = models.ForeignKey(Account, on_delete=models.CASCADE, related_name='orders')
    order_number = models.CharField(max_length=20, unique=True, editable=False)

    # Shipping details - captured at checkout time (never read back from the
    # user profile, because addresses can change later)
    full_name = models.CharField(max_length=100)
    phone = models.CharField(max_length=15)
    email = models.EmailField(max_length=50)
    address_line_1 = models.CharField(max_length=100)
    address_line_2 = models.CharField(max_length=100, blank=True)
    city = models.CharField(max_length=50)
    state = models.CharField(max_length=50)
    country = models.CharField(max_length=50)
    pincode = models.CharField(max_length=10)

    # Money snapshot - totals are stored, not recalculated
    total = models.DecimalField(max_digits=10, decimal_places=2)
    tax = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    grand_total = models.DecimalField(max_digits=10, decimal_places=2)

    status = models.CharField(max_length=10, choices=STATUS, default='New')
    ip = models.CharField(max_length=20, blank=True)
    is_ordered = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.order_number} - {self.user.email}"

    def save(self, *args, **kwargs):
        # Order number is generated once, on first save. A uuid-derived code
        # is used instead of a sequential scheme because the number must be
        # unique and set BEFORE the row has a primary key.
        if not self.order_number:
            self.order_number = str(uuid.uuid4()).replace('-', '').upper()[:10]
        super().save(*args, **kwargs)


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    variant = models.ForeignKey(ProductVariant, on_delete=models.SET_NULL, null=True)
    quantity = models.PositiveIntegerField()
    price = models.DecimalField(max_digits=10, decimal_places=2)  # unit price snapshot

    def __str__(self):
        return f"{self.order.order_number} - {self.variant} x {self.quantity}"

    def subtotal(self):
        return self.price * self.quantity