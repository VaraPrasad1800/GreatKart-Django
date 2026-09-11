"""
Run with: python manage.py shell < seed_products.py
Seeds brand, description, original_price, is_on_sale for all existing products.
"""
import django, os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'greatkart.settings')
django.setup()

from store.models import Product

PRODUCT_DATA = {
    'ATX-Jeans': {
        'brand': 'Wrangler',
        'description': 'Classic slim-fit denim jeans with a modern tapered leg. Durable cotton-stretch fabric for all-day comfort. Available in multiple washes.',
        'original_price': 39,
        'is_on_sale': True,
    },
    'Blue_Shirt': {
        'brand': 'Van Heusen',
        'description': 'Crisp wrinkle-free dress shirt in classic blue. Slim-fit cut with a spread collar. Perfect for office wear or formal events.',
        'original_price': 45,
        'is_on_sale': True,
    },
    'Great-Tshirt': {
        'brand': 'Hanes',
        'description': 'Lightweight cotton crew-neck tee. Pre-shrunk fabric for a consistent fit wash after wash. A wardrobe essential.',
        'original_price': 20,
        'is_on_sale': False,
    },
    'Jordan-basketball-shoes': {
        'brand': 'Nike',
        'description': 'Air Jordan performance basketball shoes with responsive Zoom Air cushioning. High-top design for ankle support on the court.',
        'original_price': 120,
        'is_on_sale': True,
    },
    'Mavi_Jeans': {
        'brand': 'Mavi',
        'description': 'Premium straight-leg jeans made from organic cotton denim. Sits at the waist with a relaxed thigh and straight leg for a clean silhouette.',
        'original_price': 55,
        'is_on_sale': True,
    },
    'Puma-Ferrari-shoes': {
        'brand': 'Puma',
        'description': 'Puma x Ferrari motorsport-inspired sneakers. Lightweight rubber sole with streamlined design. Official Scuderia Ferrari collaboration.',
        'original_price': 95,
        'is_on_sale': False,
    },
    'US-Polo-Jacket': {
        'brand': 'U.S. Polo Assn.',
        'description': 'Lightweight zip-up jacket with ribbed cuffs and hem. Water-resistant outer shell with soft fleece lining. Ideal for transitional weather.',
        'original_price': 65,
        'is_on_sale': True,
    },
    'Wrangler-Shirt': {
        'brand': 'Wrangler',
        'description': 'Western-style snap-button shirt in durable cotton twill. Pointed yoke stitching and two chest pockets. A ranch classic.',
        'original_price': 28,
        'is_on_sale': False,
    },
    'Nike-Air-Jordhan': {
        'brand': 'Nike',
        'description': 'Air Jordan 1 retro high-top sneakers. Premium leather upper with the iconic Wings logo and Air-Sole cushioning. A sneaker-collector staple.',
        'original_price': 250,
        'is_on_sale': True,
    },
}

updated = 0
for product in Product.objects.all():
    data = PRODUCT_DATA.get(product.product_name)
    if data:
        changed = False
        for field, value in data.items():
            if getattr(product, field) != value:
                setattr(product, field, value)
                changed = True
        if changed:
            product.save(update_fields=['brand', 'description', 'original_price', 'is_on_sale'])
            updated += 1
            print(f'  Updated: {product.product_name} (brand={product.brand}, was ${product.original_price}, sale={product.is_on_sale})')
    else:
        print(f'  Skipped (no data): {product.product_name}')

print(f'\nDone — {updated} products updated.')
