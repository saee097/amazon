"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import AdminLayout from "@/components/admin/AdminLayout";
import { AdminPageSkeleton } from "@/components/ui/skeleton";
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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <AdminPageSkeleton variant="stats" className="mx-auto max-w-7xl px-6 py-10" />
      </div>
    );
  }

  if (!authorized) return null;

  return <AdminLayout>{children}</AdminLayout>;
}
