from django.db import models
from category.models import Category
from django.urls import reverse
from django.utils.text import slugify

# Create your models here.

class Product(models.Model):
    product_name        = models.CharField(max_length=200,unique=True)
    slug                = models.SlugField(max_length=200,unique=True)
    # price               = models.IntegerField()
    description         = models.TextField(max_length=200)
    # images              = models.ImageField(upload_to='photos/products')
    category            = models.ForeignKey(Category,on_delete=models.CASCADE)
    isAvailable         = models.BooleanField()
    # stock               = models.IntegerField()
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




