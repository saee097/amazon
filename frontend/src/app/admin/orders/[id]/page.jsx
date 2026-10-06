"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { AdminPageSkeleton } from "@/components/ui/skeleton";

const statusBadge = (status) => {
  const map = {
    pending: "bg-orange-100 text-orange-800",
    processing: "bg-blue-100 text-blue-800",
    shipped: "bg-purple-100 text-purple-800",
    delivered: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${map[status] || "bg-gray-100 text-gray-800"}`}>
      {status}
    </span>
  );
};

const paymentBadge = (status) => {
  const map = {
    pending: "bg-orange-100 text-orange-800",
    paid: "bg-green-100 text-green-800",
    failed: "bg-red-100 text-red-800",
    refunded: "bg-gray-100 text-gray-800",
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${map[status] || "bg-gray-100 text-gray-800"}`}>
      {status}
    </span>
  );
};

function formatDate(dateStr) {
  if (!dateStr) return "N/A";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminOrderDetail() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.id;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadOrder = async () => {
      try {
        const { data } = await api.get(`/admin/orders/${orderId}`);
        setOrder(data.data);
      } catch (err) {
        setError("Failed to load order details.");
        console.error("Failed to load order:", err);
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      loadOrder();
    }
  }, [orderId]);

  const updateOrderStatus = async (newStatus) => {
    try {
      await api.put(`/admin/orders/${orderId}`, { order_status: newStatus });
      setOrder((prev) => ({ ...prev, order_status: newStatus }));
    } catch (err) {
      console.error("Failed to update order status:", err);
    }
  };

  const updatePaymentStatus = async (newStatus) => {
    try {
      await api.put(`/admin/orders/${orderId}`, { payment_status: newStatus });
      setOrder((prev) => ({ ...prev, payment_status: newStatus }));
    } catch (err) {
      console.error("Failed to update payment status:", err);
    }
  };

  if (loading) {
    return <AdminPageSkeleton variant="detail" className="mx-auto max-w-6xl" />;
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-red-700">{error}</p>
        </div>
        <Link href="/admin/orders" className="text-sm text-[#0F766E] hover:underline">
          ← Back to Orders
        </Link>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-6xl mx-auto text-center py-12">
        <p className="text-gray-500 mb-4">Order not found</p>
        <Link href="/admin/orders" className="text-sm text-[#0F766E] hover:underline">
          ← Back to Orders
        </Link>
      </div>
    );
  }

  const customer = order.customer || {};
  const address = order.address || {};
  const items = order.items || [];
  const totals = order.totals || {};

  const statuses = ["pending", "processing", "shipped", "delivered", "cancelled"];
  const paymentStatuses = ["pending", "paid", "failed", "refunded"];

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href="/admin/orders" className="text-sm text-[#0F766E] hover:underline mb-2 inline-block">
            ← Back to Orders
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">Order Details</h1>
          <p className="text-sm text-gray-500 mt-1">
            Order #{order._id?.toString().slice(-6).toUpperCase()}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm text-gray-500">Order Status</p>
            <select
              value={order.order_status}
              onChange={(e) => updateOrderStatus(e.target.value)}
              className="mt-1 rounded border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:border-[#0F766E]"
            >
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Payment</p>
            <select
              value={order.payment_status}
              onChange={(e) => updatePaymentStatus(e.target.value)}
              className="mt-1 rounded border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:border-[#0F766E]"
            >
              {paymentStatuses.map((s) => (
                <option key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Order Information</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Order ID</p>
              <p className="font-medium text-gray-800">#{order._id?.toString().slice(-6).toUpperCase()}</p>
            </div>
            <div>
              <p className="text-gray-500">Date</p>
              <p className="font-medium text-gray-800">{formatDate(order.created_at)}</p>
            </div>
            <div>
              <p className="text-gray-500">Order Status</p>
              <div className="mt-1">{statusBadge(order.order_status)}</div>
            </div>
            <div>
              <p className="text-gray-500">Payment Status</p>
              <div className="mt-1">{paymentBadge(order.payment_status)}</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Customer</h2>
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-gray-500">Name</p>
              <p className="font-medium text-gray-800">
                {customer.first_name || ""} {customer.last_name || ""}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Email</p>
              <p className="font-medium text-gray-800">{customer.email || "-"}</p>
            </div>
            <div>
              <p className="text-gray-500">Phone</p>
              <p className="font-medium text-gray-800">{customer.phone || "-"}</p>
            </div>
          </div>
        </div>
      </div>

      {address && (address.street || address.city || address.country) && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Shipping Address</h2>
          <div className="text-sm text-gray-700 space-y-1">
            {address.street && <p>{address.street}</p>}
            {address.city && <p>{address.city}</p>}
            {address.state && <p>{address.state}</p>}
            {address.zip_code && <p>{address.zip_code}</p>}
            {address.country && <p>{address.country}</p>}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">Order Items</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Variant</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item) => (
                <tr key={item._id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {item.product?.title || "Product"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {item.variant ? (
                      <span>
                        {[item.variant.size, item.variant.color].filter(Boolean).join(" / ") || "N/A"}
                      </span>
                    ) : (
                      "N/A"
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 text-right">{item.quantity}</td>
                  <td className="px-6 py-4 text-sm text-gray-700 text-right">${item.price || 0}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 text-right">
                    ${(item.price || 0) * (item.quantity || 1)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Payment Summary</h2>
        <div className="space-y-3 text-sm max-w-md">
          <div className="flex justify-between">
            <span className="text-gray-500">Subtotal</span>
            <span className="font-medium text-gray-800">${totals.subtotal || totals.total || 0}</span>
          </div>
          {totals.discount > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-500">Discount</span>
              <span className="font-medium text-gray-800">-${totals.discount}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-500">Shipping</span>
            <span className="font-medium text-gray-800">${totals.shipping || 0}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Tax</span>
            <span className="font-medium text-gray-800">${totals.tax || 0}</span>
          </div>
          <div className="border-t border-gray-200 pt-3 flex justify-between">
            <span className="font-semibold text-gray-800">Total</span>
            <span className="font-bold text-lg text-[#0F766E]">${totals.total || order.total_amount || 0}</span>
          </div>
        </div>
      </div>

      {order.note && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Customer Note</h2>
          <p className="text-sm text-gray-700">{order.note}</p>
        </div>
      )}
    </div>
  );
}