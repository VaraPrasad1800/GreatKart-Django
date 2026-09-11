from django.shortcuts import render
from store.models import Product

# def home(request):
#     products = Product.objects.all().filter(isAvailable = True)
#     context = {
#         'products' : products,
#     }
#     return render(request,'home.html',context)

# def hello(request):
#     return render(request,'hello.html')