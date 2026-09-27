"use client";

import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import { AdminPageSkeleton } from "@/components/ui/skeleton";
import {
  Plus,
  Search,
  RefreshCw,
  Pencil,
  Trash2,
  Package,
  X,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Save,
} from "lucide-react";

const PAGE_SIZE = 20;

const EMPTY_FORM = {
  warehouse_id: "",
  product_id: "",
  variant_id: "",
  quantity: "",
  available_quantity: "",
  reserved_quantity: "",
  damaged_quantity: "",
  incoming_quantity: "",
};

function DeleteConfirmDialog({ open, onClose, onConfirm, itemName }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl bg-white shadow-2xl dark:bg-gray-800">
        <div className="flex items-start gap-4 p-6">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600">
            <AlertTriangle size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Delete stock entry?
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              This action cannot be undone. The stock record for{" "}
              <strong className="font-medium">&quot;{itemName}&quot;</strong> will be permanently removed.
            </p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4 dark:border-gray-700">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function getProductName(item) {
  if (item.product?.title) return item.product.title;
  if (item.variant?.product?.title) return item.variant.product.title;
  if (item.products?.title) return item.products.title;
  return "Unknown";
}

function getWarehouseName(item) {
  if (item.warehouse?.warehouse_name) return item.warehouse.warehouse_name;
  if (item.warehouse?.name) return item.warehouse.name;
  if (item.warehouses?.name) return item.warehouses.name;
  return "Unknown";
}

function getVariantLabel(item) {
  const v = item.product_variants;
  if (!v) return null;
  const parts = [v.size, v.color].filter(Boolean);
  return parts.length ? parts.join(" / ") : null;
}

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function AdminStock() {
  const [stock, setStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [variants, setVariants] = useState([]);

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const load = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    setError("");
    try {
      const res = await api.get("/admin/stock");
      setStock(res.data?.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load stock records.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const loadDependencies = useCallback(async () => {
    try {
      const [productsRes, warehousesRes, variantsRes] = await Promise.all([
        api.get("/admin/products"),
        api.get("/warehouses"),
        api.get("/admin/variants"),
      ]);
      setProducts(productsRes.data.data || []);
      setWarehouses(warehousesRes.data.data || []);
      setVariants(variantsRes.data.data || []);
    } catch (err) {
      console.error("Failed to load dependencies:", err);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => setSuccess(""), 3000);
    return () => clearTimeout(t);
  }, [success]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const openEdit = (item) => {
    setEditing(item);
    setForm({
      warehouse_id: item.warehouse_id || item.warehouse || "",
      product_id: item.product_id || item.product?._id || "",
      variant_id: item.variant_id || item.variant?._id || "",
      quantity: item.quantity != null ? String(item.quantity) : "",
      available_quantity: item.available_quantity != null ? String(item.available_quantity) : "",
      reserved_quantity: item.reserved_quantity != null ? String(item.reserved_quantity) : "",
      damaged_quantity: item.damaged_quantity != null ? String(item.damaged_quantity) : "",
      incoming_quantity: item.incoming_quantity != null ? String(item.incoming_quantity) : "",
    });
    setShowModal(true);
    loadDependencies();
  };

  const confirmDelete = (item) => {
    setDeletingId(item._id);
    setDeleteConfirmOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const qty = Number(form.quantity) || 0;
      const avl = form.available_quantity !== "" ? Number(form.available_quantity) : undefined;
      const resv = form.reserved_quantity !== "" ? Number(form.reserved_quantity) : undefined;
      const dmg = form.damaged_quantity !== "" ? Number(form.damaged_quantity) : undefined;
      const inc = form.incoming_quantity !== "" ? Number(form.incoming_quantity) : undefined;

      const payload = {
        warehouse_id: form.warehouse_id,
        product_id: form.product_id,
        variant_id: form.variant_id || null,
        quantity: qty,
        ...(avl !== undefined && { available_quantity: avl }),
        ...(resv !== undefined && { reserved_quantity: resv }),
        ...(dmg !== undefined && { damaged_quantity: dmg }),
        ...(inc !== undefined && { incoming_quantity: inc }),
      };

      if (editing) {
        const res = await api.put(`/admin/stock/${editing._id}`, payload);
        const updated = res.data?.data;
        setStock((prev) =>
          prev.map((s) => (s._id === editing._id ? { ...updated } : s))
        );
        setSuccess("Stock entry updated.");
      } else {
        const res = await api.post("/admin/stock", payload);
        setStock((prev) => [res.data?.data, ...prev]);
        setSuccess("Stock entry created.");
      }
      setShowModal(false);
      setEditing(null);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to save stock entry.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await api.delete(`/admin/stock/${deletingId}`);
      setStock((prev) => prev.filter((s) => s._id !== deletingId));
      setSuccess("Stock entry deleted.");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to delete stock entry.");
    } finally {
      setDeleteConfirmOpen(false);
      setDeletingId(null);
    }
  };

  const filtered = stock.filter((item) => {
    const q = search.toLowerCase();
    if (!q) return true;
    return (
      getProductName(item).toLowerCase().includes(q) ||
      getWarehouseName(item).toLowerCase().includes(q) ||
      String(item.quantity || "").includes(q)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const productVariantsForSelect = form.product_id
    ? variants.filter((v) => v.product_id === form.product_id)
    : [];

  if (loading) {
    return <AdminPageSkeleton variant="table" className="mx-auto max-w-7xl" />;
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-gray-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-700 dark:text-gray-100">Stock</h1>
          <p className="mt-1 text-sm text-gray-500">
            {filtered.length} stock record{filtered.length === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => load(true)}
            disabled={refreshing}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
          <button
            onClick={() => {
              setShowModal(true);
              loadDependencies();
            }}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#0F766E] px-4 text-sm font-semibold text-white hover:bg-[#0F766E]/90"
          >
            <Plus size={16} />
            Add Stock
          </button>
        </div>
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

      {/* Search */}
      <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800 sm:flex-row">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by product, warehouse, or quantity…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-sm outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/10 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        {paginated.length === 0 ? (
          <div className="py-20 text-center">
            <Package className="mx-auto text-gray-300 dark:text-gray-600" size={36} />
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
              No stock records found.
            </p>
            <button
              onClick={() => {
                setShowModal(true);
                loadDependencies();
              }}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#0F766E] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0F766E]/90"
            >
              <Plus size={15} /> Add Stock
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm sm:min-w-0">
                <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500 dark:bg-gray-700/50 dark:text-gray-400">
                  <tr>
                    <th className="px-6 py-3 font-semibold">Product</th>
                    <th className="px-6 py-3 font-semibold hidden sm:table-cell">Warehouse</th>
                    <th className="px-6 py-3 font-semibold">Variant</th>
                    <th className="px-6 py-3 font-semibold">Quantity</th>
                    <th className="px-6 py-3 font-semibold hidden sm:table-cell">Available</th>
                    <th className="px-6 py-3 font-semibold hidden sm:table-cell">Reserved</th>
                    <th className="px-6 py-3 font-semibold hidden sm:table-cell">Damaged</th>
                    <th className="px-6 py-3 font-semibold hidden md:table-cell">Incoming</th>
                    <th className="px-6 py-3 font-semibold hidden md:table-cell">Created</th>
                    <th className="px-6 py-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {paginated.map((item) => {
                    const qty = item.quantity || 0;
                    const qtyColor =
                      qty <= 0
                        ? "text-rose-600"
                        : qty < 10
                          ? "text-amber-600"
                          : "text-gray-900 dark:text-gray-100";
                    const variantLabel = getVariantLabel(item);

                    return (
                      <tr
                        key={item._id}
                        className="transition hover:bg-gray-50 dark:hover:bg-gray-700/30"
                      >
                        <td className="px-6 py-4">
                          <p className={`font-medium ${qtyColor}`}>{getProductName(item)}</p>
                          {item.product_id && (
                            <p className="text-xs text-gray-400 truncate max-w-[140px]">{item.product_id}</p>
                          )}
                        </td>
                        <td className="px-6 py-4 text-gray-700 dark:text-gray-300 hidden sm:table-cell">
                          {getWarehouseName(item)}
                        </td>
                        <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                          {variantLabel || (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`font-semibold ${qtyColor}`}>{qty}</span>
                        </td>
                        <td className="px-6 py-4 text-gray-700 dark:text-gray-300 hidden sm:table-cell">
                          {item.available_quantity != null ? item.available_quantity : "—"}
                        </td>
                        <td className="px-6 py-4 text-gray-700 dark:text-gray-300 hidden sm:table-cell">
                          {item.reserved_quantity != null ? item.reserved_quantity : "—"}
                        </td>
                        <td className="px-6 py-4 text-gray-700 dark:text-gray-300 hidden sm:table-cell">
                          {item.damaged_quantity != null ? item.damaged_quantity : "—"}
                        </td>
                        <td className="px-6 py-4 text-gray-700 dark:text-gray-300 hidden md:table-cell">
                          {item.incoming_quantity != null ? item.incoming_quantity : "—"}
                        </td>
                        <td className="px-6 py-4 text-gray-500 hidden md:table-cell">
                          {formatDate(item.created_at)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEdit(item)}
                              className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-[#0F766E] bg-[#0F766E]/5 border border-[#0F766E]/20 hover:bg-[#0F766E]/10 transition"
                              title="Edit stock"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              onClick={() => confirmDelete(item)}
                              className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition"
                              title="Delete stock"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4 dark:border-gray-700">
                <p className="text-sm text-gray-500">
                  Showing {(page - 1) * PAGE_SIZE + 1}–
                  {Math.min(page * PAGE_SIZE, filtered.length)} of{" "}
                  {filtered.length}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 disabled:opacity-40 hover:bg-gray-50 dark:border-gray-600"
                    title="Previous page"
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
                    title="Next page"
                  >
                    <ChevronRight size={15} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg sm:max-w-2xl overflow-hidden rounded-xl bg-white shadow-2xl dark:bg-gray-800">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
              <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                {editing ? "Edit Stock Entry" : "New Stock Entry"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4 p-6">
              {error && (
                <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  {error}
                </p>
              )}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Warehouse <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={form.warehouse_id}
                    onChange={(e) => setForm((f) => ({ ...f, warehouse_id: e.target.value }))}
                    required
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/10 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                  >
                    <option value="">Select warehouse</option>
                    {warehouses.map((w) => (
                      <option key={w._id} value={w._id}>
                        {w.warehouse_name || w.name || w._id}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Product <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={form.product_id}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        product_id: e.target.value,
                        variant_id: "",
                      }))
                    }
                    required
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/10 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                  >
                    <option value="">Select product</option>
                    {products.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Variant
                  </label>
                  <select
                    value={form.variant_id}
                    onChange={(e) => setForm((f) => ({ ...f, variant_id: e.target.value }))}
                    disabled={!form.product_id}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/10 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                  >
                    <option value="">None (base product)</option>
                    {productVariantsForSelect.map((v) => (
                      <option key={v._id} value={v._id}>
                        {v.size && v.color
                          ? `${v.size} / ${v.color}`
                          : v.size || v.color || v.sku || v._id}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Quantity <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.quantity}
                    onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
                    required
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/10 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Available Quantity
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.available_quantity}
                    onChange={(e) => setForm((f) => ({ ...f, available_quantity: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/10 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Reserved Quantity
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.reserved_quantity}
                    onChange={(e) => setForm((f) => ({ ...f, reserved_quantity: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/10 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Damaged Quantity
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.damaged_quantity}
                    onChange={(e) => setForm((f) => ({ ...f, damaged_quantity: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/10 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Incoming Quantity
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.incoming_quantity}
                    onChange={(e) => setForm((f) => ({ ...f, incoming_quantity: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/10 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#0F766E] px-5 text-sm font-semibold text-white hover:bg-[#0F766E]/90 disabled:opacity-60"
                >
                  {saving ? (
                    <>
                      <Save size={14} className="animate-pulse" />
                      Saving…
                    </>
                  ) : editing ? (
                    "Save Changes"
                  ) : (
                    "Create Stock Entry"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <DeleteConfirmDialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDelete}
        itemName={stock.find((s) => s._id === deletingId) ? getProductName(stock.find((s) => s._id === deletingId)) : "this stock entry"}
      />
    </div>
  );
}
