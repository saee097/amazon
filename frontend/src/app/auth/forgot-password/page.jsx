"use client";

import { useState } from "react";
import api from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [success, setSuccess] = useState(false);
  const [resetToken, setResetToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const submitHandler = async (e) => {
    e.preventDefault();

    if (!email) {
      setErrors({ email: "Email is required" });
      return;
    }

    if (!validateEmail(email)) {
      setErrors({ email: "Please enter a valid email address" });
      return;
    }

    try {
      setLoading(true);

      const { data } = await api.post(
        "/auth/forgot-password",
        {
          email,
        }
      );

      setSuccess(true);
      setResetToken(data.resetToken || "");
    } catch (error) {
      setErrors({
        submit: error?.response?.data?.message || "Something went wrong",
      });
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = email && validateEmail(email);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col items-center justify-center px-4 py-8 sm:py-12">
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-light text-gray-800 mb-3">
            Forgot Password
          </h1>
          <p className="text-base sm:text-lg text-gray-600 px-4">
            Enter your email to receive a password reset link.
          </p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 sm:p-8">
          {success ? (
            <div className="bg-green-50 border border-green-200 p-4 rounded-lg text-center">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Check your email</h3>
              <p className="text-sm text-gray-600 mb-4">
                We&apos;ve sent a password reset link to <strong>{email}</strong>
              </p>
              {resetToken && (
                <a
                  className="inline-block text-sm text-[#0F766E] hover:underline"
                  href={`/auth/reset-password/${resetToken}`}
                >
                  (Development: Open reset link)
                </a>
              )}
            </div>
          ) : (
            <>
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
                    placeholder="Enter your email"
                    className={`w-full rounded-lg border px-4 py-3 text-gray-500 text-sm outline-none transition ${
                      errors.email ? "border-red-300 focus:border-red-500" : "border-gray-300 focus:border-[#0F766E]"
                    } focus:ring-1 focus:ring-[#0F766E]/20`}
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email) setErrors({ ...errors, email: "" });
                    }}
                    required
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                  )}
                </div>

                <button
                  disabled={loading || !isFormValid}
                  className="w-full rounded-lg bg-[#0F766E] py-3.5 text-sm font-semibold text-white hover:bg-[#0F766E]/90 disabled:opacity-70 disabled:cursor-not-allowed transition transform"
                >
                  {loading ? "Sending..." : "Send Reset Link"}
                </button>
              </form>
            </>
          )}
        </div>

        <div className="mt-6 text-center">
          <a
            href="/auth/login"
            className="text-sm text-[#0F766E] hover:underline"
          >
            Back to Sign In
          </a>
        </div>
      </div>
    </div>
  );
}