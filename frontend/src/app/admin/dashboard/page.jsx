"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { getUser, getToken } from "@/lib/auth";

const ROLES = {
  CUSTOMER: "customer",
  ADMIN: "admin",
  SUPERADMIN: "superadmin",
};

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const user = getUser();
    setCurrentUser(user);
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [statsRes, ordersRes, inventoryRes] = await Promise.all([
          api.get("/dashboard/stats").catch(() => ({ data: { data: { stats: {} } } })),
          api.get("/admin/orders").catch(() => ({ data: { data: [] } })),
          api.get("/admin/inventory").catch(() => ({ data: { data: [] } })),
        ]);

        setStats(statsRes.data.data?.stats || {});
        setRecentOrders((ordersRes.data.data || []).slice(0, 8));
        setLowStock(
          (inventoryRes.data.data || [])
            .filter((item) => item.quantity <= 10)
            .slice(0, 8)
        );
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto rounded-full border-4 border-[#0F766E] border-t-transparent animate-spin"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const formatCurrency = (val) => {
    const num = Number(val) || 0;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(num);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isSuperAdmin = currentUser?.role === ROLES.SUPERADMIN;

  const statCards = [
    { label: "Revenue", value: formatCurrency(stats?.totalSales || 0), icon: "💰", color: "text-green-600", bg: "bg-green-50", href: "/admin/analytics" },
    { label: "Orders", value: stats?.totalOrders || 0, icon: "🛒", color: "text-blue-600", bg: "bg-blue-50", href: "/admin/orders" },
    { label: "Products", value: stats?.totalProducts || 0, icon: "📦", color: "text-purple-600", bg: "bg-purple-50", href: "/admin/products" },
    { label: "Customers", value: stats?.totalCustomers || 0, icon: "👥", color: "text-orange-600", bg: "bg-orange-50", href: "/admin/customers" },
    { label: "Low Stock", value: lowStock.length || 0, icon: "⚠️", color: "text-yellow-600", bg: "bg-yellow-50", href: "/admin/inventory" },
    { label: "Pending Returns", value: stats?.pendingReturns || 0, icon: "↩️", color: "text-red-600", bg: "bg-red-50", href: "/admin/returns" },
  ];

  if (isSuperAdmin) {
    statCards.push(
      { label: "Total Admins", value: stats?.totalAdmins || 0, icon: "🛡️", color: "text-indigo-600", bg: "bg-indigo-50", href: "/admin/admins" }
    );
  }

  const statusColors = {
    pending: "bg-yellow-100 text-yellow-800",
    processing: "bg-blue-100 text-blue-800",
    shipped: "bg-purple-100 text-purple-800",
    delivered: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
  };

  return (
    <div className="max-w-7xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Welcome back, {currentUser?.first_name}! Here&apos;s what&apos;s happening with your store.
          </p>
        </div>
        {isSuperAdmin && (
          <span className="px-3 py-1 bg-red-100 text-red-800 text-sm font-medium rounded-full">
            Super Admin
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
        {statCards.map((stat) => (
          <a
            key={stat.label}
            href={stat.href}
            className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition"
          >
            <div className="flex items-center justify-between mb-2">
              <span className={`text-xs font-medium ${stat.color} ${stat.bg} px-2 py-1 rounded-full`}>
                {stat.label}
              </span>
              <span className="text-2xl">{stat.icon}</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
          </a>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Revenue Overview</h2>
            <span className="text-sm text-gray-500">Last 7 days</span>
          </div>
          <div className="h-64 flex items-end gap-2">
            {[65, 45, 75, 50, 85, 60, 90].map((height, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div
                  className="w-full bg-[#0F766E] rounded-t-lg hover:bg-[#0F766E]/80 transition-all relative group"
                  style={{ height: `${height}%` }}
                >
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition">
                    ${(height * 100).toLocaleString()}
                  </div>
                </div>
                <span className="text-xs text-gray-500">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i]}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Order Status</h2>
          <div className="space-y-4">
            {[
              { label: "Delivered", count: stats?.totalOrders || 0, color: "bg-green-500", percent: 60 },
              { label: "Processing", count: Math.floor((stats?.totalOrders || 0) * 0.2), color: "bg-blue-500", percent: 20 },
              { label: "Shipped", count: Math.floor((stats?.totalOrders || 0) * 0.15), color: "bg-purple-500", percent: 15 },
              { label: "Pending", count: Math.floor((stats?.totalOrders || 0) * 0.05), color: "bg-yellow-500", percent: 5 },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-600">{item.label}</span>
                  <span className="text-sm font-medium text-gray-900">{item.count}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`${item.color} h-2 rounded-full transition-all`}
                    style={{ width: `${item.percent}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">Recent Orders</h2>
              <a href="/admin/orders" className="text-sm text-[#0F766E] hover:underline">View All</a>
            </div>
          </div>
          {recentOrders.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No recent orders</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {recentOrders.map((order) => (
                    <tr key={order._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        #{order._id?.toString().slice(-6).toUpperCase()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {order.customer?.email || "Unknown"}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {formatCurrency(order.total_amount)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                            statusColors[order.orderStatus] || "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {order.orderStatus || "unknown"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800">Low Stock Alerts</h2>
          </div>
          {lowStock.length === 0 ? (
            <div className="p-8 text-center text-gray-500">All products are well stocked!</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Warehouse</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {lowStock.map((item) => (
                    <tr key={item._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {item.variant?.product?.title || "Unknown"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {item.warehouse?.warehouse_name || "Unknown"}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          {item.quantity}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Store Performance</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">Avg. Order Value</p>
            <p className="text-xl font-bold text-gray-900 mt-1">
              {formatCurrency((stats?.totalSales || 0) / (stats?.totalOrders || 1))}
            </p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">Total Categories</p>
            <p className="text-xl font-bold text-gray-900 mt-1">{stats?.totalCategories || 0}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">Total Brands</p>
            <p className="text-xl font-bold text-gray-900 mt-1">{stats?.totalBrands || 0}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">Pending Refunds</p>
            <p className="text-xl font-bold text-gray-900 mt-1">{stats?.pendingRefunds || 0}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
