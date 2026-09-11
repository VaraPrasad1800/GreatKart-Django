"""Product sync services.

Mappers turn a raw API item into a normalized dict; ``save_mapped_product``
persists that dict idempotently, keyed on ``Product.external_id``. To add a
new data source later, write one more mapper function that returns the same
dict shape and feed it to the same save logic.
"""

import os
import random
import urllib.request
from urllib.parse import urlparse

from django.core.files.base import ContentFile
from django.utils.text import slugify

from category.models import Category
from store.models import (
    Color, Product, ProductAttribute, ProductColor, ProductImage,
    ProductVariant, Size,
)
from store.variant_config import get_category_variants

# Small predefined pool used to fake the color field DummyJSON doesn't provide.
# Colors deliberately match the hex map in frontend FilterPanel so swatches render.
# The variant dimension (which sizes/storage values apply) lives per-category in
# store/variant_config.py — NOT here, so a phone never gets clothing sizes.
PREDEFINED_COLORS = [
    'Black', 'White', 'Red', 'Blue', 'Green', 'Yellow', 'Orange',
    'Purple', 'Pink', 'Brown', 'Navy', 'Grey', 'Beige', 'Teal',
]

# Color used when a category has no color dimension (e.g. groceries): one
# "Default" color keeps the single required variant + product image attached.
NO_COLOR = 'Default'

USER_AGENT = 'GreatKart-ProductSync/1.0 (Django management command)'


def map_dummyjson_product(item):
    """Map one DummyJSON product dict to normalized GreatKart data.

    Returns a dict ready for ``save_mapped_product``, or ``None`` when the
    item is missing a required field (title / category / price / stock).
    """
    external_id = item.get('id')
    title = (item.get('title') or '').strip()
    description = (item.get('description') or '').strip()
    category_name = (item.get('category') or '').strip()
    price = item.get('price')
    stock = item.get('stock')

    if not external_id or not title or not category_name or price is None or stock is None:
        return None

    # Deterministic randomness per product: the SAME product always maps to
    # the same colors, so re-syncing never changes or duplicates variants.
    rng = random.Random(external_id)

    discount = item.get('discountPercentage') or 0
    is_on_sale = discount > 0
    original_price = round(price / (1 - discount / 100)) if is_on_sale else None

    config = get_category_variants(category_name)
    colors = (
        rng.sample(PREDEFINED_COLORS, rng.randint(1, 3))
        if config['has_color'] else [NO_COLOR]
    )
    sizes = list(config['options'])
    price_pct = dict(config['price_pct'])

    attributes = [
        {'key': 'rating', 'label': 'Rating', 'value': str(item.get('rating') or ''),
         'attribute_type': 'number', 'is_filterable': True},
        {'key': 'availability', 'label': 'Availability',
         'value': item.get('availabilityStatus') or 'Unknown',
         'attribute_type': 'select', 'is_filterable': True},
        {'key': 'tags', 'label': 'Tags', 'value': ', '.join(item.get('tags') or []),
         'attribute_type': 'multiselect', 'is_filterable': True},
        {'key': 'warranty', 'label': 'Warranty',
         'value': item.get('warrantyInformation') or '', 'attribute_type': 'text', 'is_filterable': False},
        {'key': 'shipping', 'label': 'Shipping',
         'value': item.get('shippingInformation') or '', 'attribute_type': 'text', 'is_filterable': False},
        {'key': 'return_policy', 'label': 'Return Policy',
         'value': item.get('returnPolicy') or '', 'attribute_type': 'text', 'is_filterable': False},
        {'key': 'weight', 'label': 'Weight', 'value': str(item.get('weight') or ''),
         'attribute_type': 'number', 'is_filterable': False},
    ]

    product_name = title[:200]
    slug = slugify(title)

    # Product.product_name and Product.slug are both UNIQUE. DummyJSON has one
    # duplicate-title pair (ids 96 & 191 both 'Rolex Cellini Moonphase'), and a
    # manual product could collide too. Disambiguate against any OTHER synced
    # or manual product that already owns the value, keyed on this external_id.
    if Product.objects.filter(product_name=product_name).exclude(external_id=external_id).exists():
        product_name = f'{product_name}-{external_id}'
    if Product.objects.filter(slug=slug).exclude(external_id=external_id).exists():
        slug = f'{slug}-{external_id}'

    return {
        'external_id': external_id,
        'product_name': product_name,
        'slug': slug,
        'description': description[:500],
        'category_name': category_name,
        'brand': (item.get('brand') or '').strip()[:100],
        'is_available': True,
        'is_on_sale': is_on_sale,
        'original_price': original_price,
        'colors': colors,
        'sizes': sizes,
        'price_pct': price_pct,
        'price': round(price),
        'stock': stock,
        'attributes': attributes,
        'image_urls': list(item.get('images') or []),
        'thumbnail': item.get('thumbnail') or '',
    }


def save_mapped_product(mapped, download_images=True):
    """Persist one mapped product — idempotent, keyed on ``external_id``.

    Creates or reuses Category / Color / Size, then Product and its
    color -> variant -> image -> attribute hierarchy. Returns
    ``('created' | 'updated', {'variants': n, 'images': n})``.
    """
    category, _ = Category.objects.get_or_create(
        category_name=mapped['category_name'],
        defaults={'slug': slugify(mapped['category_name']), 'description': ''},
    )

    product, created = Product.objects.update_or_create(
        external_id=mapped['external_id'],
        defaults={
            'product_name': mapped['product_name'],
            'slug': mapped['slug'],
            'description': mapped['description'],
            'category': category,
            'brand': mapped['brand'],
            'isAvailable': mapped['is_available'],
            'original_price': mapped['original_price'],
            'is_on_sale': mapped['is_on_sale'],
        },
    )

    base_price = mapped['price']  # DummyJSON price, already rounded to int

    # Colors -> ProductColor, then one variant per (color x dimension value).
    # price varies per the category's price_pct map, deterministically, so
    # re-sync is stable and clothing sizes never leak onto phones.
    price_pct = mapped.get('price_pct') or {}
    product_colors = []
    for color_name in mapped['colors']:
        color, _ = Color.objects.get_or_create(name=color_name)
        product_color, _ = ProductColor.objects.get_or_create(product=product, color=color)
        product_colors.append(product_color)
        for size_name in mapped['sizes']:
            size, _ = Size.objects.get_or_create(name=size_name)
            size_price = round(base_price * (1 + price_pct.get(size_name, 0)))
            variant, created_v = ProductVariant.objects.get_or_create(
                product_color=product_color,
                size=size,
                defaults={'price': size_price, 'stock': mapped['stock']},
            )
            # Refresh on re-sync — deterministic, so same inputs -> same price every run.
            if not created_v and variant.price != size_price:
                variant.price = size_price
            if not created_v and variant.stock != mapped['stock']:
                variant.stock = mapped['stock']
            if not created_v:
                variant.save(update_fields=['price', 'stock'])

    # Attributes -> dynamic filters in the FilterPanel.
    for attr in mapped['attributes']:
        ProductAttribute.objects.update_or_create(
            product=product,
            key=attr['key'],
            defaults={
                'label': attr['label'],
                'value': attr['value'],
                'attribute_type': attr['attribute_type'],
                'is_filterable': attr['is_filterable'],
            },
        )

    images = _attach_images(product, product_colors, mapped) if download_images and product_colors else 0

    return ('created' if created else 'updated'), {'variants': len(product_colors) * len(mapped['sizes']), 'images': images}


def _attach_images(product, product_colors, mapped):
    """Download up to 4 images onto the first (primary) color only.

    Images are attached once per product — never once per color/size variant.
    If the primary color already has images, skip entirely (idempotent).
    """
    primary = product_colors[0]
    if primary.images.exists():          # re-sync: don't re-download or duplicate
        return 0

    urls = mapped['image_urls'] or ([mapped['thumbnail']] if mapped['thumbnail'] else [])
    saved = 0
    for index, url in enumerate(urls[:4]):
        try:
            content = _download(url)
        except Exception:
            continue
        ext = os.path.splitext(urlparse(url).path)[1] or '.jpg'
        image = ProductImage(product_color=primary, is_primary=(index == 0))
        image.image.save(f'{product.slug}-{index}{ext}', ContentFile(content), save=True)
        saved += 1
    return saved


def _download(url, timeout=20):
    req = urllib.request.Request(url, headers={'User-Agent': USER_AGENT})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.read()