import React, { useEffect, useState } from 'react';
import { orderService } from '../services/index.js';

export const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter) params.status = statusFilter;

      const response = await orderService.getAll(params);
      setOrders(response.data);
    } catch (error) {
      alert('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;

    try {
      await orderService.cancel(orderId);
      fetchOrders();
      alert('Order cancelled successfully');
    } catch (error) {
      alert('Failed to cancel order: ' + error.message);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading orders...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">My Orders</h1>

      <div className="mb-6">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input-field w-full"
        >
          <option value="">All Orders</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-12 card">
          <p className="text-gray-600">No orders found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order._id} className="card">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold">Order #{order._id.substring(0, 8)}</h3>
                  <p className="text-sm text-gray-600">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded text-sm font-medium">
                    {order.status.toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="mb-4 border-t pt-4">
                <p className="text-sm mb-2">
                  <strong>Items:</strong> {order.items.length}
                </p>
                <p className="text-sm mb-2">
                  <strong>Total:</strong> ${order.totalAmount.toFixed(2)}
                </p>
                <p className="text-sm">
                  <strong>Payment Status:</strong> {order.paymentStatus}
                </p>
              </div>

              <div className="flex gap-2">
                <a
                  href={`/orders/${order._id}`}
                  className="btn-primary"
                >
                  View Details
                </a>
                {['pending', 'processing'].includes(order.status) && (
                  <button
                    onClick={() => handleCancelOrder(order._id)}
                    className="btn-secondary"
                  >
                    Cancel Order
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
