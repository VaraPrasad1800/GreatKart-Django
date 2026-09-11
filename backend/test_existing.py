import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'greatkart.settings')
import django
django.setup()

from accounts.models import Account
from django.contrib.auth import authenticate

# Test against existing staff users
print('=== EXISTING STAFF USERS ===')
for u in Account.objects.filter(is_staff=True):
    print(f'email={u.email!r} username={u.username!r} is_active={u.is_active} is_staff={u.is_staff} is_superuser={u.is_superuser} has_usable_pwd={u.has_usable_password()}')

# Try to authenticate with a known password pattern
# Common passwords the user might have used
test_passwords = ['password', 'password123', 'varaprasad', 'admin', 'admin123', '123456', 'greatkart', 'GreatKart']

for u in Account.objects.filter(is_staff=True):
    print(f'\n--- Testing {u.email} ---')
    for pwd in test_passwords:
        result = authenticate(username=u.email, password=pwd)
        if result:
            print(f'  SUCCESS with password: {pwd}')
            break
    else:
        print(f'  No match with common passwords')