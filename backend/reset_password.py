import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'greatkart.settings')
import django
django.setup()

from accounts.models import Account
from django.contrib.auth import authenticate

# Find the user and reset password
user = Account.objects.filter(email='varaprasad1800@gmail.com').first()
if user:
    user.set_password('admin123')
    user.is_superuser = True
    user.is_staff = True
    user.is_active = True
    user.is_admin = True
    user.is_superadmin = True
    user.save()
    print(f'Updated {user.email}')
    print(f'  is_active={user.is_active}')
    print(f'  is_staff={user.is_staff}')
    print(f'  is_superuser={user.is_superuser}')

    # Test authenticate
    result = authenticate(username='varaprasad1800@gmail.com', password='admin123')
    print(f'authenticate: {result}')
    if result:
        print(f'  is_active: {result.is_active}')
        print(f'  is_staff: {result.is_staff}')
        print(f'  is_superuser: {result.is_superuser}')
else:
    print('User not found')