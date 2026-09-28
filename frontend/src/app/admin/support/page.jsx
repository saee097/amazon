"use client";

import { useEffect, useState, useCallback } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import api from "@/lib/api";
import { AdminPageSkeleton } from "@/components/ui/skeleton";
import { ToastProvider } from "@/components/ui/Toast";
import DeleteConfirmDialog from "@/components/ui/DeleteConfirmDialog";
import {
  Search,
  RefreshCw,
  Pencil,
  Trash2,
  X,
  Save,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Mail,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Plus,
} from "lucide-react";

const PAGE_SIZE = 15;

const TICKET_STATUSES = ["open", "pending", "resolved", "closed"];

const TICKET_STYLES = {
  open:     "bg-blue-50 text-blue-800 ring-1 ring-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:ring-blue-800",
  pending:  "bg-amber-50 text-amber-800 ring-1 ring-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:ring-amber-800",
  resolved: "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:ring-emerald-800",
  closed:   "bg-gray-100 text-gray-800 ring-1 ring-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:ring-gray-700",
};

const TICKET_ICONS = {
  open:     Clock,
  pending:  Clock,
  resolved: CheckCircle2,
  closed:   XCircle,
};

const PRIORITY_STYLES = {
  low:    "bg-gray-100 text-gray-700 ring-1 ring-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:ring-gray-700",
  medium: "bg-amber-50 text-amber-800 ring-1 ring-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:ring-amber-800",
  high:   "bg-rose-50 text-rose-800 ring-1 ring-rose-200 dark:bg-rose-900/20 dark:text-rose-400 dark:ring-rose-800",
};

const TICKET_PRIORITIES = ["low", "medium", "high"];

const EMPTY_TICKET_FORM = {
  user_id: "",
  subject: "",
  message: "",
  customer_email: "",
  status: "open",
  priority: "medium",
};

function StatusBadge({ status }) {
  const Icon = TICKET_ICONS[status] || AlertCircle;
  const style = TICKET_STYLES[status] || "bg-gray-100 text-gray-600 ring-1 ring-gray-200";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${style}`}
    >
      <Icon size={12} />
      {status || "—"}
    </span>
  );
}

function PriorityBadge({ priority }) {
  if (!priority) return <span className="text-gray-400">—</span>;
  const style = PRIORITY_STYLES[priority] || "bg-gray-100 text-gray-700 ring-1 ring-gray-200";
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${style}`}>
      {priority}
    </span>
  );
}

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function AdminSupport() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({ status: "" });
  const [saving, setSaving] = useState(false);

  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState(EMPTY_TICKET_FORM);
  const [createErrors, setCreateErrors] = useState({});

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    setError("");
    try {
      const res = await api.get("/admin/support");
      setTickets(res.data?.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load support tickets.");
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

  const openEdit = (ticket) => {
    setEditing(ticket);
    setEditForm({ status: ticket.status || "open" });
  };

  const confirmDelete = (ticket) => {
    setDeletingId(ticket._id);
    setDeleteConfirmOpen(true);
  };

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await api.put(`/admin/support/${editing._id}`, editForm);
      const updated = res.data?.data;
      setTickets((prev) =>
        prev.map((t) => (t._id === editing._id ? { ...updated } : t))
      );
      setSuccess("Support ticket updated.");
      setEditing(null);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to update ticket.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setDeleting(true);
    try {
      await api.delete(`/admin/support/${deletingId}`);
      setTickets((prev) => prev.filter((t) => t._id !== deletingId));
      setSuccess("Support ticket deleted.");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to delete ticket.");
    } finally {
      setDeleting(false);
      setDeleteConfirmOpen(false);
      setDeletingId(null);
    }
  };

  const validateCreateForm = () => {
    const errors = {};
    if (!createForm.user_id) errors.user_id = "User ID is required";
    if (!createForm.subject.trim()) errors.subject = "Subject is required";
    if (!createForm.message.trim()) errors.message = "Message is required";
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
        user_id: createForm.user_id.trim(),
        subject: createForm.subject.trim(),
        message: createForm.message.trim(),
        customer_email: createForm.customer_email.trim() || null,
        status: createForm.status,
        priority: createForm.priority,
      };
      const res = await api.post("/admin/support", payload);
      setTickets((prev) => [res.data?.data, ...prev]);
      setSuccess("Support ticket created.");
      setCreating(false);
      setCreateForm(EMPTY_TICKET_FORM);
      setCreateErrors({});
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to create ticket.");
    } finally {
      setSaving(false);
    }
  };

  const filtered = tickets.filter((t) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      t.subject?.toLowerCase().includes(q) ||
      t.customer_email?.toLowerCase().includes(q) ||
      t.message?.toLowerCase().includes(q);
    const matchStatus = !statusFilter || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const counts = TICKET_STATUSES.reduce((acc, s) => {
    acc[s] = tickets.filter((t) => t.status === s).length;
    return acc;
  }, {});

  return (
    <ToastProvider>
      <ProtectedRoute allowedRoles={["superadmin"]} requiredPermissions={["support:view"]}>
        <div className="mx-auto max-w-7xl space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-4 border-b border-gray-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-700 dark:text-gray-100">
                Support Tickets
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                {filtered.length} ticket{filtered.length === 1 ? "" : "s"}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => load(true)}
                disabled={refreshing}
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 sm:w-auto sm:px-3"
                title="Refresh"
              >
                <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
                <span className="hidden sm:ml-1 sm:inline">Refresh</span>
              </button>
              <button
                onClick={() => setCreating(true)}
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#0F766E] px-4 text-sm font-semibold text-white hover:bg-[#0F766E]/90"
              >
                <Plus size={14} />
                Add Support
              </button>
            </div>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Total Tickets", count: tickets.length, cls: "text-gray-900 dark:text-gray-100", icon: MessageSquare },
              { label: "Open", count: counts.open, cls: "text-blue-700 dark:text-blue-400", icon: Clock },
              { label: "Pending", count: counts.pending, cls: "text-amber-700 dark:text-amber-400", icon: Clock },
              { label: "Resolved", count: counts.resolved + counts.closed, cls: "text-emerald-700 dark:text-emerald-400", icon: CheckCircle2 },
            ].map(({ label, count, cls, icon: Icon }) => (
              <div
                key={label}
                className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
              >
                <div className="flex items-center justify-between">
                  <p className={`text-2xl font-bold ${cls}`}>{count}</p>
                  <Icon size={20} className={`${cls} opacity-70`} />
                </div>
                <p className="mt-1 text-xs font-medium text-gray-500 dark:text-gray-400">{label}</p>
              </div>
            ))}
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
          <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by subject, email, or reason…"
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
              {TICKET_STATUSES.map((s) => (
                <option key={s} value={s} className="capitalize">
                  {s}
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <AdminPageSkeleton variant="table" className="mx-auto max-w-7xl" />
          ) : (
            <>
              {/* Table */}
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
                {paginated.length === 0 ? (
                  <div className="py-20 text-center">
                    <MessageSquare className="mx-auto text-gray-300 dark:text-gray-600" size={36} />
                    <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                      No support tickets match your filters.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[800px] text-left text-sm sm:min-w-0">
                        <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500 dark:bg-gray-700/50 dark:text-gray-400">
                          <tr>
                            <th className="px-6 py-3 font-semibold">Subject</th>
                            <th className="px-6 py-3 font-semibold hidden sm:table-cell">Customer</th>
                            <th className="px-6 py-3 font-semibold hidden md:table-cell">Priority</th>
                            <th className="px-6 py-3 font-semibold">Status</th>
                            <th className="px-6 py-3 font-semibold hidden lg:table-cell">Created</th>
                            <th className="px-6 py-3 text-right font-semibold w-32">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                          {paginated.map((ticket) => (
                            <tr
                              key={ticket._id}
                              className="transition hover:bg-gray-50 dark:hover:bg-gray-700/30"
                            >
                              <td className="px-6 py-4">
                                <p className="font-medium text-gray-900 dark:text-gray-100 truncate max-w-[180px]">
                                  {ticket.subject || <span className="text-gray-400">—</span>}
                                </p>
                                <p className="mt-1 text-xs text-gray-500 truncate max-w-[180px] sm:max-w-[250px]">
                                  {(ticket.message || "").slice(0, 50)}
                                  {(ticket.message || "").length > 50 && "…"}
                                </p>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300 hidden sm:table-cell">
                                <div className="flex items-center gap-1.5">
                                  <Mail size={12} className="text-gray-400" />
                                  <span className="truncate max-w-[150px] block">{ticket.customer_email || "—"}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 hidden md:table-cell">
                                <PriorityBadge priority={ticket.priority} />
                              </td>
                              <td className="px-6 py-4">
                                <StatusBadge status={ticket.status} />
                              </td>
                              <td className="px-6 py-4 text-gray-500 hidden lg:table-cell">
                                {formatDate(ticket.created_at)}
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => openEdit(ticket)}
                                    className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-[#0F766E] bg-[#0F766E]/5 border border-[#0F766E]/20 hover:bg-[#0F766E]/10 dark:bg-[#0F766E]/10 dark:border-[#0F766E]/30 dark:hover:bg-[#0F766E]/20 transition"
                                    title="Update ticket status"
                                  >
                                    <Pencil size={14} />
                                  </button>
                                  <button
                                    onClick={() => confirmDelete(ticket)}
                                    className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 dark:bg-rose-900/20 dark:border-rose-800 dark:hover:bg-rose-900/30 dark:text-rose-400 transition"
                                    title="Delete ticket"
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
                      <div className="flex flex-col gap-3 items-center border-t border-gray-200 px-6 py-4 dark:border-gray-700 sm:flex-row sm:justify-between">
                        <p className="text-sm text-gray-500 text-center sm:text-left">
                          Showing {(page - 1) * PAGE_SIZE + 1}–
                          {Math.min(page * PAGE_SIZE, filtered.length)} of{" "}
                          {filtered.length}
                        </p>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-300 disabled:opacity-40 hover:bg-gray-50 dark:border-gray-600"
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
                            className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-300 disabled:opacity-40 hover:bg-gray-50 dark:border-gray-600"
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
            </>
          )}

          {/* Edit Modal */}
          {editing && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
              <div className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-2xl dark:bg-gray-800">
                <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
                  <div>
                    <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                      Update Ticket Status
                    </h2>
                    <p className="text-xs text-gray-400">
                      {editing.subject}
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
                    <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-900/20 dark:text-rose-300">
                      {error}
                    </p>
                  )}
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Ticket Status
                    </label>
                    <select
                      value={editForm.status}
                      onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/10 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                    >
                      {TICKET_STATUSES.map((s) => (
                        <option key={s} value={s} className="capitalize">
                          {s}
                        </option>
                      ))}
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
                      className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#0F766E] px-5 text-sm font-semibold text-white hover:bg-[#0F766E]/90 disabled:opacity-60"
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

          {/* Create Support Modal */}
          {creating && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
              <div className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-2xl dark:bg-gray-800">
                <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
                  <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                    Add Support Ticket
                  </h2>
                  <button
                    onClick={() => {
                      setCreating(false);
                      setCreateForm(EMPTY_TICKET_FORM);
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
                    <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-900/20 dark:text-rose-300">
                      {error}
                    </p>
                  )}
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
                      Subject <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={createForm.subject}
                      onChange={(e) => setCreateForm((f) => ({ ...f, subject: e.target.value }))}
                      className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/10 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 ${
                        createErrors.subject ? "border-rose-500" : "border-gray-300"
                      }`}
                      placeholder="Ticket subject"
                    />
                    {createErrors.subject && (
                      <p className="mt-1 text-sm text-rose-600">{createErrors.subject}</p>
                    )}
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Message <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={createForm.message}
                      onChange={(e) => setCreateForm((f) => ({ ...f, message: e.target.value }))}
                      className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/10 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 ${
                        createErrors.message ? "border-rose-500" : "border-gray-300"
                      }`}
                      placeholder="Ticket message..."
                    />
                    {createErrors.message && (
                      <p className="mt-1 text-sm text-rose-600">{createErrors.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Customer Email
                    </label>
                    <input
                      type="email"
                      value={createForm.customer_email}
                      onChange={(e) => setCreateForm((f) => ({ ...f, customer_email: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/10 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                      placeholder="customer@example.com"
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Status
                      </label>
                      <select
                        value={createForm.status}
                        onChange={(e) => setCreateForm((f) => ({ ...f, status: e.target.value }))}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/10 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                      >
                        {TICKET_STATUSES.map((s) => (
                          <option key={s} value={s} className="capitalize">
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Priority
                      </label>
                      <select
                        value={createForm.priority}
                        onChange={(e) => setCreateForm((f) => ({ ...f, priority: e.target.value }))}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/10 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                      >
                        {TICKET_PRIORITIES.map((p) => (
                          <option key={p} value={p} className="capitalize">
                            {p}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setCreating(false);
                        setCreateForm(EMPTY_TICKET_FORM);
                        setCreateErrors({});
                      }}
                      className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#0F766E] px-5 text-sm font-semibold text-white hover:bg-[#0F766E]/90 disabled:opacity-60"
                    >
                      {saving ? (
                        <>
                          <Save size={14} className="animate-pulse" />
                          Creatingâ€¦
                        </>
                      ) : (
                        "Create Ticket"
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
              tickets.find((t) => t._id === deletingId)?.subject || "this ticket"
            }
            loading={deleting}
          />
        </div>
      </ProtectedRoute>
    </ToastProvider>
  );
}

