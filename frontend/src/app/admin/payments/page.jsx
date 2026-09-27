"use client";

import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import { AdminPageSkeleton } from "@/components/ui/skeleton";
import {
  Search,
  RefreshCw,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  X,
  Save,
  CreditCard,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RotateCcw,
  Download,
  Plus,
} from "lucide-react";

const PAGE_SIZE = 20;

const PAYMENT_STATUSES = ["pending", "paid", "failed", "refunded"];
const PAYMENT_METHODS = ["cash_on_delivery", "card", "bank_transfer", "paypal"];

const EMPTY_PAYMENT_FORM = {
  order_id: "",
  user_id: "",
  amount: "",
  currency: "USD",
  method: "cash_on_delivery",
  payment_status: "pending",
  order_status: "pending",
};

const PAYMENT_STYLES = {
  pending:  "bg-amber-50 text-amber-800 ring-1 ring-amber-200",
  paid:     "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200",
  failed:   "bg-rose-50 text-rose-800 ring-1 ring-rose-200",
  refunded: "bg-gray-100 text-gray-700 ring-1 ring-gray-200",
};

const PAYMENT_ICONS = {
  pending:  Clock,
  paid:     CheckCircle2,
  failed:   XCircle,
  refunded: RotateCcw,
};

function PaymentStatusBadge({ status }) {
  const Icon = PAYMENT_ICONS[status] || AlertCircle;
  const style = PAYMENT_STYLES[status] || "bg-gray-100 text-gray-600 ring-1 ring-gray-200";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${style}`}
    >
      <Icon size={12} />
      {status || "unknown"}
    </span>
  );
}

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
              Delete payment record?
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              This action cannot be undone. The payment record for order{" "}
              <strong className="font-medium">&quot;{itemName}&quot;</strong> will be
              permanently removed.
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

const currency = (v) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(v) || 0);

function formatDate(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function AdminPayments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [methodFilter, setMethodFilter] = useState("");
  const [page, setPage] = useState(1);

  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({ payment_status: "", order_status: "" });
  const [saving, setSaving] = useState(false);

  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState(EMPTY_PAYMENT_FORM);
  const [createErrors, setCreateErrors] = useState({});

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const load = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    setError("");
    try {
      const res = await api.get("/admin/payments");
      setPayments(res.data?.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load payments.");
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
  }, [search, statusFilter, methodFilter]);

  const openEdit = (payment) => {
    setEditing(payment);
    setEditForm({
      payment_status: payment.payment_status || "pending",
      order_status: payment.order_status || "pending",
    });
  };

  const confirmDelete = (payment) => {
    setDeletingId(payment._id);
    setDeleteConfirmOpen(true);
  };

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await api.put(`/admin/payments/${editing._id}`, editForm);
      const updated = res.data?.data;
      setPayments((prev) =>
        prev.map((p) => (p._id === editing._id ? { ...updated } : p))
      );
      setSuccess("Payment updated.");
      setEditing(null);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to update payment.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await api.delete(`/admin/payments/${deletingId}`);
      setPayments((prev) => prev.filter((p) => p._id !== deletingId));
      setSuccess("Payment deleted.");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to delete payment.");
    } finally {
      setDeleteConfirmOpen(false);
      setDeletingId(null);
    }
  };

  const validateCreateForm = () => {
    const errors = {};
    if (!createForm.order_id) errors.order_id = "Order ID is required";
    if (!createForm.user_id) errors.user_id = "User ID is required";
    if (!createForm.amount) errors.amount = "Amount is required";
    setCreateErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!validateCreateForm()) return;

    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const payload = {
        order_id: createForm.order_id.trim(),
        user_id: createForm.user_id.trim(),
        amount: parseFloat(createForm.amount),
        currency: createForm.currency,
        method: createForm.method,
        status: createForm.payment_status,
        order_status: createForm.order_status,
      };
      const res = await api.post("/admin/payments", payload);
      setPayments((prev) => [res.data?.data, ...prev]);
      setSuccess("Payment created.");
      setCreating(false);
      setCreateForm(EMPTY_PAYMENT_FORM);
      setCreateErrors({});
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to create payment.");
    } finally {
      setSaving(false);
    }
  };

  const exportCSV = () => {
    const header = ["Order #", "Total", "Method", "Payment Status", "Order Status", "Date"];
    const rows = filtered.map((p) => [
      p.order_number || p._id?.slice(-6).toUpperCase(),
      Number(p.total || 0).toFixed(2),
      p.payment_method || "—",
      p.payment_status || "—",
      p.order_status || "—",
      p.created_at ? new Date(p.created_at).toLocaleString() : "",
    ]);
    const csv = [header, ...rows]
      .map((r) => r.map((c) => `"${c}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payments-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filtered = payments.filter((p) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      p.order_number?.toLowerCase().includes(q) ||
      p.payment_method?.toLowerCase().includes(q) ||
      p.payment_status?.toLowerCase().includes(q) ||
      p.order_status?.toLowerCase().includes(q);
    const matchStatus = !statusFilter || p.payment_status === statusFilter;
    const matchMethod = !methodFilter || p.payment_method === methodFilter;
    return matchSearch && matchStatus && matchMethod;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const counts = PAYMENT_STATUSES.reduce((acc, s) => {
    acc[s] = payments.filter((p) => p.payment_status === s).length;
    return acc;
  }, {});

  if (loading) {
    return <AdminPageSkeleton variant="table" className="mx-auto max-w-7xl" />;
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-gray-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-700 dark:text-gray-100">
            Payments
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {filtered.length} payment record{filtered.length === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => load(true)}
            disabled={refreshing}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
          <button
            onClick={exportCSV}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
          >
            <Download size={14} />
            Export
          </button>
          <button
            onClick={() => setCreating(true)}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#0F766E] px-4 text-sm font-semibold text-white hover:bg-[#0F766E]/90"
          >
            <Plus size={14} />
            Add Payment
          </button>
        </div>
      </div>

      {/* Payment summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total", count: payments.length, cls: "text-gray-900 dark:text-gray-100", icon: CreditCard },
          { label: "Paid", count: counts.paid, cls: "text-emerald-700", icon: CheckCircle2 },
          { label: "Pending", count: counts.pending, cls: "text-amber-700", icon: Clock },
          { label: "Failed / Refunded", count: counts.failed + counts.refunded, cls: "text-rose-700", icon: XCircle },
        ].map(({ label, count, cls, icon: Icon }) => (
          <div
            key={label}
            className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
          >
            <div className="flex items-center justify-between">
              <p className={`text-2xl font-bold ${cls}`}>{count}</p>
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

      {/* Filters */}
      <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800 sm:flex-row">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by order # or payment method…"
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
          <option value="">All Payment Statuses</option>
          {PAYMENT_STATUSES.map((s) => (
            <option key={s} value={s} className="capitalize">
              {s}
            </option>
          ))}
        </select>
        <select
          value={methodFilter}
          onChange={(e) => setMethodFilter(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#0F766E] dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
        >
          <option value="">All Methods</option>
          {PAYMENT_METHODS.map((m) => (
            <option key={m} value={m} className="capitalize">
              {m.replace(/_/g, " ")}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        {paginated.length === 0 ? (
          <div className="py-20 text-center">
            <CreditCard className="mx-auto text-gray-300 dark:text-gray-600" size={36} />
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
              No payment records match your filters.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm sm:min-w-0">
                <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500 dark:bg-gray-700/50 dark:text-gray-400">
                  <tr>
                    <th className="px-6 py-3 font-semibold">Order #</th>
                    <th className="px-6 py-3 font-semibold hidden sm:table-cell">Total</th>
                    <th className="px-6 py-3 font-semibold hidden md:table-cell">Method</th>
                    <th className="px-6 py-3 font-semibold">Payment Status</th>
                    <th className="px-6 py-3 font-semibold hidden md:table-cell">Order Status</th>
                    <th className="px-6 py-3 font-semibold hidden lg:table-cell">Date</th>
                    <th className="px-6 py-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {paginated.map((payment) => (
                    <tr
                      key={payment._id}
                      className="transition hover:bg-gray-50 dark:hover:bg-gray-700/30"
                    >
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs font-semibold text-gray-700 dark:text-gray-300">
                          #{payment.order_number || payment._id?.slice(-6).toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-900 dark:text-gray-100 hidden sm:table-cell">
                        {currency(payment.total)}
                      </td>
                      <td className="px-6 py-4 text-gray-700 dark:text-gray-300 hidden md:table-cell">
                        {payment.payment_method
                          ? payment.payment_method.replace(/_/g, " ")
                          : "—"}
                      </td>
                      <td className="px-6 py-4">
                        <PaymentStatusBadge status={payment.payment_status} />
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell">
                        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                          {payment.order_status || "—"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500 hidden lg:table-cell">
                        {formatDate(payment.created_at)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEdit(payment)}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-[#0F766E] bg-[#0F766E]/5 border border-[#0F766E]/20 hover:bg-[#0F766E]/10 transition"
                            title="Update payment"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => confirmDelete(payment)}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition"
                            title="Delete payment"
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

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-2xl dark:bg-gray-800">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
              <div>
                <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                  Update Payment
                </h2>
                <p className="text-xs text-gray-400">
                  Order #{editing.order_number || editing._id?.slice(-6).toUpperCase()}
                </p>
              </div>
              <button
                onClick={() => setEditing(null)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSave();
              }}
              className="space-y-4 p-6"
            >
              {error && (
                <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  {error}
                </p>
              )}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Payment Status
                </label>
                <select
                  value={editForm.payment_status}
                  onChange={(e) => setEditForm((f) => ({ ...f, payment_status: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/10 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                >
                  {PAYMENT_STATUSES.map((s) => (
                    <option key={s} value={s} className="capitalize">
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Order Status
                </label>
                <select
                  value={editForm.order_status}
                  onChange={(e) => setEditForm((f) => ({ ...f, order_status: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/10 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                >
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="returned">Returned</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditing(null)}
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
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Payment Modal */}
      {creating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-2xl dark:bg-gray-800">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
              <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                Add Payment
              </h2>
              <button
                onClick={() => {
                  setCreating(false);
                  setCreateForm(EMPTY_PAYMENT_FORM);
                  setCreateErrors({});
                }}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            <form
              onSubmit={handleCreate}
              className="space-y-4 p-6"
            >
              {error && (
                <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  {error}
                </p>
              )}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Order ID <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={createForm.order_id}
                  onChange={(e) => setCreateForm((f) => ({ ...f, order_id: e.target.value }))}
                  className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/10 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 ${
                    createErrors.order_id ? "border-rose-500" : "border-gray-300"
                  }`}
                  placeholder="Order UUID"
                />
                {createErrors.order_id && (
                  <p className="mt-1 text-sm text-rose-600">{createErrors.order_id}</p>
                )}
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  User ID <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={createForm.user_id}
                  onChange={(e) => setCreateForm((f) => ({ ...f, user_id: e.target.value }))}
                  className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/10 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 ${
                    createErrors.user_id ? "border-rose-500" : "border-gray-300"
                  }`}
                  placeholder="User UUID"
                />
                {createErrors.user_id && (
                  <p className="mt-1 text-sm text-rose-600">{createErrors.user_id}</p>
                )}
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Amount <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={createForm.amount}
                  onChange={(e) => setCreateForm((f) => ({ ...f, amount: e.target.value }))}
                  className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/10 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 ${
                    createErrors.amount ? "border-rose-500" : "border-gray-300"
                  }`}
                  placeholder="0.00"
                />
                {createErrors.amount && (
                  <p className="mt-1 text-sm text-rose-600">{createErrors.amount}</p>
                )}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Currency
                  </label>
                  <input
                    type="text"
                    value={createForm.currency}
                    onChange={(e) => setCreateForm((f) => ({ ...f, currency: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/10 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                    placeholder="USD"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Payment Method
                  </label>
                  <select
                    value={createForm.method}
                    onChange={(e) => setCreateForm((f) => ({ ...f, method: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/10 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                  >
                    {PAYMENT_METHODS.map((m) => (
                      <option key={m} value={m} className="capitalize">
                        {m.replace(/_/g, " ")}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Payment Status
                  </label>
                  <select
                    value={createForm.payment_status}
                    onChange={(e) => setCreateForm((f) => ({ ...f, payment_status: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/10 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                  >
                    {PAYMENT_STATUSES.map((s) => (
                      <option key={s} value={s} className="capitalize">
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Order Status
                  </label>
                  <select
                    value={createForm.order_status}
                    onChange={(e) => setCreateForm((f) => ({ ...f, order_status: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/10 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                  >
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="returned">Returned</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setCreating(false);
                    setCreateForm(EMPTY_PAYMENT_FORM);
                    setCreateErrors({});
                  }}
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
                      Creating…
                    </>
                  ) : (
                    "Create Payment"
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
        itemName={payments.find((p) => p._id === deletingId)?.order_number || "this payment"}
      />
    </div>
  );
}
