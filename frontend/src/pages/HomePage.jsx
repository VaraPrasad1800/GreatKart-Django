import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, TrendingUp, Shield, Truck, Clock } from 'lucide-react';
import { productsApi } from '../api/products';
import { categoriesApi } from '../api/categories';
import { getImageUrl } from '../api/client';
import { useAuth } from '../context/AuthContext';
import ProductCard from '../components/ProductCard';

export default function HomePage() {
  const { isAuthenticated } = useAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHomeData = async () => {
      try {
        setLoading(true);
        const [prodData, catData] = await Promise.all([
          productsApi.getProducts({ page: 1 }),
          categoriesApi.getCategories(),
        ]);
        setProducts(prodData.results || []);
        setCategories(catData || []);
      } catch (err) {
        console.error('Error loading homepage data', err);
      } finally {
        setLoading(false);
      }
    };
    loadHomeData();
  }, []);

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Banner */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-white py-20 lg:py-28 px-4 sm:px-6 lg:px-8 rounded-b-3xl sm:rounded-b-[40px] shadow-2xl">
        {/* Subtle decorative background circles */}
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-7xl mx-auto relative z-10 grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-blue-300 text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              New Season 2026 Arrivals
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight sm:leading-none text-white">
              Discover Fashion That <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-300 bg-clip-text text-transparent">
                Defines Your Style
              </span>
            </h1>

            <p className="text-slate-300 text-base sm:text-lg max-w-xl mx-auto lg:mx-0 font-normal leading-relaxed">
              Explore our handpicked curation of premium apparel, denim, sneakers, and modern essentials. Crafted with pure comfort and unmatched quality.
            </p>

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-4">
              <Link
                to="/store"
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-7 py-3.5 rounded-full shadow-lg shadow-blue-600/30 hover:scale-105 transition-all duration-200"
              >
                Shop Now
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/store"
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 font-semibold px-7 py-3.5 rounded-full backdrop-blur-sm transition-all duration-200"
              >
                Explore Catalog
              </Link>
            </div>
          </div>

          <div className="lg:col-span-5 hidden lg:block relative">
            <div className="relative mx-auto w-full max-w-md aspect-4/5 rounded-3xl overflow-hidden shadow-2xl border border-white/10 bg-slate-800">
              <img
                src="https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&auto=format&fit=crop&q=80"
                alt="Trendy Collection"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex flex-col justify-end p-6">
                <span className="text-xs font-semibold text-blue-400 uppercase tracking-widest">Featured</span>
                <h3 className="text-xl font-bold text-white">Urban Edge Denim & Tops</h3>
                <p className="text-xs text-slate-300 mt-1">Starting from $29.99</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Grid Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Shop by Category
            </h2>
            <p className="text-sm text-slate-500 mt-1">Browse collections curated for every mood</p>
          </div>
          <Link
            to="/store"
            className="text-sm font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 group"
          >
            See All <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/store?category=${cat.slug}`}
              className="group relative rounded-2xl overflow-hidden bg-white border border-slate-200/70 p-4 shadow-xs hover:shadow-lg transition-all text-center flex flex-col items-center"
            >
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden mb-3 bg-slate-100 group-hover:scale-105 transition-transform duration-300">
                <img
                  src={getImageUrl(cat.cat_image)}
                  alt={cat.category_name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=300&auto=format&fit=crop&q=60';
                  }}
                />
              </div>
              <h3 className="font-semibold text-sm sm:text-base text-slate-800 group-hover:text-blue-600 transition-colors">
                {cat.category_name}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{cat.description || 'Explore collection'}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 text-blue-600 text-xs font-bold uppercase tracking-wider mb-1">
              <TrendingUp className="w-4 h-4" /> Top Trending
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Featured Products
            </h2>
          </div>
          <Link
            to="/store"
            className="text-sm font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 group"
          >
            View Full Store <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="bg-white rounded-2xl p-4 border border-slate-100 animate-pulse h-80"></div>
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.slice(0, 8).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
            <p className="text-slate-500">No products found in store.</p>
          </div>
        )}
      </section>

      {/* Promo Banner - visible only to guests */}
      {!isAuthenticated && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-8 sm:p-12 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center md:text-left">
              <span className="text-xs uppercase tracking-widest font-bold text-blue-200">Limited Period Offer</span>
              <h3 className="text-2xl sm:text-3xl font-extrabold">Sign up today & get special member discounts</h3>
              <p className="text-sm text-blue-100 max-w-md">
                Create an account to track your orders, maintain your wishlist, and enjoy instant checkout.
              </p>
            </div>
            <Link
              to="/register"
              className="shrink-0 bg-white text-blue-700 hover:bg-blue-50 font-bold px-8 py-3.5 rounded-full shadow-md transition hover:scale-105"
            >
              Create Free Account
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
