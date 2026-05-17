import React from 'react';
import { useAuth } from '../hooks/index.js';
import { Navigate } from 'react-router-dom';

/**
 * AdminProtectedRoute - Protects admin routes
 * Only allows access if user is authenticated AND has admin role
 */
export const AdminProtectedRoute = ({ children }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Check if user is authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  // Check if user has admin role
  const isAdmin = user?.role === 'admin';
  
  if (!isAdmin) {
    return <Navigate to="/" />;
  }

  return children;
};
