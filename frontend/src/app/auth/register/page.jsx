"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { isLoggedIn, getUserRole } from "@/lib/auth";
import { getRedirectPath } from "@/lib/rbac";

const GOOGLE_ENABLED = process.env.NEXT_PUBLIC_GOOGLE_ENABLED === "true";
const GOOGLE_AUTH_URL = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/auth/google`;

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const getPasswordStrength = (password) => {
  if (!password) return { score: 0, label: "", color: "" };
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { score, label: "Weak", color: "bg-red-500" };
  if (score === 2) return { score, label: "Fair", color: "bg-orange-500" };
  if (score === 3) return { score, label: "Good", color: "bg-yellow-500" };
  if (score === 4) return { score, label: "Strong", color: "bg-blue-500" };
  return { score, label: "Very Strong", color: "bg-green-500" };
};

export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    termsAccepted: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const redirectedRef = useRef(false);

  useEffect(() => {
    if (isLoggedIn() && !redirectedRef.current) {
      redirectedRef.current = true;
      router.push(getRedirectPath(getUserRole()));
    }
  }, [router]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value,
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

    if (!form.firstName) {
      newErrors.firstName = "First name is required";
    }

    if (!form.lastName) {
      newErrors.lastName = "Last name is required";
    }

    if (!form.username) {
      newErrors.username = "Username is required";
    }

    if (!form.email) {
      newErrors.email = "Email is required";
    } else if (!validateEmail(form.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!form.password) {
      newErrors.password = "Password is required";
    } else if (form.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    if (!form.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (!form.termsAccepted) {
      newErrors.termsAccepted = "You must accept the terms and conditions";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setLoading(true);

      await api.post("/auth/register", {
        firstName: form.firstName,
        lastName: form.lastName,
        username: form.username,
        email: form.email,
        phone: form.phone,
        password: form.password,
      });

      router.push(
        `/auth/login?registered=true&email=${encodeURIComponent(form.email)}`
      );
    } catch (error) {
      setErrors({
        submit: error?.response?.data?.message || "Registration failed",
      });
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = getPasswordStrength(form.password);

  const isFormValid =
    form.email &&
    form.password &&
    form.firstName &&
    form.lastName &&
    form.username &&
    form.confirmPassword &&
    form.termsAccepted &&
    validateEmail(form.email) &&
    form.password === form.confirmPassword;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col items-center justify-center px-4 py-8 sm:py-12">
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-light text-gray-800 mb-3">
            Create your account
          </h1>
          <p className="text-base sm:text-lg text-gray-600 px-4">
            Create your profile and get access to faster checkout, order history and members-only offers.
          </p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 sm:p-8">
          {errors.submit && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          )}

          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-600">
              A verification email will be sent to your email address after registration.
            </p>
          </div>

          <form onSubmit={submitHandler} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First name
                </label>
                <input
                  className={`w-full rounded-lg border px-4 py-3 text-gray-500 text-sm outline-none transition ${
                    errors.firstName ? "border-red-300 focus:border-red-500" : "border-gray-300 focus:border-[#0F766E]"
                  } focus:ring-1 focus:ring-[#0F766E]/20`}
                  name="firstName"
                  value={form.firstName}
                  onChange={handleChange}
                  required
                />
                {errors.firstName && (
                  <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last name
                </label>
                <input
                  className={`w-full rounded-lg border px-4 py-3 text-gray-500 text-sm outline-none transition ${
                    errors.lastName ? "border-red-300 focus:border-red-500" : "border-gray-300 focus:border-[#0F766E]"
                  } focus:ring-1 focus:ring-[#0F766E]/20`}
                  name="lastName"
                  value={form.lastName}
                  onChange={handleChange}
                  required
                />
                {errors.lastName && (
                  <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <input
                type="text"
                className={`w-full rounded-lg border px-4 py-3 text-gray-500 text-sm outline-none transition ${
                  errors.username ? "border-red-300 focus:border-red-500" : "border-gray-300 focus:border-[#0F766E]"
                } focus:ring-1 focus:ring-[#0F766E]/20`}
                name="username"
                value={form.username}
                onChange={handleChange}
                required
              />
              {errors.username && (
                <p className="mt-1 text-sm text-red-600">{errors.username}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email address
              </label>
              <input
                type="email"
                className={`w-full rounded-lg border px-4 py-3 text-gray-500 text-sm outline-none transition ${
                  errors.email ? "border-red-300 focus:border-red-500" : "border-gray-300 focus:border-[#0F766E]"
                } focus:ring-1 focus:ring-[#0F766E]/20`}
                name="email"
                value={form.email}
                onChange={handleChange}
                required
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone number
              </label>
              <input
                type="tel"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-500 text-sm outline-none focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E]/20 transition"
                name="phone"
                value={form.phone}
                onChange={handleChange}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    className={`w-full rounded-lg border px-4 py-3 pr-12 text-gray-500 text-sm outline-none transition ${
                      errors.password ? "border-red-300 focus:border-red-500" : "border-gray-300 focus:border-[#0F766E]"
                    } focus:ring-1 focus:ring-[#0F766E]/20`}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    required
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
                {form.password && (
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`${passwordStrength.color} h-2 rounded-full transition-all`}
                        style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{passwordStrength.label}</p>
                  </div>
                )}
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    className={`w-full rounded-lg border px-4 py-3 pr-12 text-gray-500 text-sm outline-none transition ${
                      errors.confirmPassword ? "border-red-300 focus:border-red-500" : "border-gray-300 focus:border-[#0F766E]"
                    } focus:ring-1 focus:ring-[#0F766E]/20`}
                    name="confirmPassword"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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
                  <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                )}
              </div>
            </div>

            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                id="terms"
                name="termsAccepted"
                checked={form.termsAccepted}
                onChange={handleChange}
                className="w-4 h-4 text-[#0F766E] border-gray-300 rounded focus:ring-[#0F766E] mt-0.5"
              />
              <label htmlFor="terms" className="text-sm text-gray-600">
                I agree to the{" "}
                <a href="/terms" className="text-[#0F766E] hover:underline">Terms of Service</a>
                {" "}and{" "}
                <a href="/privacy" className="text-[#0F766E] hover:underline">Privacy Policy</a>
              </label>
            </div>
            {errors.termsAccepted && (
              <p className="text-sm text-red-600">{errors.termsAccepted}</p>
            )}

            <button
              disabled={loading || !isFormValid}
              className="w-full rounded-lg bg-[#0F766E] py-3.5 text-sm font-semibold text-white hover:bg-[#0F766E]/90 disabled:opacity-70 disabled:cursor-not-allowed transition transform"
            >
              {loading ? "Creating account..." : "Create account"}
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
            <>
              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>

                <div className="relative flex justify-center text-sm">
                  <span className="bg-white px-3 text-gray-500">
                    or
                  </span>
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
            </>
          </form>
        </div>

        <div className="mt-6 text-center">
          <span className="text-sm text-gray-600">
            Already have an account?{" "}
          </span>
          <a
            href="/auth/login"
            className="text-sm font-medium text-[#0F766E] hover:underline"
          >
            Sign in
          </a>
        </div>
      </div>
    </div>
  );
}
