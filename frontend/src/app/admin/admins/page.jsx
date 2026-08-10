"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import api from "@/lib/api";
import { ROLES } from "@/lib/rbac";
import RoleBadge from "@/components/RoleBadge";
import StatusBadge from "@/components/StatusBadge";
import {
  FiPlus,
  FiEdit,
  FiTrash2,
  FiX,
  FiSearch,
  FiShield,
  FiUserCheck,
  FiMoreVertical,
} from "react-icons/fi";

export default function ManageAdmins() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    password: "",
    status: "active",
    permissions: [],
  });

  const permissionGroups = [
    { label: "Dashboard", perms: ["dashboard:view"] },
    { label: "Users", perms: ["users:view", "users:create", "users:edit", "users:delete"] },
    { label: "Products", perms: ["products:view", "products:create", "products:edit", "products:delete"] },
    { label: "Orders", perms: ["orders:view", "orders:edit", "orders:delete"] },
    { label: "Categories", perms: ["categories:view", "categories:create", "categories:edit", "categories:delete"] },
    { label: "Settings", perms: ["settings:view", "settings:edit"] },
    { label: "Logs", perms: ["logs:view", "logs:export"] },
  ];

  useEffect(() => {
    loadAdmins();
  }, []);

  const loadAdmins = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/users", {
        params: { search: searchQuery, role: "admin" },
      });
      setAdmins(data.data || []);
    } catch {
      setError("Failed to load admins");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(loadAdmins, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const openCreate = () => {
    setEditingAdmin(null);
    setForm({ first_name: "", last_name: "", email: "", phone: "", password: "", status: "active", permissions: [] });
    setShowModal(true);
  };

  const openEdit = (admin) => {
    setEditingAdmin(admin);
    setForm({
      first_name: admin.first_name,
      last_name: admin.last_name,
      email: admin.email,
      phone: admin.phone || "",
      password: "",
      status: admin.status || "active",
      permissions: admin.permissions || [],
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingAdmin) {
        await api.put(`/admin/users/${editingAdmin._id}`, form);
        setSuccess("Admin updated successfully");
      } else {
        await api.post("/admin/users", { ...form, role: "admin" });
        setSuccess("Admin created successfully");
      }
      setShowModal(false);
      setEditingAdmin(null);
      setForm({ first_name: "", last_name: "", email: "", phone: "", password: "", status: "active", permissions: [] });
      loadAdmins();
    } catch {
      setError("Failed to save admin");
    }
  };

  const handleStatusToggle = async (id, currentStatus) => {
    try {
      await api.put(`/admin/users/${id}`, { status: currentStatus === "active" ? "blocked" : "active" });
      setSuccess("Admin status updated");
      loadAdmins();
    } catch {
      setError("Failed to update status");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this admin?")) return;
    try {
      await api.delete(`/admin/users/${id}`);
      setSuccess("Admin deleted successfully");
      loadAdmins();
    } catch {
      setError("Failed to delete admin");
    }
  };

  return (
    <ProtectedRoute allowedRoles={[ROLES.SUPERADMIN]} requiredPermissions={["admins:view"]}>
      <AdminLayout>
        <div className="max-w-7xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Manage Admins</h1>
              <p className="text-sm text-gray-500 mt-1">Create and manage admin accounts with specific permissions</p>
            </div>
            <button
              onClick={openCreate}
              className="inline-flex items-center px-4 py-2 bg-[#0F766E] text-white rounded-lg hover:bg-[#0F766E]/90 transition"
            >
              <FiPlus className="w-4 h-4 mr-2" />
              Add Admin
            </button>
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 text-green-700 border border-green-200 rounded-lg px-4 py-3">
              {success}
            </div>
          )}

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search admins..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-[#0F766E] dark:bg-gray-700 dark:text-gray-100"
                />
              </div>
            </div>

            {loading ? (
              <div className="p-12 text-center">
                <div className="w-12 h-12 mx-auto rounded-full border-4 border-[#0F766E] border-t-transparent animate-spin"></div>
                <p className="mt-4 text-gray-600">Loading admins...</p>
              </div>
            ) : admins.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <FiUserCheck className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No admins found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Permissions</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {admins.map((admin) => (
                      <tr key={admin._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                          {admin.first_name} {admin.last_name}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{admin.email}</td>
                        <td className="px-6 py-4">
                          <RoleBadge role={admin.role} />
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-600 dark:text-gray-300">{admin.permissions?.length || 0} permissions</span>
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={admin.status || "active"} />
                        </td>
                        <td className="px-6 py-4 relative">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => openEdit(admin)}
                              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 text-[#0F766E]"
                            >
                              <FiEdit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleStatusToggle(admin._id, admin.status)}
                              className={`px-2 py-1 rounded-lg text-xs font-medium ${
                                admin.status === "active"
                                  ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                                  : "bg-green-100 text-green-800 hover:bg-green-200"
                              }`}
                            >
                              {admin.status === "active" ? "Suspend" : "Activate"}
                            </button>
                            <button
                              onClick={() => handleDelete(admin._id)}
                              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 text-red-600"
                            >
                              <FiTrash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {showModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 px-6 py-4">
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                    {editingAdmin ? "Edit Admin" : "Add New Admin"}
                  </h2>
                  <button
                    onClick={() => { setShowModal(false); setEditingAdmin(null); }}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl leading-none"
                  >
                    <FiX />
                  </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">First Name</label>
                      <input
                        type="text"
                        required
                        value={form.first_name}
                        onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 focus:outline-none focus:border-[#0F766E] dark:bg-gray-700 dark:text-gray-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Last Name</label>
                      <input
                        type="text"
                        required
                        value={form.last_name}
                        onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 focus:outline-none focus:border-[#0F766E] dark:bg-gray-700 dark:text-gray-100"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Email</label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 focus:outline-none focus:border-[#0F766E] dark:bg-gray-700 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 focus:outline-none focus:border-[#0F766E] dark:bg-gray-700 dark:text-gray-100"
                    />
                  </div>
                  {!editingAdmin && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Password</label>
                      <input
                        type="password"
                        required={!editingAdmin}
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 focus:outline-none focus:border-[#0F766E] dark:bg-gray-700 dark:text-gray-100"
                      />
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Status</label>
                    <select
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 focus:outline-none focus:border-[#0F766E] dark:bg-gray-700 dark:text-gray-100"
                    >
                      <option value="active">Active</option>
                      <option value="suspended">Suspended</option>
                      <option value="blocked">Blocked</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Permissions</label>
                    <div className="max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3">
                      {permissionGroups.map((group) => (
                        <div key={group.label}>
                          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">{group.label}</p>
                          <div className="grid grid-cols-2 gap-2">
                            {group.perms.map((perm) => (
                              <label key={perm} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                                <input
                                  type="checkbox"
                                  checked={form.permissions.includes(perm)}
                                  onChange={(e) => {
                                    const perms = e.target.checked
                                      ? [...form.permissions, perm]
                                      : form.permissions.filter((p) => p !== perm);
                                    setForm({ ...form, permissions: perms });
                                  }}
                                  className="w-4 h-4 text-[#0F766E] border-gray-300 rounded focus:ring-[#0F766E]"
                                />
                                {perm}
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-end gap-4 pt-2">
                    <button
                      type="button"
                      onClick={() => { setShowModal(false); setEditingAdmin(null); }}
                      className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-[#0F766E] text-white rounded-lg hover:bg-[#0F766E]/90"
                    >
                      {editingAdmin ? "Save Changes" : "Create Admin"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}
