import django, os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'greatkart.settings')
django.setup()

from rest_framework.test import APIRequestFactory
from store.views import ProductFilterOptionsView

rf = APIRequestFactory()

def test(url):
    req = rf.get(url, HTTP_HOST='127.0.0.1:8000')
    view = ProductFilterOptionsView.as_view()
    res = view(req)
    print(f'{url}')
    print(f'  brands: {res.data["brands"]}')
    print(f'  colors: {res.data["colors"]}')
    print(f'  sizes: {res.data["sizes"]}')
    print(f'  price_range: {res.data["price_range"]}')
    print(f'  attributes: {res.data["attributes"]}')

print('--- all ---');           test('/store/api/products/filter-options/')
print('--- category=jeans ---'); test('/store/api/products/filter-options/?category=jeans')
print('--- category=shoes ---'); test('/store/api/products/filter-options/?category=shoes')
print('--- search=shirt ---');   test('/store/api/products/filter-options/?search=shirt')