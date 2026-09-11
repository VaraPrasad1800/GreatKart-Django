import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'greatkart.settings')
import django
django.setup()

from accounts.models import Account

# Create a fresh superuser with known credentials
admin = Account.objects.create_superuser(
    email='varaprasad1800@gmail.com',
    password='admin123',
    username='varaprasad',
    first_name='Vara',
    last_name='Prasad'
)
print(f'Created/Updated: {admin.email}')
print(f'  is_active={admin.is_active}')
print(f'  is_staff={admin.is_staff}')
print(f'  is_superuser={admin.is_superuser}')