"use client";

import ResourceManager from "@/components/admin/ResourceManager";

const ratingStars = (n) => "★".repeat(n) + "☆".repeat(5 - n);

export default function AdminReviews() {
  return (
    <ResourceManager
      title="Reviews"
      endpoint="/admin/reviews"
      disableCreate
      emptyIcon="💬"
      emptyText="No reviews found."
      searchKeys={["reviewText"]}
      columns={[
        {
          key: "customer",
          header: "Customer",
          render: (r) => r.customer?.email || "Unknown",
        },
        {
          key: "product",
          header: "Product",
          render: (r) => r.product?.title || "Unknown",
        },
        { key: "rating", header: "Rating", render: (r) => ratingStars(r.rating || 0) },
        {
          key: "reviewText",
          header: "Review",
          render: (r) => (r.reviewText || "-").slice(0, 60),
        },
      ]}
      fields={[
        {
          name: "rating",
          label: "Rating (1-5)",
          type: "number",
          required: true,
        },
        { name: "reviewText", label: "Review", type: "textarea" },
      ]}
    />
  );
}
