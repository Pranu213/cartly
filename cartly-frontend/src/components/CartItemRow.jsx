import React, { useState } from 'react';
import { useCart } from '../hooks/index.js';
import { useNavigate } from 'react-router-dom';

export const CartItemRow = ({ item }) => {
  const { updateCartItem, removeFromCart } = useCart();
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(item.quantity);
  const [loading, setLoading] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const productImage = item?.productId?.image?.url || item?.productId?.image || item?.productId?.images?.[0]?.url || item?.productId?.images?.[0];

  const handleQuantityChange = async (newQuantity) => {
    if (newQuantity < 1) return;
    if (newQuantity > item.productId.stock) return;

    try {
      setLoading(true);
      setQuantity(newQuantity);
      await updateCartItem(item.productId._id, newQuantity);
    } catch (error) {
      setQuantity(item.quantity);
      console.error('Failed to update quantity:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async () => {
    try {
      setLoading(true);
      await removeFromCart(item.productId._id);
      setShowRemoveConfirm(false);
    } catch (error) {
      console.error('Failed to remove item:', error);
    } finally {
      setLoading(false);
    }
  };

  const itemTotal = item.price * quantity;
  const savings = item.productId.originalPrice
    ? (item.productId.originalPrice - item.price) * quantity
    : 0;

  return (
    <div className="p-6 hover:bg-gray-50 transition-colors">
      <div className="grid grid-cols-12 gap-4 items-center">
        {/* Product Image and Info */}
        <div className="col-span-12 md:col-span-6 flex gap-4">
          <div className="relative">
            <div className="bg-gray-100 w-20 h-20 md:w-24 md:h-24 rounded-lg overflow-hidden flex-shrink-0">
              {productImage ? (
                <img
                  src={productImage}
                  alt={item.productId.name}
                  className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                  onClick={() => navigate(`/product/${item.productId._id}`)}
                />
              ) : (
                <div className="flex items-center justify-center w-full h-full bg-gray-200 text-gray-400">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              )}
            </div>
            {item.productId.stock <= 5 && (
              <div className="absolute top-1 right-1 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded">
                Low Stock
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h3
              className="font-semibold text-gray-900 truncate hover:text-blue-600 cursor-pointer transition-colors"
              onClick={() => navigate(`/product/${item.productId._id}`)}
            >
              {item.productId.name}
            </h3>
            {item.productId.category && (
              <p className="text-xs text-gray-500 mb-2">{item.productId.category}</p>
            )}
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold text-gray-900">${item.price.toFixed(2)}</span>
              {item.productId.originalPrice && item.productId.originalPrice > item.price && (
                <>
                  <span className="text-sm text-gray-500 line-through">
                    ${item.productId.originalPrice.toFixed(2)}
                  </span>
                  <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                    Save {Math.round(((item.productId.originalPrice - item.price) / item.productId.originalPrice) * 100)}%
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Quantity Control - Mobile */}
        <div className="col-span-6 md:col-span-2 md:hidden flex items-center gap-2">
          <label className="text-xs text-gray-600 font-medium">Qty:</label>
          <div className="flex items-center border border-gray-300 rounded-lg">
            <button
              onClick={() => handleQuantityChange(quantity - 1)}
              disabled={loading || quantity <= 1}
              className="px-2 py-1 text-gray-600 hover:bg-gray-100 disabled:opacity-50"
            >
              −
            </button>
            <input
              type="number"
              min="1"
              max={item.productId.stock}
              value={quantity}
              onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
              disabled={loading}
              className="w-10 text-center border-0 focus:ring-0 text-sm"
            />
            <button
              onClick={() => handleQuantityChange(quantity + 1)}
              disabled={loading || quantity >= item.productId.stock}
              className="px-2 py-1 text-gray-600 hover:bg-gray-100 disabled:opacity-50"
            >
              +
            </button>
          </div>
        </div>

        {/* Price - Mobile */}
        <div className="col-span-6 md:col-span-2 md:hidden text-right">
          <p className="text-sm text-gray-600 mb-1">Total</p>
          <p className="text-lg font-bold text-gray-900">${itemTotal.toFixed(2)}</p>
        </div>

        {/* Quantity Control - Desktop */}
        <div className="col-span-2 hidden md:flex items-center justify-center gap-2">
          <div className="flex items-center border border-gray-300 rounded-lg bg-white">
            <button
              onClick={() => handleQuantityChange(quantity - 1)}
              disabled={loading || quantity <= 1}
              className="px-3 py-2 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Decrease quantity"
            >
              −
            </button>
            <input
              type="number"
              min="1"
              max={item.productId.stock}
              value={quantity}
              onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
              disabled={loading}
              className="w-12 text-center border-0 focus:ring-0 font-medium"
            />
            <button
              onClick={() => handleQuantityChange(quantity + 1)}
              disabled={loading || quantity >= item.productId.stock}
              className="px-3 py-2 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Increase quantity"
            >
              +
            </button>
          </div>
          <span className="text-xs text-gray-500 ml-2">of {item.productId.stock}</span>
        </div>

        {/* Price - Desktop */}
        <div className="col-span-2 hidden md:block text-right">
          <p className="font-bold text-gray-900">${itemTotal.toFixed(2)}</p>
          {savings > 0 && (
            <p className="text-xs text-green-600 font-medium">Save ${savings.toFixed(2)}</p>
          )}
        </div>

        {/* Remove Button - Desktop */}
        <div className="col-span-2 hidden md:flex justify-end">
          <button
            onClick={() => setShowRemoveConfirm(true)}
            disabled={loading}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors disabled:opacity-50 font-medium text-sm"
            title="Remove item"
          >
            {loading ? 'Removing...' : 'Remove'}
          </button>
        </div>

        {/* Remove Button - Mobile */}
        <div className="col-span-12 md:hidden flex gap-2 justify-end pt-2 border-t">
          <button
            onClick={() => navigate(`/product/${item.productId._id}`)}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
          >
            View Details
          </button>
          <button
            onClick={() => setShowRemoveConfirm(true)}
            disabled={loading}
            className="text-red-600 hover:text-red-700 text-sm font-medium transition-colors disabled:opacity-50"
          >
            Remove
          </button>
        </div>
      </div>

      {/* Remove Confirmation Modal */}
      {showRemoveConfirm && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-900 mb-3">
            Are you sure you want to remove <strong>{item.productId.name}</strong> from your cart?
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleRemove}
              disabled={loading}
              className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 font-medium text-sm"
            >
              {loading ? 'Removing...' : 'Yes, Remove'}
            </button>
            <button
              onClick={() => setShowRemoveConfirm(false)}
              disabled={loading}
              className="flex-1 border border-red-300 text-red-700 px-4 py-2 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 font-medium text-sm"
            >
              Keep Item
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
