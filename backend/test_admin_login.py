import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'greatkart.settings')
import django
django.setup()

from accounts.models import Account
from django.test import Client
from django.contrib.auth.forms import AuthenticationForm
from django.contrib.auth.backends import ModelBackend

# Check user flags
u = Account.objects.get(email='varaprasad1800@gmail.com')
print('User flags:')
print(f'  is_superuser: {u.is_superuser}')
print(f'  is_staff: {u.is_staff}')
print(f'  is_active: {u.is_active}')
print(f'  is_superadmin: {u.is_superadmin}')

# Check user_can_authenticate
print(f'\nModelBackend.user_can_authenticate: {ModelBackend().user_can_authenticate(u)}')

# AuthenticationForm
form = AuthenticationForm(data={'username': 'varaprasad1800@gmail.com', 'password': 'admin123'})
print(f'\nAuthenticationForm is_valid: {form.is_valid()}')
if not form.is_valid():
    print(f'Form errors: {dict(form.errors)}')
else:
    print(f'Form user: {form.get_user()}')

# Admin login test
print('\n=== ADMIN LOGIN TEST ===')
client = Client()
resp = client.post('/admin/login/', {'username': 'varaprasad1800@gmail.com', 'password': 'admin123', 'next': '/admin/'})
print(f'POST /admin/login/ status: {resp.status_code}')
print(f'Location: {resp.get("Location", "none")}')
print(f'Authenticated (_auth_user_id in session): {"_auth_user_id" in client.session}')

if '_auth_user_id' in client.session:
    resp2 = client.get('/admin/')
    print(f'GET /admin/ status: {resp2.status_code}')
    print('ADMIN LOGIN SUCCESSFUL!')
else:
    print('ADMIN LOGIN FAILED')
    if resp.content:
        print(resp.content.decode()[:2000])