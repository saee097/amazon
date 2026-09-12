"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowUpRight,
  BadgeDollarSign,
  Boxes,
  ClipboardList,
  Package,
  RefreshCw,
  RotateCcw,
  ShoppingBag,
  Users,
  TrendingUp,
  TrendingDown,
  Activity,
  Eye,
  DollarSign,
  CreditCard,
  Star,
  Calendar,
  Truck,
  CheckCircle2,
} from "lucide-react";
import api from "@/lib/api";
import { getUser } from "@/lib/auth";

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const numberFmt = new Intl.NumberFormat("en-US");
const statusStyles = {
  pending: "bg-amber-50 text-amber-800 ring-amber-200",
  processing: "bg-sky-50 text-sky-800 ring-sky-200",
  shipped: "bg-violet-50 text-violet-800 ring-violet-200",
  delivered: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  cancelled: "bg-rose-50 text-rose-800 ring-rose-200",
};
const statusBars = {
  pending: "bg-amber-500",
  processing: "bg-sky-500",
  shipped: "bg-violet-500",
  delivered: "bg-emerald-500",
  cancelled: "bg-rose-500",
};

function formatDate(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function DeltaPill({ value }) {
  const positive = (value ?? 0) >= 0;
  const Icon = positive ? TrendingUp : TrendingDown;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
        positive ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
      }`}
    >
      <Icon size={11} />
      {positive ? "+" : ""}
      {value ?? 0}%
    </span>
  );
}

function StatCard({ label, value, detail, href, icon: Icon, tone, delta }) {
  return (
    <Link
      href={href}
      className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md"
    >
      <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-gradient-to-br from-transparent to-gray-50 opacity-60 transition group-hover:scale-110" />
      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{label}</p>
            {typeof delta === "number" && <DeltaPill value={delta} />}
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-gray-950">{value}</p>
          <p className="mt-1 text-xs text-gray-500">{detail}</p>
        </div>
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${tone} shadow-sm`}>
          <Icon size={20} aria-hidden="true" />
        </span>
      </div>
    </Link>
  );
}

function MiniSpark({ value, color = "#0F766E" }) {
  const points = [12, 18, 14, 22, 19, 26, value];
  const max = Math.max(...points, 1);
  const w = 80;
  const h = 28;
  const step = w / (points.length - 1);
  const path = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${i * step} ${h - (p / max) * h}`)
    .join(" ");
  return (
    <svg width={w} height={h} className="overflow-visible">
      <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function AdminDashboard() {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const user = getUser();

  const loadOverview = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/dashboard/overview");
      setOverview(data.data);
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Dashboard data could not be loaded.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-gray-500">
        <RefreshCw className="mr-2 animate-spin text-[#0F766E]" size={22} /> Loading dashboard…
      </div>
    );
  }

  if (error && !overview) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-rose-200 bg-rose-50 p-6">
        <h1 className="text-lg font-semibold text-rose-950">Dashboard unavailable</h1>
        <p className="mt-2 text-sm text-rose-800">{error}</p>
        <button
          onClick={() => loadOverview()}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-rose-700 px-4 py-2 text-sm font-medium text-white hover:bg-rose-800"
        >
          <RefreshCw size={15} /> Try again
        </button>
      </div>
    );
  }

  const { stats, dailyRevenue, statusCounts, recentOrders, lowStock, topProducts, activity, recentCustomers, recentBanners } = overview;
  const maxRevenue = Math.max(1, ...dailyRevenue.map((point) => point.revenue));
  const totalStatuses = Math.max(1, statusCounts.reduce((sum, item) => sum + item.count, 0));

  const kpis = [
    {
      label: "Gross sales",
      value: currency.format(stats.grossSales),
      detail: "Last 7 days · excl. cancelled",
      href: "/admin/analytics",
      icon: BadgeDollarSign,
      tone: "bg-emerald-50 text-emerald-700",
      delta: 12.4,
    },
    {
      label: "Orders",
      value: numberFmt.format(stats.totalOrders),
      detail: "Created in the last 7 days",
      href: "/admin/orders",
      icon: ShoppingBag,
      tone: "bg-sky-50 text-sky-700",
      delta: 8.1,
    },
    {
      label: "Customers",
      value: numberFmt.format(stats.totalCustomers),
      detail: "Active customer profiles",
      href: "/admin/customers",
      icon: Users,
      tone: "bg-indigo-50 text-indigo-700",
      delta: 3.2,
    },
    {
      label: "Low stock",
      value: numberFmt.format(stats.lowStockCount),
      detail: "Variants below 10 units",
      href: "/admin/inventory",
      icon: AlertTriangle,
      tone: "bg-amber-50 text-amber-700",
      delta: -2.1,
    },
  ];

  const extraKpis = [
    {
      label: "Avg. order value",
      value: currency.format(stats.averageOrderValue),
      detail: "Revenue per order · 7d",
      href: "/admin/analytics",
      icon: DollarSign,
      tone: "bg-emerald-50 text-emerald-700",
      delta: 4.6,
    },
    {
      label: "Pending returns",
      value: numberFmt.format(stats.pendingReturns),
      detail: "Awaiting approval",
      href: "/admin/returns",
      icon: RotateCcw,
      tone: "bg-rose-50 text-rose-700",
      delta: -1.5,
    },
    {
      label: "Pending refunds",
      value: numberFmt.format(stats.pendingRefunds),
      detail: "To be processed",
      href: "/admin/refunds",
      icon: CreditCard,
      tone: "bg-violet-50 text-violet-700",
      delta: 0,
    },
    {
      label: "Active products",
      value: numberFmt.format(stats.totalProducts ?? 0),
      detail: "Listed on storefront",
      href: "/admin/products",
      icon: Package,
      tone: "bg-amber-50 text-amber-700",
      delta: 5.8,
    },
  ];

  const todayLabel = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date());

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 border-b border-gray-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="flex items-center gap-2 text-sm font-medium text-[#0F766E]">
            <Activity size={14} /> Operations overview
          </p>
          <h1 className="mt-1 text-2xl font-bold text-gray-950 sm:text-3xl">
            Good day, {user?.first_name || "Admin"}
          </h1>
          <p className="mt-1 flex items-center gap-2 text-sm text-gray-500">
            <Calendar size={13} /> {todayLabel} · Live store performance for the last 7 days.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {error && (
            <span className="inline-flex items-center gap-1 text-sm text-rose-700">
              <AlertTriangle size={14} /> {error}
            </span>
          )}
          <button
            onClick={() => loadOverview(true)}
            disabled={refreshing}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} /> Refresh
          </button>
          <Link
            href="/admin/analytics"
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#0F766E] px-3 text-sm font-semibold text-white shadow-sm hover:bg-[#0F766E]/90"
          >
            <Eye size={15} /> Full report
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {extraKpis.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm lg:col-span-3">
          <div className="flex items-start justify-between border-b border-gray-100 px-6 py-4">
            <div>
              <h2 className="text-base font-semibold text-gray-950">Revenue trend</h2>
              <p className="mt-1 text-sm text-gray-500">Daily sales excluding cancelled orders.</p>
            </div>
            <Link
              href="/admin/analytics"
              className="inline-flex items-center gap-1 text-sm font-medium text-[#0F766E] hover:underline"
            >
              Analytics <ArrowUpRight size={14} />
            </Link>
          </div>
          <div className="px-6 py-6">
            <div className="grid h-56 grid-cols-7 items-end gap-3 border-b border-gray-200">
              {dailyRevenue.map((point) => (
                <div key={point.date} className="group flex h-full min-w-0 flex-col justify-end">
                  <div
                    className="relative rounded-t-md bg-gradient-to-t from-[#0F766E] to-[#14b8a6] transition-colors group-hover:from-[#0d5e58] group-hover:to-[#0d9488]"
                    style={{ height: `${Math.max(4, (point.revenue / maxRevenue) * 100)}%` }}
                  >
                    <span className="pointer-events-none absolute -top-7 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-950 px-2 py-1 text-xs text-white shadow-lg group-hover:block">
                      {currency.format(point.revenue)}
                    </span>
                  </div>
                  <div className="pt-2 text-center text-xs font-medium text-gray-500">{point.label}</div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-gray-500">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-sm bg-[#0F766E]" /> Sales
              </span>
              <span>Highest: {currency.format(maxRevenue)}</span>
              <span>Total: {currency.format(dailyRevenue.reduce((s, p) => s + p.revenue, 0))}</span>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <div>
              <h2 className="text-base font-semibold text-gray-950">Order pipeline</h2>
              <p className="mt-1 text-sm text-gray-500">Orders created this week.</p>
            </div>
            <ClipboardList size={18} className="text-gray-400" />
          </div>
          <div className="space-y-4 px-6 py-6">
            {statusCounts.map((item) => (
              <div key={item.status}>
                <div className="mb-1.5 flex justify-between text-sm">
                  <span className="capitalize text-gray-700">{item.status}</span>
                  <span className="font-semibold text-gray-950">{numberFmt.format(item.count)}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className={`h-full rounded-full ${statusBars[item.status]}`}
                    style={{ width: `${(item.count / totalStatuses) * 100}%` }}
                  />
                </div>
              </div>
            ))}
            <div className="mt-4 grid grid-cols-3 gap-3 border-t border-gray-100 pt-4">
              {statusCounts.slice(0, 3).map((item) => (
                <div key={item.status} className="text-center">
                  <p className="text-lg font-bold text-gray-950">{item.count}</p>
                  <p className="text-[10px] uppercase tracking-wider text-gray-500">{item.status}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <div>
              <h2 className="text-base font-semibold text-gray-950">Recent orders</h2>
              <p className="mt-1 text-sm text-gray-500">Newest orders across the store.</p>
            </div>
            <Link href="/admin/orders" className="text-sm font-medium text-[#0F766E] hover:underline">
              View all
            </Link>
          </div>
          {recentOrders.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <ShoppingBag className="mx-auto text-gray-300" size={28} />
              <p className="mt-3 text-sm text-gray-500">No orders have been created in this period.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                  <tr>
                    <th className="px-6 py-3 font-semibold">Order</th>
                    <th className="px-6 py-3 font-semibold">Customer</th>
                    <th className="px-6 py-3 font-semibold">Total</th>
                    <th className="px-6 py-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {recentOrders.map((order) => (
                    <tr key={order._id} className="hover:bg-gray-50/60">
                      <td className="px-6 py-3">
                        <Link
                          href={`/admin/orders/${order._id}`}
                          className="font-semibold text-gray-950 hover:text-[#0F766E]"
                        >
                          {order.order_number}
                        </Link>
                        <p className="mt-0.5 text-xs text-gray-500">{formatDate(order.created_at)}</p>
                      </td>
                      <td className="px-6 py-3 text-gray-700">
                        {order.customer?.name || order.customer?.email || "Guest"}
                      </td>
                      <td className="px-6 py-3 font-semibold text-gray-950">{currency.format(order.total)}</td>
                      <td className="px-6 py-3">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${
                            statusStyles[order.order_status] || "bg-gray-100 text-gray-700 ring-gray-200"
                          }`}
                        >
                          {order.order_status === "delivered" ? <CheckCircle2 size={11} /> : null}
                          {order.order_status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <div>
              <h2 className="text-base font-semibold text-gray-950">Inventory attention</h2>
              <p className="mt-1 text-sm text-gray-500">Variants with fewer than 10 units.</p>
            </div>
            <Link href="/admin/inventory" className="text-sm font-medium text-[#0F766E] hover:underline">
              Open inventory
            </Link>
          </div>
          {lowStock.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <Boxes className="mx-auto text-emerald-500" size={28} />
              <p className="mt-3 text-sm text-gray-500">No low-stock variants need attention.</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {lowStock.map((variant) => (
                <li
                  key={variant._id}
                  className="flex items-center justify-between gap-4 px-6 py-3 hover:bg-gray-50/60"
                >
                  <div className="min-w-0 flex items-center gap-3">
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                        variant.inventory_quantity <= 0 ? "bg-rose-50 text-rose-600" : "bg-amber-50 text-amber-600"
                      }`}
                    >
                      <Boxes size={16} />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-gray-950">
                        {variant.product?.title || "Deleted product"}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-gray-500">
                        {[variant.size, variant.color, variant.sku].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                      variant.inventory_quantity <= 0 ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {variant.inventory_quantity} units
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {recentCustomers && recentCustomers.length > 0 && (
        <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <div>
              <h2 className="text-base font-semibold text-gray-950">New Customers</h2>
              <p className="mt-1 text-sm text-gray-500">Recently registered customers.</p>
            </div>
            <Link href="/admin/customers" className="text-sm font-medium text-[#0F766E] hover:underline">
              View all
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="px-6 py-3 font-semibold">Name</th>
                  <th className="px-6 py-3 font-semibold">Email</th>
                  <th className="px-6 py-3 font-semibold">Phone</th>
                  <th className="px-6 py-3 font-semibold">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentCustomers.map((customer) => (
                  <tr key={customer._id} className="hover:bg-gray-50/60">
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-gray-100 flex items-center justify-center">
                        {customer.avatarUrl ? (
                          <img
                            src={customer.avatarUrl}
                            alt={`${customer.firstName || ""} ${customer.lastName || ""}`}
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              const target = e.currentTarget;
                              target.style.display = "none";
                              const fallback = target.nextElementSibling;
                              if (fallback) (fallback).style.display = "flex";
                            }}
                          />
                        ) : null}
                        {!customer.avatarUrl && (
                          <span className="text-xs font-bold text-gray-500">
                            {(customer.firstName || customer.email || "?").charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <span className="font-medium text-gray-950">
                        {`${customer.firstName || ""} ${customer.lastName || ""}`.trim() || customer.email}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-3 text-gray-700">{customer.email}</td>
                  <td className="px-6 py-3 text-gray-700">{customer.phone || "-"}</td>
                  <td className="px-6 py-3 text-gray-500">{formatDate(customer.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {recentBanners && recentBanners.length > 0 && (
        <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <div>
              <h2 className="text-base font-semibold text-gray-950">Recent Banners</h2>
              <p className="mt-1 text-sm text-gray-500">Latest banners shown on the storefront.</p>
            </div>
            <Link href="/admin/banners" className="text-sm font-medium text-[#0F766E] hover:underline">
              Manage banners
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="px-6 py-3 font-semibold">Image</th>
                  <th className="px-6 py-3 font-semibold">Heading</th>
                  <th className="px-6 py-3 font-semibold">Subheading</th>
                  <th className="px-6 py-3 font-semibold">Status</th>
                  <th className="px-6 py-3 font-semibold">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentBanners.map((banner) => (
                  <tr key={banner._id} className="hover:bg-gray-50/60">
                    <td className="px-6 py-3">
                      {banner.image ? (
                        <img
                          src={banner.image}
                          alt={banner.heading || "Banner"}
                          className="h-10 w-16 object-cover rounded border border-gray-200"
                        />
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-6 py-3 font-medium text-gray-950">{banner.heading || "—"}</td>
                    <td className="px-6 py-3 text-gray-500">{banner.subheading || "—"}</td>
                    <td className="px-6 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          banner.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {banner.status || "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-gray-500">{formatDate(banner.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-5">
        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm lg:col-span-3">
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <div>
              <h2 className="text-base font-semibold text-gray-950">Top products</h2>
              <p className="mt-1 text-sm text-gray-500">Ranked by all-time order-item revenue.</p>
            </div>
            <Package size={18} className="text-gray-400" />
          </div>
          {topProducts.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-gray-500">
              Product performance will appear after orders are placed.
            </div>
          ) : (
            <ol className="divide-y divide-gray-100">
              {topProducts.map((product, index) => (
                <li key={product._id} className="flex items-center justify-between gap-3 px-6 py-3 hover:bg-gray-50/60">
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                        index === 0
                          ? "bg-amber-100 text-amber-700"
                          : index === 1
                          ? "bg-slate-100 text-slate-700"
                          : index === 2
                          ? "bg-orange-100 text-orange-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {index === 0 ? <Star size={13} /> : index + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-gray-950">{product.title}</p>
                      <p className="text-xs text-gray-500">{numberFmt.format(product.units)} units sold</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <MiniSpark value={(product.revenue / 1000) % 30} />
                    <span className="text-sm font-bold text-gray-950">{currency.format(product.revenue)}</span>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <div>
              <h2 className="text-base font-semibold text-gray-950">Activity</h2>
              <p className="mt-1 text-sm text-gray-500">Recent audited actions.</p>
            </div>
            <Link href="/admin/logs" className="text-sm font-medium text-[#0F766E] hover:underline">
              Logs
            </Link>
          </div>
          {activity.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-gray-500">No activity has been recorded yet.</div>
          ) : (
            <ol className="divide-y divide-gray-100">
              {activity.map((entry) => (
                <li key={entry._id} className="flex gap-3 px-6 py-3 hover:bg-gray-50/60">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#0F766E]" />
                  <div className="min-w-0">
                    <p className="text-sm text-gray-800">
                      <span className="font-semibold">{entry.actor}</span>{" "}
                      {entry.action.replaceAll("_", " ")}
                      {entry.resource ? ` in ${entry.resource}` : ""}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-500">{formatDate(entry.created_at)}</p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>

      <section className="grid gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:grid-cols-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
            <DollarSign size={18} />
          </span>
          <div>
            <p className="text-xs uppercase text-gray-500">Avg. order value</p>
            <p className="text-lg font-bold text-gray-950">{currency.format(stats.averageOrderValue)}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-700">
            <RotateCcw size={18} />
          </span>
          <div>
            <p className="text-xs uppercase text-gray-500">Pending returns</p>
            <Link
              href="/admin/returns"
              className="text-lg font-bold text-gray-950 hover:text-[#0F766E]"
            >
              {numberFmt.format(stats.pendingReturns)}
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
            <CreditCard size={18} />
          </span>
          <div>
            <p className="text-xs uppercase text-gray-500">Pending refunds</p>
            <Link
              href="/admin/refunds"
              className="text-lg font-bold text-gray-950 hover:text-[#0F766E]"
            >
              {numberFmt.format(stats.pendingRefunds)}
            </Link>
          </div>
        </div>
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
              <Truck size={18} />
            </span>
            <div>
              <p className="text-xs uppercase text-gray-500">Orders this week</p>
              <Link
                href="/admin/orders"
                className="text-lg font-bold text-gray-950 hover:text-[#0F766E]"
              >
                {numberFmt.format(stats.totalOrders ?? 0)}
              </Link>
            </div>
          </div>
      </section>
    </div>
  );
}