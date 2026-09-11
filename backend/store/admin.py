from django.contrib import admin
from .models import Product,ProductVariant,Color,Size,ProductImage,ProductColor,Review,ProductAttribute

# Register your models here.
class ProductAdmin(admin.ModelAdmin):
    prepopulated_fields = {'slug' : ('product_name',)}
    list_display = ['product_name','brand','isAvailable','is_on_sale','modified_at','external_id']
    list_filter = ['brand', 'is_on_sale', 'category']
    search_fields = ['product_name', 'brand', 'description']

class ProductVariantAdmin(admin.ModelAdmin):
    list_display  = ['sku','stock']
    list_filter = ['is_active']

class ProductAttributeAdmin(admin.ModelAdmin):
    list_display = ['product', 'key', 'label', 'value', 'attribute_type', 'is_filterable']
    list_filter = ['key', 'attribute_type', 'is_filterable']
    search_fields = ['product__product_name', 'key', 'label', 'value']

admin.site.register(Product,ProductAdmin)
admin.site.register(ProductVariant,ProductVariantAdmin)
admin.site.register(Color)
admin.site.register(Size)
admin.site.register(ProductImage)
admin.site.register(ProductColor)
admin.site.register(ProductAttribute, ProductAttributeAdmin)

@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ['product', 'user', 'rating', 'comment', 'created_at']
    list_filter = ['rating', 'created_at']
    search_fields = ['user__email', 'product__product_name']