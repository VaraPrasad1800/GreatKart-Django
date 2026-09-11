import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { productsApi } from '../api/products';

const FilterContext = createContext(null);

// Keys that are allowed as URL-driven filters. Anything else starting with attr_ is preserved too.
const FILTER_KEYS = ['category', 'search', 'brand', 'price_min', 'price_max', 'size', 'color', 'rating_min', 'in_stock', 'on_sale', 'sort'];

function parseFilters(searchParams) {
  const f = {};
  FILTER_KEYS.forEach((k) => {
    const v = searchParams.get(k);
    if (v !== null && v !== '') f[k] = v;
  });
  for (const [k, v] of searchParams.entries()) {
    if (k.startsWith('attr_') && v) f[k] = v;
  }
  return f;
}

export function FilterProvider({ children }) {
  const [searchParams, setSearchParams] = useSearchParams();

  // Derive live filters directly from the URL so back/forward always stays in sync with no extra state.
  const filters = useMemo(() => parseFilters(searchParams), [searchParams]);

  const [filterOptions, setFilterOptions] = useState({
    variant_label: 'Size',
    brands: [],
    colors: [],
    sizes: [],
    price_range: { min: 0, max: 0 },
    attributes: [],
  });
  const [loadingOptions, setLoadingOptions] = useState(false);

  // Keep category/search context for the options endpoint; load options whenever they change.
  const optionsCategory = filters.category || '';
  const optionsSearch = filters.search || '';

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoadingOptions(true);
      try {
        const data = await productsApi.getFilterOptions({
          category: optionsCategory,
          search: optionsSearch,
        });
        if (!cancelled) setFilterOptions(data);
      } catch (err) {
        if (!cancelled) console.error('Failed to load filter options', err);
      } finally {
        if (!cancelled) setLoadingOptions(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [optionsCategory, optionsSearch]);

  const updateParams = useCallback((mutator) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      mutator(next);
      next.delete('page'); // any filter change resets pagination
      return next;
    }, { replace: false });
  }, [setSearchParams]);

  const setFilter = useCallback((key, value) => {
    updateParams((next) => {
      if (value === '' || value === null || value === undefined) next.delete(key);
      else next.set(key, String(value));
    });
  }, [updateParams]);

  const setFiltersBatch = useCallback((entries) => {
    updateParams((next) => {
      Object.entries(entries).forEach(([k, v]) => {
        if (v === '' || v === null || v === undefined) next.delete(k);
        else next.set(k, String(v));
      });
    });
  }, [updateParams]);

  const clearFilter = useCallback((key) => {
    updateParams((next) => next.delete(key));
  }, [updateParams]);

  const clearAllFilters = useCallback(() => {
    // Preserve nothing except maybe we drop all filter keys + attr_* + page, keep nothing
    setSearchParams(new URLSearchParams(), { replace: false });
  }, [setSearchParams]);

  const toggleArrayFilter = useCallback((key, value) => {
    updateParams((next) => {
      const cur = next.get(key);
      const arr = cur ? cur.split(',').filter(Boolean) : [];
      const nextArr = arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
      if (nextArr.length === 0) next.delete(key);
      else next.set(key, nextArr.join(','));
    });
  }, [updateParams]);

  const isFilterActive = useCallback((key, value) => {
    const cur = filters[key];
    if (!cur) return false;
    return cur.split(',').filter(Boolean).includes(value);
  }, [filters]);

  const activeFilterCount = useMemo(() => {
    let c = 0;
    Object.entries(filters).forEach(([k, v]) => {
      if (!v) return;
      if (k.startsWith('attr_') || ['size', 'color', 'brand'].includes(k)) c += v.split(',').filter(Boolean).length;
      else c += 1;
    });
    return c;
  }, [filters]);

  // Also expose canonical URL string for sharing / debugging
  const filterQueryString = useMemo(() => searchParams.toString(), [searchParams]);

  return (
    <FilterContext.Provider
      value={{
        filters,
        searchParams,
        setSearchParams,
        setFilter,
        setFiltersBatch,
        clearFilter,
        clearAllFilters,
        toggleArrayFilter,
        isFilterActive,
        filterOptions,
        loadingOptions,
        activeFilterCount,
        filterQueryString,
      }}
    >
      {children}
    </FilterContext.Provider>
  );
}

export function useFilters() {
  const ctx = useContext(FilterContext);
  if (!ctx) throw new Error('useFilters must be used within a FilterProvider');
  return ctx;
}
