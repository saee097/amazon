"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "@/components/admin/AdminLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import api from "@/lib/api";
import { ROLES } from "@/lib/rbac";
import {
  FiPlus,
  FiEdit,
  FiTrash2,
  FiX,
  FiSearch,
  FiFilter,
  FiSave,
  FiShield,
} from "react-icons/fi";

const MODULES = [
  { id: "dashboard", label: "Dashboard", perms: ["view"] },
  { id: "users", label: "Users", perms: ["view", "create", "edit", "delete"] },
  { id: "admins", label: "Admins", perms: ["view", "create", "edit", "delete"] },
  { id: "products", label: "Products", perms: ["view", "create", "edit", "delete"] },
  { id: "orders", label: "Orders", perms: ["view", "edit", "delete"] },
  { id: "categories", label: "Categories", perms: ["view", "create", "edit", "delete"] },
  { id: "inventory", label: "Inventory", perms: ["view", "edit"] },
  { id: "settings", label: "Settings", perms: ["view", "edit"] },
  { id: "logs", label: "Logs", perms: ["view", "export"] },
  { id: "analytics", label: "Analytics", perms: ["view"] },
  { id: "customers", label: "Customers", perms: ["view", "edit"] },
  { id: "vendors", label: "Vendors", perms: ["view", "edit"] },
  { id: "reports", label: "Reports", perms: ["view", "export"] },
];

export default function PermissionsPage() {
  const router = useRouter();
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPerm, setEditingPerm] = useState(null);
  const [activeModule, setActiveModule] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [form, setForm] = useState({ name: "", module: "", action: "", description: "" });
  const [error, setError] = useState("");

  useEffect(() => {
    loadPermissions();
  }, []);

  const loadPermissions = async () => {
    try {
      const { data } = await api.get("/admin/permissions");
      setPermissions(data.data || []);
    } catch {
      setError("Failed to load permissions");
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditingPerm(null);
    setForm({ name: "", module: "", action: "", description: "" });
    setShowModal(true);
  };

  const openEdit = (perm) => {
    setEditingPerm(perm);
    setForm({ name: perm.name, module: perm.module || "", action: perm.action || "", description: perm.description || "" });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingPerm) {
        await api.put(`/admin/permissions/${editingPerm._id}`, form);
      } else {
        await api.post("/admin/permissions", form);
      }
      setShowModal(false);
      loadPermissions();
    } catch {
      setError("Failed to save permission");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this permission?")) return;
    try {
      await api.delete(`/admin/permissions/${id}`);
      loadPermissions();
    } catch {
      setError("Failed to delete permission");
    }
  };

  const filteredPerms = permissions.filter((p) => {
    const matchesModule = activeModule === "all" || p.module === activeModule;
    const matchesSearch = p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesModule && matchesSearch;
  });

  const groupedByModule = filteredPerms.reduce((acc, perm) => {
    const mod = perm.module || "other";
    if (!acc[mod]) acc[mod] = [];
    acc[mod].push(perm);
    return acc;
  }, {});

  const getActionBadgeColor = (action) => {
    switch (action) {
      case "view": return "bg-blue-100 text-blue-800";
      case "create": return "bg-green-100 text-green-800";
      case "edit": return "bg-yellow-100 text-yellow-800";
      case "delete": return "bg-red-100 text-red-800";
      case "export": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.SUPERADMIN]} requiredPermissions={["permissions:view"]}>
      <AdminLayout>
        <div className="max-w-7xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Permissions</h1>
              <p className="text-sm text-gray-500 mt-1">Manage system permissions</p>
            </div>
            <button
              onClick={openCreate}
              className="inline-flex items-center px-4 py-2 bg-[#0F766E] text-white rounded-lg hover:bg-[#0F766E]/90 transition"
            >
              <FiPlus className="w-4 h-4 mr-2" />
              Add Permission
            </button>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl  border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search permissions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-[#0F766E] dark:bg-gray-700 dark:text-gray-100"
                />
              </div>
              <div className="flex gap-2 overflow-x-auto">
                <button
                  onClick={() => setActiveModule("all")}
                  className={`px-3 py-2 text-sm rounded-lg whitespace-nowrap ${
                    activeModule === "all" ? "bg-[#0F766E] text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200"
                  }`}
                >
                  All
                </button>
                {MODULES.map((mod) => (
                  <button
                    key={mod.id}
                    onClick={() => setActiveModule(mod.id)}
                    className={`px-3 py-2 text-sm rounded-lg whitespace-nowrap ${
                      activeModule === mod.id ? "bg-[#0F766E] text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200"
                    }`}
                  >
                    {mod.label}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="p-12 text-center">
                <div className="w-12 h-12 mx-auto rounded-full border-4 border-[#0F766E] border-t-transparent animate-spin"></div>
                <p className="mt-4 text-gray-600">Loading permissions...</p>
              </div>
            ) : Object.keys(groupedByModule).length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <FiShield className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No permissions found</p>
              </div>
            ) : (
              <div className="p-6 space-y-6">
                {Object.entries(groupedByModule).map(([module, perms]) => (
                  <div key={module}>
                    <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                      {module}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {perms.map((perm) => (
                        <div
                          key={perm._id}
                          className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
                        >
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{perm.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{perm.description || ""}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getActionBadgeColor(perm.action)}`}>
                              {perm.action}
                            </span>
                            <button
                              onClick={() => openEdit(perm)}
                              className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-[#0F766E]"
                            >
                              <FiEdit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(perm._id)}
                              className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-red-600"
                            >
                              <FiTrash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {showModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-6 py-4">
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                    {editingPerm ? `Edit Permission` : `Create Permission`}
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
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Permission Name</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      required
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 focus:outline-none focus:border-[#0F766E] dark:bg-gray-700 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Module</label>
                    <select
                      value={form.module}
                      onChange={(e) => setForm({ ...form, module: e.target.value })}
                      required
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 focus:outline-none focus:border-[#0F766E] dark:bg-gray-700 dark:text-gray-100"
                    >
                      <option value="">Select module</option>
                      {MODULES.map((mod) => (
                        <option key={mod.id} value={mod.id}>{mod.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Action</label>
                    <select
                      value={form.action}
                      onChange={(e) => setForm({ ...form, action: e.target.value })}
                      required
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 focus:outline-none focus:border-[#0F766E] dark:bg-gray-700 dark:text-gray-100"
                    >
                      <option value="">Select action</option>
                      <option value="view">View</option>
                      <option value="create">Create</option>
                      <option value="edit">Edit</option>
                      <option value="delete">Delete</option>
                      <option value="export">Export</option>
                    </select>
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
                      {editingPerm ? "Save Changes" : "Create Permission"}
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
