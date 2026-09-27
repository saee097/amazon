"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import {
  Search,
  RefreshCw,
  Eye,
  ChevronLeft,
  ChevronRight,
  Truck,
  Download,
} from "lucide-react";
import { AdminPageSkeleton } from "@/components/ui/skeleton";

function formatDate(v) {
  if (!v) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(v));
}

const SHIPMENT_STATUSES = [
  "pending",
  "processing",
  "shipped",
  "in_transit",
  "out_for_delivery",
  "delivered",
  "returned",
  "cancelled",
  "exception",
];

const STATUS_STYLES = {
  pending: "bg-amber-50 text-amber-800 ring-1 ring-amber-200",
  processing: "bg-sky-50 text-sky-800 ring-1 ring-sky-200",
  shipped: "bg-violet-50 text-violet-800 ring-1 ring-violet-200",
  in_transit: "bg-blue-50 text-blue-800 ring-1 ring-blue-200",
  out_for_delivery: "bg-indigo-50 text-indigo-800 ring-1 ring-indigo-200",
  delivered: "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200",
  returned: "bg-gray-100 text-gray-700 ring-1 ring-gray-200",
  cancelled: "bg-rose-50 text-rose-800 ring-1 ring-rose-200",
  exception: "bg-orange-50 text-orange-800 ring-1 ring-orange-200",
};

function StatusBadge({ status, styles }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
        styles[status] || "bg-gray-100 text-gray-600"
      }`}
    >
      {status || "—"}
    </span>
  );
}

const PAGE_SIZE = 20;

export default function AdminShipments() {
  const router = useRouter();
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [carrierFilter, setCarrierFilter] = useState("");
  const [page, setPage] = useState(1);

  const loadShipments = useCallback(async (isRefresh = false) => {
      isRefresh ? setRefreshing(true) : setLoading(true);
      setError("");
      try {
        const { data } = await api.get("/admin/shipments");
        setShipments(data?.data || []);
      } catch (err) {
        setError(
          err?.response?.data?.message || "Failed to load shipments."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    }, []);

  useEffect(() => {
    loadShipments();
  }, [loadShipments]);

  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => setSuccess(""), 3000);
    return () => clearTimeout(t);
  }, [success]);

  const filtered = shipments.filter((s) => {
    const q = search.toLowerCase();
    const orderId = s.order_id?.toString() || "";
    const matchSearch =
      !q ||
      (s.tracking_number && s.tracking_number.toLowerCase().includes(q)) ||
      orderId.toLowerCase().includes(q) ||
      (s.carrier && s.carrier.toLowerCase().includes(q)) ||
      (s?.orders?.order_number &&
        s.orders.order_number.toLowerCase().includes(q));
    const matchStatus = !statusFilter || s.status === statusFilter;
    const matchCarrier =
      !carrierFilter ||
      (s.carrier && s.carrier.toLowerCase().includes(carrierFilter.toLowerCase()));
    return matchSearch && matchStatus && matchCarrier;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  useEffect(
    () => setPage(1),
    [search, statusFilter, carrierFilter]
  );

  const handleStatusChange = async (shipment, nextStatus) => {
    try {
      await api.put(`/admin/shipments/${shipment._id}`, {
        status: nextStatus,
      });
      setShipments((prev) =>
        prev.map((s) =>
          s._id === shipment._id ? { ...s, status: nextStatus } : s
        )
      );
      setSuccess("Shipment status updated.");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to update shipment.");
    }
  };

  const exportCSV = () => {
    const header = [
      "Tracking #",
      "Order",
      "Carrier",
      "Status",
      "Ship Date",
      "Created",
    ];
    const rows = filtered.map((s) => [
      s.tracking_number || "",
      s.orders?.order_number || s.order_id?.slice(-6)?.toUpperCase() || "",
      s.carrier || "",
      s.status || "",
      s.ship_date ? new Date(s.ship_date).toLocaleString() : "",
      s.created_at ? new Date(s.created_at).toLocaleString() : "",
    ]);
    const csv = [header, ...rows]
      .map((r) => r.map((v) => `"${v}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `shipments-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const summaryCounts = SHIPMENT_STATUSES.reduce((acc, s) => {
    acc[s] = shipments.filter((sh) => sh.status === s).length;
    return acc;
  }, {});

  const carriers = [
    ...new Set(shipments.map((s) => s.carrier).filter(Boolean)),
  ];

  if (loading) {
    return <AdminPageSkeleton variant="table" className="mx-auto max-w-7xl" />;
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 border-b border-gray-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-700 dark:text-gray-100">
            Shipments
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {filtered.length} shipments found
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => loadShipments(true)}
            disabled={refreshing}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
          >
            <RefreshCw
              size={14}
              className={refreshing ? "animate-spin" : ""}
            />
            Refresh
          </button>
          <button
            onClick={exportCSV}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
          >
            <Download size={14} />
            Export
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
        {SHIPMENT_STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(statusFilter === s ? "" : s)}
            className={`rounded-xl border p-3 text-center transition hover: ${
              statusFilter === s
                ? "border-[#0F766E] bg-[#0F766E]/5 ring-1 ring-[#0F766E]"
                : "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
            }`}
          >
            <p className="text-xl font-bold text-gray-700 dark:text-gray-100">
              {summaryCounts[s] || 0}
            </p>
            <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500 capitalize">
              {s.replace("_", " ")}
            </p>
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </div>
      )}

      <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800 sm:flex-row">
        <div className="relative flex-1">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Search by tracking #, order #, or carrier…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-sm outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/10 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#0F766E] dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
        >
          <option value="">All Statuses</option>
          {SHIPMENT_STATUSES.map((s) => (
            <option key={s} value={s} className="capitalize">
              {s}
            </option>
          ))}
        </select>
        <select
          value={carrierFilter}
          onChange={(e) => setCarrierFilter(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#0F766E] dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
        >
          <option value="">All Carriers</option>
          {carriers.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        {paginated.length === 0 ? (
          <div className="py-20 text-center">
            <Truck className="mx-auto text-gray-300" size={36} />
            <p className="mt-4 text-sm text-gray-500">
              No shipments match your filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500 dark:bg-gray-700/50 dark:text-gray-400">
                <tr>
                  <th className="px-6 py-3 font-semibold">Tracking #</th>
                  <th className="px-6 py-3 font-semibold">Order</th>
                  <th className="px-6 py-3 font-semibold">Carrier</th>
                  <th className="px-6 py-3 font-semibold">Status</th>
                  <th className="px-6 py-3 font-semibold">Ship Date</th>
                  <th className="px-6 py-3 font-semibold">Created</th>
                  <th className="px-6 py-3 text-right font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {paginated.map((shipment) => (
                  <tr
                    key={shipment._id}
                    className="transition hover:bg-gray-50 dark:hover:bg-gray-700/30"
                  >
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs font-semibold text-gray-700 dark:text-gray-300">
                        {shipment.tracking_number || "—"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs font-semibold text-gray-700 dark:text-gray-300">
                        #
                        {shipment.orders?.order_number ||
                          shipment.order_id?.slice(-6).toUpperCase() ||
                          "—"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-900 dark:text-gray-100">
                      {shipment.carrier || "—"}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge
                        status={shipment.status}
                        styles={STATUS_STYLES}
                      />
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500">
                      {shipment.ship_date
                        ? formatDate(shipment.ship_date)
                        : "—"}
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500">
                      {formatDate(shipment.created_at)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/admin/shipments/${shipment._id}`}
                          title="View shipment"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#0F766E] transition hover:bg-[#0F766E]/10"
                        >
                          <Eye size={16} />
                        </Link>
                        <select
                          value={shipment.status || ""}
                          onChange={(e) =>
                            handleStatusChange(shipment, e.target.value)
                          }
                          className="rounded-lg border border-gray-300 px-2 py-1 text-xs text-gray-700 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
                        >
                          {SHIPMENT_STATUSES.map((s) => (
                            <option key={s} value={s} className="capitalize">
                              {s}
                            </option>
                          ))}
                        </select>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4 dark:border-gray-700">
            <p className="text-sm text-gray-500">
              Showing {(page - 1) * PAGE_SIZE + 1}-
              {Math.min(page * PAGE_SIZE, filtered.length)} of{" "}
              {filtered.length}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 disabled:opacity-40 hover:bg-gray-50 dark:border-gray-600"
              >
                <ChevronLeft size={15} />
              </button>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 disabled:opacity-40 hover:bg-gray-50 dark:border-gray-600"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
