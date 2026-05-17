import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../layouts/AdminLayout.jsx';

/**
 * AdminDashboard - Main dashboard overview
 * Displays:
 * - Key metrics (orders, revenue, users, products)
 * - Charts (optional)
 * - Recent activity
 */
export const AdminDashboard = () => {
  const [metrics, setMetrics] = useState({
    totalOrders: 1250,
    totalRevenue: 45230.50,
    totalUsers: 328,
    totalProducts: 156,
    averageOrderValue: 36.18,
    pendingOrders: 24,
    lowStockProducts: 8
  });

  const [recentOrders] = useState([
    { id: 'ORD-001', customer: 'John Doe', total: 125.50, status: 'completed', date: '2026-01-22' },
    { id: 'ORD-002', customer: 'Jane Smith', total: 89.99, status: 'pending', date: '2026-01-22' },
    { id: 'ORD-003', customer: 'Mike Johnson', total: 234.75, status: 'shipped', date: '2026-01-21' },
    { id: 'ORD-004', customer: 'Sarah Williams', total: 156.20, status: 'completed', date: '2026-01-21' },
  ]);

  const getStatusColor = (status) => {
    const colors = {
      completed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      shipped: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <AdminLayout>
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Orders */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Orders</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{metrics.totalOrders.toLocaleString()}</p>
              <p className="text-green-600 text-xs mt-2">↑ 12% from last month</p>
            </div>
            <div className="text-4xl">🛒</div>
          </div>
        </div>

        {/* Total Revenue */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Revenue</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">${metrics.totalRevenue.toFixed(2)}</p>
              <p className="text-green-600 text-xs mt-2">↑ 8% from last month</p>
            </div>
            <div className="text-4xl">💰</div>
          </div>
        </div>

        {/* Total Users */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Users</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{metrics.totalUsers.toLocaleString()}</p>
              <p className="text-green-600 text-xs mt-2">↑ 5% from last month</p>
            </div>
            <div className="text-4xl">👥</div>
          </div>
        </div>

        {/* Total Products */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Products</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{metrics.totalProducts.toLocaleString()}</p>
              <p className="text-red-600 text-xs mt-2">⚠️ {metrics.lowStockProducts} low stock</p>
            </div>
            <div className="text-4xl">📦</div>
          </div>
        </div>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm font-medium">Average Order Value</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">${metrics.averageOrderValue.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm font-medium">Pending Orders</p>
          <p className="text-2xl font-bold text-yellow-600 mt-2">{metrics.pendingOrders}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm font-medium">Low Stock Products</p>
          <p className="text-2xl font-bold text-red-600 mt-2">{metrics.lowStockProducts}</p>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Order ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {recentOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">{order.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.customer}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${order.total.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{order.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 border-t border-gray-200 text-center">
          <a href="/admin/orders" className="text-blue-600 hover:text-blue-800 font-medium text-sm">
            View all orders →
          </a>
        </div>
      </div>
    </AdminLayout>
  );
};
