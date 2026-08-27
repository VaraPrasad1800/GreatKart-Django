from django.db import models
from category.models import Category
from django.urls import reverse

# Create your models here.

class Product(models.Model):
    product_name        = models.CharField(max_length=200,unique=True)
    slug                = models.SlugField(max_length=200,unique=True)
    price               = models.IntegerField()
    description         = models.TextField(max_length=200)
    images              = models.ImageField(upload_to='photos/products')
    category            = models.ForeignKey(Category,on_delete=models.CASCADE)
    isAvailable         = models.BooleanField()
    stock               = models.IntegerField()
    created_at          = models.DateTimeField(auto_now_add=True)
    modified_at         = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.product_name


    def get_url(self):
        return reverse('product_details', args=[self.category.slug,self.slug])