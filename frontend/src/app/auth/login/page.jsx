"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import api from "@/lib/api";
import { saveToken, saveRefreshToken, saveUser, isLoggedIn, getUserRole } from "@/lib/auth";
import { ROLES, getRedirectPath } from "@/lib/rbac";

const GOOGLE_ENABLED = process.env.NEXT_PUBLIC_GOOGLE_ENABLED === "true";
const GOOGLE_AUTH_URL = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/auth/google`;

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [form, setForm] = useState({
    email: searchParams?.get("email") || "",
    password: "",
    twoFactorCode: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState("");
  const [locked, setLocked] = useState(false);
  const [requires2FA, setRequires2FA] = useState(false);
  const [tempSession, setTempSession] = useState(null);
  const redirectedRef = useRef(false);

  useEffect(() => {
    if (searchParams?.get("registered") === "true") {
      setSuccess("Registration successful! Please verify your email and sign in.");
    }
    if (isLoggedIn() && !redirectedRef.current) {
      redirectedRef.current = true;
      router.push(getRedirectPath(getUserRole()));
    }
  }, [router, searchParams]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({
      ...form,
      [name]: value,
    });

    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: "",
      });
    }
  };

  const submitHandler = async (e) => {
    e.preventDefault();

    const newErrors = {};

    if (!form.email) {
      newErrors.email = "Email is required";
    } else if (!validateEmail(form.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!requires2FA && !form.password) {
      newErrors.password = "Password is required";
    }

    if (requires2FA && !form.twoFactorCode) {
      newErrors.twoFactorCode = "2FA code is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setLoading(true);

      let payload = {
        email: form.email,
        password: form.password,
        remember: rememberMe,
      };

      if (requires2FA) {
        payload.twoFactorCode = form.twoFactorCode;
        payload.tempSession = tempSession;
      }

      const { data } = await api.post("/auth/login", payload);

      saveToken(data.token);
      if (data.refreshToken) {
        saveRefreshToken(data.refreshToken);
      }
      saveUser(data.customer || data.user);

      const role = (data.customer || data.user)?.role;

      router.push(getRedirectPath(role));
    } catch (error) {
      const message = error?.response?.data?.message || "Login failed";

      if (message.toLowerCase().includes("locked") || message.toLowerCase().includes("suspended")) {
        setLocked(true);
        setErrors({ submit: message });
      } else if (message.toLowerCase().includes("2fa") || message.toLowerCase().includes("two-factor")) {
        setRequires2FA(true);
        setErrors({ submit: "Please enter your 2FA code" });
      } else {
        setErrors({ submit: message });
      }
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = requires2FA
    ? form.email && form.twoFactorCode && validateEmail(form.email)
    : form.email && form.password && validateEmail(form.email);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col items-center justify-center px-4 py-8 sm:py-12">
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-light text-gray-800 mb-3">
            Welcome back
          </h1>
          <p className="text-base sm:text-lg text-gray-600 px-4">
            Sign in to access an enhanced shopping experience.
          </p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 sm:p-8">
          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-600">{success}</p>
            </div>
          )}

          {locked && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600 font-medium">Account temporarily locked</p>
              <p className="text-sm text-red-600 mt-1">Please contact support or try again later.</p>
            </div>
          )}

          {errors.submit && !locked && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          )}

          <form onSubmit={submitHandler} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email address
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className={`w-full rounded-lg border px-4 py-3 text-gray-500 text-sm outline-none transition ${
                  errors.email ? "border-red-300 focus:border-red-500" : "border-gray-300 focus:border-[#0F766E]"
                } focus:ring-1 focus:ring-[#0F766E]/20`}
                required
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {!requires2FA && (
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">
                    Password
                  </label>

                  <a
                    href="/auth/forgot-password"
                    className="text-sm text-[#0F766E] hover:underline"
                  >
                    Forgot password?
                  </a>
                </div>

                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    className={`w-full rounded-lg border px-4 py-3 pr-12 text-sm text-gray-500 outline-none transition ${
                      errors.password ? "border-red-300 focus:border-red-500" : "border-gray-300 focus:border-[#0F766E]"
                    } focus:ring-1 focus:ring-[#0F766E]/20`}
                    required={!requires2FA}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9-7 1.732-4.057 6.522-7 9-7 .824 0 1.624.113 2.375.325M6.375 6.375l11.25 11.25M17.625 17.625L6.375 6.375" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9 7-1.274 4.057-5.064 7-9 7-4.477 0-8.268-2.943-9-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                )}
              </div>
            )}

            {requires2FA && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Two-Factor Authentication Code
                </label>
                <input
                  type="text"
                  name="twoFactorCode"
                  value={form.twoFactorCode}
                  onChange={handleChange}
                  maxLength={6}
                  placeholder="Enter 6-digit code"
                  className={`w-full rounded-lg border px-4 py-3 text-sm text-gray-500 outline-none transition ${
                    errors.twoFactorCode ? "border-red-300 focus:border-red-500" : "border-gray-300 focus:border-[#0F766E]"
                  } focus:ring-1 focus:ring-[#0F766E]/20`}
                  required
                />
                {errors.twoFactorCode && (
                  <p className="mt-1 text-sm text-red-600">{errors.twoFactorCode}</p>
                )}
              </div>
            )}

            <div className="flex items-center justify-between">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-[#0F766E] border-gray-300 rounded focus:ring-[#0F766E]"
                />
                <span className="ml-2 text-sm text-gray-600">Remember me</span>
              </label>
            </div>

            <button
              disabled={loading || !isFormValid}
              className="w-full rounded-lg bg-[#0F766E] py-3.5 text-sm font-semibold text-white hover:bg-[#0F766E]/90 disabled:opacity-70 disabled:cursor-not-allowed transition transform"
            >
              {loading ? "Signing in..." : requires2FA ? "Verify 2FA" : "Sign in"}
            </button>

            {GOOGLE_ENABLED && (
              <>
                <div className="relative my-5">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-3 bg-white text-gray-500">or</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => window.location.href = GOOGLE_AUTH_URL}
                  disabled={loading}
                  className="w-full rounded-lg bg-white border border-gray-300 py-3.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-3 transition transform disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.88 7.49-2.38l-3.57-2.77c-.89.66-2.03.98-3.12.98-2.21 0-4.19-.74-5.56-2.06h-3.97v2.95c1.86 1.08 4.1 1.79 6.53 1.79z"/>
                    <path fill="#FBBC05" d="M4.89 14.06c-.53-.16-.99-.4-1.4-.69v-2.95h-3.97c-.59 1.15-.91 2.44-.91 3.81 0 1.36.32 2.65.91 3.81l3.52-2.77z"/>
                    <path fill="#EA4335" d="M12 4.76c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.69 14.97.5 12 .5 8.53.5 5.32 1.78 2.91 4.06l3.52 2.77c.88-1.74 2.5-2.94 4.21-2.94z"/>
                  </svg>
                  Continue with Google
                </button>
              </>
            )}

            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-white text-gray-500">or</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => window.location.href = GOOGLE_AUTH_URL}
              disabled={loading}
              className="w-full rounded-lg border border-gray-300 bg-white py-3.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-70 flex items-center justify-center gap-3"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.88 7.49-2.38l-3.57-2.77c-.89.66-2.03.98-3.12.98-2.21 0-4.19-.74-5.56-2.06h-3.97v2.95c1.86 1.08 4.1 1.79 6.53 1.79z"
                />
                <path
                  fill="#FBBC05"
                  d="M4.89 14.06c-.53-.16-.99-.4-1.4-.69v-2.95h-3.97c-.59 1.15-.91 2.44-.91 3.81 0 1.36.32 2.65.91 3.81l3.52-2.77z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.76c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.69 14.97.5 12 .5 8.53.5 5.32 1.78 2.91 4.06l3.52 2.77c.88-1.74 2.5-2.94 4.21-2.94z"
                />
              </svg>

              Continue with Google
            </button>
          </form>
        </div>

        <div className="mt-6 text-center">
          <span className="text-sm text-gray-600">
            New to the platform?{" "}
          </span>
          <a
            href="/auth/register"
            className="text-sm font-medium text-[#0F766E] hover:underline"
          >
            Create an account
          </a>
        </div>
      </div>
    </div>
  );
}

export default function LoginPageWrapper() {
  return (
    <Suspense fallback={null}>
      <LoginPage />
    </Suspense>
  );
}
