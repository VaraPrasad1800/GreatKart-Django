"""Per-category variant-dimension configuration.

The single source of truth for which variant dimensions each category gets:

* ``label``     — what the dimension is called in the UI ("Size" / "Storage")
* ``has_color`` — whether the category also gets color variants
* ``options``   — the dimension values to create as ``Size`` rows
* ``price_pct`` — deterministic per-value price bump (fraction of base price)

The sync mapper (``map_dummyjson_product``), the data-fix command
(``fix_variants``) and the API serializers all read this one dict, so a new
category is supported by adding one entry here — no per-product hardcoding.

Categories NOT listed fall back to group-5 behavior (color only, a single
"One Size" option, flat price) rather than crashing or silently reusing
clothing sizes.  This covers future DummyJSON categories and any manual
product whose category name doesn't match the list.
"""

from django.utils.text import slugify

# ---- shared option sets ----------------------------------------------------
CLOTHING_SIZES = ['S', 'M', 'L', 'XL', 'XXL']
SHOE_SIZES = ['39', '40', '41', '42', '43', '44', '45']
SUNGLASS_SIZES = ['S', 'M', 'L']
PHONE_STORAGE = ['64GB', '128GB', '256GB', '512GB']
LAPTOP_STORAGE = ['256GB', '512GB', '1TB', '2TB']
TABLET_STORAGE = ['64GB', '128GB', '256GB', '512GB']
ONE_SIZE = ['One Size']

# ---- price bumps (deterministic, applied to the base price) ---------------
# Shoes deliberately have NO bump: a US/EU 39 and a 45 of the same shoe cost
# the same in real stores, so the price is flat across all sizes.
CLOTHING_PRICE_PCT = {'S': 0.00, 'M': 0.05, 'L': 0.08, 'XL': 0.12, 'XXL': 0.15}
SHOE_PRICE_PCT = {}
SUNGLASS_PRICE_PCT = {'S': 0.00, 'M': 0.05, 'L': 0.08}
PHONE_PRICE_PCT = {'64GB': 0.00, '128GB': 0.04, '256GB': 0.09, '512GB': 0.15}
LAPTOP_PRICE_PCT = {'256GB': 0.00, '512GB': 0.05, '1TB': 0.10, '2TB': 0.18}
TABLET_PRICE_PCT = {'64GB': 0.00, '128GB': 0.04, '256GB': 0.09, '512GB': 0.15}
FLAT_PRICE = {}

# ---- per-category config ---------------------------------------------------
CATEGORY_VARIANTS = {
    # Clothing — Size + Color
    'mens-shirts':     {'label': 'Size', 'has_color': True, 'options': CLOTHING_SIZES, 'price_pct': CLOTHING_PRICE_PCT},
    'tops':            {'label': 'Size', 'has_color': True, 'options': CLOTHING_SIZES, 'price_pct': CLOTHING_PRICE_PCT},
    'womens-dresses':  {'label': 'Size', 'has_color': True, 'options': CLOTHING_SIZES, 'price_pct': CLOTHING_PRICE_PCT},

    # Footwear — Size + Color, flat price across sizes
    'mens-shoes':      {'label': 'Size', 'has_color': True, 'options': SHOE_SIZES, 'price_pct': SHOE_PRICE_PCT},
    'womens-shoes':    {'label': 'Size', 'has_color': True, 'options': SHOE_SIZES, 'price_pct': SHOE_PRICE_PCT},

    # Eyewear — Size + Color
    'sunglasses':      {'label': 'Size', 'has_color': True, 'options': SUNGLASS_SIZES, 'price_pct': SUNGLASS_PRICE_PCT},

    # Electronics — Storage + Color
    'smartphones':     {'label': 'Storage', 'has_color': True, 'options': PHONE_STORAGE, 'price_pct': PHONE_PRICE_PCT},
    'laptops':         {'label': 'Storage', 'has_color': True, 'options': LAPTOP_STORAGE, 'price_pct': LAPTOP_PRICE_PCT},
    'tablets':         {'label': 'Storage', 'has_color': True, 'options': TABLET_STORAGE, 'price_pct': TABLET_PRICE_PCT},

    # Color only — "One Size" placeholder so the UI shows no size row
    'beauty':              {'label': 'Size', 'has_color': True, 'options': ONE_SIZE, 'price_pct': FLAT_PRICE},
    'skin-care':           {'label': 'Size', 'has_color': True, 'options': ONE_SIZE, 'price_pct': FLAT_PRICE},
    'fragrances':          {'label': 'Size', 'has_color': True, 'options': ONE_SIZE, 'price_pct': FLAT_PRICE},
    'womens-bags':         {'label': 'Size', 'has_color': True, 'options': ONE_SIZE, 'price_pct': FLAT_PRICE},
    'womens-jewellery':    {'label': 'Size', 'has_color': True, 'options': ONE_SIZE, 'price_pct': FLAT_PRICE},
    'mobile-accessories':  {'label': 'Size', 'has_color': True, 'options': ONE_SIZE, 'price_pct': FLAT_PRICE},
    'home-decoration':     {'label': 'Size', 'has_color': True, 'options': ONE_SIZE, 'price_pct': FLAT_PRICE},
    'kitchen-accessories': {'label': 'Size', 'has_color': True, 'options': ONE_SIZE, 'price_pct': FLAT_PRICE},
    'furniture':           {'label': 'Size', 'has_color': True, 'options': ONE_SIZE, 'price_pct': FLAT_PRICE},
    'motorcycle':          {'label': 'Size', 'has_color': True, 'options': ONE_SIZE, 'price_pct': FLAT_PRICE},
    'vehicle':             {'label': 'Size', 'has_color': True, 'options': ONE_SIZE, 'price_pct': FLAT_PRICE},
    'mens-watches':        {'label': 'Size', 'has_color': True, 'options': ONE_SIZE, 'price_pct': FLAT_PRICE},
    'womens-watches':      {'label': 'Size', 'has_color': True, 'options': ONE_SIZE, 'price_pct': FLAT_PRICE},
    'sports-accessories':  {'label': 'Size', 'has_color': True, 'options': ONE_SIZE, 'price_pct': FLAT_PRICE},

    # No variants — no color, single "One Size" so the product stays
    # purchasable (schema requires a size FK; the UI hides both selectors)
    'groceries':       {'label': 'Size', 'has_color': False, 'options': ONE_SIZE, 'price_pct': FLAT_PRICE},
    'books':           {'label': 'Size', 'has_color': False, 'options': ONE_SIZE, 'price_pct': FLAT_PRICE},
}

# Explicit fallback for categories NOT in CATEGORY_VARIANTS — both future
# DummyJSON categories and manual products with non-matching categories.
# Group-5 behavior: color only, no size/storage shown. Never clothing sizes.
DEFAULT_CATEGORY_VARIANTS = {
    'label': 'Size', 'has_color': True, 'options': ONE_SIZE, 'price_pct': FLAT_PRICE,
}


def get_category_variants(category):
    """Return the variant config for a category (Category instance, slug or name).

    Falls back to DEFAULT_CATEGORY_VARIANTS for anything not listed.
    """
    if category is None:
        return DEFAULT_CATEGORY_VARIANTS
    slug = getattr(category, 'slug', None) or slugify(str(category))
    return CATEGORY_VARIANTS.get(slug, DEFAULT_CATEGORY_VARIANTS)
