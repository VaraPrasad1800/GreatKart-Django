from django.contrib.auth.decorators import login_required
from django.shortcuts import render, redirect, get_object_or_404
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.generics import ListAPIView
from store.models import ProductVariant
from .models import WishlistItem
from .serializers import WishlistItemSerializer


# ============================================================
# HTML views (browser) - the MVT side of the wishlist feature.
# These pair with templates/wishlist/wishlist.html so a logged-in
# user can view/add/remove wishlist items in the browser.
# ============================================================

@login_required
def wishlist(request):
    """GET /wishlist/ -> show the logged-in user's wishlist"""
    items = WishlistItem.objects.filter(user=request.user).select_related(
        'variant__product_color__product',
        'variant__product_color__color',
        'variant__size',
    ).prefetch_related('variant__product_color__images')
    context = {'wishlist_items': items}
    return render(request, 'wishlist/wishlist.html', context)


@login_required
def add_to_wishlist(request, variant_id):
    """GET /wishlist/add/<variant_id>/ -> add (idempotent) to wishlist"""
    variant = get_object_or_404(ProductVariant, id=variant_id)
    WishlistItem.objects.get_or_create(
        user=request.user,
        variant=variant,
    )
    # Return to the page the user came from, else the wishlist.
    return redirect(request.META.get('HTTP_REFERER') or 'wishlist')


@login_required
def remove_wishlist(request, variant_id):
    """GET /wishlist/remove/<variant_id>/ -> remove from wishlist"""
    WishlistItem.objects.filter(
        user=request.user,
        variant__id=variant_id,
    ).delete()
    return redirect(request.META.get('HTTP_REFERER') or 'wishlist')


class WishlistListView(ListAPIView):
    """
    GET /wishlist/api/ -> list user's wishlist items.
    """
    serializer_class = WishlistItemSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return WishlistItem.objects.filter(user=self.request.user).select_related(
            'variant__product_color__product',
            'variant__product_color__color',
            'variant__size',
        )


class WishlistAddView(APIView):
    """
    POST /wishlist/api/add/<variant_id>/ -> add variant to wishlist.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, variant_id):
        variant = get_object_or_404(ProductVariant, id=variant_id)
        item, created = WishlistItem.objects.get_or_create(
            user=request.user,
            variant=variant,
        )
        if not created:
            return Response(
                {'detail': 'Already in wishlist.'},
                status=status.HTTP_200_OK,
            )
        serializer = WishlistItemSerializer(
            item, context={'request': request}
        )
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class WishlistRemoveView(APIView):
    """
    DELETE /wishlist/api/remove/<variant_id>/ -> remove variant from wishlist.
    """
    permission_classes = [IsAuthenticated]

    def delete(self, request, variant_id):
        deleted, _ = WishlistItem.objects.filter(
            user=request.user,
            variant__id=variant_id,
        ).delete()
        if not deleted:
            return Response(
                {'detail': 'Not in wishlist.'},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(status=status.HTTP_204_NO_CONTENT)
