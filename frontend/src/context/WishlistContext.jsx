import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { wishlistApi } from '../api/wishlist';
import { useAuth } from './AuthContext';

const WishlistContext = createContext(null);

export const WishlistProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [wishlist, setWishlist] = useState({ count: 0, results: [] });
  const [loading, setLoading] = useState(false);

  const fetchWishlist = useCallback(async () => {
    if (!isAuthenticated) {
      setWishlist({ count: 0, results: [] });
      return;
    }
    try {
      setLoading(true);
      const data = await wishlistApi.getWishlist();
      setWishlist(data);
    } catch (err) {
      console.error('Failed to fetch wishlist:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const addToWishlist = async (variantId) => {
    if (!isAuthenticated) {
      throw new Error('Please login to save items to your wishlist.');
    }
    const res = await wishlistApi.addToWishlist(variantId);
    await fetchWishlist();
    return res;
  };

  const removeFromWishlist = async (variantId) => {
    if (!isAuthenticated) return;
    const res = await wishlistApi.removeFromWishlist(variantId);
    await fetchWishlist();
    return res;
  };

  const isInWishlist = (variantId) => {
    return wishlist.results.some((item) => item.variant_id === variantId);
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        wishlistCount: wishlist.count || wishlist.results.length || 0,
        loading,
        fetchWishlist,
        addToWishlist,
        removeFromWishlist,
        isInWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};
