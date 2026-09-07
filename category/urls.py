from django.urls import path
from . import views

urlpatterns = [
    # ===== API endpoints =====
    path('api/categories/', views.CategoryListView.as_view(), name='api_category_list'),
]