"use client";

import ResourceManager from "@/components/admin/ResourceManager";

export default function AdminCollections() {
  return (
    <ResourceManager
      title="Collections"
      endpoint="/admin/collections"
      addLabel="Add Collection"
      emptyIcon="⭐"
      emptyText="No collections found."
      searchKeys={["collectionName", "description"]}
      columns={[
        { key: "collectionName", header: "Name" },
        { key: "description", header: "Description", render: (i) => i.description || "-" },
        {
          key: "created_at",
          header: "Created",
          render: (i) => new Date(i.created_at).toLocaleDateString(),
        },
      ]}
      fields={[
        { name: "collectionName", label: "Collection Name", type: "text", required: true },
        { name: "description", label: "Description", type: "textarea" },
      ]}
    />
  );
}
