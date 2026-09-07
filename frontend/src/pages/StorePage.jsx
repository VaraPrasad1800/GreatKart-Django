import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Filter, Search, X, ChevronLeft, ChevronRight, SlidersHorizontal } from 'lucide-react';
import { productsApi } from '../api/products';
import { categoriesApi } from '../api/categories';
import ProductCard from '../components/ProductCard';

export default function StorePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeCategory = searchParams.get('category') || '';
  const activeSearch = searchParams.get('search') || '';
  const activePage = parseInt(searchParams.get('page') || '1', 10);

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState(activeSearch);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Sync search input with URL search param
  useEffect(() => {
    setSearchInput(activeSearch);
  }, [activeSearch]);

  // Load categories once
  useEffect(() => {
    categoriesApi.getCategories().then(setCategories).catch(console.error);
  }, []);

  // Fetch products whenever params change
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const data = await productsApi.getProducts({
          category: activeCategory,
          search: activeSearch,
          page: activePage,
        });
        setProducts(data.results || []);
        setTotalCount(data.count || 0);
      } catch (err) {
        console.error('Failed to load products', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [activeCategory, activeSearch, activePage]);

  const handleCategorySelect = (slug) => {
    const params = new URLSearchParams(searchParams);
    if (slug) {
      params.set('category', slug);
    } else {
      params.delete('category');
    }
    params.delete('page'); // Reset to page 1
    setSearchParams(params);
    setMobileFilterOpen(false);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (searchInput.trim()) {
      params.set('search', searchInput.trim());
    } else {
      params.delete('search');
    }
    params.delete('page');
    setSearchParams(params);
  };

  const clearFilter = (filterKey) => {
    const params = new URLSearchParams(searchParams);
    params.delete(filterKey);
    params.delete('page');
    setSearchParams(params);
    if (filterKey === 'search') setSearchInput('');
  };

  const clearAllFilters = () => {
    setSearchParams({});
    setSearchInput('');
  };

  const totalPages = Math.ceil(totalCount / 9);

  const goToPage = (page) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', page);
    setSearchParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Title & Filters Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {activeCategory
              ? `${categories.find((c) => c.slug === activeCategory)?.category_name || activeCategory} Collection`
              : activeSearch
              ? `Search Results for "${activeSearch}"`
              : 'Our Store'}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Showing <span className="font-semibold text-slate-800">{totalCount}</span> items available
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Mobile Filter Trigger */}
          <button
            onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
            className="md:hidden flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-xl text-sm font-semibold text-slate-700 shadow-xs"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
          </button>
        </div>
      </div>

      {/* Active Filter Tags */}
      {(activeCategory || activeSearch) && (
        <div className="flex flex-wrap items-center gap-2 py-4">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mr-1">Active:</span>
          {activeCategory && (
            <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold px-3 py-1 rounded-full">
              Category: {categories.find((c) => c.slug === activeCategory)?.category_name || activeCategory}
              <button onClick={() => clearFilter('category')} className="hover:text-blue-900">
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          )}
          {activeSearch && (
            <span className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-semibold px-3 py-1 rounded-full">
              Keyword: "{activeSearch}"
              <button onClick={() => clearFilter('search')} className="hover:text-indigo-900">
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          )}
          <button
            onClick={clearAllFilters}
            className="text-xs text-rose-600 hover:text-rose-700 font-semibold ml-2 underline"
          >
            Clear All
          </button>
        </div>
      )}

      {/* Main Layout */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mt-6">
        
        {/* Sidebar Filters */}
        <aside className={`md:block ${mobileFilterOpen ? 'block mb-6' : 'hidden'} space-y-6`}>
          {/* Search Widget */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <h3 className="font-bold text-sm text-slate-900 mb-3 flex items-center gap-2">
              <Search className="w-4 h-4 text-blue-600" />
              Search Catalog
            </h3>
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                placeholder="Product name..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-hidden focus:border-blue-500 focus:bg-white"
              />
              <button
                type="submit"
                className="mt-2 w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold py-2 rounded-xl transition"
              >
                Search
              </button>
            </form>
          </div>

          {/* Categories Filter */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <h3 className="font-bold text-sm text-slate-900 mb-3 flex items-center gap-2">
              <Filter className="w-4 h-4 text-blue-600" />
              Categories
            </h3>
            <div className="space-y-1">
              <button
                onClick={() => handleCategorySelect('')}
                className={`w-full text-left px-3 py-2 rounded-xl text-sm font-medium transition ${
                  !activeCategory
                    ? 'bg-blue-600 text-white font-semibold shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600'
                }`}
              >
                All Categories
              </button>
              {categories.map((cat) => {
                const isSelected = activeCategory === cat.slug;
                return (
                  <button
                    key={cat.id}
                    onClick={() => handleCategorySelect(cat.slug)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-sm font-medium transition ${
                      isSelected
                        ? 'bg-blue-600 text-white font-semibold shadow-xs'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600'
                    }`}
                  >
                    {cat.category_name}
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Product Grid Area */}
        <main className="md:col-span-3">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white rounded-2xl border border-slate-100 p-4 h-80 animate-pulse"></div>
              ))}
            </div>
          ) : products.length > 0 ? (
            <div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-12 flex items-center justify-center gap-2">
                  <button
                    disabled={activePage <= 1}
                    onClick={() => goToPage(activePage - 1)}
                    className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => goToPage(page)}
                      className={`w-10 h-10 rounded-xl text-sm font-semibold transition ${
                        activePage === page
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    disabled={activePage >= totalPages}
                    onClick={() => goToPage(activePage + 1)}
                    className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                <Search className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">No products found</h3>
              <p className="text-sm text-slate-500 max-w-sm mx-auto">
                We couldn't find any items matching your selected criteria. Try removing filters or searching for another term.
              </p>
              <button
                onClick={clearAllFilters}
                className="inline-flex items-center px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-full shadow-sm transition"
              >
                Clear All Filters
              </button>
            </div>
          )}
        </main>

      </div>
    </div>
  );
}
