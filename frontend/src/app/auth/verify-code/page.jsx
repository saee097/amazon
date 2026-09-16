"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import api from "@/lib/api";

export default function VerifyCodePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const emailParam = searchParams?.get("email");
    if (emailParam) setEmail(emailParam);
  }, [searchParams]);

  const validateEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  const submitHandler = async (e) => {
    e.preventDefault();

    const newErrors = {};
    if (!email) newErrors.email = "Email is required";
    else if (!validateEmail(email)) newErrors.email = "Invalid email";
    if (!code) newErrors.code = "Code is required";
    else if (code.length !== 6) newErrors.code = "Code must be 6 digits";

    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      return;
    }

    try {
      setLoading(true);
      setErrors({});

      const { data } = await api.post("/auth/verify-code", { email, code });

      setSuccess(data.message);
      sessionStorage.setItem("reset_email", email);
      sessionStorage.setItem("reset_code", code);
      router.push(`/auth/new-password?email=${encodeURIComponent(email)}`);
    } catch (err) {
      setErrors({
        submit: err?.response?.data?.message || "Verification failed",
      });
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = email && validateEmail(email) && code.length === 6;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col items-center justify-center px-4 py-8 sm:py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-light text-gray-800 mb-3">
            Verify Code
          </h1>
          <p className="text-base sm:text-lg text-gray-600 px-4">
            Enter the 6-digit code sent to your email.
          </p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 sm:p-8">
          {success && (
            <div className="mb-4 bg-emerald-50 border border-emerald-200 p-4 rounded-lg text-sm text-emerald-700">
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
                Email address
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition ${
                  errors.email
                    ? "border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100"
                    : "border-gray-300 focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/10"
                } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors({ ...errors, email: "" });
                }}
                required
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-600">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Verification Code
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="000000"
                className={`w-full rounded-xl border px-4 py-3 text-sm tracking-[0.3em] outline-none transition ${
                  errors.code
                    ? "border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100"
                    : "border-gray-300 focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/10"
                } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.replace(/\D/g, ""));
                  if (errors.code) setErrors({ ...errors, code: "" });
                }}
                required
              />
              {errors.code && (
                <p className="mt-1 text-xs text-red-600">{errors.code}</p>
              )}
            </div>

            <button
              disabled={loading || !isFormValid}
              className="w-full rounded-xl bg-[#0F766E] py-3.5 text-sm font-semibold text-white hover:bg-[#0F766E]/90 disabled:opacity-70 disabled:cursor-not-allowed transition transform focus:outline-none focus:ring-2 focus:ring-[#0F766E] focus:ring-offset-2"
            >
              {loading ? "Verifying..." : "Verify Code"}
            </button>
          </form>
        </div>

        <div className="mt-6 text-center space-y-2">
          <p className="text-sm text-gray-500">
            Didn&apos;t receive a code?{" "}
            <a href="/auth/forgot-password" className="font-medium text-[#0F766E] hover:underline">
              Resend code
            </a>
          </p>
          <p>
            <a href="/auth/login" className="text-sm text-[#0F766E] hover:underline">
              Back to Sign In
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
