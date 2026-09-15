"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { saveToken, saveRefreshToken, saveUser } from "@/lib/auth";
import { getRedirectPath } from "@/lib/rbac";

function GoogleCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");
    const refreshToken = searchParams.get("refreshToken");
    const userParam = searchParams.get("user");
    const errorParam = searchParams.get("error");

    if (errorParam) {
      setError(decodeURIComponent(errorParam));
      setTimeout(() => router.push("/auth/login"), 2000);
      return;
    }

    let user = null;
    if (userParam) {
      try {
        user = JSON.parse(decodeURIComponent(userParam));
      } catch {
        user = null;
      }
    }

    if (token && user) {
      saveToken(token);
      if (refreshToken) saveRefreshToken(refreshToken);
      saveUser(user);
      router.push(getRedirectPath(user.role));
      return;
    }

    setError("Authentication failed. No token received.");
    setTimeout(() => router.push("/auth/login"), 2000);
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md mx-auto text-center">
        {error ? (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-sm text-red-600 dark:text-red-400 font-medium">{error}</p>
            <p className="text-sm text-red-500 dark:text-red-400 mt-1">Redirecting to login...</p>
          </div>
        ) : (
          <>
            <div className="w-12 h-12 mx-auto rounded-full border-4 border-[#0F766E] border-t-transparent animate-spin"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-300">Signing you in with Google...</p>
          </>
        )}
      </div>
    </div>
  );
}

export default function GoogleCallbackWrapper() {
  return (
    <Suspense fallback={null}>
      <GoogleCallbackPage />
    </Suspense>
  );
}
