import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productService } from '../services/index.js';
import { useCart } from '../hooks/index.js';
import { ProductImageGallery } from '../components/ProductImageGallery.jsx';
import { QuantitySelector } from '../components/QuantitySelector.jsx';
import { RelatedProducts } from '../components/RelatedProducts.jsx';

export const ProductDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [cartSuccess, setCartSuccess] = useState(false);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await productService.getById(id);
      const productData = Array.isArray(response) ? response[0] : response.data || response;
      setProduct(productData);
    } catch (err) {
      console.error('Failed to load product:', err);
      setError('Failed to load product details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!product || quantity < 1) return;

    try {
      setAddingToCart(true);
      await addToCart(product._id, quantity);
      setCartSuccess(true);
      setQuantity(1);
      setTimeout(() => setCartSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to add to cart:', err);
      setError('Failed to add product to cart. Please try again.');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleQuantityChange = (newQuantity) => {
    if (product && newQuantity > 0 && newQuantity <= product.stock) {
      setQuantity(newQuantity);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block mb-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
          <p className="text-gray-600">Loading product details...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-gray-600 text-lg mb-4">{error || 'Product not found'}</p>
          <button
            onClick={() => navigate('/products')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Back to Products
          </button>
        </div>
      </div>
    );
  }

  const isOutOfStock = !product.stock || product.stock === 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <nav className="flex text-sm">
            <button
              onClick={() => navigate('/')}
              className="text-blue-600 hover:text-blue-700 transition"
            >
              Home
            </button>
            <span className="mx-2 text-gray-400">/</span>
            <button
              onClick={() => navigate('/products')}
              className="text-blue-600 hover:text-blue-700 transition"
            >
              Products
            </button>
            <span className="mx-2 text-gray-400">/</span>
            <span className="text-gray-600">{product.name}</span>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Product Image Gallery */}
          <div className="flex justify-center lg:justify-start">
            <ProductImageGallery
              image={product.image}
              productName={product.name}
            />
          </div>

          {/* Product Information */}
          <div className="flex flex-col">
            {/* Category Badge */}
            {product.category && (
              <span className="inline-block text-xs font-medium text-blue-600 bg-blue-50 rounded px-3 py-1 w-fit mb-4">
                {product.category}
              </span>
            )}

            {/* Product Name */}
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              {product.name}
            </h1>

            {/* Rating Section (Future Enhancement) */}
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className={`w-5 h-5 ${i < 4 ? 'text-yellow-400' : 'text-gray-300'}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="text-sm text-gray-600">(127 reviews)</span>
            </div>

            {/* Price Section */}
            <div className="mb-6">
              <div className="flex items-baseline gap-4">
                <span className="text-4xl font-bold text-blue-600">
                  ${product.price?.toFixed(2) || '0.00'}
                </span>
                <span className="text-lg text-gray-500 line-through">
                  ${(product.price * 1.2)?.toFixed(2) || '0.00'}
                </span>
              </div>
            </div>

            {/* Stock Availability */}
            <div className="mb-6 p-4 rounded-lg bg-gray-100">
              <p className="text-sm text-gray-600 mb-2">Stock Availability</p>
              <div className="flex items-center justify-between">
                <div>
                  {isOutOfStock ? (
                    <span className="text-lg font-semibold text-red-600">Out of Stock</span>
                  ) : product.stock <= 5 ? (
                    <span className="text-lg font-semibold text-orange-600">
                      Only {product.stock} left - Order soon!
                    </span>
                  ) : (
                    <span className="text-lg font-semibold text-green-600">In Stock</span>
                  )}
                </div>
                {!isOutOfStock && (
                  <span className="text-sm text-gray-600">{product.stock} available</span>
                )}
              </div>
              {!isOutOfStock && (
                <div className="mt-3 bg-white rounded h-2 overflow-hidden">
                  <div
                    className="bg-green-500 h-full transition-all"
                    style={{ width: `${Math.min((product.stock / 10) * 100, 100)}%` }}
                  ></div>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">About this product</h2>
              <p className="text-gray-600 leading-relaxed">{product.description}</p>
            </div>

            {/* Add to Cart Section */}
            {!isOutOfStock && (
              <>
                <QuantitySelector
                  quantity={quantity}
                  maxQuantity={product.stock}
                  onQuantityChange={handleQuantityChange}
                />

                {cartSuccess && (
                  <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
                    <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-green-700 font-medium">Added to cart successfully!</span>
                  </div>
                )}

                <button
                  onClick={handleAddToCart}
                  disabled={addingToCart}
                  className={`w-full py-3 rounded-lg font-semibold text-white transition-colors ${
                    addingToCart
                      ? 'bg-blue-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {addingToCart ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Adding to cart...
                    </span>
                  ) : (
                    'Add to Cart'
                  )}
                </button>
              </>
            )}

            {isOutOfStock && (
              <button
                disabled
                className="w-full py-3 rounded-lg font-semibold text-white bg-gray-400 cursor-not-allowed"
              >
                Out of Stock
              </button>
            )}

            {/* Shipping Info */}
            <div className="mt-8 pt-8 border-t grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600 mb-1">Free Shipping</p>
                <p className="font-semibold text-gray-900">On orders over $50</p>
              </div>
              <div>
                <p className="text-gray-600 mb-1">Easy Returns</p>
                <p className="font-semibold text-gray-900">30-day return policy</p>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products */}
        <RelatedProducts
          productId={product._id}
          category={product.category}
        />
      </div>
    </div>
  );
};
