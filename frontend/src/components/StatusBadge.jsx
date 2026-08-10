"use client";

const STATUS_CONFIG = {
  ACTIVE: { label: "Active", bg: "bg-green-100", text: "text-green-800", dot: "bg-green-500" },
  SUSPENDED: { label: "Suspended", bg: "bg-yellow-100", text: "text-yellow-800", dot: "bg-yellow-500" },
  BLOCKED: { label: "Blocked", bg: "bg-red-100", text: "text-red-800", dot: "bg-red-500" },
  INACTIVE: { label: "Inactive", bg: "bg-gray-100", text: "text-gray-800", dot: "bg-gray-500" },
  PENDING: { label: "Pending", bg: "bg-orange-100", text: "text-orange-800", dot: "bg-orange-500" },
};

export default function StatusBadge({ status, className = "" }) {
  const normalized = String(status || "").toUpperCase();
  const config = STATUS_CONFIG[normalized] || {
    label: status || "Unknown",
    bg: "bg-gray-100",
    text: "text-gray-800",
    dot: "bg-gray-500",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`}></span>
      {config.label}
    </span>
  );
}
