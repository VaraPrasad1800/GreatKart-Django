"""
Add ProductAttribute examples to demonstrate dynamic filtering.
Run: python manage.py shell < seed_attributes.py
"""
import django, os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'greatkart.settings')
django.setup()

from store.models import Product, ProductAttribute

# Clear existing to re-seed
ProductAttribute.objects.all().delete()

ATTRS = {
    'ATX-Jeans': [
        ('material', 'Material', 'Cotton', 'text', 10),
        ('fit', 'Fit', 'Slim', 'select', 20),
        ('wash', 'Wash', 'Dark', 'select', 30),
    ],
    'Mavi_Jeans': [
        ('material', 'Material', 'Organic Cotton', 'text', 10),
        ('fit', 'Fit', 'Straight', 'select', 20),
        ('wash', 'Wash', 'Medium', 'select', 30),
    ],
    'Blue_Shirt': [
        ('material', 'Material', 'Cotton Blend', 'text', 10),
        ('collar', 'Collar Type', 'Spread', 'select', 20),
    ],
    'Wrangler-Shirt': [
        ('material', 'Material', 'Cotton Twill', 'text', 10),
        ('style', 'Style', 'Western', 'select', 20),
    ],
    'Great-Tshirt': [
        ('material', 'Material', 'Cotton', 'text', 10),
        ('neck', 'Neck Type', 'Crew', 'select', 20),
    ],
    'Jordan-basketball-shoes': [
        ('material', 'Material', 'Leather/Synthetic', 'text', 10),
        ('cushioning', 'Cushioning', 'Zoom Air', 'select', 20),
        ('type', 'Shoe Type', 'Basketball', 'select', 30),
    ],
    'Puma-Ferrari-shoes': [
        ('material', 'Material', 'Synthetic Leather', 'text', 10),
        ('type', 'Shoe Type', 'Lifestyle', 'select', 20),
        ('collection', 'Collection', 'Ferrari', 'select', 30),
    ],
    'Nike-Air-Jordhan': [
        ('material', 'Material', 'Premium Leather', 'text', 10),
        ('cushioning', 'Cushioning', 'Air-Sole', 'select', 20),
        ('type', 'Shoe Type', 'Retro', 'select', 30),
        ('edition', 'Edition', 'Retro High', 'select', 40),
    ],
    'US-Polo-Jacket': [
        ('material', 'Material', 'Polyester/Nylon', 'text', 10),
        ('lining', 'Lining', 'Fleece', 'select', 20),
        ('weather', 'Weather Resistance', 'Water-Resistant', 'select', 30),
    ],
}

for name, attrs in ATTRS.items():
    try:
        product = Product.objects.get(product_name=name)
    except Product.DoesNotExist:
        continue
    for key, label, value, attr_type, order in attrs:
        ProductAttribute.objects.create(
            product=product,
            key=key,
            label=label,
            value=value,
            attribute_type=attr_type,
            is_filterable=True,
            display_order=order,
        )
    print(f'  Added {len(attrs)} attributes to {name}')

print('\\nDone.')