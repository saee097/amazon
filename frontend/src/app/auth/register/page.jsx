"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { isLoggedIn, getUserRole } from "@/lib/auth";
import { getRedirectPath } from "@/lib/rbac";

const GOOGLE_ENABLED = process.env.NEXT_PUBLIC_GOOGLE_ENABLED === "true";

const validateEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

function passwordStrength(pw) {
  if (!pw) return { score: 0, label: "", color: "" };
  let score = 0;
  if (pw.length >= 8)  score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const map = [
    { label: "", color: "" },
    { label: "Weak", color: "bg-rose-500" },
    { label: "Fair", color: "bg-orange-400" },
    { label: "Good", color: "bg-yellow-400" },
    { label: "Strong", color: "bg-blue-500" },
    { label: "Very Strong", color: "bg-emerald-500" },
  ];
  return { score, ...map[Math.min(score, 5)] };
}

export default function RegisterPage() {
  const router = useRouter();
  const redirectedRef = useRef(false);

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
  const [showPw, setShowPw]   = useState(false);
  const [showCpw, setShowCpw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors]   = useState({});

  useEffect(() => {
    if (isLoggedIn() && !redirectedRef.current) {
      redirectedRef.current = true;
      router.replace(getRedirectPath(getUserRole()));
    }
  }, [router]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
    setErrors((prev) => ({ ...prev, [name]: "", submit: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};

    if (!form.firstName.trim()) errs.firstName = "First name is required";
    if (!form.lastName.trim())  errs.lastName  = "Last name is required";
    if (!form.username.trim())  errs.username  = "Username is required";
    if (!form.email)            errs.email     = "Email is required";
    else if (!validateEmail(form.email)) errs.email = "Enter a valid email";
    if (!form.password)         errs.password  = "Password is required";
    else if (form.password.length < 8) errs.password = "Minimum 8 characters";
    if (form.password !== form.confirmPassword) errs.confirmPassword = "Passwords do not match";
    if (!form.termsAccepted)    errs.termsAccepted = "You must accept the terms";

    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      await api.post("/auth/register", {
        firstName: form.firstName.trim(),
        lastName:  form.lastName.trim(),
        username:  form.username.trim(),
        email:     form.email,
        phone:     form.phone,
        password:  form.password,
      });

      // Redirect to login with success flag
      router.push(`/auth/login?registered=true&email=${encodeURIComponent(form.email)}`);
    } catch (err) {
      setErrors({ submit: err?.response?.data?.message || "Registration failed. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const strength = passwordStrength(form.password);
  const isValid  =
    form.firstName && form.lastName && form.username &&
    validateEmail(form.email) && form.password.length >= 8 &&
    form.password === form.confirmPassword && form.termsAccepted;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-emerald-50/30 flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">

        {/* Brand */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex items-center justify-center rounded-2xl bg-gradient-to-br from-[#0F766E] to-[#0d5e58] text-white shadow-lg" style={{height:52,width:52}}>
            <svg className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <path d="M3 3h2l.4 2M7 13h10l4-8H5.4"/>
              <circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/>
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Create your account</h1>
          <p className="mt-2 text-sm text-gray-500">
            Get access to faster checkout, order history and member offers
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">

          {errors.submit && (
            <div className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {errors.submit}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Name row */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  First name <span className="text-rose-500">*</span>
                </label>
                <input
                  name="firstName"
                  value={form.firstName}
                  onChange={handleChange}
                  placeholder="John"
                  className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition ${
                    errors.firstName ? "border-rose-300 focus:border-rose-400" : "border-gray-300 focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/10"
                  }`}
                />
                {errors.firstName && <p className="mt-1 text-xs text-rose-600">{errors.firstName}</p>}
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Last name <span className="text-rose-500">*</span>
                </label>
                <input
                  name="lastName"
                  value={form.lastName}
                  onChange={handleChange}
                  placeholder="Doe"
                  className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition ${
                    errors.lastName ? "border-rose-300 focus:border-rose-400" : "border-gray-300 focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/10"
                  }`}
                />
                {errors.lastName && <p className="mt-1 text-xs text-rose-600">{errors.lastName}</p>}
              </div>
            </div>

            {/* Username */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Username <span className="text-rose-500">*</span>
              </label>
              <input
                name="username"
                value={form.username}
                onChange={handleChange}
                placeholder="johndoe"
                className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition ${
                  errors.username ? "border-rose-300 focus:border-rose-400" : "border-gray-300 focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/10"
                }`}
              />
              {errors.username && <p className="mt-1 text-xs text-rose-600">{errors.username}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Email address <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                autoComplete="email"
                className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition ${
                  errors.email ? "border-rose-300 focus:border-rose-400" : "border-gray-300 focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/10"
                }`}
              />
              {errors.email && <p className="mt-1 text-xs text-rose-600">{errors.email}</p>}
            </div>

            {/* Phone (optional) */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Phone <span className="text-gray-400 text-xs font-normal">(optional)</span>
              </label>
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="+1 555 000 0000"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/10 transition"
              />
            </div>

            {/* Password */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Min. 8 characters"
                  autoComplete="new-password"
                  className={`w-full rounded-xl border px-4 py-3 pr-12 text-sm outline-none transition ${
                    errors.password ? "border-rose-300" : "border-gray-300 focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/10"
                  }`}
                />
                <button type="button" onClick={() => setShowPw((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPw
                    ? <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9-7 1.732-4.057 6.522-7 9-7M6.375 6.375l11.25 11.25"/></svg>
                    : <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9 7-1.274 4.057-5.064 7-9 7-4.477 0-8.268-2.943-9-7z"/></svg>
                  }
                </button>
              </div>
              {form.password && (
                <div className="mt-2 space-y-1">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
                    <div className={`h-full rounded-full transition-all ${strength.color}`}
                      style={{ width: `${(strength.score / 5) * 100}%` }}/>
                  </div>
                  <p className="text-xs text-gray-500">{strength.label}</p>
                </div>
              )}
              {errors.password && <p className="mt-1 text-xs text-rose-600">{errors.password}</p>}
            </div>

            {/* Confirm password */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Confirm password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showCpw ? "text" : "password"}
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="Re-enter password"
                  autoComplete="new-password"
                  className={`w-full rounded-xl border px-4 py-3 pr-12 text-sm outline-none transition ${
                    errors.confirmPassword ? "border-rose-300" : "border-gray-300 focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/10"
                  }`}
                />
                <button type="button" onClick={() => setShowCpw((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showCpw
                    ? <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9-7 1.732-4.057 6.522-7 9-7M6.375 6.375l11.25 11.25"/></svg>
                    : <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9 7-1.274 4.057-5.064 7-9 7-4.477 0-8.268-2.943-9-7z"/></svg>
                  }
                </button>
              </div>
              {errors.confirmPassword && <p className="mt-1 text-xs text-rose-600">{errors.confirmPassword}</p>}
            </div>

            {/* Terms */}
            <div>
              <label className="flex cursor-pointer items-start gap-2.5">
                <input type="checkbox" name="termsAccepted" checked={form.termsAccepted}
                  onChange={handleChange}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#0F766E] focus:ring-[#0F766E]"/>
                <span className="text-sm text-gray-600">
                  I agree to the{" "}
                  <a href="/terms" className="font-medium text-[#0F766E] hover:underline">Terms of Service</a>
                  {" "}and{" "}
                  <a href="/privacy" className="font-medium text-[#0F766E] hover:underline">Privacy Policy</a>
                </span>
              </label>
              {errors.termsAccepted && <p className="mt-1 text-xs text-rose-600">{errors.termsAccepted}</p>}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !isValid}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0F766E] py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0d5e58] disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-[#0F766E] focus:ring-offset-2"
            >
              {loading && (
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25"/>
                  <path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                </svg>
              )}
              {loading ? "Creating account…" : "Create account"}
            </button>

            {/* Google */}
            {GOOGLE_ENABLED && (
              <>
                <div className="relative my-2">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"/></div>
                  <div className="relative flex justify-center text-xs"><span className="bg-white px-3 text-gray-400">or</span></div>
                </div>
                <button
                  type="button"
                  onClick={() => window.location.href = `${process.env.NEXT_PUBLIC_API_URL || "/api"}/auth/google`}
                  className="flex w-full items-center justify-center gap-3 rounded-xl border border-gray-300 bg-white py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
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

        <p className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{" "}
          <a href="/auth/login" className="font-semibold text-[#0F766E] hover:underline">Sign in</a>
        </p>
      </div>
    </div>
  );
}
