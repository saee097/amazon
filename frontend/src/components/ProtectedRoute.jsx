"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import api from "@/lib/api";
import { getUser, getToken, removeToken } from "@/lib/auth";
import { ROLES, getAllowedRoutes } from "@/lib/rbac";

export default function ProtectedRoute({
  children,
  allowedRoles = [],
  requiredPermissions = [],
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);
  const redirectingRef = useRef(false);

  useEffect(() => {
    const checkAuth = async () => {
      if (redirectingRef.current) return;

      const token = getToken();
      const user = getUser();

      if (!token || !user) {
        redirectingRef.current = true;
        removeToken();
        router.push("/auth/login");
        return;
      }

      if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        redirectingRef.current = true;
        if (user.role === ROLES.USER) {
          router.push("/profile");
        } else if (user.role === ROLES.ADMIN) {
          router.push("/admin/dashboard");
        } else if (user.role === ROLES.SUPERADMIN) {
          router.push("/admin/superadmin");
        } else {
          router.push("/auth/login");
        }
        return;
      }

      if (requiredPermissions.length > 0) {
        const hasAccess = requiredPermissions.every((perm) =>
          user.permissions?.includes(perm) || user.role === ROLES.SUPERADMIN
        );

        if (!hasAccess) {
          redirectingRef.current = true;
          router.push("/unauthorized");
          return;
        }
      }

      try {
        const response = await api.get("/auth/verify");
        if (response.data.success) {
          setAuthorized(true);
        } else {
          redirectingRef.current = true;
          removeToken();
          router.push("/auth/login");
        }
      } catch {
        redirectingRef.current = true;
        removeToken();
        router.push("/auth/login");
      } finally {
        setChecking(false);
      }
    };

    checkAuth();
  }, [router, allowedRoles, requiredPermissions, pathname]);

  if (checking) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto rounded-full border-4 border-[#0F766E] border-t-transparent animate-spin"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  if (!authorized) {
    return null;
  }

  return children;
}
