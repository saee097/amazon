import { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/server/supabase/admin";
import { requireAdmin } from "../../lib/auth";
import { jsonError, jsonOk } from "../../lib/response";

type OrderRow = {
  id: string;
  order_number: string;
  total: number | string;
  order_status: string;
  payment_status: string;
  created_at: string;
  profiles?: { first_name?: string; last_name?: string; email?: string } | null;
};

const ORDER_STATUSES = ["pending", "processing", "shipped", "delivered", "cancelled"];

function dateKey(value: Date) {
  return value.toISOString().slice(0, 10);
}

function calcDelta(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return +(((current - previous) / previous) * 100).toFixed(1);
}

function calcRevenue(orders: OrderRow[]): number {
  return +orders
    .filter((o) => o.order_status !== "cancelled")
    .reduce((sum, o) => sum + Number(o.total), 0)
    .toFixed(2);
}

function calcAOV(orders: OrderRow[]): number {
  const active = orders.filter((o) => o.order_status !== "cancelled");
  return active.length ? +(active.reduce((sum, o) => sum + Number(o.total), 0) / active.length).toFixed(2) : 0;
}

function safeCount(result: { count?: number | null }): number {
  return typeof result.count === "number" ? result.count : 0;
}

export async function handleDashboard(method: string, path: string[], request: NextRequest) {
  if (method !== "GET") return jsonError("Method not allowed", 405);

  const { error: authError } = await requireAdmin(request);
  if (authError) return authError;

  const supabase = getSupabaseAdmin();
  const action = path[1];

  if (action === "overview" || action === "stats") {
    const seriesStart = new Date();
    seriesStart.setUTCHours(0, 0, 0, 0);
    seriesStart.setUTCDate(seriesStart.getUTCDate() - 6);

    // Previous 7-day window for delta calculations (days 7–14 ago)
    const prevStart = new Date(seriesStart);
    prevStart.setUTCDate(prevStart.getUTCDate() - 7);

    const [usersResult, productsResult, ordersResult, recentOrdersResult, variantsResult, returnsResult, refundsResult, logsResult, orderItemsResult, recentCustomersResult, recentBannersResult, prevOrdersResult, newCustomersCurrentResult, newCustomersPrevResult, newProductsCurrentResult, newProductsPrevResult, newReturnsCurrentResult, newReturnsPrevResult, newRefundsCurrentResult, newRefundsPrevResult, newLowStockCurrentResult, newLowStockPrevResult] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "customer"),
      supabase.from("products").select("id", { count: "exact", head: true }).eq("status", "active"),
      supabase.from("orders").select("id, total, order_status, payment_status, created_at").gte("created_at", seriesStart.toISOString()),
      supabase.from("orders").select("id, order_number, total, order_status, payment_status, created_at, profiles(first_name, last_name, email)").order("created_at", { ascending: false }).limit(8),
      supabase.from("product_variants").select("id, size, color, sku, inventory_quantity, products(id, title, slug)").lt("inventory_quantity", 10).order("inventory_quantity", { ascending: true }).limit(8),
      supabase.from("returns").select("id", { count: "exact", head: true }).eq("status", "requested"),
      supabase.from("refunds").select("id", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("audit_logs").select("id, action, resource, resource_id, created_at, profiles(first_name, last_name, email)").order("created_at", { ascending: false }).limit(6),
      supabase.from("order_items").select("product_id, quantity, line_total, products(title, slug)").limit(500),
      supabase.from("profiles").select("id, first_name, last_name, email, phone, avatar_url, role, status, created_at").eq("role", "customer").order("created_at", { ascending: false }).limit(5),
      supabase.from("banners").select("id, heading, subheading, image, link_url, status, sort_order, created_at").order("created_at", { ascending: false }).limit(6),
      // Previous period — for delta calculations
      supabase.from("orders").select("id, total, order_status, payment_status, created_at").gte("created_at", prevStart.toISOString()).lt("created_at", seriesStart.toISOString()),
      supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "customer").gte("created_at", seriesStart.toISOString()),
      supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "customer").gte("created_at", prevStart.toISOString()).lt("created_at", seriesStart.toISOString()),
      supabase.from("products").select("id", { count: "exact", head: true }).eq("status", "active").gte("created_at", seriesStart.toISOString()),
      supabase.from("products").select("id", { count: "exact", head: true }).eq("status", "active").gte("created_at", prevStart.toISOString()).lt("created_at", seriesStart.toISOString()),
      supabase.from("returns").select("id", { count: "exact", head: true }).eq("status", "requested").gte("created_at", seriesStart.toISOString()),
      supabase.from("returns").select("id", { count: "exact", head: true }).eq("status", "requested").gte("created_at", prevStart.toISOString()).lt("created_at", seriesStart.toISOString()),
      supabase.from("refunds").select("id", { count: "exact", head: true }).eq("status", "pending").gte("created_at", seriesStart.toISOString()),
      supabase.from("refunds").select("id", { count: "exact", head: true }).eq("status", "pending").gte("created_at", prevStart.toISOString()).lt("created_at", seriesStart.toISOString()),
      supabase.from("product_variants").select("id", { count: "exact", head: true }).lt("inventory_quantity", 10).gte("created_at", seriesStart.toISOString()),
      supabase.from("product_variants").select("id", { count: "exact", head: true }).lt("inventory_quantity", 10).gte("created_at", prevStart.toISOString()).lt("created_at", seriesStart.toISOString()),
    ]);

    const allResults = [usersResult, productsResult, ordersResult, recentOrdersResult, variantsResult, returnsResult, refundsResult, logsResult, orderItemsResult, recentCustomersResult, recentBannersResult, prevOrdersResult, newCustomersCurrentResult, newCustomersPrevResult, newProductsCurrentResult, newProductsPrevResult, newReturnsCurrentResult, newReturnsPrevResult, newRefundsCurrentResult, newRefundsPrevResult, newLowStockCurrentResult, newLowStockPrevResult] as Array<{ error?: { message?: string } | null }>;
    const failed = allResults.find((result) => result.error);
    if (failed?.error) return jsonError(failed.error.message || "Unable to load dashboard data", 500);

    const orders = (ordersResult.data || []) as unknown as OrderRow[];
    const prevOrders = (prevOrdersResult.data || []) as unknown as OrderRow[];
    const dailyRevenue = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(seriesStart);
      date.setUTCDate(seriesStart.getUTCDate() + index);
      const key = dateKey(date);
      const dayOrders = orders.filter((order) => dateKey(new Date(order.created_at)) === key && order.order_status !== "cancelled");
      return {
        date: key,
        label: new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: "UTC" }).format(date),
        orders: dayOrders.length,
        revenue: +dayOrders.reduce((sum, order) => sum + Number(order.total), 0).toFixed(2),
      };
    });

    const activeOrders = orders.filter((order) => order.order_status !== "cancelled");
    const grossSales = activeOrders.reduce((sum, order) => sum + Number(order.total), 0);
    const productTotals = new Map<string, { title: string; slug: string; units: number; revenue: number }>();
    for (const item of (orderItemsResult.data || []) as Array<{ product_id: string; quantity: number; line_total: number | string; products?: { title?: string; slug?: string } | null }>) {
      const current = productTotals.get(item.product_id) || { title: item.products?.title || "Deleted product", slug: item.products?.slug || "", units: 0, revenue: 0 };
      current.units += Number(item.quantity);
      current.revenue += Number(item.line_total);
      productTotals.set(item.product_id, current);
    }

    const totalCustomers = safeCount(usersResult);
    const totalProducts = safeCount(productsResult);
    const pendingReturns = safeCount(returnsResult);
    const pendingRefunds = safeCount(refundsResult);
    const lowStockCount = (variantsResult.data || []).length;

    const prevGrossSales = calcRevenue(prevOrders);
    const prevAOV = calcAOV(prevOrders);
    const prevTotalOrders = prevOrders.filter((o) => o.order_status !== "cancelled").length;
    const newCustomersCurrent = safeCount(newCustomersCurrentResult);
    const newCustomersPrev = safeCount(newCustomersPrevResult);
    const newProductsCurrent = safeCount(newProductsCurrentResult);
    const newProductsPrev = safeCount(newProductsPrevResult);
    const newReturnsCurrent = safeCount(newReturnsCurrentResult);
    const newReturnsPrev = safeCount(newReturnsPrevResult);
    const newRefundsCurrent = safeCount(newRefundsCurrentResult);
    const newRefundsPrev = safeCount(newRefundsPrevResult);
    const newLowStockCurrent = safeCount(newLowStockCurrentResult);
    const newLowStockPrev = safeCount(newLowStockPrevResult);

    const currentGrossSales = +grossSales.toFixed(2);
    const currentAOV = activeOrders.length ? +(grossSales / activeOrders.length).toFixed(2) : 0;

    const deltas = {
      grossSales: calcDelta(currentGrossSales, prevGrossSales),
      totalOrders: calcDelta(activeOrders.length, prevTotalOrders),
      totalCustomers: calcDelta(newCustomersCurrent, newCustomersPrev),
      totalProducts: calcDelta(newProductsCurrent, newProductsPrev),
      averageOrderValue: calcDelta(currentAOV, prevAOV),
      lowStockCount: newLowStockPrev > 0 ? calcDelta(newLowStockCurrent, newLowStockPrev) : newLowStockCurrent > 0 ? 100 : 0,
      pendingReturns: calcDelta(newReturnsCurrent, newReturnsPrev),
      pendingRefunds: calcDelta(newRefundsCurrent, newRefundsPrev),
    };

    const overview = {
      stats: {
        grossSales: currentGrossSales,
        paidRevenue: +orders.filter((order) => order.payment_status === "paid" && order.order_status !== "cancelled").reduce((sum, order) => sum + Number(order.total), 0).toFixed(2),
        totalOrders: orders.length,
        totalCustomers,
        totalProducts,
        pendingReturns,
        pendingRefunds,
        lowStockCount,
        averageOrderValue: currentAOV,
        deltas,
      },
      dailyRevenue,
      statusCounts: ORDER_STATUSES.map((status) => ({ status, count: orders.filter((order) => order.order_status === status).length })),
      recentOrders: ((recentOrdersResult.data || []) as unknown as OrderRow[]).map((order) => ({
        _id: order.id,
        order_number: order.order_number,
        total: Number(order.total),
        order_status: order.order_status,
        payment_status: order.payment_status,
        created_at: order.created_at,
        customer: order.profiles ? { name: `${order.profiles.first_name || ""} ${order.profiles.last_name || ""}`.trim() || order.profiles.email, email: order.profiles.email } : null,
      })),
      lowStock: ((variantsResult.data || []) as Array<{ id: string; size: string; color: string; sku: string; inventory_quantity: number; products?: { id?: string; title?: string; slug?: string } | null }>).map((variant) => ({
        _id: variant.id,
        inventory_quantity: variant.inventory_quantity,
        size: variant.size,
        color: variant.color,
        sku: variant.sku,
        product: variant.products || null,
      })),
      topProducts: Array.from(productTotals.entries()).map(([id, product]) => ({ _id: id, ...product, revenue: +product.revenue.toFixed(2) })).sort((a, b) => b.revenue - a.revenue).slice(0, 5),
      activity: ((logsResult.data || []) as Array<{ id: string; action: string; resource?: string; resource_id?: string; created_at: string; profiles?: { first_name?: string; last_name?: string; email?: string } | null }>).map((log) => ({
        _id: log.id,
        action: log.action,
        resource: log.resource,
        resource_id: log.resource_id,
        created_at: log.created_at,
        actor: log.profiles ? `${log.profiles.first_name || ""} ${log.profiles.last_name || ""}`.trim() || log.profiles.email : "System",
      })),
      recentCustomers: ((recentCustomersResult.data || []) as Array<{ id: string; first_name: string; last_name: string; email: string; phone: string; avatar_url: string | null; role: string; status: string; created_at: string }>).map((c) => ({
        _id: c.id,
        firstName: c.first_name,
        lastName: c.last_name,
        first_name: c.first_name,
        last_name: c.last_name,
        email: c.email,
        phone: c.phone,
        avatarUrl: c.avatar_url,
        role: c.role,
        status: c.status,
        created_at: c.created_at,
      })),
      recentBanners: ((recentBannersResult.data || []) as Array<{ id: string; heading: string; subheading: string; image: string; link_url: string; status: string; sort_order: number; created_at: string }>).map((b) => ({
        _id: b.id,
        heading: b.heading,
        subheading: b.subheading,
        image: b.image,
        link_url: b.link_url,
        status: b.status,
        sort_order: b.sort_order,
        created_at: b.created_at,
      })),
    };

    if (action === "stats") return jsonOk({ stats: { ...overview.stats, totalSales: overview.stats.grossSales } });
    return jsonOk(overview);
  }

  if (action === "activity") {
    const { data, error } = await supabase.from("audit_logs").select("*, profiles(first_name, last_name, email)").order("created_at", { ascending: false }).limit(20);
    if (error) return jsonError(error.message, 500);
    return jsonOk(data || []);
  }

  if (action === "admin-stats") {
    const { count: totalAdmins } = await supabase.from("profiles").select("id", { count: "exact", head: true }).in("role", ["admin", "superadmin"]);
    const { count: activeAdmins } = await supabase.from("profiles").select("id", { count: "exact", head: true }).in("role", ["admin", "superadmin"]).eq("status", "active");
    return jsonOk({ totalAdmins: totalAdmins || 0, activeAdmins: activeAdmins || 0 });
  }

  return jsonError("Not found", 404);
}
