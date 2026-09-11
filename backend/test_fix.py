import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'greatkart.settings')
import django
django.setup()

from accounts.models import Account
from django.contrib.auth import authenticate

# Test create_user
user = Account.objects.create_user(
    email='test@test.com',
    password='testpass123',
    username='testuser',
    first_name='Test',
    last_name='User'
)
print('create_user:', user.email, user.is_active, user.is_staff)

# Test create_superuser
admin = Account.objects.create_superuser(
    email='admin@test.com',
    password='adminpass123',
    username='adminuser',
    first_name='Admin',
    last_name='User'
)
print('create_superuser:', admin.email, admin.is_active, admin.is_staff, admin.is_superuser)

# Test authenticate
result = authenticate(username='admin@test.com', password='adminpass123')
print('authenticate:', result)
if result:
    print('  is_active:', result.is_active)
    print('  is_staff:', result.is_staff)
    print('  is_superuser:', result.is_superuser)