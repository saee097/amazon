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
  Users,
  X,
  Mail,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const PAGE_SIZE = 20;

const EMPTY_FORM = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  password: "",
  role: "customer",
  status: "active",
};

function RoleBadge({ role }) {
  const isAdmin = role === "admin";
  return (
    <span
      className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
        isAdmin
          ? "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400"
          : "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
      }`}
    >
      {role}
    </span>
  );
}

export default function AdminCustomers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
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
      const res = await api.get("/admin/customers");
      setCustomers(res.data?.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load customers.");
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
  }, [search, statusFilter, roleFilter]);

  const filtered = customers.filter((c) => {
    const q = search.toLowerCase();
    const name = `${c.first_name || ""} ${c.last_name || ""}`.trim();
    const matchSearch =
      !q ||
      name.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.phone?.toLowerCase().includes(q);
    const matchStatus = !statusFilter || c.status === statusFilter;
    const matchRole = !roleFilter || c.role === roleFilter;
    return matchSearch && matchStatus && matchRole;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (customer) => {
    setEditing(customer);
    setForm({
      first_name: customer.first_name || "",
      last_name: customer.last_name || "",
      email: customer.email || "",
      phone: customer.phone || "",
      role: customer.role || "customer",
      status: customer.status || "active",
    });
    setShowModal(true);
  };

  const confirmDelete = (customer) => {
    setDeletingId(customer._id);
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
        const res = await api.put(`/admin/customers/${editing._id}`, payload);
        const updated = res.data?.data;
        setCustomers((prev) =>
          prev.map((c) => (c._id === editing._id ? { ...updated } : c))
        );
        setSuccess("Customer updated.");
      } else {
        const res = await api.post("/admin/customers", payload);
        setCustomers((prev) => [res.data?.data, ...prev]);
        setSuccess("Customer created.");
      }
      setShowModal(false);
      setEditing(null);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to save customer.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setDeleting(true);
    try {
      await api.delete(`/admin/customers/${deletingId}`);
      setCustomers((prev) => prev.filter((c) => c._id !== deletingId));
      setSuccess("Customer deleted.");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to delete customer.");
    } finally {
      setDeleting(false);
      setDeleteConfirmOpen(false);
      setDeletingId(null);
    }
  };

  const customerName = (c) =>
    `${c.first_name || ""} ${c.last_name || ""}`.trim() || "-";

  if (loading) {
    return <AdminPageSkeleton variant="table" className="mx-auto max-w-7xl" />;
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 border-b border-gray-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-700 dark:text-gray-100">
            Customers
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {filtered.length} customer
            {filtered.length === 1 ? "" : "s"}
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
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#0F766E] px-4 text-sm font-semibold text-white hover:bg-[#0F766E]/90"
          >
            <Plus size={16} />
            Add Customer
          </button>
        </div>
      </div>

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

      <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800 sm:flex-row">
        <div className="relative flex-1">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Search customers by name, email, phone…"
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
          <option value="blocked">Blocked</option>
        </select>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#0F766E] dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
        >
          <option value="">All Roles</option>
          <option value="customer">Customer</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        {paginated.length === 0 ? (
          <div className="py-20 text-center">
            <Users className="mx-auto text-gray-300" size={36} />
            <p className="mt-4 text-sm text-gray-500">No customers found.</p>
            <button
              onClick={openCreate}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#0F766E] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0F766E]/90"
            >
              <Plus size={15} /> Add Customer
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
             <table className="w-full min-w-[800px] text-left text-sm sm:min-w-0">
                 <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500 dark:bg-gray-700/50 dark:text-gray-400">
                   <tr>
                     <th className="px-6 py-3 font-semibold">Customer</th>
                     <th className="px-6 py-3 font-semibold hidden sm:table-cell">Email</th>
                     <th className="px-6 py-3 font-semibold hidden lg:table-cell">Phone</th>
                     <th className="px-6 py-3 font-semibold hidden md:table-cell">Role</th>
                     <th className="px-6 py-3 font-semibold">Status</th>
                     <th className="px-6 py-3 text-right font-semibold w-32">
                       Actions
                     </th>
                   </tr>
                 </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {paginated.map((customer) => {
                    const initials = `${(customer.first_name || "")[0] || ""}${(customer.last_name || "")[0] || ""}`.toUpperCase() || "?";
                    return (
                      <tr
                        key={customer._id}
                        className="transition hover:bg-gray-50 dark:hover:bg-gray-700/30"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                              {initials}
                            </div>
                            <span className="font-medium text-gray-900 dark:text-gray-100 truncate max-w-[120px]">
                              {customerName(customer)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300 hidden sm:table-cell">
                          <div className="flex items-center gap-1.5">
                            <Mail size={12} className="text-gray-400" />
                            <span className="block truncate max-w-[150px]">{customer.email || "—"}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300 hidden lg:table-cell">
                          {customer.phone || "—"}
                        </td>
                        <td className="px-6 py-4 hidden md:table-cell">
                          <RoleBadge role={customer.role} />
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={customer.status} className="border border-gray-200"/>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => openEdit(customer)}
                              className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-[#0F766E] bg-[#0F766E]/5 border border-[#0F766E]/20 hover:bg-[#0F766E]/10 dark:bg-[#0F766E]/10 dark:border-[#0F766E]/30 dark:hover:bg-[#0F766E]/20 transition"
                              title="Edit customer"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              onClick={() => confirmDelete(customer)}
                              className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 dark:bg-rose-900/20 dark:border-rose-800 dark:hover:bg-rose-900/30 dark:text-rose-400 transition"
                              title="Delete customer"
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

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden rounded-xl bg-white dark:bg-gray-800">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
              <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                {editing ? "Edit Customer" : "New Customer"}
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
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    First Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.first_name}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, first_name: e.target.value }))
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/10 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                    placeholder="John"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Last Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.last_name}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, last_name: e.target.value }))
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/10 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                    placeholder="Doe"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, email: e.target.value }))
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/10 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                  placeholder="john@example.com"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Phone
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, phone: e.target.value }))
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/10 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                   placeholder="+1 234 567 890"
                 />
               </div>
              {!editing && (
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Password
                  </label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, password: e.target.value }))
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/10 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                    placeholder="Auto-generated if blank"
                  />
                </div>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Role
                  </label>
                  <select
                    value={form.role}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, role: e.target.value }))
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#0F766E] dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                  >
                    <option value="customer">Customer</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Status
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, status: e.target.value }))
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#0F766E] dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                  >
                    <option value="active">Active</option>
                    <option value="blocked">Blocked</option>
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
                  {saving
                    ? "Saving…"
                    : editing
                    ? "Save Changes"
                    : "Create Customer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <DeleteConfirmDialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDelete}
        itemName={
          customers.find((c) => c._id === deletingId)
            ? customerName(customers.find((c) => c._id === deletingId))
            : "this customer"
        }
        loading={deleting}
      />
    </div>
  );
}
