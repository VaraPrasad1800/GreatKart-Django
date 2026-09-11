import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'greatkart.settings')
django.setup()

from accounts.models import Account
from django.contrib.auth import authenticate

# Create a fresh test user
user = Account.objects.create_superuser(
    email='testadmin2@greatkart.com',
    username='testadmin2',
    first_name='Test',
    last_name='Admin2',
    password='testpass123'
)
print('Created user:', user.email)
print('  is_active:', user.is_active)
print('  is_staff:', user.is_staff)
print('  is_admin:', user.is_admin)
print('  is_superadmin:', user.is_superadmin)
print('  has_usable_pwd:', user.has_usable_password())

# Test authenticate with username=email
result1 = authenticate(username='testadmin2@greatkart.com', password='testpass123')
print('authenticate(username=email):', result1)

# Test authenticate with email=email
result2 = authenticate(email='testadmin2@greatkart.com', password='testpass123')
print('authenticate(email=email):', result2)

# Test authenticate with wrong password
result3 = authenticate(username='testadmin2@greatkart.com', password='wrong')
print('authenticate(wrong password):', result3)

# Also test against existing user varaprasad1800@gmail.com
# We don't know the password but let's at least verify get_by_natural_key works
print()
print('=== EXISTING USERS ===')
for u in Account.objects.filter(is_staff=True):
    print(f'email={u.email!r} username={u.username!r} is_active={u.is_active} is_staff={u.is_staff} is_admin={u.is_admin} has_usable_pwd={u.has_usable_password()}')