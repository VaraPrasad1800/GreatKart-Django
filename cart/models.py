from django.db import models
from store.models import Product,ProductVariant

# Create your models here.
class Cart(models.Model):
    cart_id = models.CharField(max_length=200,unique=True)
    date_added = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.cart_id

class CartItem(models.Model):
    variant = models.ForeignKey(ProductVariant,on_delete=models.CASCADE,null=True,blank=True)
    cart    = models.ForeignKey(Cart,on_delete=models.CASCADE)
    quantity = models.IntegerField()
    isAvailable = models.BooleanField(default=True)

    def __str__(self):
        return self.product

    def subtotal(self):
        return self.quantity*self.variant.price


