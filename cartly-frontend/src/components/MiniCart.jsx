import React, { useState, useRef, useEffect } from 'react';
import { useCart } from '../hooks/index.js';
import { useNavigate } from 'react-router-dom';

export const MiniCart = () => {
  const { cart, removeFromCart } = useCart();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const itemCount = cart?.items?.length || 0;
  const subtotal = cart?.totalPrice || 0;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleViewCart = () => {
    navigate('/cart');
    setIsOpen(false);
  };

  const handleRemoveItem = async (productId) => {
    try {
      await removeFromCart(productId);
    } catch (error) {
      console.error('Failed to remove item:', error);
    }
  };

  const getProductImage = (product) => {
    return product?.image?.url || product?.image || product?.images?.[0]?.url || product?.images?.[0] || null;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Cart Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-700 hover:text-gray-900 transition-colors"
        title="Shopping cart"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
          />
        </svg>
        {itemCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1 -translate-y-1 bg-red-600 rounded-full">
            {itemCount > 99 ? '99+' : itemCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl z-50 border border-gray-100">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Shopping Cart</h3>
            <p className="text-xs text-gray-500">{itemCount} item{itemCount !== 1 ? 's' : ''}</p>
          </div>

          {/* Items List */}
          {itemCount > 0 ? (
            <>
              <div className="max-h-96 overflow-y-auto">
                {cart.items.map((item) => (
                  <div key={item.productId._id} className="px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <div className="flex gap-3">
                      {/* Product Image */}
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center overflow-hidden">
                          {getProductImage(item.productId) ? (
                            <img
                              src={getProductImage(item.productId)}
                              alt={item.productId.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                          )}
                        </div>
                      </div>

                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 truncate text-sm">
                          {item.productId.name}
                        </h4>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Qty: <span className="font-semibold">{item.quantity}</span>
                        </p>
                        <p className="text-sm font-bold text-gray-900 mt-1">
                          ${(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => handleRemoveItem(item.productId._id)}
                        className="text-gray-400 hover:text-red-600 transition-colors flex-shrink-0 p-1"
                        title="Remove item"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="px-4 py-4 border-t border-gray-100 space-y-3">
                <div className="flex justify-between items-baseline">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-lg font-bold text-blue-600">${subtotal.toFixed(2)}</span>
                </div>
                <button
                  onClick={handleViewCart}
                  className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                >
                  View Cart
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-full border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
                >
                  Continue Shopping
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="px-4 py-8 text-center">
                <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                  />
                </svg>
                <p className="text-gray-500 text-sm">Your cart is empty</p>
              </div>
              <div className="px-4 py-4 border-t border-gray-100">
                <button
                  onClick={() => {
                    navigate('/products');
                    setIsOpen(false);
                  }}
                  className="w-full text-blue-600 py-2 rounded-lg hover:bg-blue-50 transition-colors font-medium text-sm"
                >
                  Start Shopping
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
