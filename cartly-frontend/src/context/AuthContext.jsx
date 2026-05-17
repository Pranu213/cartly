import React, { createContext, useState, useCallback, useEffect } from 'react';
import { authService, getLocalToken, setLocalToken, removeLocalToken } from '../services/index.js';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is logged in on mount
  useEffect(() => {
    const token = getLocalToken();
    if (token) {
      fetchCurrentUser();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchCurrentUser = useCallback(async () => {
    try {
      const response = await authService.getCurrentUser();
      setUser(response.data?.user);
      setError(null);
    } catch (err) {
      removeLocalToken();
      setUser(null);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (data) => {
    try {
      const response = await authService.register(data);
      setLocalToken(response.data?.accessToken);
      setUser(response.data?.user);
      setError(null);
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const login = useCallback(async (data) => {
    try {
      const response = await authService.login(data);
      setLocalToken(response.data?.accessToken);
      setUser(response.data?.user);
      setError(null);
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch (err) {
      // continue even if logout fails
    } finally {
      removeLocalToken();
      setUser(null);
      setError(null);
    }
  }, []);

  const updateProfile = useCallback(async (data) => {
    try {
      const response = await authService.updateProfile(data);
      setUser(response.data?.user);
      setError(null);
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const value = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    register,
    login,
    logout,
    updateProfile
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
