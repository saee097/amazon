"use client";

import { FiInfo } from "react-icons/fi";
import { ROLES, getRoleDisplayName } from "@/lib/rbac";

const ROLE_COLORS = {
  [ROLES.SUPERADMIN]: {
    bg: "bg-purple-100",
    text: "text-purple-800",
    border: "border-purple-200",
    dot: "bg-purple-500",
  },
  [ROLES.ADMIN]: {
    bg: "bg-blue-100",
    text: "text-blue-800",
    border: "border-blue-200",
    dot: "bg-blue-500",
  },
  [ROLES.USER]: {
    bg: "bg-gray-100",
    text: "text-gray-800",
    border: "border-gray-200",
    dot: "bg-gray-500",
  },
};

export default function RoleBadge({ role, className = "" }) {
  const colors = ROLE_COLORS[role] || ROLE_COLORS[ROLES.USER];
  const displayName = getRoleDisplayName(role);

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${colors.bg} ${colors.text} ${colors.border} ${className}`}
      title={displayName}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`}></span>
      {displayName}
    </span>
  );
}
