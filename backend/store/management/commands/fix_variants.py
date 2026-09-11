"""Rebuild variants of synced products to match the per-category config.

One-time data migration for the bug where every synced product got the same
S/M/L/XL/XXL sizes regardless of category (e.g. a phone showing
"Size: L, XL, M"). After this runs, each synced product's variants match
store/variant_config.py:

* phones / laptops / tablets get Storage options (64GB, 128GB, ...)
* clothing keeps Sizes; shoes get flat-priced EU sizes
* color-only categories (beauty, watches, ...) collapse to "One Size"
* groceries / books collapse to a single Default x One Size variant

Idempotent: safe to re-run — products whose variants already match are left
untouched. Manual products (external_id IS NULL) are never modified.

Usage:
    python manage.py fix_variants              # fix all synced products
    python manage.py fix_variants --dry-run    # report without changing
    python manage.py fix_variants --category smartphones   # one category
    python manage.py fix_variants --product 121            # one product
"""

import random
from collections import defaultdict

from django.core.management.base import BaseCommand

from store.models import Color, Product, ProductColor, ProductVariant
from store.services.sync import NO_COLOR, PREDEFINED_COLORS
from store.variant_config import get_category_variants


class Command(BaseCommand):
    help = 'Rebuild synced-product variants to match per-category config (idempotent).'

    def add_arguments(self, parser):
        parser.add_argument('--dry-run', action='store_true',
                            help='Report what would change without writing anything.')
        parser.add_argument('--category', default=None,
                            help='Only fix products in this category slug (testing).')
        parser.add_argument('--product', type=int, default=None,
                            help='Only fix this product id (testing).')
        parser.add_argument('--verbose', action='store_true',
                            help='Print per-product detail.')

    def handle(self, *args, **options):
        self.verbose = options['verbose']
        self.dry_run = options['dry_run']

        qs = Product.objects.filter(external_id__isnull=False).select_related('category')
        if options['category']:
            qs = qs.filter(category__slug=options['category'])
        if options['product']:
            qs = qs.filter(id=options['product'])

        per_category = defaultdict(lambda: {
            'products': 0, 'variants_deleted': 0, 'variants_created': 0,
            'colors_deleted': 0, 'prices_changed': 0,
        })
        total = {'products': 0, 'variants_deleted': 0, 'variants_created': 0,
                 'colors_deleted': 0, 'prices_changed': 0}
        skipped_no_data = 0

        for product in qs.order_by('category__category_name', 'id'):
            cat_stats = per_category[product.category.category_name]
            result = self._fix_product(product, cat_stats)
            if result is None:
                skipped_no_data += 1
            else:
                for key in ('variants_deleted', 'variants_created', 'colors_deleted', 'prices_changed'):
                    total[key] += result[key]
                    cat_stats[key] += result[key]
                total['products'] += 1
                cat_stats['products'] += 1

        if self.dry_run:
            self.stdout.write(self.style.WARNING('DRY RUN — nothing was written.\n'))

        self.stdout.write('\nPer-category results:')
        for cat, s in sorted(per_category.items()):
            if not s['products']:
                continue
            self.stdout.write(
                f"  {cat:<22} products={s['products']:<3} "
                f"deleted={s['variants_deleted']:<3} created={s['variants_created']:<3} "
                f"colors_removed={s['colors_deleted']:<3} repriced={s['prices_changed']:<3}"
            )

        self.stdout.write(self.style.SUCCESS(
            f"\nTotal: {total['products']} products corrected "
            f"({total['variants_deleted']} old variants deleted, "
            f"{total['variants_created']} new variants created, "
            f"{total['colors_deleted']} colors removed, "
            f"{total['prices_changed']} variants repriced)."
        ))
        if skipped_no_data:
            self.stdout.write(self.style.WARNING(
                f'{skipped_no_data} synced products had no variants and were left alone.'))

    # ------------------------------------------------------------------ fix
    def _fix_product(self, product, stats):
        """Rebuild one synced product's variants per its category config.

        Returns a dict of counts, or None if the product has no variants to
        base a price on. Each product is updated inside its own transaction so
        orphan SKUs between deletes and inserts don't trip the global UNIQUE on
        ProductVariant.sku.
        """
        from django.db import transaction

        config = get_category_variants(product.category)
        target_sizes = config['options']
        price_pct = config['price_pct']
        has_color = config['has_color']

        pcs = list(ProductColor.objects.filter(product=product)
                   .prefetch_related('color', 'images', 'variants__size'))
        variants = ProductVariant.objects.filter(product_color__product=product) \
            .select_related('size', 'product_color', 'product_color__color')

        existing = list(variants)
        if not existing:
            return None  # nothing to derive a base price from

        base_price = min(v.price for v in existing)
        stock = existing[0].stock

        result = {'variants_deleted': 0, 'variants_created': 0,
                  'colors_deleted': 0, 'prices_changed': 0}

        with transaction.atomic():
            # ---- target colors ---------------------------------------------
            if has_color:
                color_names = [pc.color.name for pc in pcs]
                if not color_names:
                    rng = random.Random(product.external_id)
                    color_names = rng.sample(PREDEFINED_COLORS, rng.randint(1, 3))
                target_pcs = pcs[:]
            else:
                default_color, _ = Color.objects.get_or_create(name=NO_COLOR)
                if pcs:
                    primary = pcs[0]
                    for extra in pcs[1:]:
                        if not self.dry_run:
                            for img in extra.images.all():
                                img.product_color = primary
                                img.save(update_fields=['product_color'])
                            for v in extra.variants.all():
                                v.product_color = primary
                                v.save(update_fields=['product_color'])
                            extra.delete()
                        result['colors_deleted'] += 1
                    if primary.color.name != NO_COLOR:
                        primary.color = default_color
                        if not self.dry_run:
                            primary.save(update_fields=['color'])
                else:
                    primary = None
                target_pcs = [primary] if primary else []
                if not target_pcs and not self.dry_run:
                    pc = ProductColor.objects.create(product=product, color=default_color)
                    target_pcs = [pc]

            # ---- delete variants whose value is no longer valid ------------
            valid = set(target_sizes)
            to_delete = [v for v in existing if v.size.name not in valid]
            if to_delete and not self.dry_run:
                ProductVariant.objects.filter(id__in=[v.id for v in to_delete]).delete()
            result['variants_deleted'] = len(to_delete)

            # ---- reload so live_map reflects repoints/deletes --------------
            live = list(ProductVariant.objects.filter(product_color__product=product)
                        .select_related('size', 'product_color'))
            live_map = {(v.product_color_id, v.size.name): v for v in live}

            # ---- create / refresh the target variants ----------------------
            for pc in target_pcs:
                for size_name in target_sizes:
                    size = _get_size(size_name)
                    price = round(base_price * (1 + price_pct.get(size_name, 0)))
                    key = (pc.id, size_name)
                    var = live_map.get(key)
                    if var is None:
                        if not self.dry_run:
                            ProductVariant.objects.create(
                                product_color=pc, size=size,
                                price=price, stock=stock, is_active=True,
                            )
                        result['variants_created'] += 1
                    elif var.price != price or var.stock != stock:
                        if not self.dry_run:
                            var.price = price
                            var.stock = stock
                            var.save(update_fields=['price', 'stock'])
                        result['prices_changed'] += 1

            if self.dry_run:
                # Don't actually commit the clears we did inside this txn.
                transaction.set_rollback(True)

        if self.verbose:
            self.stdout.write(
                f"  {product.category.category_name:<22} {product.product_name[:40]:<40} "
                f"ext={product.external_id} "
                f"del={result['variants_deleted']} new={result['variants_created']} "
                f"colors_del={result['colors_deleted']}"
            )
        return result


def _get_size(name):
    """Get-or-create a Size row."""
    from store.models import Size
    size, _ = Size.objects.get_or_create(name=name)
    return size
