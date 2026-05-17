import React from 'react';

export const CartSummary = ({ subtotal = 0, taxRate = 0.08, shippingCost = 10, compact = false }) => {
  const tax = subtotal * taxRate;
  const total = subtotal + shippingCost + tax;

  if (compact) {
    return (
      <div className="space-y-2 text-sm">
        <div className="flex justify-between text-gray-600">
          <span>Subtotal</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>Tax</span>
          <span>${tax.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>Shipping</span>
          <span>${shippingCost.toFixed(2)}</span>
        </div>
        <div className="border-t pt-2 flex justify-between font-bold">
          <span>Total</span>
          <span>${total.toFixed(2)}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="flex justify-between text-gray-600">
          <span>Subtotal</span>
          <span className="font-medium">${subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>Tax ({(taxRate * 100).toFixed(0)}%)</span>
          <span className="font-medium">${tax.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>Shipping</span>
          <span className="font-medium">${shippingCost.toFixed(2)}</span>
        </div>
      </div>
      <div className="border-t pt-4 flex justify-between items-baseline">
        <span className="text-lg font-semibold text-gray-900">Total</span>
        <span className="text-3xl font-bold text-blue-600">${total.toFixed(2)}</span>
      </div>
    </div>
  );
};
