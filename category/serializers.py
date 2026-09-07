from rest_framework import serializers
from .models import Category


class CategorySerializer(serializers.ModelSerializer):
    cat_image = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ['id', 'category_name', 'slug', 'description', 'cat_image']

    def get_cat_image(self, obj):
        request = self.context.get('request')
        if obj.cat_image:
            return request.build_absolute_uri(obj.cat_image.url) if request else obj.cat_image.url
        return None