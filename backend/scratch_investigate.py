import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'greatkart.settings')
import django
django.setup()

from accounts.models import Account
from django.contrib.auth.hashers import check_password
from django.test import Client

# Create a fresh test superuser
Account.objects.filter(email='fresh_debug@test.com').delete()
new_su = Account.objects.create_superuser(
    email='fresh_debug@test.com',
    password='TestPass123',
    username='fresh_debug',
    first_name='Fresh',
    last_name='Debug',
)
print(f'Created superuser: {new_su.email}')
print(f'  is_staff={new_su.is_staff}, is_superuser={new_su.is_superuser}')
print(f'  is_active={new_su.is_active}, is_admin={new_su.is_admin}')
pwd_correct = check_password('TestPass123', new_su.password)
print(f'  Password correct: {pwd_correct}')

# Now simulate admin login
c = Client()
c.get('/admin/login/')
resp = c.post('/admin/login/', {
    'username': 'fresh_debug@test.com',
    'password': 'TestPass123',
    'next': '/admin/',
})

print()
print('Admin login response status:', resp.status_code)
print('Redirect location:', resp.get('Location', 'none'))

if resp.status_code == 302:
    admin_resp = c.get(resp.get('Location', '/admin/'))
    print('Admin dashboard status:', admin_resp.status_code)
    if admin_resp.status_code == 302:
        print('REDIRECTED BACK TO:', admin_resp.get('Location', '?'))
        print('-> Django admin rejected the user after login!')
    else:
        print('-> Admin dashboard loaded OK!')

# Also test using django.contrib.auth.authenticate directly
from django.contrib.auth import authenticate
user = authenticate(request=None, username='fresh_debug@test.com', password='TestPass123')
print()
print('authenticate() result:', user)
if user:
    print('  is_active:', user.is_active)
    print('  is_staff:', user.is_staff)

# Cleanup
Account.objects.filter(email='fresh_debug@test.com').delete()
print()
print('Cleanup done.')
