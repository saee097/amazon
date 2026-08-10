"use client";

import ResourceManager from "@/components/admin/ResourceManager";

const typeBadge = (type) => {
  const map = {
    info: "bg-blue-100 text-blue-800",
    success: "bg-green-100 text-green-800",
    warning: "bg-yellow-100 text-yellow-800",
    error: "bg-red-100 text-red-800",
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${map[type] || "bg-gray-100 text-gray-800"}`}>
      {type || "info"}
    </span>
  );
};

export default function AdminNotifications() {
  return (
    <ResourceManager
      title="Notifications"
      endpoint="/admin/notifications"
      addLabel="Add Notification"
      emptyIcon="🔔"
      emptyText="No notifications found."
      searchKeys={["title", "message", "recipient"]}
      columns={[
        { key: "title", header: "Title" },
        { key: "message", header: "Message", render: (n) => (n.message || "-").slice(0, 60) },
        { key: "type", header: "Type", render: (n) => typeBadge(n.type) },
        { key: "recipient", header: "Recipient", render: (n) => n.recipient || "All" },
        {
          key: "read",
          header: "Read",
          render: (n) =>
            n.read ? (
              <span className="text-green-600 text-sm">Yes</span>
            ) : (
              <span className="text-gray-400 text-sm">No</span>
            ),
        },
      ]}
      fields={[
        { name: "title", label: "Title", type: "text", required: true },
        { name: "message", label: "Message", type: "textarea" },
        {
          name: "type",
          label: "Type",
          type: "select",
          required: true,
          options: [
            { value: "info", label: "Info" },
            { value: "success", label: "Success" },
            { value: "warning", label: "Warning" },
            { value: "error", label: "Error" },
          ],
        },
        { name: "recipient", label: "Recipient (email, blank = all)", type: "email" },
        { name: "read", label: "Mark as read", type: "boolean" },
      ]}
    />
  );
}
