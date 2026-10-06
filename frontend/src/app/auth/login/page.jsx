"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import api from "@/lib/api";
import { saveToken, saveRefreshToken, saveUser, isLoggedIn, getUserRole } from "@/lib/auth";
import { getRedirectPath } from "@/lib/rbac";

const GOOGLE_ENABLED = process.env.NEXT_PUBLIC_GOOGLE_ENABLED === "true";
const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const DEMO_ACCOUNTS = [
  {
    role: "Super Admin",
    email: "superadmin@amazonstore.com",
    password: "Super@123456",
    redirect: "/admin/superadmin",
    accent: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
    dot: "bg-rose-500",
  },
  {
    role: "Admin",
    email: "admin@amazonstore.com",
    password: "Admin@123456",
    redirect: "/admin/dashboard",
    accent: "bg-violet-50 text-violet-700 ring-1 ring-violet-200",
    dot: "bg-violet-500",
  },
  {
    role: "Customer",
    email: "customer@amazonstore.com",
    password: "Customer@123456",
    redirect: "/",
    accent: "bg-sky-50 text-sky-700 ring-1 ring-sky-200",
    dot: "bg-sky-500",
  },
];

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [form, setForm] = useState({
    email: searchParams?.get("email") || "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState("");
  const [locked, setLocked] = useState(false);
  const [rateLimited, setRateLimited] = useState(false);
  const redirectedRef = useRef(false);

  useEffect(() => {
    if (searchParams?.get("registered") === "true") {
      setSuccess("Account created! You can sign in now.");
    }
    // If already logged in redirect immediately
    if (isLoggedIn() && !redirectedRef.current) {
      redirectedRef.current = true;
      router.replace(getRedirectPath(getUserRole()));
    }
  }, [router, searchParams]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "", submit: "" }));
    setRateLimited(false);
  };

  const fillDemo = (acct) => {
    setForm({ email: acct.email, password: acct.password });
    setErrors({});
    setRateLimited(false);
    setLocked(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Client-side validation
    const newErrors = {};
    if (!form.email) newErrors.email = "Email is required";
    else if (!validateEmail(form.email)) newErrors.email = "Enter a valid email address";
    if (!form.password) newErrors.password = "Password is required";
    if (Object.keys(newErrors).length) { setErrors(newErrors); return; }

    setLoading(true);
    setErrors({});

    try {
      const { data } = await api.post("/auth/login", {
        email: form.email,
        password: form.password,
        remember: rememberMe,
      });

      // Persist auth state
      const token = data.token || data.accessToken;
      const refreshToken = data.refreshToken || data.refresh_token;
      const user = data.customer || data.user;

      saveToken(token);
      if (refreshToken) saveRefreshToken(refreshToken);
      saveUser(user);

      // Role-based redirect
      const role = user?.role;
      if (role === "admin" || role === "superadmin") {
        router.replace(role === "superadmin" ? "/admin/superadmin" : "/admin/dashboard");
      } else {
        router.replace("/");
      }
    } catch (err) {
      const message = err?.response?.data?.message || "Login failed. Please try again.";
      const lower = message.toLowerCase();

      if (lower.includes("rate limit") || lower.includes("too many")) {
        setRateLimited(true);
      } else if (lower.includes("locked") || lower.includes("suspended") || lower.includes("blocked")) {
        setLocked(true);
      }
      setErrors({ submit: message });
    } finally {
      setLoading(false);
    }
  };

  const isValid = form.email && form.password && validateEmail(form.email);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-emerald-50/40 dark:from-gray-900 dark:via-gray-800 dark:to-emerald-900/30 flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">

        {/* Brand */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-13 w-13 items-center justify-center rounded-xl bg-gradient-to-br from-[#0F766E] to-[#0d5e58] text-white" style={{height:52,width:52}}>
            <svg className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <path d="M3 3h2l.4 2M7 13h10l4-8H5.4" />
              <circle cx="9" cy="20" r="1.5" /><circle cx="18" cy="20" r="1.5" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Welcome back</h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Sign in to your account</p>
        </div>

        {/* Card */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-8">

          {/* Alerts */}
          {success && (
            <div className="mb-5 flex items-start gap-2 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 px-4 py-3 text-sm text-emerald-800 dark:text-emerald-300">
              <svg className="mt-0.5 h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
              {success}
            </div>
          )}

          {locked && (
            <div className="mb-5 rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-900/20 px-4 py-3 text-sm text-rose-800 dark:text-rose-300">
              <p className="font-semibold">Account locked</p>
              <p className="mt-0.5">Please contact support or try again later.</p>
            </div>
          )}

          {rateLimited && (
            <div className="mb-5 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 px-4 py-3 text-sm text-amber-900 dark:text-amber-300">
              <p className="font-semibold">Too many attempts</p>
              <p className="mt-0.5">Please wait a few minutes then try again, or use a demo account below.</p>
            </div>
          )}

          {errors.submit && !locked && !rateLimited && (
            <div className="mb-5 rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-900/20 px-4 py-3 text-sm text-rose-700 dark:text-rose-300">
              {errors.submit}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
                            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Email address</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                autoComplete="email"
                className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition ${
                  errors.email
                    ? "border-rose-300 focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
                    : "border-gray-300 dark:border-gray-600 focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/10 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                }`}
              />
              {errors.email && <p className="mt-1 text-xs text-rose-600">
{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
                <a href="/auth/forgot-password" className="text-xs font-medium text-[#0F766E] hover:underline">
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className={`w-full rounded-xl border px-4 py-3 pr-12 text-sm outline-none transition ${
                    errors.password
                      ? "border-rose-300 focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
                      : "border-gray-300 dark:border-gray-600 focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/10 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9-7 1.732-4.057 6.522-7 9-7M6.375 6.375l11.25 11.25"/></svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9 7-1.274 4.057-5.064 7-9 7-4.477 0-8.268-2.943-9-7z"/></svg>
                  )}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-rose-600">{errors.password}</p>}
            </div>

            {/* Remember me */}
             <label className="flex cursor-pointer items-center gap-2">
               <input
                 type="checkbox"
                 checked={rememberMe}
                 onChange={(e) => setRememberMe(e.target.checked)}
                 className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-[#0F766E] focus:ring-[#0F766E]"
               />
               <span className="text-sm text-gray-600 dark:text-gray-400">Remember me</span>
             </label>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !isValid}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0F766E] py-3.5 text-sm font-semibold text-white transition hover:bg-[#0d5e58] focus:outline-none focus:ring-2 focus:ring-[#0F766E] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading && (
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25"/>
                  <path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                </svg>
              )}
              {loading ? "Signing in…" : "Sign in"}
            </button>

            {/* Google */}
            {GOOGLE_ENABLED && (
              <>
            <div className="relative my-2">
                   <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200 dark:border-gray-700"/></div>
                   <div className="relative flex justify-center text-xs"><span className="bg-white dark:bg-gray-800 px-3 text-gray-400 dark:text-gray-500">or</span></div>
                 </div>
                 <button
                   type="button"
                   onClick={() => window.location.href = `${process.env.NEXT_PUBLIC_API_URL || "/api"}/auth/google`}
                   className="flex w-full items-center justify-center gap-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 transition hover:bg-gray-50 dark:hover:bg-gray-700"
                 >
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.88 7.49-2.38l-3.57-2.77c-.89.66-2.03.98-3.12.98-2.21 0-4.19-.74-5.56-2.06h-3.97v2.95c1.86 1.08 4.1 1.79 6.53 1.79z"/>
                    <path fill="#FBBC05" d="M4.89 14.06c-.53-.16-.99-.4-1.4-.69v-2.95h-3.97c-.59 1.15-.91 2.44-.91 3.81 0 1.36.32 2.65.91 3.81l3.52-2.77z"/>
                    <path fill="#EA4335" d="M12 4.76c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.69 14.97.5 12 .5 8.53.5 5.32 1.78 2.91 4.06l3.52 2.77c.88-1.74 2.5-2.94 4.21-2.94z"/>
                  </svg>
                  Continue with Google
                </button>
              </>
            )}
          </form>
        </div>

        {/* Register link */}
        <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          Don't have an account?{" "}
          <a href="/auth/register" className="font-semibold text-[#0F766E] hover:underline">
            Create one free
          </a>
        </p>

{/* Demo accounts removed */}

      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#0F766E] border-t-transparent"/>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
