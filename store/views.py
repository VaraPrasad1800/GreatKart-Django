from django.shortcuts import render,get_object_or_404
from .models import Product,ProductColor,ProductVariant
from category.models import Category
from cart.models import CartItem
from cart.views import _cart_id
from django.core.paginator import Paginator
from django.http import HttpResponse
from django.db.models import Q

# Create your views here.
def store(request,category_slug = None):
    categories = None
    products = None
    if category_slug != None:
        categories = get_object_or_404(Category,slug = category_slug)
        products   = Product.objects.filter(category=categories,isAvailable = True)
        paginator   = Paginator(products,3)
        page_number = request.GET.get("page")
        page_obj    = paginator.get_page(page_number)
        products_count = products.count()
    else :
        products = Product.objects.all().filter(isAvailable = True)
        paginator   = Paginator(products,3)
        page_number = request.GET.get("page")
        page_obj    = paginator.get_page(page_number)
        products_count = products.count()


    
    context = {
        'products' : page_obj,
        'products_count' : products_count,
    }

    return render(request,'store/store.html',context)


def product_details(request,category_slug,product_slug):
    try:
        single_product = Product.objects.get(category__slug = category_slug,slug=product_slug)
        

        product_colors = ProductColor.objects.filter(product = single_product)

        color_id = request.GET.get('color')
        variant_id = request.GET.get('variant')

        if color_id:
            selected_color = product_colors.get(id=color_id)
        else:
            selected_color = product_colors.first()

        variants = ProductVariant.objects.filter(
            product_color=selected_color,
            is_active=True
        )

        if variant_id:
            try:
                selected_variant = variants.get(id = variant_id)
            except ProductVariant.DoesNotExist:
                selected_variant = variants.first()
        else:
            selected_variant = variants.first()



        in_cart = CartItem.objects.filter(cart__cart_id = _cart_id(request),variant = selected_variant).exists()
    except Exception as e:
        raise e

    context = {
        'single_product' : single_product,
        'in_cart' : in_cart,
        'product_colors': product_colors,
        'selected_color': selected_color,
        'variants': variants,
        'selected_variant' : selected_variant,
    }
    return render(request,'store/product_details.html',context)

def search(request):

    if 'keyword' in request.GET:
        keyword = request.GET['keyword']
        if keyword:
            products       = Product.objects.order_by('-created_at').filter(Q(description__icontains = keyword) | Q(product_name__icontains = keyword))
            products_count = products.count()

    context = {
        'products' : products,
        'products_count' : products_count,
    }    
    return render(request,'store/store.html',context) 


