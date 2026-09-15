"use client";

import { FiInfo } from "react-icons/fi";
import { ROLES, getRoleDisplayName } from "@/lib/rbac";

const ROLE_COLORS = {
  [ROLES.SUPERADMIN]: {
    bg: "bg-purple-100",
    text: "text-purple-800",
    border: "border-purple-200",
    dot: "bg-purple-500",
    darkBg: "dark:bg-purple-900/20",
    darkText: "dark:text-purple-400",
    darkBorder: "dark:border-purple-800",
    darkDot: "dark:bg-purple-400",
  },
  [ROLES.ADMIN]: {
    bg: "bg-blue-100",
    text: "text-blue-800",
    border: "border-blue-200",
    dot: "bg-blue-500",
    darkBg: "dark:bg-blue-900/20",
    darkText: "dark:text-blue-400",
    darkBorder: "dark:border-blue-800",
    darkDot: "dark:bg-blue-400",
  },
  [ROLES.USER]: {
    bg: "bg-gray-100",
    text: "text-gray-800",
    border: "border-gray-200",
    dot: "bg-gray-500",
    darkBg: "dark:bg-gray-700",
    darkText: "dark:text-gray-300",
    darkBorder: "dark:border-gray-600",
    darkDot: "dark:bg-gray-400",
  },
};

export default function RoleBadge({ role, className = "" }) {
  const colors = ROLE_COLORS[role] || ROLE_COLORS[ROLES.USER];
  const displayName = getRoleDisplayName(role);

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${colors.bg} ${colors.text} ${colors.border} ${colors.darkBg} ${colors.darkText} ${colors.darkBorder} ${className}`}
      title={displayName}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${colors.dot} ${colors.darkDot}`}></span>
      {displayName}
    </span>
  );
}
