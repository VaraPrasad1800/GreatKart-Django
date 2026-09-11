"""Sync products from the DummyJSON API into the local database.

Idempotent: re-running refreshes existing synced products (keyed on
``Product.external_id``) and never touches manually-created products.
"""

import json
import urllib.request

from django.core.management.base import BaseCommand

from store.services.sync import map_dummyjson_product, save_mapped_product

API_URL = 'https://dummyjson.com/products'
USER_AGENT = 'GreatKart-ProductSync/1.0'


class Command(BaseCommand):
    help = 'Sync products from DummyJSON into GreatKart (idempotent).'

    def add_arguments(self, parser):
        parser.add_argument('--no-images', action='store_true',
                            help='Skip downloading product images (faster sync).')
        parser.add_argument('--max', type=int, default=None,
                            help='Only sync the first N products (for testing).')

    def handle(self, *args, **options):
        created = updated = skipped = 0
        variants = images = 0
        skip = 0
        limit = 30
        fetched = 0

        self.stdout.write('Fetching products from DummyJSON ...')

        while True:
            page = self._fetch(skip, limit)
            if page is None:
                self.stderr.write(self.style.ERROR(f'Failed to fetch (skip={skip}); aborting.'))
                break

            products = page.get('products') or []
            total = page.get('total')

            for item in products:
                if options['max'] and fetched >= options['max']:
                    break
                mapped = map_dummyjson_product(item)
                if mapped is None:
                    skipped += 1
                    self.stdout.write(self.style.WARNING(
                        f"  skipped #{item.get('id')}: missing required fields"))
                    continue
                status, counts = save_mapped_product(mapped, download_images=not options['no_images'])
                if status == 'created':
                    created += 1
                else:
                    updated += 1
                variants += counts['variants']
                images += counts['images']
                fetched += 1

            if options['max'] and fetched >= options['max']:
                break
            if not products or len(products) < limit:
                break
            skip += limit
            if total is not None and skip >= total:
                break

        self.stdout.write(self.style.SUCCESS(
            f'Done: {created} created, {updated} updated, {skipped} skipped '
            f'({variants} variants, {images} images).'))

    def _fetch(self, skip, limit):
        url = f'{API_URL}?limit={limit}&skip={skip}'
        try:
            req = urllib.request.Request(url, headers={'User-Agent': USER_AGENT})
            with urllib.request.urlopen(req, timeout=30) as resp:
                return json.loads(resp.read().decode('utf-8'))
        except Exception as exc:
            self.stderr.write(f'  error fetching {url}: {exc}')
            return None