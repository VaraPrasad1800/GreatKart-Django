import React, { useState, useEffect, useCallback } from 'react';
import { useFilters } from '../context/FilterContext';
import {
  Filter, ChevronDown, ChevronUp, Star, Check, Search,
  Palette, Tag, Ruler, DollarSign, ShoppingCart, Layers
} from 'lucide-react';

// Color hex mapping for swatches
const COLOR_HEX = {
  red: '#ef4444', blue: '#3b82f6', green: '#22c55e', black: '#1a1a1a',
  white: '#f8f8f8', grey: '#9ca3af', gray: '#9ca3af', yellow: '#eab308',
  orange: '#f97316', purple: '#a855f7', pink: '#ec4899', brown: '#92400e',
  navy: '#1e3a5f', maroon: '#7f1d1d', beige: '#d1c4a9', cream: '#f5f0e1',
  teal: '#14b8a6', indigo: '#6366f1', coral: '#f87171', peach: '#fbbf24',
  olive: '#65a30d', khaki: '#b5a642', burgundy: '#900020', cyan: '#06b6d4',
  lavender: '#c4b5fd', mint: '#a7f3d0', rose: '#fda4af', charcoal: '#374151',
  denim: '#1560bd',
};

function getColorHex(name) {
  if (!name) return '#d1d5db';
  return COLOR_HEX[name.toLowerCase()] || '#d1d5db';
}

// ---- session-persisted UI state (accordion open/close, see-more) -------------
function useSessionState(key, defaultValue) {
  const [value, setValue] = useState(() => {
    try {
      const raw = sessionStorage.getItem(key);
      return raw === null ? defaultValue : JSON.parse(raw);
    } catch { return defaultValue; }
  });
  const setAndStore = useCallback((next) => {
    setValue((cur) => {
      const v = typeof next === 'function' ? next(cur) : next;
      try { sessionStorage.setItem(key, JSON.stringify(v)); } catch {}
      return v;
    });
  }, [key]);
  return [value, setAndStore];
}

// ---- shared building blocks --------------------------------------------------

function FilterSection({ id, title, icon: Icon, defaultOpen = false, forceOpen = false, children }) {
  const [open, setOpen] = useSessionState(`gk-fp:${id}:open`, defaultOpen);
  // A section with an active filter force-opens so users can always see/remove what's selected.
  const showOpen = open || forceOpen;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition"
        aria-expanded={showOpen}
      >
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-4 h-4 text-blue-600" />}
          <span className="font-bold text-sm text-slate-900">{title}</span>
        </div>
        {showOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>
      {showOpen && <div className="px-4 pb-4 space-y-2">{children}</div>}
    </div>
  );
}

function CheckboxItem({ label, checked, onChange, count }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer group py-1">
      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition ${
        checked ? 'bg-blue-600 border-blue-600' : 'border-slate-300 group-hover:border-blue-400'
      }`}>
        {checked && <Check className="w-3 h-3 text-white" />}
      </div>
      <span className={`text-sm flex-1 ${checked ? 'text-slate-900 font-semibold' : 'text-slate-600'}`}>{label}</span>
      {count !== undefined && <span className="text-xs text-slate-400">{count}</span>}
      <input type="checkbox" className="sr-only" checked={!!checked} onChange={onChange} tabIndex={-1} />
    </label>
  );
}

function RadioItem({ label, checked, onChange }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer group py-1">
      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition ${
        checked ? 'border-blue-600 bg-blue-600' : 'border-slate-300 group-hover:border-blue-400'
      }`}>
        {checked && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
      </div>
      <span className={`text-sm flex-1 ${checked ? 'text-slate-900 font-semibold' : 'text-slate-600'}`}>{label}</span>
      <input type="radio" className="sr-only" checked={!!checked} onChange={onChange} tabIndex={-1} />
    </label>
  );
}

function SeeMoreList({ id, items, renderItem, limit = 6 }) {
  const [expanded, setExpanded] = useSessionState(`gk-fp:${id}:seeMore`, false);
  const visible = expanded ? items : items.slice(0, limit);
  if (items.length === 0) return null;
  return (
    <>
      {visible.map(renderItem)}
      {items.length > limit && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline pt-1"
        >
          {expanded ? 'See less' : `See more ▾ (${items.length - limit} more)`}
        </button>
      )}
    </>
  );
}

function DualRangeSlider({ min, max, valueMin, valueMax, onCommit }) {
  const lo = Math.min(valueMin, valueMax);
  const hi = Math.max(valueMin, valueMax);
  const [draft, setDraft] = useState([lo, hi]);

  useEffect(() => { setDraft([lo, hi]); }, [lo, hi]);

  const clamp = (v) => Math.min(max, Math.max(min, Math.round(v)));
  const pct = (v) => (max === min ? 0 : ((v - min) / (max - min)) * 100);

  const handleChange = (which) => (e) => {
    const v = clamp(Number(e.target.value));
    setDraft(([dl, dh]) => which === 'min' ? [v, dh] : [dl, v]);
  };
  const handleCommit = () => onCommit(draft[0], draft[1]);

  const fillStyle = {
    left: `${pct(lo)}%`,
    width: `${pct(hi) - pct(lo)}%`,
  };

  return (
    <div>
      <div className="flex items-center justify-between text-sm font-semibold text-slate-900 mb-3">
        <span className="text-xs text-slate-400">Price</span>
        <span>${draft[0]} – ${draft[1]}</span>
      </div>
      <div className="relative h-6">
        <div className="absolute top-1/2 -translate-y-1/2 h-1.5 w-full bg-slate-200 rounded-full" />
        <div className="absolute top-1/2 -translate-y-1/2 h-1.5 bg-blue-600 rounded-full" style={fillStyle} />
        <input
          type="range" min={min} max={max} step={1} value={draft[0]}
          onChange={handleChange('min')} onMouseUp={handleCommit} onTouchEnd={handleCommit} onKeyUp={handleCommit}
          className="gk-range"
          aria-label="Minimum price"
        />
        <input
          type="range" min={min} max={max} step={1} value={draft[1]}
          onChange={handleChange('max')} onMouseUp={handleCommit} onTouchEnd={handleCommit} onKeyUp={handleCommit}
          className="gk-range"
          aria-label="Maximum price"
        />
      </div>
      <div className="flex justify-between text-[10px] text-slate-400 mt-1">
        <span>${min}</span><span>${max}</span>
      </div>
    </div>
  );
}

// =============================================================================
//  FilterPanel — Amazon-style filter sidebar (category-scoped, UI-only)
// =============================================================================
export default function FilterPanel({ categories = [] }) {
  const {
    filters, setFilter, toggleArrayFilter, isFilterActive,
    filterOptions, activeFilterCount, clearAllFilters
  } = useFilters();

  const { min: priceMin, max: priceMax } = filterOptions.price_range || { min: 0, max: 0 };

  const commitPrice = useCallback((lo, hi) => {
    setFilter('price_min', lo > priceMin ? String(lo) : '');
    setFilter('price_max', hi < priceMax ? String(hi) : '');
  }, [setFilter, priceMin, priceMax]);

  const currentMin = filters.price_min ? parseInt(filters.price_min, 10) : priceMin;
  const currentMax = filters.price_max ? parseInt(filters.price_max, 10) : priceMax;

  return (
    <div className="space-y-3">
      {/* Panel header: count + clear-all */}
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
          <Filter className="w-4 h-4 text-blue-600" /> Filters
          {activeFilterCount > 0 && (
            <span className="bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{activeFilterCount}</span>
          )}
        </h3>
        {activeFilterCount > 0 && (
          <button onClick={clearAllFilters} className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline">
            Clear all
          </button>
        )}
      </div>

      {/* Search widget */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4">
        <form
          onSubmit={(e) => { e.preventDefault(); setFilter('search', e.target.elements.searchInput.value.trim()); }}
          className="relative"
        >
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            name="searchInput"
            defaultValue={filters.search}
            placeholder="Search products..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:bg-white"
          />
          <button type="submit" className="mt-2 w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold py-2 rounded-xl transition">
            Search
          </button>
        </form>
      </div>

      {/* 1. Category / Department — single-select radio, "All" default, See more */}
      {categories.length > 0 && (
        <FilterSection id="category" title="Category" icon={Layers} defaultOpen={true} forceOpen={!!filters.category}>
          <RadioItem
            label="All"
            checked={!filters.category}
            onChange={() => setFilter('category', '')}
          />
          <SeeMoreList
            id="category"
            items={categories}
            limit={6}
            renderItem={(cat) => (
              <RadioItem
                key={cat.slug}
                label={cat.category_name}
                checked={filters.category === cat.slug}
                onChange={() => setFilter('category', cat.slug)}
              />
            )}
          />
        </FilterSection>
      )}

      {/* 3. Brand — multi-select checkboxes, See more */}
      {filterOptions.brands.length > 0 && (
        <FilterSection id="brand" title="Brand" icon={Tag} defaultOpen={false} forceOpen={!!filters.brand}>
          <SeeMoreList
            id="brand"
            items={filterOptions.brands}
            limit={6}
            renderItem={(brand) => (
              <CheckboxItem
                key={brand}
                label={brand}
                checked={isFilterActive('brand', brand)}
                onChange={() => toggleArrayFilter('brand', brand)}
              />
            )}
          />
        </FilterSection>
      )}

      {/* 7. Dynamic attribute facets — same pattern as Brand */}
      {filterOptions.attributes?.map((attr) => (
        <FilterSection key={attr.key} id={`attr-${attr.key}`} title={attr.label} icon={Tag} defaultOpen={false} forceOpen={!!filters[`attr_${attr.key}`]}>
          <SeeMoreList
            id={`attr-${attr.key}`}
            items={attr.values}
            limit={6}
            renderItem={(val) => (
              <CheckboxItem
                key={val}
                label={val}
                checked={isFilterActive(`attr_${attr.key}`, val)}
                onChange={() => toggleArrayFilter(`attr_${attr.key}`, val)}
              />
            )}
          />
        </FilterSection>
      ))}

      {/* 4. Customer Reviews — single-select radio, "All" default, >= semantics */}
      <FilterSection id="rating" title="Customer Reviews" icon={Star} defaultOpen={false} forceOpen={!!filters.rating_min}>
        <RadioItem label="All" checked={!filters.rating_min} onChange={() => setFilter('rating_min', '')} />
        {[4, 3, 2, 1].map((minRating) => (
          <RadioItem
            key={minRating}
            label={
              <span className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`w-3.5 h-3.5 ${i < minRating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-200'}`} />
                ))}
                <span className="text-xs text-slate-500">& up</span>
              </span>
            }
            checked={filters.rating_min === String(minRating)}
            onChange={() => setFilter('rating_min', String(minRating))}
          />
        ))}
      </FilterSection>

      {/* 5. Discount / Price — dual-handle range slider, numbers above */}
      {priceMax > 0 && (
        <FilterSection id="price" title="Price" icon={DollarSign} defaultOpen={false} forceOpen={!!filters.price_min || !!filters.price_max}>
          <DualRangeSlider
            min={priceMin}
            max={priceMax}
            valueMin={currentMin}
            valueMax={currentMax}
            onCommit={commitPrice}
          />
        </FilterSection>
      )}

      {/* 6. Boolean tags — plain checkboxes, no See more */}
      <FilterSection id="availability" title="Availability" icon={ShoppingCart} defaultOpen={false} forceOpen={!!filters.in_stock || !!filters.on_sale}>
        <CheckboxItem
          label="In Stock Only"
          checked={filters.in_stock === 'true'}
          onChange={() => setFilter('in_stock', filters.in_stock ? '' : 'true')}
        />
        <CheckboxItem
          label="On Sale"
          checked={filters.on_sale === 'true'}
          onChange={() => setFilter('on_sale', filters.on_sale ? '' : 'true')}
        />
      </FilterSection>

      {/* Variant dimension — label tracks the category (Size / Storage / One Size / ...) */}
      {filterOptions.sizes.length > 0 && (
        <FilterSection id="size" title={filterOptions.variant_label || 'Size'} icon={Ruler} defaultOpen={false} forceOpen={!!filters.size}>
          <div className="flex flex-wrap gap-2">
            {filterOptions.sizes.map((s) => {
              const active = isFilterActive('size', s.name);
              return (
                <button
                  key={s.name}
                  onClick={() => toggleArrayFilter('size', s.name)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                    active ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-blue-300'
                  }`}
                >
                  {s.name}
                </button>
              );
            })}
          </div>
        </FilterSection>
      )}

      {/* Color — existing swatch buttons, kept in its own section */}
      {filterOptions.colors.length > 0 && (
        <FilterSection id="color" title="Color" icon={Palette} defaultOpen={false} forceOpen={!!filters.color}>
          <div className="flex flex-wrap gap-2">
            {filterOptions.colors.map((c) => {
              const hex = getColorHex(c.name);
              const active = isFilterActive('color', c.name);
              return (
                <button key={c.name} onClick={() => toggleArrayFilter('color', c.name)} className="relative group" title={`${c.name} (${c.count})`}>
                  <div
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      active ? 'border-blue-600 scale-110 ring-2 ring-blue-200' : 'border-slate-200 hover:scale-105'
                    }`}
                    style={{ backgroundColor: hex }}
                  >
                    {c.name.toLowerCase() === 'white' && <div className="absolute inset-0 rounded-full border border-slate-300" />}
                    {active && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Check className="w-4 h-4 text-white drop-shadow" />
                      </div>
                    )}
                  </div>
                  <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] text-slate-500 whitespace-nowrap opacity-0 group-hover:opacity-100 transition">
                    {c.name} ({c.count})
                  </span>
                </button>
              );
            })}
          </div>
        </FilterSection>
      )}

      {/* Sort — kept as single-select radios (not part of the reference, but useful) */}
      <FilterSection id="sort" title="Sort By" icon={Tag} defaultOpen={false} forceOpen={!!filters.sort}>
        {[
          { value: '', label: 'Relevance' },
          { value: 'price_asc', label: 'Price: Low to High' },
          { value: 'price_desc', label: 'Price: High to Low' },
          { value: 'newest', label: 'Newest First' },
          { value: 'rating', label: 'Highest Rated' },
        ].map((opt) => (
          <RadioItem
            key={opt.value}
            label={opt.label}
            checked={(filters.sort || '') === opt.value}
            onChange={() => setFilter('sort', opt.value)}
          />
        ))}
      </FilterSection>
    </div>
  );
}