from django.db import models
from category.models import Category
from django.urls import reverse
from django.utils.text import slugify
from accounts.models import Account

# Create your models here.

class Product(models.Model):
    product_name        = models.CharField(max_length=200,unique=True)
    slug                = models.SlugField(max_length=200,unique=True)
    # price               = models.IntegerField()
    description         = models.TextField(max_length=500)
    # images              = models.ImageField(upload_to='photos/products')
    category            = models.ForeignKey(Category,on_delete=models.CASCADE)
    brand               = models.CharField(max_length=100, blank=True)
    isAvailable         = models.BooleanField()
    # stock               = models.IntegerField()
    original_price      = models.PositiveIntegerField(null=True, blank=True)
    is_on_sale          = models.BooleanField(default=False)
    created_at          = models.DateTimeField(auto_now_add=True)
    modified_at         = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.product_name


    def get_url(self):
        return reverse('product_details', args=[self.category.slug,self.slug])

    def first_color(self):
        return self.product_colors.first()

class Color(models.Model):
    name = models.CharField(max_length=30,unique=True)

    def __str__(self):
        return self.name

class Size(models.Model):
    name=models.CharField(max_length=10,unique=True)


    def __str__(self):
        return self.name

class ProductColor(models.Model):
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="product_colors"
    )

    color = models.ForeignKey(
        Color,
        on_delete=models.CASCADE
    )

    def __str__(self):
        return f"{self.product.product_name} - {self.color.name}"




class ProductVariant(models.Model):


    product_color = models.ForeignKey(ProductColor,on_delete=models.CASCADE,related_name='variants',null=True,blank=True)


    size = models.ForeignKey(Size,on_delete=models.CASCADE)

    sku = models.CharField(max_length=150,unique=True,editable=False)

    price = models.PositiveIntegerField()

    stock = models.PositiveIntegerField()

    is_active = models.BooleanField(default=True)


    def __str__(self):
        
            return f"{self.product_color.product.product_name}-{self.product_color.color.name}-{self.size.name}"


    def save(self, *args, **kwargs):

        product_name = self.product_color.product.product_name
        color_name = self.product_color.color.name

        self.sku = slugify(
            f"{product_name}-{color_name}-{self.size.name}"
        ).upper()

        super().save(*args, **kwargs)

class ProductImage(models.Model):
    product_color = models.ForeignKey(
        ProductColor,
        on_delete=models.CASCADE,
        related_name='images',
    )

    image = models.ImageField(upload_to='photos/product')
    is_primary = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.product_color}"


class ProductAttribute(models.Model):
    """
    Flexible attribute for a product (e.g., material, storage, processor, etc.)
    Category-specific filters are built from these dynamically.
    """
    ATTRIBUTE_TYPES = [
        ('text', 'Text'),
        ('number', 'Number'),
        ('boolean', 'True/False'),
        ('select', 'Single Select'),
        ('multiselect', 'Multi Select'),
    ]

    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name='attributes'
    )
    key = models.CharField(max_length=100)  # e.g., 'material', 'storage', 'processor'
    label = models.CharField(max_length=100)  # Human-readable label: 'Material', 'Storage'
    value = models.CharField(max_length=500)  # Stored as string, parsed based on type
    attribute_type = models.CharField(max_length=20, choices=ATTRIBUTE_TYPES, default='text')
    is_filterable = models.BooleanField(default=True)  # Show in filter panel
    display_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['display_order', 'key']
        unique_together = ('product', 'key')

    def __str__(self):
        return f"{self.product.product_name} - {self.key}: {self.value}"

    @property
    def parsed_value(self):
        """Parse value based on attribute_type."""
        if self.attribute_type == 'number':
            try:
                return float(self.value)
            except ValueError:
                return None
        elif self.attribute_type == 'boolean':
            return self.value.lower() in ('true', '1', 'yes', 'on')
        elif self.attribute_type in ('select', 'multiselect'):
            return [v.strip() for v in self.value.split(',') if v.strip()]
        return self.value


class Review(models.Model):
    """
    A rating + comment on a Product.

    BUSINESS RULE (enforced in ReviewSerializer.validate):
    a user may only review a product they have actually bought AND whose
    order has been marked 'Completed' (i.e. delivered) by the admin.
    One review per user per product.
    """
    RATING_CHOICES = [(i, f'{i} star') for i in range(1, 6)]

    user = models.ForeignKey(Account, on_delete=models.CASCADE, related_name='reviews')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='reviews')
    rating = models.PositiveSmallIntegerField(choices=RATING_CHOICES)
    comment = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('user', 'product')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.email} - {self.product.product_name} - {self.rating}*"




