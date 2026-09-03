"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { ROLES } from "@/lib/rbac";
import RoleBadge from "@/components/RoleBadge";
import StatusBadge from "@/components/StatusBadge";
import {
  FiSearch,
  FiFilter,
  FiPlus,
  FiEdit,
  FiTrash2,
  FiX,
  FiChevronLeft,
  FiChevronRight,
  FiMoreVertical,
  FiCheck,
  FiXCircle,
  FiUserCheck,
} from "react-icons/fi";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showActionsMenu, setShowActionsMenu] = useState(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const roleOptions = [
    { value: "customer", label: "Customer" },
    { value: "admin", label: "Admin" },
    { value: "superadmin", label: "Super Admin" },
  ];

  const statusOptions = [
    { value: "active", label: "Active" },
    { value: "suspended", label: "Suspended" },
    { value: "blocked", label: "Blocked" },
    { value: "inactive", label: "Inactive" },
  ];

  useEffect(() => {
    const user = getUser();
    setIsSuperAdmin(user?.role === ROLES.SUPERADMIN);
    loadUsers();
  }, [page, roleFilter, statusFilter]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("page", page);
      params.append("limit", 20);
      if (searchQuery) params.append("search", searchQuery);
      if (roleFilter) params.append("role", roleFilter);
      if (statusFilter) params.append("status", statusFilter);

      const { data } = await api.get(`/admin/users?${params.toString()}`);
      setUsers(data.data || []);
      setTotalPages(data.totalPages || 1);
    } catch {
      setError("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      loadUsers();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const openCreate = () => {
    setEditingUser(null);
    setShowModal(true);
  };

  const openEdit = (user) => {
    setEditingUser(user);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await api.put(`/admin/users/${editingUser._id}`, editingUser);
        setSuccess("User updated successfully");
      } else {
        await api.post("/admin/users", editingUser);
        setSuccess("User created successfully");
      }
      setShowModal(false);
      setEditingUser(null);
      loadUsers();
    } catch {
      setError("Failed to save user");
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedUsers.length === 0) return;
    try {
      await api.post("/admin/users/bulk", { userIds: selectedUsers, action });
      setSuccess(`Users ${action}d successfully`);
      setSelectedUsers([]);
      loadUsers();
    } catch {
      setError("Bulk action failed");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      await api.delete(`/admin/users/${id}`);
      setSuccess("User deleted successfully");
      loadUsers();
    } catch {
      setError("Failed to delete user");
    }
  };

  const toggleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map((u) => u._id));
    }
  };

  const toggleSelectUser = (id) => {
    setSelectedUsers((prev) =>
      prev.includes(id) ? prev.filter((uid) => uid !== id) : [...prev, id]
    );
  };

  return (
    <div className="max-w-7xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{isSuperAdmin ? "All Users" : "Customers"}</h1>
              <p className="text-sm text-gray-500 mt-1">Manage users and their roles</p>
            </div>
            <button
              onClick={openCreate}
              className="inline-flex items-center px-4 py-2 bg-[#0F766E] text-white rounded-lg hover:bg-[#0F766E]/90 transition"
            >
              <FiPlus className="w-4 h-4 mr-2" />
              Add User
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
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-[#0F766E] dark:bg-gray-700 dark:text-gray-100"
                  />
                </div>
                <div className="flex gap-3">
                  <div className="relative">
                    <FiFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <select
                      value={roleFilter}
                      onChange={(e) => setRoleFilter(e.target.value)}
                      className="pl-10 pr-8 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-[#0F766E] dark:bg-gray-700 dark:text-gray-100"
                    >
                      <option value="">All Roles</option>
                      {isSuperAdmin && <option value="superadmin">Super Admin</option>}
                      <option value="admin">Admin</option>
                      <option value="customer">Customer</option>
                    </select>
                  </div>
                  <div className="relative">
                    <FiFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="pl-10 pr-8 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-[#0F766E] dark:bg-gray-700 dark:text-gray-100"
                    >
                      <option value="">All Status</option>
                      {statusOptions.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              {selectedUsers.length > 0 && (
                <div className="mt-4 flex items-center gap-3">
                  <span className="text-sm text-gray-600 dark:text-gray-300">{selectedUsers.length} selected</span>
                  <button
                    onClick={() => handleBulkAction("suspend")}
                    className="px-3 py-1.5 bg-yellow-100 text-yellow-800 rounded-lg text-sm hover:bg-yellow-200 transition"
                  >
                    Suspend
                  </button>
                  <button
                    onClick={() => handleBulkAction("activate")}
                    className="px-3 py-1.5 bg-green-100 text-green-800 rounded-lg text-sm hover:bg-green-200 transition"
                  >
                    Activate
                  </button>
                  <button
                    onClick={() => handleBulkAction("delete")}
                    className="px-3 py-1.5 bg-red-100 text-red-800 rounded-lg text-sm hover:bg-red-200 transition"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>

            {loading ? (
              <div className="p-12 text-center">
                <div className="w-12 h-12 mx-auto rounded-full border-4 border-[#0F766E] border-t-transparent animate-spin"></div>
                <p className="mt-4 text-gray-600">Loading users...</p>
              </div>
            ) : users.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <FiUserCheck className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No users found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                        <input
                          type="checkbox"
                          checked={selectedUsers.length === users.length}
                          onChange={toggleSelectAll}
                          className="w-4 h-4 text-[#0F766E] border-gray-300 rounded focus:ring-[#0F766E]"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Created</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {users.map((user) => (
                      <tr key={user._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={selectedUsers.includes(user._id)}
                            onChange={() => toggleSelectUser(user._id)}
                            className="w-4 h-4 text-[#0F766E] border-gray-300 rounded focus:ring-[#0F766E]"
                          />
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                          {user.first_name} {user.last_name}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{user.email}</td>
                        <td className="px-6 py-4">
                          <RoleBadge role={user.role} />
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={user.status || "active"} />
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                          {user.created_at ? new Date(user.created_at).toLocaleDateString() : "-"}
                        </td>
                        <td className="px-6 py-4 relative">
                          <button
                            onClick={() => setShowActionsMenu(showActionsMenu === user._id ? null : user._id)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300"
                          >
                            <FiMoreVertical className="w-4 h-4" />
                          </button>
                          {showActionsMenu === user._id && (
                            <div className="absolute right-0 mt-1 w-40 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 z-10">
                              <button
                                onClick={() => { openEdit(user); setShowActionsMenu(null); }}
                                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                              >
                                <FiEdit className="w-4 h-4" />
                                Edit
                              </button>
                              <button
                                onClick={() => { handleDelete(user._id); setShowActionsMenu(null); }}
                                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                              >
                                <FiTrash2 className="w-4 h-4" />
                                Delete
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex items-center gap-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                >
                  <FiChevronLeft className="w-4 h-4" />
                  Previous
                </button>
                <span className="text-sm text-gray-600 dark:text-gray-300">Page {page} of {totalPages}</span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="flex items-center gap-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                >
                  Next
                  <FiChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {showModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 px-6 py-4">
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                    {editingUser ? "Edit User" : "Add User"}
                  </h2>
                  <button
                    onClick={() => { setShowModal(false); setEditingUser(null); }}
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
                        value={editingUser?.first_name || ""}
                        onChange={(e) => setEditingUser({ ...editingUser, first_name: e.target.value })}
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 focus:outline-none focus:border-[#0F766E] dark:bg-gray-700 dark:text-gray-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Last Name</label>
                      <input
                        type="text"
                        required
                        value={editingUser?.last_name || ""}
                        onChange={(e) => setEditingUser({ ...editingUser, last_name: e.target.value })}
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 focus:outline-none focus:border-[#0F766E] dark:bg-gray-700 dark:text-gray-100"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Email</label>
                    <input
                      type="email"
                      required
                      value={editingUser?.email || ""}
                      onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 focus:outline-none focus:border-[#0F766E] dark:bg-gray-700 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={editingUser?.phone || ""}
                      onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 focus:outline-none focus:border-[#0F766E] dark:bg-gray-700 dark:text-gray-100"
                    />
                  </div>
                  {isSuperAdmin && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Role</label>
                      <select
                        value={editingUser?.role || "customer"}
                        onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 focus:outline-none focus:border-[#0F766E] dark:bg-gray-700 dark:text-gray-100"
                      >
                        {roleOptions.map((r) => (
                          <option key={r.value} value={r.value}>{r.label}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Status</label>
                    <select
                      value={editingUser?.status || "active"}
                      onChange={(e) => setEditingUser({ ...editingUser, status: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 focus:outline-none focus:border-[#0F766E] dark:bg-gray-700 dark:text-gray-100"
                    >
                      {statusOptions.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex justify-end gap-4 pt-2">
                    <button
                      type="button"
                      onClick={() => { setShowModal(false); setEditingUser(null); }}
                      className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-[#0F766E] text-white rounded-lg hover:bg-[#0F766E]/90"
                    >
                      {editingUser ? "Save Changes" : "Create User"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
  );
}

function getUser() {
  if (typeof window === "undefined") return null;
  return JSON.parse(localStorage.getItem("authUser") || "null");
}
