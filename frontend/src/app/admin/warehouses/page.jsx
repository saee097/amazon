"use client";

import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import StatusBadge from "@/components/StatusBadge";
import { AdminPageSkeleton } from "@/components/ui/skeleton";
import DeleteConfirmDialog from "@/components/ui/DeleteConfirmDialog";
import {
  Plus,
  Search,
  RefreshCw,
  Pencil,
  Trash2,
  MapPin,
  X,
  ChevronLeft,
  ChevronRight,
  Save,
} from "lucide-react";

const PAGE_SIZE = 20;

const EMPTY_FORM = {
  name: "",
  location: "",
  status: "active",
};

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function AdminWarehouses() {
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    setError("");
    try {
      const res = await api.get("/warehouses");
      setWarehouses(res.data?.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load warehouses.");
    } finally {
      setLoading(false);
      setRefreshing(false);
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
  }, [search, statusFilter]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (warehouse) => {
    setEditing(warehouse);
    setForm({
      name: warehouse.name || "",
      location: warehouse.location || "",
      status: warehouse.status || "active",
    });
    setShowModal(true);
  };

  const confirmDelete = (warehouse) => {
    setDeletingId(warehouse._id);
    setDeleteConfirmOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const payload = { ...form };
      if (editing) {
        const res = await api.put(`/warehouses/${editing._id}`, payload);
        const updated = res.data?.data;
        setWarehouses((prev) =>
          prev.map((w) => (w._id === editing._id ? { ...updated } : w))
        );
        setSuccess("Warehouse updated.");
      } else {
        const res = await api.post("/warehouses", payload);
        setWarehouses((prev) => [res.data?.data, ...prev]);
        setSuccess("Warehouse created.");
      }
      setShowModal(false);
      setEditing(null);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to save warehouse.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setDeleting(true);
    try {
      await api.delete(`/warehouses/${deletingId}`);
      setWarehouses((prev) => prev.filter((w) => w._id !== deletingId));
      setSuccess("Warehouse deleted.");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to delete warehouse.");
    } finally {
      setDeleting(false);
      setDeleteConfirmOpen(false);
      setDeletingId(null);
    }
  };

  const filtered = warehouses.filter((w) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      w.name?.toLowerCase().includes(q) ||
      w.location?.toLowerCase().includes(q);
    const matchStatus = !statusFilter || w.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (loading) {
    return <AdminPageSkeleton variant="table" className="mx-auto max-w-7xl" />;
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-gray-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-700 dark:text-gray-100">
            Warehouses
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {filtered.length} warehouse{filtered.length === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => load(true)}
            disabled={refreshing}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
          <button
            onClick={openCreate}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#0F766E] px-4 text-sm font-semibold text-white hover:bg-[#0F766E]/90"
          >
            <Plus size={16} />
            Add Warehouse
          </button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-800 dark:bg-rose-900/20 dark:text-rose-300">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300">
          {success}
        </div>
      )}

      {/* Search & Filters */}
      <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800 sm:flex-row">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or location…"
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
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        {paginated.length === 0 ? (
          <div className="py-20 text-center">
            <MapPin className="mx-auto text-gray-300 dark:text-gray-600" size={36} />
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
              No warehouses found.
            </p>
            <button
              onClick={openCreate}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#0F766E] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0F766E]/90"
            >
              <Plus size={15} /> Add Warehouse
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] text-left text-sm sm:min-w-0">
                <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500 dark:bg-gray-700/50 dark:text-gray-400">
                  <tr>
                    <th className="px-6 py-3 font-semibold">Name</th>
                    <th className="px-6 py-3 font-semibold hidden sm:table-cell">Location</th>
                    <th className="px-6 py-3 font-semibold hidden md:table-cell">Status</th>
                    <th className="px-6 py-3 font-semibold hidden md:table-cell">Created</th>
                    <th className="px-6 py-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {paginated.map((warehouse) => (
                    <tr
                      key={warehouse._id}
                      className="transition hover:bg-gray-50 dark:hover:bg-gray-700/30"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#0F766E]/5">
                            <MapPin size={14} className="text-[#0F766E]" />
                          </div>
                          <span className="font-semibold text-gray-900 dark:text-gray-100">
                            {warehouse.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-700 dark:text-gray-300 hidden sm:table-cell">
                        {warehouse.location || (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell">
                        <StatusBadge status={warehouse.status} />
                      </td>
                      <td className="px-6 py-4 text-gray-500 hidden md:table-cell">
                        {formatDate(warehouse.created_at)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEdit(warehouse)}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-[#0F766E] bg-[#0F766E]/5 border border-[#0F766E]/20 hover:bg-[#0F766E]/10 dark:bg-[#0F766E]/10 dark:border-[#0F766E]/30 dark:hover:bg-[#0F766E]/20 transition"
                            title="Edit warehouse"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => confirmDelete(warehouse)}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 dark:bg-rose-900/20 dark:border-rose-800 dark:hover:bg-rose-900/30 dark:text-rose-400 transition"
                            title="Delete warehouse"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
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
          <div className="w-full max-w-lg overflow-hidden rounded-xl bg-white dark:bg-gray-800">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
              <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                {editing ? "Edit Warehouse" : "New Warehouse"}
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
                <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-900/20 dark:text-rose-300">
                  {error}
                </p>
              )}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/10 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                  placeholder="e.g. Main Warehouse"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Location
                </label>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/10 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                  placeholder="e.g. New York, NY"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Status
                </label>
                <select
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#0F766E] dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
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
                    "Create Warehouse"
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
        itemName={
          warehouses.find((w) => w._id === deletingId)?.name || "this warehouse"
        }
        loading={deleting}
      />
    </div>
  );
}
