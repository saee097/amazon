"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
  FiFilter,
  FiSave,
  FiShield,
  FiUsers,
  FiSettings,
} from "react-icons/fi";
import { SkeletonTable } from "@/components/ui/skeleton";

export default function RolesPage() {
  const router = useRouter();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [form, setForm] = useState({ name: "", description: "", permissions: [] });
  const [error, setError] = useState("");

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      const { data } = await api.get("/admin/roles");
      setRoles(data.data || []);
    } catch (err) {
      setError("Failed to load roles");
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditingRole(null);
    setForm({ name: "", description: "", permissions: [] });
    setShowModal(true);
  };

  const openEdit = (role) => {
    setEditingRole(role);
    setForm({ name: role.name, description: role.description || "", permissions: role.permissions || [] });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingRole) {
        await api.put(`/admin/roles/${editingRole._id}`, form);
      } else {
        await api.post("/admin/roles", form);
      }
      setShowModal(false);
      loadRoles();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to save role");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this role? This action cannot be undone.")) return;
    try {
      await api.delete(`/admin/roles/${id}`);
      loadRoles();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to delete role");
    }
  };

  const filteredRoles = roles.filter((r) =>
    r.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const systemRoles = ["superadmin", "admin", "customer"];
  const isSystemRole = (name) => systemRoles.includes(name.toLowerCase());

  return (
    <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.SUPERADMIN]} requiredPermissions={["roles:view"]}>
      <AdminLayout>
        <div className="max-w-7xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Roles Management</h1>
              <p className="text-sm text-gray-500 mt-1">Create and manage user roles with specific permissions</p>
            </div>
            <button
              onClick={openCreate}
              className="inline-flex items-center px-4 py-2 bg-[#0F766E] text-white rounded-lg hover:bg-[#0F766E]/90 transition"
            >
              <FiPlus className="w-4 h-4 mr-2" />
              Create Role
            </button>
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          <div className="bg-white dark:bg-gray-800 rounded-xl  border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search roles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-[#0F766E] dark:bg-gray-700 dark:text-gray-100"
                />
              </div>
            </div>

            {loading ? (
              <div className="p-6" role="status" aria-busy="true">
                <span className="sr-only">Loading…</span>
                <SkeletonTable rows={5} cols={5} className="rounded-none border-0" />
              </div>
            ) : filteredRoles.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <FiShield className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No roles found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Role Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Description</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Permissions</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Users</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredRoles.map((role) => (
                      <tr key={role._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900 dark:text-gray-100">{role.name}</span>
                            {isSystemRole(role.name) && (
                              <span className="text-xs bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full">System</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{role.description || "-"}</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {role.permissions?.length || 0} permissions
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{role.usersCount || 0}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => openEdit(role)}
                              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 text-[#0F766E]"
                            >
                              <FiEdit className="w-4 h-4" />
                            </button>
                            {!isSystemRole(role.name) && (
                              <button
                                onClick={() => handleDelete(role._id)}
                                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 text-red-600"
                              >
                                <FiTrash2 className="w-4 h-4" />
                              </button>
                            )}
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
                <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-6 py-4">
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                    {editingRole ? `Edit Role` : `Create Role`}
                  </h2>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl leading-none"
                  >
                    <FiX />
                  </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Role Name</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      required
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 focus:outline-none focus:border-[#0F766E] dark:bg-gray-700 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Description</label>
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      rows={3}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 focus:outline-none focus:border-[#0F766E] dark:bg-gray-700 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Permissions</label>
                    <div className="max-h-64 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3">
                      {[
                        { label: "Dashboard", perms: ["dashboard:view"] },
                        { label: "Users", perms: ["users:view", "users:create", "users:edit", "users:delete"] },
                        { label: "Admins", perms: ["admins:view", "admins:create", "admins:edit", "admins:delete"] },
                        { label: "Products", perms: ["products:view", "products:create", "products:edit", "products:delete"] },
                        { label: "Orders", perms: ["orders:view", "orders:edit", "orders:delete"] },
                        { label: "Categories", perms: ["categories:view", "categories:create", "categories:edit", "categories:delete"] },
                        { label: "Settings", perms: ["settings:view", "settings:edit"] },
                        { label: "Logs", perms: ["logs:view", "logs:export"] },
                      ].map((group) => (
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
                      onClick={() => setShowModal(false)}
                      className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-[#0F766E] text-white rounded-lg hover:bg-[#0F766E]/90"
                    >
                      {editingRole ? "Save Changes" : "Create Role"}
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
