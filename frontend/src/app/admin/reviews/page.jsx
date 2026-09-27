"use client";

import { useEffect, useState, useCallback } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import api from "@/lib/api";
import { AdminPageSkeleton } from "@/components/ui/skeleton";
import {
  Search,
  RefreshCw,
  Pencil,
  Trash2,
  X,
  AlertTriangle,
  Save,
  Clock,
  CheckCircle2,
  XCircle,
  Star,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const PAGE_SIZE = 15;

const REVIEW_STATUSES = ["approved", "pending", "rejected"];

const REVIEW_STYLES = {
  approved: "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200",
  pending:  "bg-amber-50 text-amber-800 ring-1 ring-amber-200",
  rejected: "bg-rose-50 text-rose-800 ring-1 ring-rose-200",
};

const REVIEW_ICONS = {
  approved: CheckCircle2,
  pending:  Clock,
  rejected: XCircle,
};

function StatusBadge({ status }) {
  const Icon = REVIEW_ICONS[status] || Clock;
  const style = REVIEW_STYLES[status] || "bg-gray-100 text-gray-600 ring-1 ring-gray-200";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${style}`}
    >
      <Icon size={12} />
      {status || "—"}
    </span>
  );
}

function RatingDisplay({ rating }) {
  const r = Number(rating) || 0;
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={14}
          className={i <= r ? "text-amber-400 fill-current" : "text-gray-300"}
        />
      ))}
    </div>
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
              Delete review?
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              This action cannot be undone. The review by {itemName} will be
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

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [ratingFilter, setRatingFilter] = useState("");
  const [page, setPage] = useState(1);

  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({ status: "" });
  const [saving, setSaving] = useState(false);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const load = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    setError("");
    try {
      const res = await api.get("/admin/reviews");
      setReviews(res.data?.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load reviews.");
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
  }, [search, statusFilter, ratingFilter]);

  const openEdit = (review) => {
    setEditing(review);
    setEditForm({ status: review.status || "pending" });
  };

  const confirmDelete = (review) => {
    setDeletingId(review._id);
    setDeleteConfirmOpen(true);
  };

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await api.put(`/admin/reviews/${editing._id}`, editForm);
      const updated = res.data?.data;
      setReviews((prev) =>
        prev.map((r) => (r._id === editing._id ? { ...updated } : r))
      );
      setSuccess("Review status updated.");
      setEditing(null);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to update review.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await api.delete(`/admin/reviews/${deletingId}`);
      setReviews((prev) => prev.filter((r) => r._id !== deletingId));
      setSuccess("Review deleted.");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to delete review.");
    } finally {
      setDeleteConfirmOpen(false);
      setDeletingId(null);
    }
  };

  const filtered = reviews.filter((r) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      r.comment?.toLowerCase().includes(q);
    const matchStatus = !statusFilter || r.status === statusFilter;
    const matchRating = !ratingFilter || r.rating === Number(ratingFilter);
    return matchSearch && matchStatus && matchRating;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const counts = REVIEW_STATUSES.reduce((acc, s) => {
    acc[s] = reviews.filter((r) => r.status === s).length;
    return acc;
  }, {});

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + (Number(r.rating) || 0), 0) / reviews.length).toFixed(1)
    : "0.0";

  return (
    <ProtectedRoute allowedRoles={["superadmin"]} requiredPermissions={["reviews:view"]}>
        <div className="mx-auto max-w-7xl space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-4 border-b border-gray-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-700 dark:text-gray-100">
                Reviews
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                {filtered.length} review{filtered.length === 1 ? "" : "s"}
                {" "}· Avg rating: {avgRating}★
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
            </div>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Total Reviews", count: reviews.length, cls: "text-gray-900", icon: Star },
              { label: "Approved", count: counts.approved, cls: "text-emerald-700", icon: CheckCircle2 },
              { label: "Pending", count: counts.pending, cls: "text-amber-700", icon: Clock },
              { label: "Rejected", count: counts.rejected, cls: "text-rose-700", icon: XCircle },
            ].map(({ label, count, cls, icon: Icon }) => (
              <div
                key={label}
                className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
              >
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

          {/* Search & Filters */}
          <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by review text…"
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
              {REVIEW_STATUSES.map((s) => (
                <option key={s} value={s} className="capitalize">
                  {s}
                </option>
              ))}
            </select>
            <select
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#0F766E] dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 w-full sm:w-auto"
            >
              <option value="">All Ratings</option>
              {[5, 4, 3, 2, 1].map((r) => (
                <option key={r} value={r}>{r}★ &amp; up</option>
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
                    <Star className="mx-auto text-gray-300 dark:text-gray-600" size={36} />
                    <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                      No reviews match your filters.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[800px] text-left text-sm sm:min-w-0">
                        <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500 dark:bg-gray-700/50 dark:text-gray-400">
                          <tr>
                            <th className="px-6 py-3 font-semibold">Rating</th>
                            <th className="px-6 py-3 font-semibold">Review</th>
                            <th className="px-6 py-3 font-semibold hidden sm:table-cell">Product</th>
                            <th className="px-6 py-3 font-semibold">Status</th>
                            <th className="px-6 py-3 font-semibold hidden md:table-cell">Created</th>
                            <th className="px-6 py-3 text-right font-semibold w-32">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                          {paginated.map((review) => (
                            <tr
                              key={review._id}
                              className="transition hover:bg-gray-50 dark:hover:bg-gray-700/30"
                            >
                              <td className="px-6 py-4">
                                <RatingDisplay rating={review.rating} />
                              </td>
                              <td className="px-6 py-4">
                                <p className="text-gray-700 dark:text-gray-300 truncate max-w-[200px] sm:max-w-[300px]">
                                  {review.comment || <span className="text-gray-400">—</span>}
                                </p>
                                {review.verified_purchase && (
                                  <span className="mt-1 inline-flex items-center gap-1.2 text-xs text-emerald-600">
                                    <CheckCircle2 size={10} />
                                    Verified purchase
                                  </span>
                                )}
                                {review.admin_approved && (
                                  <span className="mt-1 block text-xs text-blue-600">
                                    Admin approved
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300 hidden sm:table-cell">
                                <span className="truncate max-w-[150px] block">
                                  Product ID: {review.product_id?.slice(-8) || "—"}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <StatusBadge status={review.status} />
                              </td>
                              <td className="px-6 py-4 text-gray-500 hidden md:table-cell">
                                {formatDate(review.created_at)}
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => openEdit(review)}
                                    className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-[#0F766E] bg-[#0F766E]/5 border border-[#0F766E]/20 hover:bg-[#0F766E]/10 transition"
                                    title="Update review status"
                                  >
                                    <Pencil size={14} />
                                  </button>
                                  <button
                                    onClick={() => confirmDelete(review)}
                                    className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition"
                                    title="Delete review"
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
                      Update Review Status
                    </h2>
                    <p className="text-xs text-gray-400">
                      {editing.comment?.slice(0, 40)}...
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
                      Review Status
                    </label>
                    <select
                      value={editForm.status}
                      onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/10 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                    >
                      {REVIEW_STATUSES.map((s) => (
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

          {/* Delete Confirmation */}
          <DeleteConfirmDialog
            open={deleteConfirmOpen}
            onClose={() => setDeleteConfirmOpen(false)}
            onConfirm={handleDelete}
            itemName={
              reviews.find((r) => r._id === deletingId)?.comment?.slice(0, 20)
                ? reviews.find((r) => r._id === deletingId).comment.slice(0, 20) + "…"
                : "this review"
            }
          />
        </div>
      </ProtectedRoute>
  );
}
