"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { ROLES } from "@/lib/rbac";
import {
  FiSearch,
  FiFilter,
  FiDownload,
  FiX,
  FiChevronLeft,
  FiChevronRight,
  FiEye,
  FiCalendar,
  FiUser,
  FiActivity,
} from "react-icons/fi";

export default function AdminLogsPage() {
  const router = useRouter();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedLog, setSelectedLog] = useState(null);
  const [filters, setFilters] = useState({
    user: "",
    action: "",
    module: "",
    startDate: "",
    endDate: "",
  });
  const [users, setUsers] = useState([]);

  useEffect(() => {
    loadLogs();
    loadUsers();
  }, [page]);

  useEffect(() => {
    setPage(1);
  }, [filters]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("page", page);
      params.append("limit", 20);
      if (filters.user) params.append("user", filters.user);
      if (filters.action) params.append("action", filters.action);
      if (filters.module) params.append("module", filters.module);
      if (filters.startDate) params.append("startDate", filters.startDate);
      if (filters.endDate) params.append("endDate", filters.endDate);

      const { data } = await api.get(`/admin/logs?${params.toString()}`);
      setLogs(data.data || []);
      setTotalPages(data.totalPages || 1);
    } catch {
      setError("Failed to load logs");
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const { data } = await api.get("/admin/users");
      setUsers(data.data || []);
    } catch {
      console.error("Failed to load users");
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    setPage(1);
    loadLogs();
  };

  const exportLogs = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.user) params.append("user", filters.user);
      if (filters.action) params.append("action", filters.action);
      if (filters.module) params.append("module", filters.module);
      if (filters.startDate) params.append("startDate", filters.startDate);
      if (filters.endDate) params.append("endDate", filters.endDate);

      const response = await api.get(`/admin/logs/export?${params.toString()}`, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `audit-logs-${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      setError("Failed to export logs");
    }
  };

  const getActionBadgeColor = (action) => {
    switch (action?.toLowerCase()) {
      case "create": return "bg-green-100 text-green-800";
      case "update":
      case "edit": return "bg-blue-100 text-blue-800";
      case "delete": return "bg-red-100 text-red-800";
      case "login": return "bg-purple-100 text-purple-800";
      case "logout": return "bg-gray-100 text-gray-800";
      default: return "bg-yellow-100 text-yellow-800";
    }
  };

  return (
    <div className="max-w-7xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Activity Logs</h1>
              <p className="text-sm text-gray-500 mt-1">Audit trail of all system activities</p>
            </div>
            <button
              onClick={exportLogs}
              className="inline-flex items-center px-4 py-2 bg-[#0F766E] text-white rounded-lg hover:bg-[#0F766E]/90 transition"
            >
              <FiDownload className="w-4 h-4 mr-2" />
              Export
            </button>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="relative">
                <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <select
                  value={filters.user}
                  onChange={(e) => handleFilterChange("user", e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-[#0F766E] dark:bg-gray-700 dark:text-gray-100"
                >
                  <option value="">All Users</option>
                  {users.map((u) => (
                    <option key={u._id} value={u._id}>{u.first_name} {u.last_name}</option>
                  ))}
                </select>
              </div>
              <div className="relative">
                <FiActivity className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <select
                  value={filters.action}
                  onChange={(e) => handleFilterChange("action", e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-[#0F766E] dark:bg-gray-700 dark:text-gray-100"
                >
                  <option value="">All Actions</option>
                  <option value="create">Create</option>
                  <option value="update">Update</option>
                  <option value="delete">Delete</option>
                  <option value="login">Login</option>
                  <option value="logout">Logout</option>
                </select>
              </div>
              <div className="relative">
                <FiFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Module..."
                  value={filters.module}
                  onChange={(e) => handleFilterChange("module", e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-[#0F766E] dark:bg-gray-700 dark:text-gray-100"
                />
              </div>
              <div className="relative">
                <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange("startDate", e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-[#0F766E] dark:bg-gray-700 dark:text-gray-100"
                />
              </div>
              <div className="relative">
                <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange("endDate", e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-[#0F766E] dark:bg-gray-700 dark:text-gray-100"
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={applyFilters}
                className="px-4 py-2 bg-[#0F766E] text-white rounded-lg text-sm hover:bg-[#0F766E]/90 transition"
              >
                Apply Filters
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            {loading ? (
              <div className="p-12 text-center">
                <div className="w-12 h-12 mx-auto rounded-full border-4 border-[#0F766E] border-t-transparent animate-spin"></div>
                <p className="mt-4 text-gray-600">Loading logs...</p>
              </div>
            ) : logs.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <FiActivity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No logs found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Action</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Module</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">IP Address</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Timestamp</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {logs.map((log) => (
                      <tr key={log._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionBadgeColor(log.action)}`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-200">{log.user?.name || log.user?.email || "System"}</td>
                        <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-200">{log.module || "-"}</td>
                        <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-200">{log.ipAddress || "-"}</td>
                        <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-200">
                          {log.createdAt ? new Date(log.createdAt).toLocaleString() : "-"}
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => setSelectedLog(log)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 text-[#0F766E]"
                          >
                            <FiEye className="w-4 h-4" />
                          </button>
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
                  className="flex items-center gap-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FiChevronLeft className="w-4 h-4" />
                  Previous
                </button>
                <span className="text-sm text-gray-600 dark:text-gray-300">Page {page} of {totalPages}</span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="flex items-center gap-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                  <FiChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {selectedLog && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 px-6 py-4">
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Log Details</h2>
                  <button
                    onClick={() => setSelectedLog(null)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl leading-none"
                  >
                    <FiX />
                  </button>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <p className="text-sm text-gray-500">Action</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{selectedLog.action}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">User</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{selectedLog.user?.name || selectedLog.user?.email || "System"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Module</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{selectedLog.module || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Timestamp</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{selectedLog.createdAt ? new Date(selectedLog.createdAt).toLocaleString() : "-"}</p>
                  </div>
                  {selectedLog.oldData && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Old Data</p>
                      <pre className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg text-xs overflow-x-auto text-gray-700 dark:text-gray-200">
                        {JSON.stringify(selectedLog.oldData, null, 2)}
                      </pre>
                    </div>
                  )}
                  {selectedLog.newData && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">New Data</p>
                      <pre className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg text-xs overflow-x-auto text-gray-700 dark:text-gray-200">
                        {JSON.stringify(selectedLog.newData, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
  );
}
