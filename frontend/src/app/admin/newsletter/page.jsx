"use client";

import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import StatusBadge from "@/components/StatusBadge";
import { ToastProvider, useToast } from "@/components/ui/Toast";
import { AdminPageSkeleton } from "@/components/ui/skeleton";
import DeleteConfirmDialog from "@/components/ui/DeleteConfirmDialog";
import {
  Plus,
  Search,
  RefreshCw,
  Pencil,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Mail,
} from "lucide-react";

const PAGE_SIZE = 20;

const NOTIFICATION_TYPES = [
  { value: "order", label: "Order" },
  { value: "stock", label: "Stock" },
  { value: "user", label: "User" },
  { value: "refund", label: "Refund" },
  { value: "info", label: "Info" },
];

const EMPTY_FORM = {
  title: "",
  message: "",
  type: "info",
  status: "active",
};

export default function AdminNewsletterPage() {
  const toast = useToast();

  const [items, setItems] = useState([]);
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
  const [formErrors, setFormErrors] = useState({});

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    setError("");
    try {
      const res = await api.get("/admin/newsletter");
      const data = res.data?.data || [];
      setItems(data);
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to load notifications.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => setSuccess(""), 3000);
    return () => clearTimeout(t);
  }, [success]);

  useEffect(() => { setPage(1); }, [search, statusFilter]);

  const validateForm = () => {
    const errors = {};
    if (!form.title.trim()) errors.title = "Title is required";
    if (!form.message.trim()) errors.message = "Message is required";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const filtered = items.filter((item) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      item.title?.toLowerCase().includes(q) ||
      item.message?.toLowerCase().includes(q) ||
      item.type?.toLowerCase().includes(q);
    const matchStatus = !statusFilter || item.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM });
    setFormErrors({});
    setShowModal(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    setForm({
      title: item.title || "",
      message: item.message || "",
      type: item.type || "info",
      status: item.status || "active",
    });
    setFormErrors({});
    setShowModal(true);
  };

  const confirmDelete = (item) => {
    setDeletingId(item._id);
    setDeleteConfirmOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const payload = {
        title: form.title.trim(),
        message: form.message.trim(),
        type: form.type,
        status: form.status,
      };
      if (editing) {
        const res = await api.put(`/admin/newsletter/${editing._id}`, payload);
        const updated = res.data?.data;
        setItems((prev) =>
          prev.map((i) => (i._id === editing._id ? { ...updated } : i))
        );
        setSuccess("Notification updated");
      } else {
        const res = await api.post("/admin/newsletter", payload);
        setItems((prev) => [res.data?.data, ...prev]);
        setSuccess("Notification created");
      }
      setShowModal(false);
      setEditing(null);
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to save notification.";
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setDeleting(true);
    try {
      await api.delete(`/admin/newsletter/${deletingId}`);
      setItems((prev) => prev.filter((i) => i._id !== deletingId));
      setSuccess("Notification deleted");
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to delete notification.";
      toast.error(msg);
    } finally {
      setDeleting(false);
      setDeleteConfirmOpen(false);
      setDeletingId(null);
    }
  };

  const typeLabel = (type) => {
    const found = NOTIFICATION_TYPES.find((t) => t.value === type);
    return found ? found.label : type;
  };

  if (loading) {
    return (
      <ToastProvider>
        <AdminPageSkeleton variant="table" className="mx-auto max-w-7xl" />
      </ToastProvider>
    );
  }

  return (
    <ToastProvider>
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 border-b border-gray-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-700 dark:text-gray-100">Newsletter Notifications</h1>
            <p className="mt-1 text-sm text-gray-500">{filtered.length} notifications</p>
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
              Compose Notification
            </button>
          </div>
        </div>

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

        <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800 sm:flex-row">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search notifications…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-sm outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/10 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#0F766E] dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 w-full sm:w-auto"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          {paginated.length === 0 ? (
            <div className="py-20 text-center">
              <Mail className="mx-auto text-gray-300" size={36} />
              <p className="mt-4 text-sm text-gray-500">No notifications found.</p>
              <button
                onClick={openCreate}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#0F766E] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0F766E]/90"
              >
                <Plus size={15} /> Compose Notification
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500 dark:bg-gray-700/50 dark:text-gray-400">
                  <tr>
                    <th className="px-6 py-3 font-semibold">Title</th>
                    <th className="px-6 py-3 font-semibold">Type</th>
                    <th className="px-6 py-3 font-semibold">Message</th>
                    <th className="px-6 py-3 font-semibold">Status</th>
                    <th className="px-6 py-3 font-semibold">Created</th>
                    <th className="px-6 py-3 text-right font-semibold w-24">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {paginated.map((item) => (
                    <tr
                      key={item._id}
                      className="transition hover:bg-gray-50 dark:hover:bg-gray-700/30"
                    >
                      <td className="px-6 py-4">
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {item.title}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                          {typeLabel(item.type)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                        {item.message}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={item.status} className="border border-gray-200" />
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {item.created_at ? new Date(item.created_at).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEdit(item)}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-[#0F766E] bg-[#0F766E]/5 border border-[#0F766E]/20 hover:bg-[#0F766E]/10 transition"
                            title="Edit notification"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => confirmDelete(item)}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition"
                            title="Delete notification"
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
          )}

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
                  title="Previous page"
                >
                  <ChevronLeft size={15} />
                </button>
                <span className="text-sm text-gray-600 dark:text-gray-400">{page} / {totalPages}</span>
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
        </div>

        {/* Create / Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-2xl overflow-hidden rounded-xl bg-white dark:bg-gray-800">
              <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
                <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                  {editing ? "Edit Notification" : "Compose Notification"}
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
                  <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
                )}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/10 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 ${
                      formErrors.title ? "border-rose-500" : "border-gray-300"
                    }`}
                    placeholder="e.g. New Shipping Options Available"
                    autoFocus
                  />
                  {formErrors.title && (
                    <p className="mt-1 text-sm text-rose-600">{formErrors.title}</p>
                  )}
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Message <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={form.message}
                    onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                    className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/10 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 ${
                      formErrors.message ? "border-rose-500" : "border-gray-300"
                    }`}
                    placeholder="Enter the notification message..."
                  />
                  {formErrors.message && (
                    <p className="mt-1 text-sm text-rose-600">{formErrors.message}</p>
                  )}
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Type
                    </label>
                    <select
                      value={form.type}
                      onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#0F766E] dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                    >
                      {NOTIFICATION_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
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
                    className="rounded-lg bg-[#0F766E] px-5 py-2 text-sm font-semibold text-white hover:bg-[#0F766E]/90 disabled:opacity-60"
                  >
                    {saving ? (
                      <>
                        <Loader2 size={14} className="mr-2 animate-spin" />
                        Saving…
                      </>
                    ) : editing ? (
                      "Save Changes"
                    ) : (
                      "Create Notification"
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
          itemName={items.find((i) => i._id === deletingId)?.title || "this notification"}
          loading={deleting}
        />
      </div>
    </ToastProvider>
  );
}
