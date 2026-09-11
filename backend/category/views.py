from rest_framework import generics
from rest_framework.permissions import AllowAny
from .models import Category
from .serializers import CategorySerializer

# Create your views here.


class CategoryListView(generics.ListAPIView):
    """
    GET /category/api/categories/
    Public list of all categories, used by frontends to build the
    navigation menu (replaces the old menu_links context processor
    for API clients).
    """
    serializer_class = CategorySerializer
    permission_classes = [AllowAny]
    queryset = Category.objects.all().order_by('category_name')