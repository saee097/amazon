"use client";

import ResourceManager from "@/components/admin/ResourceManager";

export default function AdminBanners() {
  return (
    <ResourceManager
      title="Banners"
      endpoint="/admin/banners"
      addLabel="Add Banner"
      emptyIcon="🖼️"
      emptyText="No banners found."
      searchKeys={["heading", "subheading"]}
      columns={[
        { key: "image", header: "Image", render: (i) => (
          i.image ? (
            <img src={i.image} alt={i.heading || "Banner"} className="h-12 w-20 object-cover rounded border border-gray-200" />
          ) : <span className="text-gray-300">—</span>
        ) },
        { key: "heading", header: "Heading" },
        { key: "subheading", header: "Subheading", render: (i) => i.subheading || "-" },
        { key: "link_url", header: "Link", render: (i) => i.link_url || "-" },
        { key: "sort_order", header: "Order" },
        { key: "status", header: "Status", render: (i) => (
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
            i.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-600"
          }`}>
            {i.status || "Inactive"}
          </span>
        ) },
        { key: "created_at", header: "Created", render: (i) => new Date(i.created_at).toLocaleDateString() },
      ]}
      fields={[
        { name: "heading", label: "Heading", type: "text", required: true },
        { name: "subheading", label: "Subheading", type: "text" },
        { name: "image", label: "Image URL", type: "text", required: true },
        { name: "link_url", label: "Link URL", type: "text" },
        { name: "sort_order", label: "Sort Order", type: "number", placeholder: "0" },
        { name: "status", label: "Status", type: "select", options: [
          { value: "active", label: "Active" },
          { value: "inactive", label: "Inactive" },
        ] },
      ]}
    />
  );
}