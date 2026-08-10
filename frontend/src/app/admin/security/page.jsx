"use client";

import { useEffect, useState } from "react";
import ResourceManager from "@/components/admin/ResourceManager";
import api from "@/lib/api";

function ActivityLogFeed() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get("/dashboard/activity").catch(() => ({ data: { data: [] } }));
        setLogs(data.data || []);
      } catch (error) {
        console.error("Failed to load activity logs:", error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h2>
      {loading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : logs.length === 0 ? (
        <p className="text-sm text-gray-500">No activity recorded yet.</p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {logs.map((log) => (
            <li key={log._id} className="py-3 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-gray-800">
                  <span className="font-medium">{log.entityName}</span> — {log.action}
                </p>
                <p className="text-xs text-gray-400">
                  {log.user?.email || "System"} · {new Date(log.timestamp).toLocaleString()}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function AdminSecurity() {
  return (
    <div className="space-y-6">
      <ResourceManager
        title="Security Settings"
        endpoint="/admin/security"
        addLabel="Add Setting"
        emptyIcon="🔐"
        emptyText="No security settings configured."
        searchKeys={["key", "description"]}
        columns={[
          { key: "key", header: "Key" },
          { key: "value", header: "Value", render: (s) => s.value || "-" },
          { key: "description", header: "Description", render: (s) => s.description || "-" },
        ]}
        fields={[
          { name: "key", label: "Key", type: "text", required: true },
          { name: "value", label: "Value", type: "text" },
          { name: "description", label: "Description", type: "textarea" },
        ]}
      />
      <ActivityLogFeed />
    </div>
  );
}
