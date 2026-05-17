import React from 'react';
import { Link } from 'react-router-dom';

export const HomePage = () => {
  return (
    <div className="bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4">Welcome to Cartly</h1>
          <p className="text-xl text-gray-600 mb-8">
            Your one-stop shop for quality products at great prices
          </p>
          <Link to="/products" className="btn-primary inline-block">
            Start Shopping
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="card text-center">
            <h3 className="text-2xl font-bold mb-4">Fast Shipping</h3>
            <p className="text-gray-600">
              Get your orders delivered quickly and reliably
            </p>
          </div>

          <div className="card text-center">
            <h3 className="text-2xl font-bold mb-4">Secure Checkout</h3>
            <p className="text-gray-600">
              Your payment information is safe and secure with us
            </p>
          </div>

          <div className="card text-center">
            <h3 className="text-2xl font-bold mb-4">24/7 Support</h3>
            <p className="text-gray-600">
              We're here to help with any questions or concerns
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
