"use client";

import ResourceManager from "@/components/admin/ResourceManager";

const statusBadge = (status) => {
  const map = {
    open: "bg-blue-100 text-blue-800",
    pending: "bg-yellow-100 text-yellow-800",
    resolved: "bg-green-100 text-green-800",
    closed: "bg-gray-100 text-gray-800",
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${map[status] || "bg-gray-100 text-gray-800"}`}>
      {status}
    </span>
  );
};

export default function AdminSupport() {
  return (
    <ResourceManager
      title="Support Tickets"
      endpoint="/admin/support"
      addLabel="Add Ticket"
      emptyIcon="🎧"
      emptyText="No support tickets found."
      searchKeys={["subject", "customerEmail", "message"]}
      columns={[
        { key: "subject", header: "Subject" },
        { key: "customerEmail", header: "Customer", render: (t) => t.customerEmail || "-" },
        { key: "status", header: "Status", render: (t) => statusBadge(t.status) },
        { key: "priority", header: "Priority", render: (t) => t.priority || "-" },
      ]}
      fields={[
        { name: "subject", label: "Subject", type: "text", required: true },
        { name: "customerEmail", label: "Customer Email", type: "email" },
        { name: "message", label: "Message", type: "textarea", required: true },
        {
          name: "status",
          label: "Status",
          type: "select",
          required: true,
          options: [
            { value: "open", label: "Open" },
            { value: "pending", label: "Pending" },
            { value: "resolved", label: "Resolved" },
            { value: "closed", label: "Closed" },
          ],
        },
        {
          name: "priority",
          label: "Priority",
          type: "select",
          options: [
            { value: "low", label: "Low" },
            { value: "medium", label: "Medium" },
            { value: "high", label: "High" },
          ],
        },
      ]}
    />
  );
}
