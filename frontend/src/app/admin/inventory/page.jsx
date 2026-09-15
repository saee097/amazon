"use client";

import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import {
  Search,
  RefreshCw,
  AlertTriangle,
  Package,
  Download,
  ChevronLeft,
  ChevronRight,
  XCircle,
  CheckCircle2,
  Boxes,
} from "lucide-react";

const PAGE_SIZE = 25;

const STOCK_STATUS = {
  out_of_stock: { label: "Out of Stock", cls: "bg-rose-50 text-rose-700 ring-1 ring-rose-200" },
  low_stock: { label: "Low Stock", cls: "bg-amber-50 text-amber-700 ring-1 ring-amber-200" },
  in_stock: { label: "In Stock", cls: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" },
};

export default function AdminInventory() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  // Inline edit
  const [editingId, setEditingId] = useState(null);
  const [editQty, setEditQty] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/admin/inventory");
      setInventory(data.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load inventory.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => setSuccess(""), 3000);
    return () => clearTimeout(t);
  }, [success]);

  useEffect(() => { setPage(1); }, [search, statusFilter]);

  const filtered = inventory.filter((item) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      item.product?.title?.toLowerCase().includes(q) ||
      item.sku?.toLowerCase().includes(q) ||
      item.size?.toLowerCase().includes(q) ||
      item.color?.toLowerCase().includes(q);
    const matchStatus = !statusFilter || item.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const saveQty = async (item) => {
    const qty = parseInt(editQty, 10);
    if (isNaN(qty) || qty < 0) {
      setError("Quantity must be a non-negative number.");
      return;
    }
    setSaving(true);
    try {
      await api.put(`/admin/variants/${item._id}`, { inventory_quantity: qty });
      setInventory((prev) =>
        prev.map((v) => {
          if (v._id !== item._id) return v;
          const newQty = qty;
          const newStatus =
            newQty <= 0 ? "out_of_stock" : newQty < 10 ? "low_stock" : "in_stock";
          return { ...v, inventory_quantity: newQty, status: newStatus };
        })
      );
      setSuccess("Quantity updated.");
      setEditingId(null);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to update quantity.");
    } finally {
      setSaving(false);
    }
  };

  const exportCSV = () => {
    const header = ["Product", "SKU", "Size", "Color", "Qty", "Status"];
    const rows = filtered.map((v) => [
      v.product?.title || "—",
      v.sku || "—",
      v.size || "—",
      v.color || "—",
      v.inventory_quantity,
      v.status,
    ]);
    const csv = [header, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `inventory-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Summary counts
  const counts = {
    total: inventory.length,
    out_of_stock: inventory.filter((v) => v.status === "out_of_stock").length,
    low_stock: inventory.filter((v) => v.status === "low_stock").length,
    in_stock: inventory.filter((v) => v.status === "in_stock").length,
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#0F766E] border-t-transparent" />
          <p className="mt-3 text-sm text-gray-500">Loading inventory…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-gray-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-950 dark:text-gray-100">Inventory</h1>
          <p className="mt-1 text-sm text-gray-500">{filtered.length} variants</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => load(true)}
            disabled={refreshing}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-60 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
          <button
            onClick={exportCSV}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
          >
            <Download size={14} />
            Export
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total Variants", count: counts.total, cls: "text-gray-900", icon: Boxes },
          { label: "In Stock", count: counts.in_stock, cls: "text-emerald-700", icon: CheckCircle2 },
          { label: "Low Stock", count: counts.low_stock, cls: "text-amber-700", icon: AlertTriangle },
          { label: "Out of Stock", count: counts.out_of_stock, cls: "text-rose-700", icon: XCircle },
        ].map(({ label, count, cls, icon: Icon }) => (
          <div key={label} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <p className={`text-2xl font-bold ${cls} dark:text-gray-100`}>{count}</p>
              <Icon size={20} className={`${cls} opacity-70`} />
            </div>
            <p className="mt-1 text-xs font-medium text-gray-500">{label}</p>
          </div>
        ))}
      </div>

      {/* Alerts */}
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </div>
      )}

      {/* Low-stock alert banner */}
      {counts.low_stock > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <AlertTriangle size={16} className="shrink-0 text-amber-600" />
          <p className="text-sm font-medium text-amber-800">
            {counts.low_stock} variant{counts.low_stock > 1 ? "s are" : " is"} running low on stock.
          </p>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:flex-row">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by product, SKU, size or color…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-sm outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/10 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#0F766E] dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
        >
          <option value="">All Statuses</option>
          <option value="in_stock">In Stock</option>
          <option value="low_stock">Low Stock</option>
          <option value="out_of_stock">Out of Stock</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        {paginated.length === 0 ? (
          <div className="py-20 text-center">
            <Package className="mx-auto text-gray-300" size={36} />
            <p className="mt-4 text-sm text-gray-500">No inventory items match your filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500 dark:bg-gray-700/50 dark:text-gray-400">
                <tr>
                  <th className="px-6 py-3 font-semibold">Product</th>
                  <th className="px-6 py-3 font-semibold">SKU</th>
                  <th className="px-6 py-3 font-semibold">Size</th>
                  <th className="px-6 py-3 font-semibold">Color</th>
                  <th className="px-6 py-3 font-semibold">Quantity</th>
                  <th className="px-6 py-3 font-semibold">Status</th>
                  <th className="px-6 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {paginated.map((item) => (
                  <tr
                    key={item._id}
                    className={`transition hover:bg-gray-50 dark:hover:bg-gray-700/30 ${item.status === "out_of_stock" ? "bg-rose-50/30 dark:bg-rose-900/10" : ""
                      }`}
                  >
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {item.product?.title || "—"}
                      </p>
                      {item.product?.slug && (
                        <p className="text-xs text-gray-400">{item.product.slug}</p>
                      )}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-gray-600 dark:text-gray-400">
                      {item.sku || "—"}
                    </td>
                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{item.size || "—"}</td>
                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{item.color || "—"}</td>
                    <td className="px-6 py-4">
                      {editingId === item._id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            value={editQty}
                            onChange={(e) => setEditQty(e.target.value)}
                            className="w-20 rounded-lg border border-gray-300 px-2 py-1 text-sm outline-none focus:border-[#0F766E] dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === "Enter") saveQty(item);
                              if (e.key === "Escape") setEditingId(null);
                            }}
                          />
                          <button
                            onClick={() => saveQty(item)}
                            disabled={saving}
                            className="rounded-lg bg-[#0F766E] px-2.5 py-1 text-xs font-medium text-white disabled:opacity-60"
                          >
                            {saving ? "…" : "Save"}
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="rounded-lg px-2 py-1 text-xs text-gray-500 hover:bg-gray-100"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <span
                          className={`font-semibold ${item.inventory_quantity <= 0
                              ? "text-rose-600"
                              : item.inventory_quantity < 10
                                ? "text-amber-600"
                                : "text-gray-900 dark:text-gray-100"
                            }`}
                        >
                          {item.inventory_quantity}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${STOCK_STATUS[item.status]?.cls || "bg-gray-100 text-gray-600"
                          }`}
                      >
                        {STOCK_STATUS[item.status]?.label || item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {editingId !== item._id && (
                        <button
                          onClick={() => {
                            setEditingId(item._id);
                            setEditQty(String(item.inventory_quantity));
                          }}
                          className="text-xs font-medium text-[#0F766E] hover:underline"
                        >
                          Update Qty
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4 dark:border-gray-700">
            <p className="text-sm text-gray-500">
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of{" "}
              {filtered.length}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 disabled:opacity-40 hover:bg-gray-50 dark:border-gray-600"
              >
                <ChevronLeft size={15} />
              </button>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 disabled:opacity-40 hover:bg-gray-50 dark:border-gray-600"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
