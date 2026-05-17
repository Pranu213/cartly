import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { CartProvider } from './context/CartContext.jsx';
import { Header } from './components/Header.jsx';
import { ProtectedRoute } from './components/ProtectedRoute.jsx';
import { AdminProtectedRoute } from './components/AdminProtectedRoute.jsx';
import { HomePage } from './pages/HomePage.jsx';
import { LoginPage } from './pages/LoginPage.jsx';
import { RegisterPage } from './pages/RegisterPage.jsx';
import { ProductsPage } from './pages/ProductsPage.jsx';
import { ProductDetailsPage } from './pages/ProductDetailsPage.jsx';
import { CartPage } from './pages/CartPage.jsx';
import { OrdersPage } from './pages/OrdersPage.jsx';
import { AdminDashboard } from './pages/admin/AdminDashboard.jsx';
import { AdminProducts } from './pages/admin/AdminProducts.jsx';
import { AdminOrders } from './pages/admin/AdminOrders.jsx';
import { AdminUsers } from './pages/admin/AdminUsers.jsx';
import { useAuth } from './hooks/index.js';
import './index.css';

const AppRoutes = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <Routes>
      {/* Admin Routes - No Header/Footer */}
      <Route
        path="/admin/dashboard"
        element={
          <AdminProtectedRoute>
            <AdminDashboard />
          </AdminProtectedRoute>
        }
      />
      <Route
        path="/admin/products"
        element={
          <AdminProtectedRoute>
            <AdminProducts />
          </AdminProtectedRoute>
        }
      />
      <Route
        path="/admin/orders"
        element={
          <AdminProtectedRoute>
            <AdminOrders />
          </AdminProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <AdminProtectedRoute>
            <AdminUsers />
          </AdminProtectedRoute>
        }
      />

      {/* Public/User Routes with Header/Footer */}
      <Route
        path="*"
        element={
          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/products" element={<ProductsPage />} />
                <Route path="/product/:id" element={<ProductDetailsPage />} />
                <Route path="/login" element={isAuthenticated ? <Navigate to="/" /> : <LoginPage />} />
                <Route path="/register" element={isAuthenticated ? <Navigate to="/" /> : <RegisterPage />} />
                <Route
                  path="/cart"
                  element={
                    <ProtectedRoute isAuthenticated={isAuthenticated} redirectTo="/login">
                      <CartPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/orders"
                  element={
                    <ProtectedRoute isAuthenticated={isAuthenticated} redirectTo="/login">
                      <OrdersPage />
                    </ProtectedRoute>
                  }
                />
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </main>
            <footer className="bg-gray-100 py-8 mt-12">
              <div className="max-w-7xl mx-auto px-4 text-center text-gray-600">
                <p>&copy; 2024 Cartly. All rights reserved.</p>
              </div>
            </footer>
          </div>
        }
      />
    </Routes>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <AppRoutes />
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
