"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { getToken, removeToken } from "@/lib/auth";

export default function ReturnPage() {
  const router = useRouter();
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getToken()) {
      router.push("/auth/login");
      return;
    }

    const loadReturns = async () => {
      try {
        const { data } = await api.get("/store/orders");
        const returnsWithRequests = await Promise.all(
          (data.data || []).map(async (order) => {
            const res = await api.get(`/returns?order=${order._id}`);
            return res.data.data?.[0] || null;
          })
        );
        setReturns(returnsWithRequests.filter(Boolean));
      } catch {
        removeToken();
        router.push("/auth/login");
      } finally {
        setLoading(false);
      }
    };

    loadReturns();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto rounded-full border-4 border-[#0F766E] border-t-transparent animate-spin"></div>
          <p className="mt-4 text-gray-600">Loading returns...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Return Requests</h1>

        {returns.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-8 text-center">
            <p className="text-gray-500">You have no return requests.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {returns.map((ret) => (
              <div key={ret._id} className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-800">
                    Return #{ret._id?.toString().slice(-6).toUpperCase()}
                  </h3>
                  <span className="text-sm px-3 py-1 rounded-full bg-gray-100">
                    {ret.status || "Requested"}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{ret.reason}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}