from .models import WishlistItem


def wishlist_count(request):
    """Expose wishlist_count to every template (used for the navbar badge)."""
    if request.user.is_authenticated and 'admin' not in request.path:
        return {'wishlist_count': WishlistItem.objects.filter(user=request.user).count()}
    return {'wishlist_count': 0}