import React from 'react';
import { useAuth } from '../hooks/index.js';
import { Link, useNavigate } from 'react-router-dom';
import { MiniCart } from './MiniCart.jsx';

export const Header = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <nav className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        {/* Logo */}
        <Link to="/" className="text-2xl font-bold text-blue-600 hover:text-blue-700 transition-colors">
          Cartly
        </Link>

        {/* Navigation */}
        <div className="flex gap-6 items-center">
          <Link 
            to="/products" 
            className="text-gray-700 hover:text-blue-600 transition-colors font-medium"
          >
            Products
          </Link>

          {isAuthenticated ? (
            <>
              <Link 
                to="/orders" 
                className="text-gray-700 hover:text-blue-600 transition-colors font-medium"
              >
                Orders
              </Link>

              {/* Mini Cart */}
              <MiniCart />

              {/* User Dropdown */}
              <div className="relative group">
                <button className="text-gray-700 hover:text-blue-600 transition-colors font-medium flex items-center gap-1">
                  {user?.name}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </button>
                <div className="absolute right-0 mt-0 w-48 bg-white rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-40 border border-gray-100">
                  <Link 
                    to="/profile" 
                    className="block px-4 py-3 text-gray-700 hover:bg-gray-100 transition-colors first:rounded-t-lg"
                  >
                    Profile
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-100 transition-colors last:rounded-b-lg"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <Link 
                to="/login" 
                className="text-gray-700 hover:text-blue-600 transition-colors font-medium"
              >
                Login
              </Link>
              <Link 
                to="/register" 
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
};
