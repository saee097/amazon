"use client";

import ResourceManager from "@/components/admin/ResourceManager";

const statusBadge = (status) => {
  const map = {
    active: "bg-green-100 text-green-800",
    pending: "bg-yellow-100 text-yellow-800",
    suspended: "bg-red-100 text-red-800",
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${map[status] || "bg-gray-100 text-gray-800"}`}>
      {status}
    </span>
  );
};

export default function AdminVendors() {
  return (
    <ResourceManager
      title="Vendors"
      endpoint="/admin/vendors"
      addLabel="Add Vendor"
      emptyIcon="🏪"
      emptyText="No vendors found."
      searchKeys={["vendorName", "contactEmail", "phone"]}
      columns={[
        { key: "vendorName", header: "Name" },
        { key: "contactEmail", header: "Email", render: (v) => v.contactEmail || "-" },
        { key: "phone", header: "Phone", render: (v) => v.phone || "-" },
        {
          key: "commissionRate",
          header: "Commission",
          render: (v) => `${v.commissionRate ?? 0}%`,
        },
        { key: "status", header: "Status", render: (v) => statusBadge(v.status) },
      ]}
      fields={[
        { name: "vendorName", label: "Vendor Name", type: "text", required: true },
        { name: "contactEmail", label: "Contact Email", type: "email" },
        { name: "phone", label: "Phone", type: "text" },
        {
          name: "status",
          label: "Status",
          type: "select",
          required: true,
          options: [
            { value: "pending", label: "Pending" },
            { value: "active", label: "Active" },
            { value: "suspended", label: "Suspended" },
          ],
        },
        { name: "commissionRate", label: "Commission Rate (%)", type: "number" },
      ]}
    />
  );
}
