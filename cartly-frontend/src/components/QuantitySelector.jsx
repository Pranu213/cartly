import React from 'react';

export const QuantitySelector = ({ quantity, maxQuantity, onQuantityChange }) => {
  const handleDecrement = () => {
    if (quantity > 1) {
      onQuantityChange(quantity - 1);
    }
  };

  const handleIncrement = () => {
    if (quantity < maxQuantity) {
      onQuantityChange(quantity + 1);
    }
  };

  const handleInputChange = (e) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value > 0 && value <= maxQuantity) {
      onQuantityChange(value);
    }
  };

  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-700 mb-3">
        Quantity
      </label>
      <div className="flex items-center gap-4">
        {/* Quantity Controls */}
        <div className="flex items-center border border-gray-300 rounded-lg">
          <button
            onClick={handleDecrement}
            disabled={quantity <= 1}
            className="px-4 py-3 text-gray-600 hover:bg-gray-100 disabled:text-gray-300 disabled:cursor-not-allowed transition"
            title="Decrease quantity"
          >
            −
          </button>
          <input
            type="number"
            min="1"
            max={maxQuantity}
            value={quantity}
            onChange={handleInputChange}
            className="w-16 text-center font-semibold border-l border-r border-gray-300 py-3 focus:outline-none"
          />
          <button
            onClick={handleIncrement}
            disabled={quantity >= maxQuantity}
            className="px-4 py-3 text-gray-600 hover:bg-gray-100 disabled:text-gray-300 disabled:cursor-not-allowed transition"
            title="Increase quantity"
          >
            +
          </button>
        </div>

        {/* Stock Info */}
        <span className="text-sm text-gray-600">
          of {maxQuantity} available
        </span>
      </div>
    </div>
  );
};
