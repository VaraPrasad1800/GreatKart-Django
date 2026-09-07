import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { cartApi } from '../api/cart';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [cart, setCart] = useState({
    items: [],
    total: 0,
    quantity: 0,
    tax: 0,
    grand_total: 0,
  });
  const [loading, setLoading] = useState(false);

  const fetchCart = useCallback(async () => {
    if (!isAuthenticated) {
      setCart({ items: [], total: 0, quantity: 0, tax: 0, grand_total: 0 });
      return;
    }
    try {
      setLoading(true);
      const data = await cartApi.getCart();
      setCart(data);
    } catch (err) {
      console.error('Failed to fetch cart:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addToCart = async (variantId) => {
    if (!isAuthenticated) {
      throw new Error('Please login to add items to your cart.');
    }
    const res = await cartApi.addToCart(variantId);
    await fetchCart();
    return res;
  };

  const removeFromCart = async (variantId) => {
    if (!isAuthenticated) return;
    const res = await cartApi.removeFromCart(variantId);
    await fetchCart();
    return res;
  };

  const removeCartItem = async (variantId) => {
    if (!isAuthenticated) return;
    const res = await cartApi.removeCartItem(variantId);
    await fetchCart();
    return res;
  };

  const clearCart = () => {
    setCart({ items: [], total: 0, quantity: 0, tax: 0, grand_total: 0 });
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        itemCount: cart.quantity || 0,
        loading,
        fetchCart,
        addToCart,
        removeFromCart,
        removeCartItem,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
