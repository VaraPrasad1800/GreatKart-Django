from django.db import models
from accounts.models import Account
from store.models import ProductVariant


class WishlistItem(models.Model):
    """
    A user's saved product variant (color + size) for later purchase.
    One item per user per variant.
    """
    user = models.ForeignKey(
        Account,
        on_delete=models.CASCADE,
        related_name='wishlist_items'
    )
    variant = models.ForeignKey(
        ProductVariant,
        on_delete=models.CASCADE,
        related_name='wishlist_items'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'variant')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.email} - {self.variant.sku}"