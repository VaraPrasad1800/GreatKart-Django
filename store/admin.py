from django.contrib import admin
from .models import Product,ProductVariant,Color,Size,ProductImage,ProductColor,Review

# Register your models here.
class ProductAdmin(admin.ModelAdmin):
    prepopulated_fields = {'slug' : ('product_name',)}
    list_display = ['product_name','isAvailable','modified_at',]

class ProductVariantAdmin(admin.ModelAdmin):
    list_display  = ['sku','stock']

admin.site.register(Product,ProductAdmin)
admin.site.register(ProductVariant,ProductVariantAdmin)
admin.site.register(Color)
admin.site.register(Size)
admin.site.register(ProductImage)
admin.site.register(ProductColor)

@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ['product', 'user', 'rating', 'comment', 'created_at']
    list_filter = ['rating', 'created_at']
    search_fields = ['user__email', 'product__product_name']