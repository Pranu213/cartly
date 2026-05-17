import React, { useEffect, useState } from 'react';
import { useCart } from '../hooks/index.js';
import { CartItemRow } from '../components/CartItemRow.jsx';
import { useNavigate } from 'react-router-dom';

export const CartPage = () => {
  const { cart, loading, fetchCart, clearCart } = useCart();
  const [shippingAddress, setShippingAddress] = useState({
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: ''
  });
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [shippingCost] = useState(10);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCart();
  }, []);

  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setShippingAddress(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCheckout = async () => {
    try {
      setCheckoutLoading(true);
      const { orderService } = await import('../services/index.js');
      const response = await orderService.create({ shippingAddress });
      alert('Order created successfully!');
      navigate(`/orders/${response.data._id}`);
    } catch (error) {
      alert('Failed to create order: ' + error.message);
    } finally {
      setCheckoutLoading(false);
    }
  };

  const subtotal = cart?.totalPrice || 0;
  const tax = subtotal * 0.08;
  const total = subtotal + shippingCost + tax;

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your cart...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center">
          <svg className="w-24 h-24 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          <h1 className="text-3xl font-bold mb-2 text-gray-900">Your Cart is Empty</h1>
          <p className="text-gray-600 mb-6">Add some items to get started!</p>
          <button
            onClick={() => navigate('/products')}
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">Shopping Cart</h1>
        <p className="text-gray-600">You have {cart.items.length} item{cart.items.length !== 1 ? 's' : ''} in your cart</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items Section */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm">
            {/* Cart Items Header */}
            <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-4 bg-gray-50 border-b font-semibold text-gray-700 text-sm">
              <div className="col-span-6">Product</div>
              <div className="col-span-2 text-center">Quantity</div>
              <div className="col-span-2 text-right">Price</div>
              <div className="col-span-2 text-right">Action</div>
            </div>

            {/* Cart Items List */}
            <div className="divide-y">
              {cart.items.map((item) => (
                <CartItemRow key={item.productId._id} item={item} />
              ))}
            </div>

            {/* Continue Shopping Button */}
            <div className="px-6 py-4 bg-gray-50 border-t">
              <button
                onClick={() => navigate('/products')}
                className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                ← Continue Shopping
              </button>
            </div>
          </div>
        </div>

        {/* Order Summary Section */}
        <div className="h-fit">
          <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h3>

            {/* Price Breakdown */}
            <div className="space-y-4 mb-6 pb-6 border-b">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span className="font-medium">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Tax (8%)</span>
                <span className="font-medium">${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span className="font-medium">${shippingCost.toFixed(2)}</span>
              </div>
            </div>

            {/* Total */}
            <div className="mb-6 flex justify-between items-baseline">
              <span className="text-lg font-semibold text-gray-900">Total</span>
              <span className="text-3xl font-bold text-blue-600">${total.toFixed(2)}</span>
            </div>

            {/* Shipping Address */}
            <div className="mb-6 pb-6 border-b">
              <h4 className="font-semibold text-gray-900 mb-4">Shipping Address</h4>
              <div className="space-y-3">
                <input
                  type="text"
                  name="street"
                  placeholder="Street Address"
                  value={shippingAddress.street}
                  onChange={handleAddressChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    name="city"
                    placeholder="City"
                    value={shippingAddress.city}
                    onChange={handleAddressChange}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                  <input
                    type="text"
                    name="state"
                    placeholder="State"
                    value={shippingAddress.state}
                    onChange={handleAddressChange}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    name="zipCode"
                    placeholder="ZIP Code"
                    value={shippingAddress.zipCode}
                    onChange={handleAddressChange}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                  <input
                    type="text"
                    name="country"
                    placeholder="Country"
                    value={shippingAddress.country}
                    onChange={handleAddressChange}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={handleCheckout}
                disabled={
                  checkoutLoading ||
                  !shippingAddress.street ||
                  !shippingAddress.city ||
                  !shippingAddress.state ||
                  !shippingAddress.zipCode
                }
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {checkoutLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Processing...
                  </span>
                ) : (
                  'Proceed to Checkout'
                )}
              </button>

              <button
                onClick={clearCart}
                className="w-full border-2 border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Clear Cart
              </button>
            </div>

            {/* Security Badge */}
            <div className="mt-6 pt-6 border-t text-center">
              <svg className="w-5 h-5 text-green-600 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 111.414 1.414L7.414 9l3.293 3.293a1 1 0 01-1.414 1.414l-4-4z" clipRule="evenodd" />
              </svg>
              <p className="text-xs text-gray-600">Secure checkout powered by Stripe</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
