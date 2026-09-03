import { NextRequest } from "next/server";
import { getSupabaseAdmin } from "../../supabase/admin";
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

    const [usersResult, productsResult, ordersResult, recentOrdersResult, variantsResult, returnsResult, refundsResult, logsResult, orderItemsResult] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "customer"),
      supabase.from("products").select("id", { count: "exact", head: true }).eq("status", "active"),
      supabase.from("orders").select("id, total, order_status, payment_status, created_at").gte("created_at", seriesStart.toISOString()),
      supabase.from("orders").select("id, order_number, total, order_status, payment_status, created_at, profiles(first_name, last_name, email)").order("created_at", { ascending: false }).limit(8),
      supabase.from("product_variants").select("id, size, color, sku, inventory_quantity, products(id, title, slug)").lt("inventory_quantity", 10).order("inventory_quantity", { ascending: true }).limit(8),
      supabase.from("returns").select("id", { count: "exact", head: true }).eq("status", "requested"),
      supabase.from("refunds").select("id", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("audit_logs").select("id, action, resource, resource_id, created_at, profiles(first_name, last_name, email)").order("created_at", { ascending: false }).limit(6),
      supabase.from("order_items").select("product_id, quantity, line_total, products(title, slug)").limit(500),
    ]);

    const results = [usersResult, productsResult, ordersResult, recentOrdersResult, variantsResult, returnsResult, refundsResult, logsResult, orderItemsResult] as Array<{ error?: { message?: string } | null }>;
    const failed = results.find((result) => result.error);
    if (failed?.error) return jsonError(failed.error.message || "Unable to load dashboard data", 500);

    const orders = (ordersResult.data || []) as unknown as OrderRow[];
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

    const overview = {
      stats: {
        grossSales: +grossSales.toFixed(2),
        paidRevenue: +orders.filter((order) => order.payment_status === "paid" && order.order_status !== "cancelled").reduce((sum, order) => sum + Number(order.total), 0).toFixed(2),
        totalOrders: orders.length,
        totalCustomers: usersResult.count || 0,
        totalProducts: productsResult.count || 0,
        pendingReturns: returnsResult.count || 0,
        pendingRefunds: refundsResult.count || 0,
        lowStockCount: (variantsResult.data || []).length,
        averageOrderValue: activeOrders.length ? +(grossSales / activeOrders.length).toFixed(2) : 0,
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
    };

    if (action === "stats") return jsonOk({ stats: { ...overview.stats, totalSales: overview.stats.grossSales } });
    return jsonOk(overview);
  }

  if (action === "activity") {
    const { data, error } = await supabase.from("audit_logs").select("*, profiles(first_name, last_name, email)").order("created_at", { ascending: false }).limit(20);
    if (error) return jsonError(error.message, 500);
    return jsonOk(data || []);
  }

  return jsonError("Not found", 404);
}
