import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'greatkart.settings')
import django
django.setup()

from django.test import Client

# Test admin login
print("=== ADMIN LOGIN TEST ===")
client = Client()
resp = client.post('/admin/login/', {
    'username': 'varaprasad1800@gmail.com',
    'password': 'admin123',
    'next': '/admin/',
})
print(f"POST /admin/login/ status: {resp.status_code}")
print(f"Location: {resp.get('Location', 'none')}")
print(f"Auth: {'_auth_user_id' in client.session}")
if '_auth_user_id' in client.session:
    resp2 = client.get('/admin/')
    print(f"GET /admin/ status: {resp2.status_code}")

# Test custom HTML login view
print("\n=== CUSTOM HTML LOGIN TEST ===")
client2 = Client()
resp2 = client2.post('/accounts/login/', {
    'email': 'varaprasad1800@gmail.com',
    'password': 'admin123',
})
print(f"POST /accounts/login/ status: {resp2.status_code}")
if '_auth_user_id' in client2.session:
    print(f"User ID: {client2.session['_auth_user_id']} - LOGIN WORKS")
else:
    print("FAILED")