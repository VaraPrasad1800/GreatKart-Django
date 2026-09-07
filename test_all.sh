#!/bin/bash
set -e
BASE=http://127.0.0.1:8000

TOK=$(curl -s -X POST "$BASE/api/token/" -H 'Content-Type: application/json' -d '{"email":"wish.reviewer.2026.2@test.com","password":"Testpass123!"}' | env/Scripts/python.exe -c "import sys,json;print(json.load(sys.stdin)['access'])")
AUTH="Authorization: Bearer $TOK"
PROD=atx-jeans
VAR=4

echo "===== Full Regression Test ====="
echo "1. Product list + search + category"
curl -s "$BASE/store/api/products/" | env/Scripts/python.exe -c "import sys,json;d=json.load(sys.stdin);print(' count',d['count'],'page_size',len(d['results']))"
curl -s "$BASE/store/api/products/?search=Jeans" | env/Scripts/python.exe -c "import sys,json;d=json.load(sys.stdin);print(' search Jeans:',d['count'])"
curl -s "$BASE/store/api/products/?category=jeans" | env/Scripts/python.exe -c "import sys,json;d=json.load(sys.stdin);print(' category jeans:',d['count'])"

echo "2. Product detail review_summary"
curl -s "$BASE/store/api/products/$PROD/" | env/Scripts/python.exe -c "import sys,json;d=json.load(sys.stdin);print(' reviews', 'reviews' in d, 'summary', 'review_summary' in d, 'count', d.get('review_summary',{}).get('count'))"

echo "3. Category list"
curl -s "$BASE/category/api/categories/" | env/Scripts/python.exe -c "import sys,json;d=json.load(sys.stdin);print(' categories:',d['count'])"

echo "4. Cart ops + Checkout"
env/Scripts/python.exe manage.py shell -c "
from cart.models import CartItem
from accounts.models import Account
u = Account.objects.get(email='wish.reviewer.2026.2@test.com')
CartItem.objects.filter(user=u).delete()
"
CODE=$(curl -s -o /tmp/ac1.json -w "%{http_code}" -X POST "$BASE/cart/api/add/$VAR/" -H "$AUTH")
echo " add HTTP $CODE"
curl -s "$BASE/cart/api/" -H "$AUTH" | env/Scripts/python.exe -c "import sys,json;d=json.load(sys.stdin);print(' items',len(d.get('items',[])),'img_http',(d.get('items',[{}])[0].get('image','')[:4] if d.get('items') else 'none'),'total',d.get('total'),'grand',d.get('grand_total'))"

echo "5. Checkout"
env/Scripts/python.exe manage.py shell -c "
from store.models import ProductVariant
v = ProductVariant.objects.get(id=4)
v.stock = 2
v.save()
"
CODE=$(curl -s -o /tmp/co1.json -w "%{http_code}" -X POST "$BASE/orders/api/checkout/" -H 'Content-Type: application/json' -H "$AUTH" -d '{"full_name":"Test User","phone":"9876543210","email":"test@test.com","address_line_1":"123 Main","city":"Hyd","state":"TS","country":"India","pincode":"500001"}')
ORDER=$(cat /tmp/co1.json | env/Scripts/python.exe -c "import sys,json;d=json.load(sys.stdin);print(d.get('order',{}).get('order_number',''))")
echo " checkout HTTP $CODE order=$ORDER"

echo "6. Remove line (after checkout cart is empty)"
CODE=$(curl -s -o /tmp/rm1.json -w "%{http_code}" -X POST "$BASE/cart/api/remove/$VAR/" -H "$AUTH")
echo " remove HTTP $CODE (expected 404)"
curl -s "$BASE/cart/api/" -H "$AUTH" | env/Scripts/python.exe -c "import sys,json;print('items:',len(json.load(sys.stdin).get('items',[])))"

echo "6. Order list/detail"
curl -s "$BASE/orders/api/orders/" -H "$AUTH" | env/Scripts/python.exe -c "import sys,json;d=json.load(sys.stdin);print(' orders:',d['count'])"
curl -s "$BASE/orders/api/orders/$ORDER/" -H "$AUTH" | env/Scripts/python.exe -c "import sys,json;d=json.load(sys.stdin);print(' detail status:',d.get('status'),'items:',len(d.get('items',[])))"

echo "7. Empty cart -> 400"
CODE=$(curl -s -o /tmp/co2.json -w "%{http_code}" -X POST "$BASE/orders/api/checkout/" -H 'Content-Type: application/json' -H "$AUTH" -d '{"full_name":"Test","phone":"9876543210","email":"test@test.com","address_line_1":"123","city":"Hyd","state":"TS","country":"India","pincode":"500001"}')
echo " HTTP $CODE"

echo "8. Review flow"
curl -s "$BASE/store/api/products/$PROD/reviews/" | env/Scripts/python.exe -c "import sys,json;d=json.load(sys.stdin);print(' public reviews:',d['count'])"
CODE=$(curl -s -o /tmp/r1.json -w "%{http_code}" -X POST "$BASE/store/api/products/$PROD/reviews/" -H 'Content-Type: application/json' -H "$AUTH" -d '{"rating":5,"comment":"test"}')
echo " POST no delivered -> $CODE"
CODE=$(curl -s -o /tmp/r2.json -w "%{http_code}" -X POST "$BASE/store/api/products/$PROD/reviews/" -H 'Content-Type: application/json' -d '{"rating":4,"comment":"anon"}')
echo " POST unauth -> $CODE"

echo "9. Mark Completed -> review"
env/Scripts/python.exe manage.py shell -c "
from orders.models import Order
o = Order.objects.get(order_number='$ORDER')
o.status = 'Completed'
o.save()
print('marked Completed:', o.order_number, '->', o.status)
"
CODE=$(curl -s -o /tmp/r3.json -w "%{http_code}" -X POST "$BASE/store/api/products/$PROD/reviews/" -H 'Content-Type: application/json' -H "$AUTH" -d '{"rating":5,"comment":"Delivered great!"}')
echo " POST after delivered -> $CODE: $(cat /tmp/r3.json | head -c 80)"
CODE=$(curl -s -o /tmp/r4.json -w "%{http_code}" -X POST "$BASE/store/api/products/$PROD/reviews/" -H 'Content-Type: application/json' -H "$AUTH" -d '{"rating":3,"comment":"dup"}')
echo " duplicate -> $CODE: $(cat /tmp/r4.json | head -c 80)"
curl -s "$BASE/store/api/products/$PROD/reviews/" | env/Scripts/python.exe -c "import sys,json;d=json.load(sys.stdin);print(' reviews count:',d['count'])"
curl -s "$BASE/store/api/products/$PROD/" | env/Scripts/python.exe -c "import sys,json;d=json.load(sys.stdin);print(' review_summary:',d.get('review_summary'))"

echo "10. Wishlist"
VAR2=$(curl -s "$BASE/store/api/products/nike-air-jordhan/" | env/Scripts/python.exe -c "import sys,json;d=json.load(sys.stdin);pcs=d.get('product_colors')or[];print(next((v['id'] for pc in pcs for v in (pc.get('variants')or[])), ''))")
CODE=$(curl -s -o /tmp/w1.json -w "%{http_code}" -X POST "$BASE/wishlist/api/add/$VAR2/" -H "$AUTH")
echo " add $CODE"
curl -s "$BASE/wishlist/api/" -H "$AUTH" | env/Scripts/python.exe -c "import sys,json;print(' count:',json.load(sys.stdin)['count'])"
CODE=$(curl -s -o /tmp/w2.json -w "%{http_code}" -X DELETE "$BASE/wishlist/api/remove/$VAR2/" -H "$AUTH")
echo " remove $CODE"
curl -s "$BASE/wishlist/api/" -H "$AUTH" | env/Scripts/python.exe -c "import sys,json;print(' count after:',json.load(sys.stdin)['count'])"

echo "11. AddToCart create=201, increment=200"
env/Scripts/python.exe manage.py shell -c "
from cart.models import CartItem
from accounts.models import Account
u = Account.objects.get(email='wish.reviewer.2026.2@test.com')
CartItem.objects.filter(user=u).delete()
"
CODE=$(curl -s -o /tmp/a2.json -w "%{http_code}" -X POST "$BASE/cart/api/add/$VAR/" -H "$AUTH")
echo " first $CODE"
CODE=$(curl -s -o /tmp/a3.json -w "%{http_code}" -X POST "$BASE/cart/api/add/$VAR/" -H "$AUTH")
echo " second $CODE"

echo "12. Out-of-stock checkout -> 400"
env/Scripts/python.exe manage.py shell -c "
from store.models import ProductVariant
v = ProductVariant.objects.get(id=4)
v.stock = 0
v.save()
from cart.models import CartItem
from accounts.models import Account
u = Account.objects.get(email='wish.reviewer.2026.2@test.com')
CartItem.objects.filter(user=u).delete()
CartItem.objects.create(user=u, variant=v, quantity=1)
"
CODE=$(curl -s -o /tmp/c3.json -w "%{http_code}" -X POST "$BASE/orders/api/checkout/" -H 'Content-Type: application/json' -H "$AUTH" -d '{"full_name":"Test","phone":"9876543210","email":"test@test.com","address_line_1":"123","city":"Hyd","state":"TS","country":"India","pincode":"500001"}')
echo " HTTP $CODE: $(cat /tmp/c3.json)"
env/Scripts/python.exe manage.py shell -c "
from store.models import ProductVariant
v = ProductVariant.objects.get(id=4)
v.stock = 2
v.save()
"

echo "13. Admin"
curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8000/admin/ 2>&1 | grep -E '200|302' && echo " admin OK" || echo " admin issue"

echo "===== DONE ====="