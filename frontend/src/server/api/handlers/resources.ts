import { NextRequest } from "next/server";
import { getSupabaseAdmin } from "../../supabase/admin";
import { requireAdmin } from "../../lib/auth";
import { toMongoId, toMongoIds } from "../../lib/mapper";
import { jsonError, jsonOk } from "../../lib/response";

const RESOURCE_TABLES: Record<string, string> = {
  "/admin/collections": "collections",
  "/admin/support": "support_tickets",
  "/admin/reviews": "reviews",
  "/admin/vendors": "vendors",
  "/admin/notifications": "notifications",
  "/admin/security": "security_settings",
  "/admin/blogs": "collections",
  "/admin/faqs": "support_tickets",
  "/admin/newsletter": "notifications",
  "/admin/payments": "orders",
  "/admin/refunds": "refunds",
  "/admin/returns": "returns",
  "/admin/variants": "product_variants",
  "/admin/menu": "menu_items",
  "/admin/banners": "banners",
};

export function getResourceTable(endpoint: string): string | null {
  return RESOURCE_TABLES[endpoint] || null;
}

export async function handleResource(
  method: string,
  endpoint: string,
  id: string | undefined,
  request: NextRequest
) {
  const table = getResourceTable(endpoint);
  if (!table) return jsonError("Resource not found", 404);

  const { error: authError } = await requireAdmin(request);
  if (authError) return authError;

  const supabase = getSupabaseAdmin();

  if (method === "GET" && !id) {
    const { data, error } = await supabase.from(table).select("*").order("created_at", { ascending: false });
    if (error) return jsonError(error.message, 500);
    return jsonOk(toMongoIds(data || []));
  }

  if (method === "POST" && !id) {
    const body = await request.json();
    const { data, error } = await supabase.from(table).insert(body).select().single();
    if (error) return jsonError(error.message, 400);
    return jsonOk(toMongoId(data), 201);
  }

  if (method === "PUT" && id) {
    const body = await request.json();
    const { data, error } = await supabase.from(table).update(body).eq("id", id).select().single();
    if (error) return jsonError(error.message, 400);
    return jsonOk(toMongoId(data));
  }

  if (method === "DELETE" && id) {
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) return jsonError(error.message, 400);
    return jsonOk({ message: "Deleted" });
  }

  return jsonError("Not found", 404);
}

export async function handleGenericCrud(
  method: string,
  table: string,
  id: string | undefined,
  request: NextRequest,
  requireAdminAuth = true
) {
  if (requireAdminAuth) {
    const { error: authError } = await requireAdmin(request);
    if (authError) return authError;
  }

  const supabase = getSupabaseAdmin();

  if (method === "GET" && !id) {
    const { data, error } = await supabase.from(table).select("*").order("created_at", { ascending: false });
    if (error) return jsonError(error.message, 500);
    return jsonOk(toMongoIds(data || []));
  }

  if (method === "GET" && id) {
    const { data, error } = await supabase.from(table).select("*").eq("id", id).single();
    if (error) return jsonError("Not found", 404);
    return jsonOk(toMongoId(data));
  }

  if (method === "POST" && !id) {
    const body = await request.json();
    const { data, error } = await supabase.from(table).insert(body).select().single();
    if (error) return jsonError(error.message, 400);
    return jsonOk(toMongoId(data), 201);
  }

  if (method === "PUT" && id) {
    const body = await request.json();
    const { data, error } = await supabase.from(table).update(body).eq("id", id).select().single();
    if (error) return jsonError(error.message, 400);
    return jsonOk(toMongoId(data));
  }

  if (method === "DELETE" && id) {
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) return jsonError(error.message, 400);
    return jsonOk({ message: "Deleted" });
  }

  return jsonError("Not found", 404);
}
