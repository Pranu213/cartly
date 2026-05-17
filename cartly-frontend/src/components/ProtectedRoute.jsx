import React, { Children, isValidElement } from 'react';

export const ProtectedRoute = ({ children, isAuthenticated, redirectTo = '/' }) => {
  if (!isAuthenticated) {
    window.location.href = redirectTo;
    return null;
  }

  return children;
};
