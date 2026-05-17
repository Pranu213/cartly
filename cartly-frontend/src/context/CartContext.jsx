import React, { createContext, useState, useCallback, useEffect } from 'react';
import { cartService } from '../services/index.js';

export const CartContext = createContext();

const CART_STORAGE_KEY = 'cartly_cart';

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Initialize cart from localStorage on mount
  useEffect(() => {
    const initializeCart = async () => {
      try {
        setLoading(true);
        const response = await cartService.get();
        setCart(response.data);
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(response.data));
        setError(null);
      } catch (err) {
        // If API fails, try to load from localStorage
        const cachedCart = localStorage.getItem(CART_STORAGE_KEY);
        if (cachedCart) {
          try {
            setCart(JSON.parse(cachedCart));
          } catch (parseErr) {
            setError('Failed to load cart');
          }
        }
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    initializeCart();
  }, []);

  const fetchCart = useCallback(async () => {
    try {
      setLoading(true);
      const response = await cartService.get();
      setCart(response.data);
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(response.data));
      setError(null);
    } catch (err) {
      setError(err.message);
      // Fallback to localStorage
      const cachedCart = localStorage.getItem(CART_STORAGE_KEY);
      if (cachedCart) {
        setCart(JSON.parse(cachedCart));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const addToCart = useCallback(async (productId, quantity) => {
    try {
      const response = await cartService.add({ productId, quantity });
      setCart(response.data);
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(response.data));
      setError(null);
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const updateCartItem = useCallback(async (productId, quantity) => {
    try {
      const response = await cartService.update({ productId, quantity });
      setCart(response.data);
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(response.data));
      setError(null);
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const removeFromCart = useCallback(async (productId) => {
    try {
      const response = await cartService.remove(productId);
      setCart(response.data);
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(response.data));
      setError(null);
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const clearCart = useCallback(async () => {
    try {
      await cartService.clear();
      const emptyCart = { items: [], totalPrice: 0 };
      setCart(emptyCart);
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(emptyCart));
      setError(null);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const value = {
    cart,
    loading,
    error,
    cartItemCount: cart?.items?.length || 0,
    fetchCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
