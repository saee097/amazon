"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";

export default function AdminAnalytics() {
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, ordersRes] = await Promise.all([
          api.get("/dashboard/stats").catch(() => ({ data: { data: { stats: {} } } })),
          api.get("/admin/orders").catch(() => ({ data: { data: [] } })),
        ]);
        setStats(statsRes.data.data?.stats || {});
        setRecentOrders((ordersRes.data.data || []).slice(0, 6));
      } catch (error) {
        console.error("Failed to load analytics:", error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto rounded-full border-4 border-[#0F766E] border-t-transparent animate-spin"></div>
          <p className="mt-4 text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  const formatCurrency = (val) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(val) || 0);

  const cards = [
    { label: "Total Revenue", value: formatCurrency(stats.totalSales || 0), color: "text-green-600", bg: "bg-green-50" },
    { label: "Total Orders", value: stats.totalOrders || 0, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Customers", value: stats.totalCustomers || 0, color: "text-orange-600", bg: "bg-orange-50" },
    { label: "Products", value: stats.totalProducts || 0, color: "text-purple-600", bg: "bg-purple-50" },
    { label: "Inventory Units", value: stats.totalInventory || 0, color: "text-teal-600", bg: "bg-teal-50" },
    { label: "Pending Returns", value: stats.pendingReturns || 0, color: "text-red-600", bg: "bg-red-50" },
  ];

  const orderStatuses = ["pending", "processing", "shipped", "delivered", "cancelled"];
  const statusColors = {
    pending: "bg-yellow-400",
    processing: "bg-blue-400",
    shipped: "bg-purple-400",
    delivered: "bg-green-400",
    cancelled: "bg-red-400",
  };

  const statusCounts = orderStatuses.map((status) => ({
    status,
    count: recentOrders.filter((o) => o.orderStatus === status).length,
  }));
  const maxCount = Math.max(1, ...statusCounts.map((s) => s.count));

  return (
    <div className="max-w-7xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Analytics</h1>
        <p className="text-gray-600 mt-1">Store performance overview.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <span className={`text-xs font-medium ${c.color} ${c.bg} px-2 py-1 rounded-full`}>{c.label}</span>
            <p className="text-2xl font-bold text-gray-900 mt-2">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Orders by Status</h2>
          <div className="space-y-3">
            {statusCounts.map((s) => (
              <div key={s.status} className="flex items-center gap-3">
                <span className="w-24 text-sm capitalize text-gray-600">{s.status}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-3 rounded-full ${statusColors[s.status]}`}
                    style={{ width: `${(s.count / maxCount) * 100}%` }}
                  ></div>
                </div>
                <span className="w-8 text-right text-sm font-medium text-gray-900">{s.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Fulfillment</h2>
          <div className="space-y-4">
            {[
              { label: "Pending Shipments", count: stats.pendingShipments || 0 },
              { label: "Pending Returns", count: stats.pendingReturns || 0 },
              { label: "Pending Refunds", count: stats.pendingRefunds || 0 },
              { label: "Total Categories", count: stats.totalCategories || 0 },
              { label: "Total Brands", count: stats.totalBrands || 0 },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{item.label}</span>
                <span className="text-sm font-semibold text-gray-900">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
