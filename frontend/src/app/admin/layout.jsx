"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import AdminLayout from "@/components/admin/AdminLayout";
import { getUser, getToken, removeToken } from "@/lib/auth";
import { ROLES } from "@/lib/rbac";

export default function AdminLayoutWrapper({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = getUser();
    const token = getToken();

    if (!token || !user || (user.role !== ROLES.ADMIN && user.role !== ROLES.SUPERADMIN)) {
      removeToken();
      router.push("/auth/login");
      return;
    }

    setAuthorized(true);
    setLoading(false);
  }, [router, pathname]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto rounded-full border-4 border-[#0F766E] border-t-transparent animate-spin" />
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">Loading workspace…</p>
        </div>
      </div>
    );
  }

  if (!authorized) return null;

  return <AdminLayout>{children}</AdminLayout>;
}
