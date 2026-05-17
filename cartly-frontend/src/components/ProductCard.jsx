import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../hooks/index.js';

export const ProductCard = ({ product, showViewButton = true }) => {
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const productImage = product?.image?.url || product?.image || product?.images?.[0]?.url || product?.images?.[0];

  const isOutOfStock = !product.stock || product.stock === 0;

  const handleAddToCart = async (e) => {
    e.stopPropagation();
    if (isOutOfStock) return;

    try {
      setLoading(true);
      await addToCart(product._id, quantity);
      setShowSuccess(true);
      setQuantity(1);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (error) {
      console.error('Failed to add to cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value);
    if (value > 0 && value <= product.stock) {
      setQuantity(value);
    }
  };

  const handleCardClick = () => {
    navigate(`/product/${product._id}`);
  };

  return (
    <div 
      onClick={handleCardClick}
      className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden h-full flex flex-col cursor-pointer"
    >
      {/* Product Image */}
      <div className="relative bg-gray-100 h-48 overflow-hidden flex items-center justify-center group">
        {productImage ? (
          <img
            src={productImage}
            alt={product.name}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-gray-400">
            <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-sm">No Image</span>
          </div>
        )}

        {/* Stock Badge */}
        <div className="absolute top-2 right-2 bg-white rounded-lg px-2 py-1 text-xs font-semibold">
          {isOutOfStock ? (
            <span className="text-red-600">Out of Stock</span>
          ) : product.stock <= 5 ? (
            <span className="text-orange-600">Only {product.stock} left</span>
          ) : (
            <span className="text-green-600">In Stock</span>
          )}
        </div>
      </div>

      {/* Product Info */}
      <div className="p-4 flex-1 flex flex-col">
        {/* Category Badge */}
        {product.category && (
          <span className="inline-block text-xs font-medium text-blue-600 bg-blue-50 rounded px-2 py-1 mb-2 w-fit">
            {product.category}
          </span>
        )}

        {/* Product Name */}
        <h3 className="font-bold text-lg text-gray-900 mb-1 line-clamp-2">
          {product.name}
        </h3>

        {/* Description */}
        {product.description && (
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
            {product.description}
          </p>
        )}

        {/* Price */}
        <div className="mb-4">
          <span className="text-2xl font-bold text-blue-600">
            ${product.price?.toFixed(2) || '0.00'}
          </span>
        </div>

        {/* Quantity and Add to Cart */}
        <div className="mt-auto">
          {!isOutOfStock && (
            <div className="flex gap-2 mb-3">
              <input
                type="number"
                min="1"
                max={product.stock}
                value={quantity}
                onChange={handleQuantityChange}
                className="w-16 px-2 py-2 border border-gray-300 rounded-lg text-center font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <span className="text-sm text-gray-500 flex items-center">
                / {product.stock} available
              </span>
            </div>
          )}

          <button
            onClick={handleAddToCart}
            disabled={loading || isOutOfStock}
            className={`w-full py-2 rounded-lg font-medium transition-colors ${
              isOutOfStock
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : showSuccess
                ? 'bg-green-500 text-white'
                : loading
                ? 'bg-blue-400 text-white'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Adding...
              </span>
            ) : showSuccess ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Added!
              </span>
            ) : isOutOfStock ? (
              'Out of Stock'
            ) : (
              'Add to Cart'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
