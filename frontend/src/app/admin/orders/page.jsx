"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const { data } = await api.get("/admin/orders");
        setOrders(data.data || []);
      } catch (error) {
        console.error("Failed to load orders:", error);
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto rounded-full border-4 border-[#0F766E] border-t-transparent animate-spin"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Orders</h1>

      <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
        {orders.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">No orders found.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Order ID</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Customer</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Total</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Status</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {orders.map((order) => (
                <tr key={order._id}>
                  <td className="px-6 py-4 font-medium">
                    #{order._id?.toString().slice(-6).toUpperCase()}
                  </td>
                  <td className="px-6 py-4">{order.customer?.email}</td>
                  <td className="px-6 py-4">${order.total_amount || 0}</td>
                  <td className="px-6 py-4">
                    <select
                      value={order.orderStatus}
                      onChange={(e) => {
                        api.put(`/admin/orders/${order._id}`, { order_status: e.target.value });
                      }}
                      className="rounded border border-gray-300 px-2 py-1 text-sm"
                    >
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <a href={`/admin/orders/${order._id}`} className="text-sm text-[#0F766E] hover:underline">
                      View
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}