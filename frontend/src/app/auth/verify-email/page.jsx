"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2, Mail, XCircle } from "lucide-react";
import api from "@/lib/api";

function VerifyEmailInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState("verifying");
  const [message, setMessage] = useState("Verifying your email…");

  useEffect(() => {
    const token =
      searchParams?.get("token") ||
      searchParams?.get("token_hash") ||
      searchParams?.get("code");
    const errorCode = searchParams?.get("error");

    if (errorCode) {
      setStatus("error");
      setMessage(
        errorCode === "otp_expired"
          ? "This verification link has expired. Please request a new one."
          : "This verification link is invalid."
      );
      return;
    }

    if (!token) {
      setStatus("error");
      setMessage("Missing verification token.");
      return;
    }

    (async () => {
      try {
        const { data } = await api.get(`/auth/verify-email/${encodeURIComponent(token)}`);
        if (data?.success) {
          setStatus("success");
          setMessage(data.message || "Your email has been verified.");
        } else {
          setStatus("error");
          setMessage(data?.message || "Verification failed.");
        }
      } catch (error) {
        setStatus("error");
        setMessage(error?.response?.data?.message || "Verification failed. The link may have expired.");
      }
    })();
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-emerald-50/40 px-4 py-12">
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-8 text-center ">
        <div
          className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full ${
            status === "success"
              ? "bg-emerald-50 text-emerald-700"
              : status === "error"
              ? "bg-rose-50 text-rose-700"
              : "bg-gray-50 text-gray-600"
          }`}
        >
          {status === "verifying" ? (
            <Loader2 size={24} className="animate-spin" />
          ) : status === "success" ? (
            <CheckCircle2 size={26} />
          ) : (
            <XCircle size={26} />
          )}
        </div>
        <h1 className="text-2xl font-semibold text-gray-900">
          {status === "success" ? "Email verified" : status === "error" ? "Verification failed" : "Verifying…"}
        </h1>
        <p className="mt-2 text-sm text-gray-600">{message}</p>
        {status !== "verifying" && (
          <div className="mt-6 flex flex-col gap-2">
            {status === "success" ? (
              <button
                onClick={() => router.push("/auth/login")}
                className="rounded-lg bg-[#0F766E] px-4 py-2.5 text-sm font-semibold text-white  hover:bg-[#0d5e58]"
              >
                Continue to sign in
              </button>
            ) : (
              <button
                onClick={() => router.push("/auth/register")}
                className="rounded-lg bg-[#0F766E] px-4 py-2.5 text-sm font-semibold text-white  hover:bg-[#0d5e58]"
              >
                Try registering again
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailInner />
    </Suspense>
  );
}
