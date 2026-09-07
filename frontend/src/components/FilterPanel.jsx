import React, { useState } from 'react';
import { useFilters } from '../context/FilterContext';
import {
  Filter, ChevronDown, ChevronUp, Star, X, Check,
  Palette, Tag, Ruler, DollarSign, ShoppingCart
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

function FilterSection({ title, icon: Icon, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition"
      >
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-4 h-4 text-blue-600" />}
          <span className="font-bold text-sm text-slate-900">{title}</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>
      {open && <div className="px-4 pb-4 space-y-2">{children}</div>}
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
      <span className={`text-sm flex-1 ${checked ? 'text-slate-900 font-semibold' : 'text-slate-600'}`}>
        {label}
      </span>
      {count !== undefined && (
        <span className="text-xs text-slate-400">{count}</span>
      )}
      <input
        type="checkbox"
        className="sr-only"
        checked={!!checked}
        onChange={onChange}
        tabIndex={-1}
      />
    </label>
  );
}

export default function FilterPanel() {
  const {
    filters, setFilter, toggleArrayFilter, isFilterActive,
    filterOptions, activeFilterCount, clearFilter
  } = useFilters();

  const [priceInput, setPriceInput] = useState({
    min: filters.price_min || '',
    max: filters.price_max || '',
  });

  const handlePriceApply = () => {
    if (priceInput.min) setFilter('price_min', priceInput.min);
    else clearFilter('price_min');
    if (priceInput.max) setFilter('price_max', priceInput.max);
    else clearFilter('price_max');
  };

  return (
    <div className="space-y-3">
      {/* Search widget */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const val = e.target.elements.searchInput.value.trim();
            setFilter('search', val);
          }}
          className="relative"
        >
          <input
            name="searchInput"
            defaultValue={filters.search}
            placeholder="Search products..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:bg-white"
          />
          <button
            type="submit"
            className="mt-2 w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold py-2 rounded-xl transition"
          >
            Search
          </button>
        </form>
      </div>

      {/* Price Range */}
      <FilterSection title="Price Range" icon={DollarSign} defaultOpen={true}>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Min"
            value={priceInput.min}
            onChange={(e) => setPriceInput(p => ({ ...p, min: e.target.value }))}
            className="w-1/2 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-blue-500"
          />
          <span className="text-slate-400 text-xs">to</span>
          <input
            type="number"
            placeholder="Max"
            value={priceInput.max}
            onChange={(e) => setPriceInput(p => ({ ...p, max: e.target.value }))}
            className="w-1/2 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-blue-500"
          />
        </div>
        <button
          onClick={handlePriceApply}
          className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-1.5 rounded-lg transition"
        >
          Apply
        </button>
      </FilterSection>

      {/* Sort */}
      <FilterSection title="Sort By" icon={Tag} defaultOpen={true}>
        {[
          { value: '', label: 'Relevance' },
          { value: 'price_asc', label: 'Price: Low to High' },
          { value: 'price_desc', label: 'Price: High to Low' },
          { value: 'newest', label: 'Newest First' },
          { value: 'rating', label: 'Highest Rated' },
        ].map(opt => (
          <label key={opt.value} className="flex items-center gap-2 cursor-pointer group py-1">
            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition ${
              (filters.sort || '') === opt.value ? 'border-blue-600 bg-blue-600' : 'border-slate-300 group-hover:border-blue-400'
            }`}>
              {(filters.sort || '') === opt.value && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
            </div>
            <span className={`text-sm ${(filters.sort || '') === opt.value ? 'text-slate-900 font-semibold' : 'text-slate-600'}`}>
              {opt.label}
            </span>
          </label>
        ))}
      </FilterSection>

      {/* Brands */}
      {filterOptions.brands.length > 0 && (
        <FilterSection title="Brand" icon={Tag}>
          {filterOptions.brands.map(brand => (
            <CheckboxItem
              key={brand}
              label={brand}
              checked={isFilterActive('brand', brand)}
              onChange={() => toggleArrayFilter('brand', brand)}
            />
          ))}
        </FilterSection>
      )}

      {/* Colors */}
      {filterOptions.colors.length > 0 && (
        <FilterSection title="Color" icon={Palette}>
          <div className="flex flex-wrap gap-2">
            {filterOptions.colors.map(c => {
              const hex = getColorHex(c.name);
              const active = isFilterActive('color', c.name);
              return (
                <button
                  key={c.name}
                  onClick={() => toggleArrayFilter('color', c.name)}
                  className="relative group"
                  title={`${c.name} (${c.count})`}
                >
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

      {/* Sizes */}
      {filterOptions.sizes.length > 0 && (
        <FilterSection title="Size" icon={Ruler}>
          <div className="flex flex-wrap gap-2">
            {filterOptions.sizes.map(s => {
              const active = isFilterActive('size', s.name);
              return (
                <button
                  key={s.name}
                  onClick={() => toggleArrayFilter('size', s.name)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                    active
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-blue-300'
                  }`}
                >
                  {s.name}
                </button>
              );
            })}
          </div>
        </FilterSection>
      )}

      {/* Rating */}
      <FilterSection title="Rating" icon={Star} defaultOpen={false}>
        {[4, 3, 2, 1].map(minRating => {
          const active = filters.rating_min === String(minRating);
          return (
            <label key={minRating} className="flex items-center gap-2 cursor-pointer group py-1">
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition ${
                active ? 'border-yellow-500 bg-yellow-500' : 'border-slate-300 group-hover:border-yellow-400'
              }`}>
                {active && <Check className="w-3 h-3 text-white" />}
              </div>
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3.5 h-3.5 ${i < minRating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-200'}`}
                  />
                ))}
              </div>
              <span className="text-xs text-slate-500">& up</span>
            </label>
          );
        })}
      </FilterSection>

      {/* Availability */}
      <FilterSection title="Availability" icon={ShoppingCart} defaultOpen={false}>
        <CheckboxItem
          label="In Stock Only"
          checked={filters.in_stock === true || filters.in_stock === 'true'}
          onChange={() => setFilter('in_stock', filters.in_stock ? '' : 'true')}
        />
        <CheckboxItem
          label="On Sale"
          checked={filters.on_sale === true || filters.on_sale === 'true'}
          onChange={() => setFilter('on_sale', filters.on_sale ? '' : 'true')}
        />
      </FilterSection>

      {/* Dynamic Custom Attributes */}
      {filterOptions.attributes?.map(attr => (
        <FilterSection key={attr.key} title={attr.label} defaultOpen={false}>
          {attr.type === 'multiselect' || attr.type === 'select' ? (
            attr.values.map(val => (
              <CheckboxItem
                key={val}
                label={val}
                checked={isFilterActive(`attr_${attr.key}`, val)}
                onChange={() => toggleArrayFilter(`attr_${attr.key}`, val)}
              />
            ))
          ) : (
            <div className="text-xs text-slate-500">
              {attr.type}: {attr.values.join(', ')}
            </div>
          )}
        </FilterSection>
      ))}
    </div>
  );
}