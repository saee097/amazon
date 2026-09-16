"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import api from "@/lib/api";

export default function NewPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams?.get("email") || "";

  const [form, setForm] = useState({
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState("");
  const [code, setCode] = useState("");

  useEffect(() => {
    const emailParam = searchParams?.get("email");
    if (!emailParam) {
      router.replace("/auth/forgot-password");
      return;
    }
    const storedCode = sessionStorage.getItem("reset_code");
    if (storedCode) setCode(storedCode);
  }, [email, router, searchParams]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const submitHandler = async (e) => {
    e.preventDefault();

    const newErrors = {};
    if (!form.password) newErrors.password = "Password is required";
    else if (form.password.length < 8) newErrors.password = "Password must be at least 8 characters";

    if (!form.confirmPassword) newErrors.confirmPassword = "Please confirm your password";
    else if (form.password !== form.confirmPassword) newErrors.confirmPassword = "Passwords do not match";

    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      return;
    }

    try {
      setLoading(true);
      setErrors({});

      await api.post("/auth/reset-password", {
        email,
        code,
        password: form.password,
        confirmPassword: form.confirmPassword,
      });

      sessionStorage.removeItem("reset_email");
      sessionStorage.removeItem("reset_code");
      setSuccess("Password changed successfully!");
      setTimeout(() => {
        router.push("/auth/login");
      }, 2000);
    } catch (err) {
      setErrors({
        submit: err?.response?.data?.message || "Password reset failed",
      });
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = form.password && form.confirmPassword && form.password.length >= 8 && form.password === form.confirmPassword;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col items-center justify-center px-4 py-8 sm:py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-light text-gray-800 mb-3">
            New Password
          </h1>
          <p className="text-base sm:text-lg text-gray-600 px-4">
            Set a new password for your account.
          </p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 sm:p-8">
          {success && (
            <div className="mb-4 bg-emerald-50 border border-emerald-200 p-4 rounded-lg text-sm text-emerald-700 text-center">
              <svg className="w-8 h-8 mx-auto mb-2 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {success}
            </div>
          )}
          {errors.submit && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          )}

          <form onSubmit={submitHandler} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Enter new password"
                  className={`w-full rounded-xl border px-4 py-3 pr-12 text-sm outline-none transition ${
                    errors.password
                      ? "border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100"
                      : "border-gray-300 focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/10"
                  } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
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
                <p className="mt-1 text-xs text-red-600">{errors.password}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm new password"
                  className={`w-full rounded-xl border px-4 py-3 pr-12 text-sm outline-none transition ${
                    errors.confirmPassword
                      ? "border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100"
                      : "border-gray-300 focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/10"
                  } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showConfirmPassword ? (
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
              {errors.confirmPassword && (
                <p className="mt-1 text-xs text-red-600">{errors.confirmPassword}</p>
              )}
            </div>

            <button
              disabled={loading || !isFormValid}
              className="w-full rounded-xl bg-[#0F766E] py-3.5 text-sm font-semibold text-white hover:bg-[#0F766E]/90 disabled:opacity-70 disabled:cursor-not-allowed transition transform focus:outline-none focus:ring-2 focus:ring-[#0F766E] focus:ring-offset-2"
            >
              {loading ? "Updating..." : "Reset Password"}
            </button>
          </form>
        </div>

        <div className="mt-6 text-center">
          <a href="/auth/login" className="text-sm text-[#0F766E] hover:underline">
            Back to Sign In
          </a>
        </div>
      </div>
    </div>
  );
}
