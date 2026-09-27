"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  CreditCard,
  Package,
  ShoppingBag,
  Truck,
  XCircle,
} from "lucide-react";
import api from "@/lib/api";
import { getToken, removeToken } from "@/lib/auth";
import { PageHeaderSkeleton, Skeleton, SkeletonList } from "@/components/ui/skeleton";

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getToken()) {
      router.push("/auth/login");
      return;
    }

    const loadOrders = async () => {
      try {
        const { data } = await api.get("/store/orders");
        setOrders(data.data || []);
      } catch {
        removeToken();
        router.push("/auth/login");
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, [router]);

  /* -------------------------------------------------------
     Loading State
  ------------------------------------------------------- */
  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="border-b border-gray-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
            <Skeleton rounded="rounded" className="h-4 w-32" />
          </div>
        </div>

        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
          <PageHeaderSkeleton />

          <SkeletonList count={3} />
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Top Header */}
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <nav
            aria-label="Breadcrumb"
            className="flex h-14 items-center gap-2 text-sm"
          >
            <Link
              href="/"
              className="font-medium text-gray-500 transition-colors hover:text-[#0F766E]"
            >
              Home
            </Link>

            <ChevronRight className="h-4 w-4 text-gray-400" />

            <span className="font-medium text-gray-700">My Orders</span>
          </nav>
        </div>
      </div>

      {/* Page */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
        {/* Page Header */}
        <div className="mb-8 flex flex-col gap-5 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#0F766E]/15 bg-[#0F766E]/5 px-3 py-1.5 text-xs font-semibold text-[#0F766E]">
              <Package className="h-3.5 w-3.5" />
              Order history
            </div>

            <h1 className="text-3xl font-semibold tracking-tight text-gray-700 sm:text-4xl">
              My Orders
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-gray-500 sm:text-base">
              Track your purchases, check payment status, and review your
              recent order history.
            </p>
          </div>

          {orders.length > 0 && (
            <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 ">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0F766E]/10 text-[#0F766E]">
                <ShoppingBag className="h-4.5 w-4.5" />
              </div>

              <div>
                <p className="text-xs text-gray-500">Total orders</p>
                <p className="text-sm font-bold text-gray-700">
                  {orders.length}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Empty State */}
        {orders.length === 0 ? (
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white ">
            <div className="flex flex-col items-center px-5 py-14 text-center sm:px-8 sm:py-20">
              <div className="relative mb-6">
                <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-[#0F766E]/10 text-[#0F766E]">
                  <ShoppingBag className="h-9 w-9" />
                </div>

                <div className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full border-4 border-white bg-gray-100 text-gray-500">
                  <Package className="h-3.5 w-3.5" />
                </div>
              </div>

              <h2 className="text-xl font-bold text-gray-700 sm:text-2xl">
                No orders yet
              </h2>

              <p className="mt-2 max-w-md text-sm leading-6 text-gray-500">
                You haven't placed an order yet. Explore our products and
                discover something you'll love.
              </p>

              <Link
                href="/products"
                className="mt-7 inline-flex items-center gap-2 rounded-xl bg-[#0F766E] px-5 py-3 text-sm font-semibold text-white  transition-all hover:bg-[#0a5c4f] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#0F766E]/30 focus:ring-offset-2"
              >
                Start Shopping
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="border-t border-gray-100 bg-gray-50/70 px-5 py-4 sm:px-8">
              <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-gray-500 sm:text-sm">
                <span className="flex items-center gap-1.5">
                  <ShieldIcon />
                  Secure checkout
                </span>

                <span className="flex items-center gap-1.5">
                  <Truck className="h-4 w-4 text-[#0F766E]" />
                  Reliable delivery
                </span>

                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-[#0F766E]" />
                  Order tracking
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {orders.map((order) => (
              <OrderCard key={order._id} order={order} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

/* -------------------------------------------------------
   Order Card
------------------------------------------------------- */

function OrderCard({ order }) {
  const status = order.order_status;

  const statusConfig =
    status === "delivered"
      ? {
          label: "Delivered",
          className: "border-green-200 bg-green-50 text-green-700",
          icon: CheckCircle2,
          iconClass: "text-green-600",
        }
      : status === "cancelled"
      ? {
          label: "Cancelled",
          className: "border-red-200 bg-red-50 text-red-700",
          icon: XCircle,
          iconClass: "text-red-600",
        }
      : {
          label: status || "Processing",
          className: "border-gray-200 bg-gray-50 text-gray-700",
          icon: Clock3,
          iconClass: "text-gray-500",
        };

  const StatusIcon = statusConfig.icon;

  return (
    <article className="group overflow-hidden rounded-2xl border border-gray-200 bg-white  transition-all duration-200 ">
      {/* Card Header */}
      <div className="border-b border-gray-100 px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0F766E]/10 text-[#0F766E]">
              <Package className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                Order number
              </p>

              <h2 className="mt-1 truncate text-base font-bold text-gray-700 sm:text-lg">
                #
                {order.order_number
                  ?.toString()
                  .slice(-6)
                  .toUpperCase()}
              </h2>
            </div>
          </div>

          <div
            className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold capitalize ${statusConfig.className}`}
          >
            <StatusIcon className={`h-3.5 w-3.5 ${statusConfig.iconClass}`} />
            {statusConfig.label}
          </div>
        </div>
      </div>

      {/* Order Details */}
      <div className="grid grid-cols-1 divide-y divide-gray-100 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        <OrderDetail
          icon={CreditCard}
          label="Order total"
          value={`$${order.total || 0}`}
        />

        <OrderDetail
          icon={status === "delivered" ? CheckCircle2 : Clock3}
          label="Payment status"
          value={order.payment_status}
          capitalize
        />

        <OrderDetail
          icon={ShoppingBag}
          label="Items"
          value={`${order.items?.length || 0} ${
            order.items?.length === 1 ? "item" : "items"
          }`}
        />
      </div>

      {/* Bottom Footer */}
      <div className="flex flex-col gap-4 border-t border-gray-100 bg-gray-50/60 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <CalendarDays className="h-4 w-4 text-gray-400" />
          <span>Order information</span>
        </div>

        <div className="flex items-center gap-2 text-xs font-medium text-[#0F766E]">
          <Truck className="h-4 w-4" />
          <span>Order status: {status || "Processing"}</span>
        </div>
      </div>
    </article>
  );
}

/* -------------------------------------------------------
   Order Detail
------------------------------------------------------- */

function OrderDetail({
  icon: Icon,
  label,
  value,
  capitalize = false,
}) {
  return (
    <div className="flex items-center gap-3 px-5 py-4 sm:block sm:px-6 sm:py-5">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500 sm:mb-3">
        <Icon className="h-4 w-4" />
      </div>

      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
          {label}
        </p>

        <p
          className={`mt-1 truncate text-sm font-semibold text-gray-700 ${
            capitalize ? "capitalize" : ""
          }`}
        >
          {value || "N/A"}
        </p>
      </div>
    </div>
  );
}

/* -------------------------------------------------------
   Small Trust Icon
------------------------------------------------------- */

function ShieldIcon() {
  return (
    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#0F766E]/10">
      <span className="h-1.5 w-1.5 rounded-full bg-[#0F766E]" />
    </span>
  );
}