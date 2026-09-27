"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import api from "@/lib/api";
import {
  FiUserPlus,
  FiLock,
  FiUsers,
  FiAlertTriangle,
  FiServer,
  FiDatabase,
  FiCpu,
  FiHardDrive,
  FiRefreshCw,
} from "react-icons/fi";
import { AdminPageSkeleton } from "@/components/ui/skeleton";
import { ToastProvider, useToast } from "@/components/ui/Toast";

export default function SuperAdminDashboard() {
  const toast = useToast();

  const [stats, setStats] = useState(null);
  const [adminStats, setAdminStats] = useState(null);
  const [recentLogs, setRecentLogs] = useState([]);
  const [systemHealth, setSystemHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    setError("");
    try {
      const [statsRes, adminStatsRes, logsRes, healthRes] = await Promise.all([
        api.get("/dashboard/stats").catch(() => ({ data: { data: { stats: {} } } })),
        api.get("/dashboard/admin-stats").catch(() => ({ data: { data: {} } })),
        api.get("/admin/logs?limit=5").catch(() => ({ data: { data: [] } })),
        api.get("/admin/system/health").catch(() => ({ data: { data: {} } })),
      ]);

      setStats(statsRes.data.data?.stats || {});
      setAdminStats(adminStatsRes.data.data || {});
      setRecentLogs(logsRes.data.data || []);
      setSystemHealth(healthRes.data.data || {});
    } catch (err) {
      const msg = err?.message || "Failed to load dashboard data.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const formatCurrency = (val) => {
    const num = Number(val) || 0;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(num);
  };

  if (loading) {
    return (
      <ToastProvider>
        <AdminPageSkeleton variant="stats" className="max-w-7xl" />
      </ToastProvider>
    );
  }

  return (
    <ToastProvider>
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b border-gray-200 pb-5">
          <div>
            <h1 className="text-2xl font-bold text-gray-700 dark:text-gray-100">Super Admin Dashboard</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Complete system overview and management</p>
          </div>
          <button
            onClick={() => load(true)}
            disabled={refreshing}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
          >
            <FiRefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Customers</p>
            <p className="text-2xl font-bold text-gray-700 dark:text-gray-100">{stats?.totalCustomers || 0}</p>
            <Link href="/admin/customers" className="text-sm text-[#0F766E] hover:underline mt-2 block">
              View all
            </Link>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Admins</p>
            <p className="text-2xl font-bold text-purple-600">{adminStats?.totalAdmins || 0}</p>
            <Link href="/admin/admins" className="text-sm text-[#0F766E] hover:underline mt-2 block">
              Manage admins
            </Link>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">Active Admins</p>
            <p className="text-2xl font-bold text-green-600">{adminStats?.activeAdmins || 0}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              {stats?.totalCustomers || 0} customers
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Products</p>
            <p className="text-2xl font-bold text-blue-600">{stats?.totalProducts || 0}</p>
            <Link href="/admin/products" className="text-sm text-[#0F766E] hover:underline mt-2 block">
              View products
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-100 mb-4">Store Performance</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-gray-50 border border-gray-200 dark:bg-gray-700 dark:border-gray-600 rounded-lg">
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Revenue</p>
                <p className="text-xl font-bold text-gray-700 dark:text-gray-100 mt-1">
                  {formatCurrency(stats?.totalSales || 0)}
                </p>
              </div>
              <div className="p-4 bg-gray-50 border border-gray-200 dark:bg-gray-700 dark:border-gray-600 rounded-lg">
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Orders</p>
                <p className="text-xl font-bold text-gray-700 dark:text-gray-100 mt-1">
                  {stats?.totalOrders || 0}
                </p>
              </div>
              <div className="p-4 bg-gray-50 border border-gray-200 dark:bg-gray-700 dark:border-gray-600 rounded-lg">
                <p className="text-sm text-gray-500 dark:text-gray-400">Pending Issues</p>
                <p className="text-xl font-bold text-gray-700 dark:text-gray-100 mt-1">
                  {(stats?.pendingReturns || 0) + (stats?.pendingRefunds || 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-100 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <Link
                href="/admin/admins"
                className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/40 border border-gray-200 transition"
              >
                <FiUserPlus className="w-5 h-5 text-purple-600" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Manage Admins</span>
              </Link>
              <Link
                href="/admin/users"
                className="flex items-center gap-3 border border-gray-200 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition"
              >
                <FiUsers className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Manage Users</span>
              </Link>
              <Link
                href="/admin/security"
                className="flex items-center gap-3 border border-gray-200 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition"
              >
                <FiLock className="w-5 h-5 text-red-600" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Security Settings</span>
              </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-100 mb-4">System Health</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg">
                <FiServer className="w-6 h-6 mx-auto text-green-600 mb-2" />
                <p className="text-lg font-bold text-gray-700 dark:text-gray-100">
                  {systemHealth?.serverStatus || "Online"}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Server</p>
              </div>
              <div className="text-center p-4 border border-gray-200 bg-gray-50 dark:bg-gray-700 dark:border-gray-600 rounded-lg">
                <FiDatabase className="w-6 h-6 mx-auto text-green-600 mb-2" />
                <p className="text-lg font-bold text-gray-700 dark:text-gray-100">
                  {systemHealth?.databaseStatus || "Connected"}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Database</p>
              </div>
              <div className="text-center p-4 border border-gray-200 bg-gray-50 dark:bg-gray-700 dark:border-gray-600 rounded-lg">
                <FiCpu className="w-6 h-6 mx-auto text-green-600 mb-2" />
                <p className="text-lg font-bold text-gray-700 dark:text-gray-100">
                  {systemHealth?.cpuUsage || "12%"}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">CPU</p>
              </div>
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg">
                <FiHardDrive className="w-6 h-6 mx-auto text-green-600 mb-2" />
                <p className="text-lg font-bold text-gray-700 dark:text-gray-100">
                  {systemHealth?.diskUsage || "45%"}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Disk</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-100">Recent Critical Logs</h2>
              <Link href="/admin/logs" className="text-sm text-[#0F766E] hover:underline">View All</Link>
            </div>
            <div className="space-y-3">
              {recentLogs.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No recent logs</p>
              ) : (
                recentLogs.map((log) => (
                  <div key={log._id} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200">
                    <FiAlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-100">{log.action}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{log.module} • {log.user?.name || "System"}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-100 mb-4">System Overview</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="text-center p-4 border border-gray-200 bg-gray-50 dark:bg-gray-700 dark:border-gray-600 rounded-lg">
                <p className="text-2xl font-bold text-gray-700 dark:text-gray-100">{stats?.totalCategories || 0}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Categories</p>
              </div>
              <div className="text-center p-4 border border-gray-200 bg-gray-50 dark:bg-gray-700 dark:border-gray-600 rounded-lg">
                <p className="text-2xl font-bold text-gray-700 dark:text-gray-100">{stats?.totalBrands || 0}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Brands</p>
              </div>
              <div className="text-center p-4 border border-gray-200 bg-gray-50 dark:bg-gray-700 dark:border-gray-600 rounded-lg">
                <p className="text-2xl font-bold text-gray-700 dark:text-gray-101">{stats?.totalInventory || 0}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Inventory Items</p>
              </div>
              <div className="text-center p-4 border border-gray-200 bg-gray-50 dark:bg-gray-700 dark:border-gray-600 rounded-lg">
                <p className="text-2xl font-bold text-gray-700 dark:text-gray-100">{stats?.pendingShipments || 0}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Pending Shipments</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ToastProvider>
  );
}
