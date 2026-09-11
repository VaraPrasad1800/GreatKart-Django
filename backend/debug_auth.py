import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'greatkart.settings')
import django
django.setup()

from django.contrib.auth import authenticate
from accounts.models import Account

# Check if is_superuser property exists on model instances
u = Account.objects.get(email='varaprasad1800@gmail.com')
print('hasattr is_superuser:', hasattr(u, 'is_superuser'))
print('is_superuser value:', getattr(u, 'is_superuser', 'NOT FOUND'))
print('is_admin:', u.is_admin)
print('is_superadmin:', u.is_superadmin)

# Check what Django's ModelBackend expects
from django.contrib.auth.backends import ModelBackend
mb = ModelBackend()
print()
print('ModelBackend.user_can_authenticate check:')
# It checks: user.is_active and user.is_staff and user.is_superuser (for admin)
# Let's trace what happens

# Check what the admin login form does
from django.contrib.auth.forms import AuthenticationForm
form = AuthenticationForm(data={'username': 'varaprasad1800@gmail.com', 'password': 'admin123'})
print('Form is_valid:', form.is_valid())
print('Form user_cache:', form.get_user() if form.is_valid() else 'N/A')
print('Form errors:', form.errors)

# Check the actual clean method
if not form.is_valid():
    print()
    print('=== DEBUG FORM CLEAN ===')
    print('username field value:', form.data.get('username'))
    print('password field value:', form.data.get('password'))
    # Let's trace the authenticate call inside the form
    user_cache = authenticate(request=None, username='varaprasad1800@gmail.com', password='admin123')
    print('authenticate result:', user_cache)
    if user_cache:
        print('user_cache.is_active:', user_cache.is_active)
        print('user_cache.is_staff:', user_cache.is_staff)
        # Check what user_can_authenticate returns
        from django.contrib.auth.backends import ModelBackend
        mb = ModelBackend()
        print('user_can_authenticate:', mb.user_can_authenticate(user_cache))