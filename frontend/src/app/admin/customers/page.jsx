"use client";

import ResourceManager from "@/components/admin/ResourceManager";

const statusBadge = (status) => {
  const map = {
    active: "bg-green-100 text-green-800",
    blocked: "bg-red-100 text-red-800",
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${map[status] || "bg-gray-100 text-gray-800"}`}>
      {status}
    </span>
  );
};

const roleBadge = (role) => (
  <span
    className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
      role === "admin" ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"
    }`}
  >
    {role}
  </span>
);

export default function AdminCustomers() {
  return (
    <ResourceManager
      title="Customers"
      endpoint="/admin/customers"
      disableCreate
      emptyIcon="👥"
      emptyText="No customers found."
      searchKeys={["first_name", "last_name", "email", "phone"]}
      columns={[
        {
          key: "name",
          header: "Name",
          render: (c) => `${c.first_name || ""} ${c.last_name || ""}`.trim() || "-",
        },
        { key: "email", header: "Email" },
        { key: "phone", header: "Phone", render: (c) => c.phone || "-" },
        { key: "role", header: "Role", render: (c) => roleBadge(c.role) },
        { key: "status", header: "Status", render: (c) => statusBadge(c.status) },
      ]}
      fields={[
        { name: "first_name", label: "First Name", type: "text", required: true },
        { name: "last_name", label: "Last Name", type: "text", required: true },
        { name: "email", label: "Email", type: "email", required: true },
        { name: "phone", label: "Phone", type: "text" },
        {
          name: "role",
          label: "Role",
          type: "select",
          required: true,
          options: [
            { value: "customer", label: "Customer" },
            { value: "admin", label: "Admin" },
          ],
        },
        {
          name: "status",
          label: "Status",
          type: "select",
          required: true,
          options: [
            { value: "active", label: "Active" },
            { value: "blocked", label: "Blocked" },
          ],
        },
      ]}
    />
  );
}
