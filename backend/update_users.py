import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'greatkart.settings')
import django
django.setup()

from accounts.models import Account

# Update existing staff users to have is_superuser=True
for u in Account.objects.filter(is_staff=True):
    u.is_superuser = True
    u.save()
    print(f'Updated {u.email}: is_superuser={u.is_superuser}')