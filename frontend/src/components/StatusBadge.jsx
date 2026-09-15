"use client";

const STATUS_CONFIG = {
  ACTIVE: { label: "Active", bg: "bg-green-100", text: "text-green-800", dot: "bg-green-500", darkBg: "dark:bg-green-900/20", darkText: "dark:text-green-400", darkDot: "dark:bg-green-400" },
  SUSPENDED: { label: "Suspended", bg: "bg-yellow-100", text: "text-yellow-800", dot: "bg-yellow-500", darkBg: "dark:bg-yellow-900/20", darkText: "dark:text-yellow-400", darkDot: "dark:bg-yellow-400" },
  BLOCKED: { label: "Blocked", bg: "bg-red-100", text: "text-red-800", dot: "bg-red-500", darkBg: "dark:bg-red-900/20", darkText: "dark:text-red-400", darkDot: "dark:bg-red-400" },
  INACTIVE: { label: "Inactive", bg: "bg-gray-100", text: "text-gray-800", dot: "bg-gray-500", darkBg: "dark:bg-gray-700", darkText: "dark:text-gray-300", darkDot: "dark:bg-gray-400" },
  PENDING: { label: "Pending", bg: "bg-orange-100", text: "text-orange-800", dot: "bg-orange-500", darkBg: "dark:bg-orange-900/20", darkText: "dark:text-orange-400", darkDot: "dark:bg-orange-400" },
};

export default function StatusBadge({ status, className = "" }) {
  const normalized = String(status || "").toUpperCase();
  const config = STATUS_CONFIG[normalized] || {
    label: status || "Unknown",
    bg: "bg-gray-100",
    text: "text-gray-800",
    dot: "bg-gray-500",
    darkBg: "dark:bg-gray-700",
    darkText: "dark:text-gray-300",
    darkDot: "dark:bg-gray-400",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text} ${config.darkBg} ${config.darkText} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot} ${config.darkDot}`}></span>
      {config.label}
    </span>
  );
}
