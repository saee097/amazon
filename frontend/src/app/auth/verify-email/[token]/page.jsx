"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import api from "@/lib/api";

export default function VerifyEmailPage() {
  const router = useRouter();
  const params = useParams();
  const token = params?.token;

  const [status, setStatus] = useState("verifying");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Verification token is missing.");
      return;
    }

    const verify = async () => {
      try {
        const { data } = await api.get(`/auth/verify-email/${token}`);
        setStatus("success");
        setMessage(data.message || "Email verified successfully.");
      } catch (error) {
        setStatus("error");
        setMessage(
          error?.response?.data?.message ||
            "Invalid or expired verification token."
        );
      }
    };

    verify();
  }, [token]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col items-center justify-center px-4 py-8 sm:py-12">
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-light text-gray-800 mb-3">
            Email Verification
          </h1>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 sm:p-8 text-center">
          {status === "verifying" && (
            <>
              <div className="w-12 h-12 mx-auto mb-4 rounded-full border-4 border-[#0F766E] border-t-transparent animate-spin"></div>
              <p className="text-sm text-gray-600">Verifying your email, please wait...</p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Email Verified!</h3>
              <p className="text-sm text-gray-600 mb-6">{message}</p>
              <button
                onClick={() => router.push("/auth/login")}
                className="w-full rounded-lg bg-[#0F766E] py-3.5 text-sm font-semibold text-white hover:bg-[#0F766E]/90 transition"
              >
                Continue to Sign In
              </button>
            </>
          )}

          {status === "error" && (
            <>
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Verification Failed</h3>
              <p className="text-sm text-gray-600 mb-6">{message}</p>
              <a
                href="/auth/login"
                className="inline-block w-full rounded-lg bg-[#0F766E] py-3.5 text-sm font-semibold text-white hover:bg-[#0F766E]/90 transition text-center"
              >
                Back to Sign In
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
