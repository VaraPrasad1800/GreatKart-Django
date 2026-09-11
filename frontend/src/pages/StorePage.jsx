import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { productsApi } from '../api/products';
import { categoriesApi } from '../api/categories';
import ProductCard from '../components/ProductCard';
import { Search, SlidersHorizontal, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useFilters } from '../context/FilterContext';
import FilterPanel from '../components/FilterPanel';

export default function StorePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const {
    filters,
    clearFilter,
    clearAllFilters,
    activeFilterCount,
  } = useFilters();

  // Normalize params from URL for display + API calls
  const activeCategory = filters.category || '';
  const activeSearch = filters.search || '';
  const activePage = parseInt(searchParams.get('page') || '1', 10);

  const [categories, setCategories] = useState([]);
  const [categoriesMap, setCategoriesMap] = useState({});
  const [products, setProducts] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    categoriesApi.getCategories().then((cats) => {
      setCategories(cats);
      setCategoriesMap(Object.fromEntries(cats.map((c) => [c.slug, c])));
    }).catch(console.error);
  }, []);

  // Build API params from filter context
  const apiParams = useMemo(() => {
    const p = {
      page: activePage,
    };
    if (activeCategory) p.category = activeCategory;
    if (activeSearch) p.search = activeSearch;
    if (filters.brand) p.brand = filters.brand;
    if (filters.price_min) p.price_min = filters.price_min;
    if (filters.price_max) p.price_max = filters.price_max;
    if (filters.size) p.size = filters.size;
    if (filters.color) p.color = filters.color;
    if (filters.rating_min) p.rating_min = filters.rating_min;
    if (filters.in_stock) p.in_stock = filters.in_stock;
    if (filters.on_sale) p.on_sale = filters.on_sale;
    if (filters.sort) p.sort = filters.sort;

    // attr_* params
    Object.entries(filters).forEach(([k, v]) => {
      if (k.startsWith('attr_')) p[k] = v;
    });
    return p;
  }, [filters, activePage, activeCategory, activeSearch]);

  useEffect(() => {
    let cancelled = false;
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const data = await productsApi.getProducts(apiParams);
        if (!cancelled) {
          setProducts(data.results || []);
          setTotalCount(data.count || 0);
        }
      } catch (err) {
        if (!cancelled) console.error('Failed to load products', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchProducts();
    return () => { cancelled = true; };
  }, [apiParams]);

  const totalPages = Math.ceil(totalCount / 9);

  const goToPage = (page) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('page', page);
      return next;
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const totalPagesDisplay = useMemo(() => Math.max(1, Math.ceil(totalCount / 9)), [totalCount]);

  // Wikipedia-style truncated pagination: window of 5 around current, first/last
  // always visible, "…" for gaps.  Matches the three spec examples exactly:
  //   < 1 2 3 4 5 … 23 >         (near start)
  //   < 1 … 8 9 10 11 12 … 23 >  (middle, current=10)
  //   < 1 … 19 20 21 22 23 >     (near end)
  const paginationItems = useMemo(() => {
    const last = totalPagesDisplay;
    if (last <= 1) return [1];
    // Small result sets — show every page, no ellipsis needed.
    if (last <= 7) return Array.from({ length: last }, (_, i) => i + 1);

    const WIN = 5;
    const HALF = Math.floor(WIN / 2); // 2
    let start = Math.max(1, Math.min(activePage - HALF, last - (WIN - 1)));
    let end = Math.min(last, start + (WIN - 1));
    // Re-clamp start if end was clamped by `last` (handles current near end)
    start = Math.max(1, end - (WIN - 1));

    const pages = new Set([1, last]);
    for (let p = start; p <= end; p++) pages.add(p);
    const sorted = [...pages].sort((a, b) => a - b);

    // Insert "…" wherever two consecutive visible pages have a gap > 1.
    const out = [];
    for (let i = 0; i < sorted.length; i++) {
      out.push(sorted[i]);
      if (i + 1 < sorted.length && sorted[i + 1] - sorted[i] > 1) out.push('…');
    }
    return out;
  }, [activePage, totalPagesDisplay]);

  const categoryLabel = activeCategory ? (categoriesMap[activeCategory]?.category_name || activeCategory) : '';
  const pageTitle = activeCategory
    ? `${categoryLabel} Collection`
    : activeSearch
    ? `Search Results for "${activeSearch}"`
    : 'Our Store';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">{pageTitle}</h1>
          <p className="text-sm text-slate-500 mt-1">
            Showing <span className="font-semibold text-slate-800">{totalCount}</span> items
            {activeFilterCount > 0 && (
              <span className="ml-2 text-xs font-semibold text-blue-600">{activeFilterCount} filters active</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileFilterOpen(true)}
            className="md:hidden flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-xl text-sm font-semibold text-slate-700 shadow-xs"
          >
            <SlidersHorizontal className="w-4 h-4" /> Filters
          </button>
        </div>
      </div>

      {/* Active chips from any filter */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap items-center gap-2 py-4">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mr-1">Active:</span>
          {activeCategory && (
            <Chip label={`Category: ${categoryLabel}`} onRemove={() => clearFilter('category')} />
          )}
          {activeSearch && (
            <Chip label={`Keyword: "${activeSearch}"`} onRemove={() => clearFilter('search')} />
          )}
          {filters.brand && (
            <Chip label={`Brand: ${filters.brand}`} onRemove={() => clearFilter('brand')} />
          )}
          {filters.price_min && (
            <Chip label={`Min $${filters.price_min}`} onRemove={() => clearFilter('price_min')} />
          )}
          {filters.price_max && (
            <Chip label={`Max $${filters.price_max}`} onRemove={() => clearFilter('price_max')} />
          )}
          {filters.size && filters.size.split(',').filter(Boolean).map((s) => (
            <Chip key={s} label={`Size: ${s}`} onRemove={() => clearFilter('size')} />
          ))}
          {filters.color && filters.color.split(',').filter(Boolean).map((c) => (
            <Chip key={c} label={`Color: ${c}`} onRemove={() => clearFilter('color')} />
          ))}
          {filters.rating_min && (
            <Chip label={`Rating ${filters.rating_min}+`} onRemove={() => clearFilter('rating_min')} />
          )}
          {filters.in_stock && (
            <Chip label="In Stock" onRemove={() => clearFilter('in_stock')} />
          )}
          {filters.on_sale && (
            <Chip label="On Sale" onRemove={() => clearFilter('on_sale')} />
          )}
          {filters.sort && (
            <Chip label={`Sort: ${filters.sort}`} onRemove={() => clearFilter('sort')} />
          )}
          {Object.entries(filters).filter(([k]) => k.startsWith('attr_')).map(([k, v]) => (
            <Chip key={k} label={`${k.replace('attr_', '')}: ${v}`} onRemove={() => clearFilter(k)} />
          ))}
          <button
            onClick={clearAllFilters}
            className="text-xs text-rose-600 hover:text-rose-700 font-semibold ml-2 underline"
          >
            Clear All
          </button>
        </div>
      )}

      {/* Layout */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mt-6">
        {/* Mobile drawer overlay */}
        {mobileFilterOpen && (
          <div className="fixed inset-0 z-40 md:hidden" aria-modal="true">
            <div className="absolute inset-0 bg-black/30" onClick={() => setMobileFilterOpen(false)} />
            <div className="absolute inset-y-0 left-0 w-80 bg-white shadow-xl overflow-y-auto p-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-sm font-bold text-slate-900">Filters</h2>
                <button onClick={() => setMobileFilterOpen(false)} className="text-slate-500 hover:text-slate-900">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <FilterPanel categories={categories} />
            </div>
          </div>
        )}

        {/* Desktop sidebar */}
        <aside className="hidden md:block space-y-6">
          <FilterPanel categories={categories} />
        </aside>

        {/* Main grid */}
        <main className="md:col-span-3">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white rounded-2xl border border-slate-100 p-4 h-80 animate-pulse" />
              ))}
            </div>
          ) : products.length > 0 ? (
            <div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-12 flex items-center justify-center gap-2">
                  <button
                    disabled={activePage <= 1}
                    onClick={() => goToPage(activePage - 1)}
                    className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {paginationItems.map((page, idx) =>
                    page === '…' ? (
                      <span key={`ellipsis-${idx}`} className="w-10 h-10 flex items-center justify-center text-sm text-slate-400 select-none">…</span>
                    ) : (
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
                    )
                  )}
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
                No items match your current filters. Try removing or changing filters, or search for a different term.
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

function Chip({ label, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold px-3 py-1 rounded-full">
      {label}
      <button onClick={onRemove} className="hover:text-blue-900"><X className="w-3.5 h-3.5" /></button>
    </span>
  );
}
