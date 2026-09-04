from django.db import models
from store.models import Product,ProductVariant
from accounts.models import Account

# Create your models here.
class Cart(models.Model):
    cart_id = models.CharField(max_length=200,unique=True)
    date_added = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.cart_id

class CartItem(models.Model):
    variant = models.ForeignKey(ProductVariant,on_delete=models.CASCADE,null=True,blank=True)
    cart    = models.ForeignKey(Cart,on_delete=models.CASCADE,null=True,blank=True)
    quantity = models.IntegerField()
    isAvailable = models.BooleanField(default=True)

    user = models.ForeignKey(
        Account,
        on_delete=models.CASCADE,
        null=True,
        blank=True
    )

    def __str__(self):
        return str(self.variant)

    def subtotal(self):
        return self.quantity*self.variant.price

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['user', 'variant'],
                name='unique_user_variant'
            )
        ]


