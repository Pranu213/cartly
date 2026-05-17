import React, { useState } from 'react';
import { useCart } from '../hooks/index.js';

export const CartItem = ({ item }) => {
  const { updateCartItem, removeFromCart } = useCart();
  const [quantity, setQuantity] = useState(item.quantity);
  const [loading, setLoading] = useState(false);
  const productImage = item?.productId?.image?.url || item?.productId?.image || item?.productId?.images?.[0]?.url || item?.productId?.images?.[0];

  const handleQuantityChange = async (newQuantity) => {
    try {
      setLoading(true);
      setQuantity(newQuantity);
      await updateCartItem(item.productId._id, newQuantity);
    } catch (error) {
      setQuantity(item.quantity);
      alert('Failed to update quantity');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async () => {
    try {
      setLoading(true);
      await removeFromCart(item.productId._id);
    } catch (error) {
      alert('Failed to remove item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card flex gap-4 items-center mb-4">
      <div className="bg-gray-200 w-24 h-24 rounded flex-shrink-0">
        {productImage ? (
          <img src={productImage} alt={item.productId.name} className="w-full h-full object-cover rounded" />
        ) : (
          <span className="flex items-center justify-center w-full h-full text-gray-500 text-sm">No Image</span>
        )}
      </div>
      <div className="flex-1">
        <h4 className="font-bold text-lg">{item.productId.name}</h4>
        <p className="text-gray-600 text-sm">${item.price}</p>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="number"
          min="1"
          value={quantity}
          onChange={(e) => handleQuantityChange(parseInt(e.target.value))}
          className="input-field w-16"
          disabled={loading}
        />
        <button
          onClick={handleRemove}
          disabled={loading}
          className="btn-secondary disabled:opacity-50"
        >
          Remove
        </button>
      </div>
      <div className="text-right min-w-24">
        <p className="text-lg font-bold">${(item.price * quantity).toFixed(2)}</p>
      </div>
    </div>
  );
};
