"use client";

import { useEffect, useState, useCallback } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import api from "@/lib/api";
import { ROLES } from "@/lib/rbac";
import StatusBadge from "@/components/StatusBadge";
import RoleBadge from "@/components/RoleBadge";
import { ToastProvider, useToast } from "@/components/ui/Toast";
import { SkeletonTable } from "@/components/ui/skeleton";
import DeleteConfirmDialog from "@/components/ui/DeleteConfirmDialog";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  X,
  Shield,
  UserCheck,
  Loader2,
  Mail,
  Phone,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from "lucide-react";

const PAGE_SIZE = 15;

const EMPTY_FORM = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  password: "",
  status: "active",
  permissions: [],
};

const PERMISSION_GROUPS = [
  { label: "Dashboard", perms: ["dashboard:view"] },
  { label: "Users", perms: ["users:view", "users:create", "users:edit", "users:delete"] },
  { label: "Products", perms: ["products:view", "products:create", "products:edit", "products:delete"] },
  { label: "Orders", perms: ["orders:view", "orders:edit", "orders:delete"] },
  { label: "Categories", perms: ["categories:view", "categories:create", "categories:edit", "categories:delete"] },
  { label: "Settings", perms: ["settings:view", "settings:edit"] },
  { label: "Logs", perms: ["logs:view", "logs:export"] },
];

function PermissionCheckbox({ label, checked, onChange, disabled }) {
  return (
    <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="w-4 h-4 text-[#0F766E] border-gray-300 rounded focus:ring-[#0F766E] disabled:opacity-50 disabled:cursor-not-allowed"
      />
      <span className={disabled ? "opacity-50" : ""}>{label}</span>
    </label>
  );
}

export default function ManageAdmins() {
  const toast = useToast();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  const [showModal, setShowModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set("search", searchQuery);
      if (statusFilter) params.set("status", statusFilter);
      params.set("role", "admin");
      params.set("page", page.toString());
      params.set("limit", PAGE_SIZE.toString());

      const { data } = await api.get(`/admin/users?${params.toString()}`);
      const adminsData = data.data || [];
      const totalPages = data.totalPages || 1;
      setAdmins(adminsData);
      return totalPages;
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to load admins";
      toast.error(msg);
      return 1;
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery, statusFilter, page, toast]);

  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    load().then(setTotalPages);
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, statusFilter]);

  const validateForm = () => {
    const errors = {};
    if (!form.first_name.trim()) errors.first_name = "First name is required";
    if (!form.last_name.trim()) errors.last_name = "Last name is required";
    if (!form.email.trim()) errors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = "Invalid email format";
    if (!editingAdmin && !form.password.trim()) errors.password = "Password is required";
    else if (form.password && form.password.length < 8) errors.password = "Password must be at least 8 characters";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const filteredAdmins = admins;

  const openCreate = () => {
    setEditingAdmin(null);
    setForm({ ...EMPTY_FORM, status: "active" });
    setFormErrors({});
    setShowModal(true);
  };

  const openEdit = (admin) => {
    setEditingAdmin(admin);
    setForm({
      first_name: admin.first_name || "",
      last_name: admin.last_name || "",
      email: admin.email || "",
      phone: admin.phone || "",
      password: "",
      status: admin.status || "active",
      permissions: admin.permissions || [],
    });
    setFormErrors({});
    setShowModal(true);
  };

  const confirmDelete = (admin) => {
    setDeletingId(admin._id);
    setDeleteConfirmOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSaving(true);
    try {
      const payload = {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        status: form.status,
        permissions: form.permissions,
        role: "admin",
      };
      if (form.password) payload.password = form.password;

      if (editingAdmin) {
        await api.put(`/admin/users/${editingAdmin._id}`, payload);
        toast.success("Admin updated successfully");
      } else {
        await api.post("/admin/users", payload);
        toast.success("Admin created successfully");
      }
      setShowModal(false);
      setEditingAdmin(null);
      setForm(EMPTY_FORM);
      load().then(setTotalPages);
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to save admin";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleStatusToggle = async (admin) => {
    const newStatus = admin.status === "active" ? "blocked" : "active";
    try {
      await api.put(`/admin/users/${admin._id}`, { status: newStatus });
      toast.success(`Admin ${newStatus === "active" ? "activated" : "suspended"}`);
      load().then(setTotalPages);
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setDeleting(true);
    try {
      await api.delete(`/admin/users/${deletingId}`);
      toast.success("Admin deleted");
      load().then(setTotalPages);
    } catch {
      toast.error("Failed to delete admin");
    } finally {
      setDeleteConfirmOpen(false);
      setDeletingId(null);
      setDeleting(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  };

  const getInitials = (first, last) => {
    return `${first?.charAt(0) || ""}${last?.charAt(0) || ""}`.toUpperCase() || "?";
  };

  return (
    <ToastProvider>
      <ProtectedRoute allowedRoles={[ROLES.SUPERADMIN]} requiredPermissions={["admins:view"]}>
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-700 dark:text-gray-100">Manage Admins</h1>
              <p className="mt-1 text-sm text-gray-500">Create and manage admin accounts with granular permissions</p>
            </div>
            <button
              onClick={openCreate}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#0F766E] px-4 text-sm font-semibold text-white hover:bg-[#0F766E]/90 transition"
            >
              <Plus size={16} />
              Add Admin
            </button>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name or email…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 pl-9 pr-4 py-2 text-sm outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/10 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm outline-none focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E]/20 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 w-full sm:w-auto"
                >
                  <option value="">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                  <option value="blocked">Blocked</option>
                </select>
                <button
                  onClick={() => load(true)}
                  disabled={refreshing}
                  className="inline-flex h-10 items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                >
                  <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
                  Refresh
                </button>
              </div>
            </div>

            {loading ? (
              <SkeletonTable rows={6} cols={8} />
            ) : filteredAdmins.length === 0 ? (
              <div className="py-16 text-center">
                <UserCheck className="mx-auto text-gray-300" size={36} />
                <p className="mt-4 text-sm text-gray-500">No admins found</p>
                <button onClick={openCreate} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#0F766E] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0F766E]/90">
                  <Plus size={15} /> Add Admin
                </button>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[800px]">
                    <thead className="bg-gray-50 border-b border-gray-200 dark:bg-gray-700/50 dark:border-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Admin</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Phone</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden xl:table-cell">Permissions</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                      {filteredAdmins.map((admin) => (
                        <tr key={admin._id} className="hover:bg-gray-50/60 dark:hover:bg-gray-700/30 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-[#0F766E]/10 flex items-center justify-center text-[#0F766E] font-medium text-sm">
                                {getInitials(admin.first_name, admin.last_name)}
                              </div>
                               <div className="min-w-0">
                                 <p className="font-medium text-gray-900 dark:text-gray-100 truncate max-w-[120px] sm:max-w-[180px]">
                                   {admin.first_name} {admin.last_name}
                                 </p>
                                 <p className="text-xs text-gray-500 truncate max-w-[120px] sm:max-w-[180px]">ID: {admin._id?.slice(0, 8)}…</p>
                               </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300 hidden md:table-cell">
                            <div className="flex items-center gap-1.5">
                              <Mail size={12} className="text-gray-400" />
                              <span className="truncate max-w-[150px] sm:max-w-[200px] block">{admin.email}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300 hidden lg:table-cell">
                            {admin.phone ? (
                              <div className="flex items-center gap-1.5">
                                <Phone size={12} className="text-gray-400" />
                                {admin.phone}
                              </div>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <RoleBadge role={admin.role} />
                          </td>
                          <td className="px-6 py-4 hidden xl:table-cell">
                            <div className="flex flex-wrap gap-1">
                              {admin.permissions?.length ? (
                                admin.permissions.slice(0, 3).map((p) => (
                                  <span key={p} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                                    {p}
                                  </span>
                                ))
                              ) : (
                                <span className="text-xs text-gray-400">No permissions</span>
                              )}
                              {admin.permissions && admin.permissions.length > 3 && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                                  +{admin.permissions.length - 3} more
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <StatusBadge status={admin.status || "active"}  className="border border-gray-200"/>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">{formatDate(admin.created_at)}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => openEdit(admin)}
                                className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-[#0F766E] bg-[#0F766E]/5 border border-[#0F766E]/20 hover:bg-[#0F766E]/10 transition"
                                title="Edit admin"
                              >
                                <Edit size={14} />
                              </button>
                              <button
                                onClick={() => handleStatusToggle(admin)}
                                className={`inline-flex items-center justify-center w-8 h-8 rounded-lg transition ${
                                  admin.status === "active"
                                    ? "text-yellow-700 bg-yellow-50 border border-yellow-200 hover:bg-yellow-100"
                                    : "text-green-700 bg-green-50 border border-green-200 hover:bg-green-100"
                                }`}
                                title={admin.status === "active" ? "Suspend admin" : "Activate admin"}
                              >
                                {admin.status === "active" ? <Shield size={14} /> : <CheckCircle size={14} />}
                              </button>
                              <button
                                onClick={() => confirmDelete(admin)}
                                className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition"
                                title="Delete admin"
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

                {totalPages > 1 && (
                  <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4 dark:border-gray-700">
                    <p className="text-sm text-gray-500">
                      Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, (page - 1) * PAGE_SIZE + filteredAdmins.length)} of {filteredAdmins.length + (page - 1) * PAGE_SIZE}
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
              </>
            )}
          </div>

          {/* Create / Edit Modal */}
          {showModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
              <div className="w-full max-w-lg overflow-hidden rounded-xl bg-white dark:bg-gray-800">
                <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
                  <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                    {editingAdmin ? "Edit Admin" : "Add New Admin"}
                  </h2>
                  <button
                    onClick={() => { setShowModal(false); setEditingAdmin(null); }}
                    className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                    aria-label="Close"
                  >
                    <X size={18} />
                  </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4 p-6 max-h-[80vh] overflow-y-auto">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">First Name <span className="text-rose-500">*</span></label>
                      <input
                        type="text"
                        required
                        value={form.first_name}
                        onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))}
                        className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/10 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 ${formErrors.first_name ? "border-rose-500" : "border-gray-300"}`}
                        placeholder="John"
                        autoFocus
                      />
                      {formErrors.first_name && <p className="mt-1 text-sm text-rose-600">{formErrors.first_name}</p>}
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Last Name <span className="text-rose-500">*</span></label>
                      <input
                        type="text"
                        required
                        value={form.last_name}
                        onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))}
                        className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/10 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 ${formErrors.last_name ? "border-rose-500" : "border-gray-300"}`}
                        placeholder="Doe"
                      />
                      {formErrors.last_name && <p className="mt-1 text-sm text-rose-600">{formErrors.last_name}</p>}
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Email <span className="text-rose-500">*</span></label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                      className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/10 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 ${formErrors.email ? "border-rose-500" : "border-gray-300"}`}
                      placeholder="john.doe@example.com"
                    />
                    {formErrors.email && <p className="mt-1 text-sm text-rose-600">{formErrors.email}</p>}
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Phone</label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/10 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                  {!editingAdmin && (
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Password <span className="text-rose-500">*</span></label>
                      <input
                        type="password"
                        required
                        value={form.password}
                        onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                        className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/10 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 ${formErrors.password ? "border-rose-500" : "border-gray-300"}`}
                        placeholder="Min 8 characters"
                      />
                      {formErrors.password && <p className="mt-1 text-sm text-rose-600">{formErrors.password}</p>}
                    </div>
                  )}
                  {editingAdmin && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">Leave password blank to keep current password</p>
                  )}
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                    <select
                      value={form.status}
                      onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#0F766E] dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                    >
                      <option value="active">Active</option>
                      <option value="suspended">Suspended</option>
                      <option value="blocked">Blocked</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Permissions</label>
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 max-h-72 overflow-y-auto space-y-4">
                      {PERMISSION_GROUPS.map((group) => (
                        <div key={group.label}>
                          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">{group.label}</p>
                          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                            {group.perms.map((perm) => (
                              <PermissionCheckbox
                                key={perm}
                                label={perm.replace(/:/g, " ").replace(/_/g, " ")}
                                checked={form.permissions.includes(perm)}
                                onChange={(e) => {
                                  const perms = e.target.checked
                                    ? [...form.permissions, perm]
                                    : form.permissions.filter((p) => p !== perm);
                                  setForm((f) => ({ ...f, permissions: perms }));
                                }}
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                    <button
                      type="button"
                      onClick={() => { setShowModal(false); setEditingAdmin(null); }}
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
                      ) : editingAdmin ? (
                        "Save Changes"
                      ) : (
                        "Create Admin"
                      )}
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
            itemName={admins.find((a) => a._id === deletingId)?.first_name || "this admin"}
            loading={deleting}
          />
        </div>
      </ProtectedRoute>
    </ToastProvider>
  );
}