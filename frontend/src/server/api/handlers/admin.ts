import { NextRequest } from "next/server";
import { getSupabaseAdmin } from "../../supabase/admin";
import { logAudit, requireAdmin } from "../../lib/auth";
import { mapCategory, mapOrder, mapProduct, mapProfile, toMongoId, toMongoIds } from "../../lib/mapper";
import { getPermissionsForRole } from "../../lib/permissions";
import { jsonError, jsonOk, jsonData } from "../../lib/response";

export async function handleAdmin(
  method: string,
  path: string[],
  request: NextRequest
) {
  const supabase = getSupabaseAdmin();
  const resource = path[1];
  const id = path[2];

  const { user: admin, error: authError } = await requireAdmin(request);
  if (authError && resource !== "system") return authError;

  // GET /admin/products
  if (method === "GET" && resource === "products") {
    const { data } = await supabase
      .from("products")
      .select("*, categories(*), brands(*), product_variants(*), product_images(*)")
      .order("created_at", { ascending: false });

    const products = (data || []).map((p) =>
      mapProduct(p, {
        category: p.categories,
        brand: p.brands,
        variants: p.product_variants || [],
        images: p.product_images || [],
      })
    );
    return jsonOk(products);
  }

  // GET /admin/categories
  if (method === "GET" && resource === "categories") {
    const { data } = await supabase.from("categories").select("*").order("category_name");
    return jsonOk((data || []).map(mapCategory));
  }

  // GET /admin/orders
  if (method === "GET" && resource === "orders" && !id) {
    const { data: orders } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
    const result = [];
    for (const order of orders || []) {
      const { data: items } = await supabase
        .from("order_items")
        .select("*, products(*, product_images(*))")
        .eq("order_id", order.id);
      result.push(mapOrder(order, items || []));
    }
    return jsonOk(result);
  }

  // GET /admin/orders/:id
  if (method === "GET" && resource === "orders" && id) {
    const { data: order, error } = await supabase.from("orders").select("*").eq("id", id).single();
    if (error || !order) return jsonError("Order not found", 404);

    const { data: items } = await supabase
      .from("order_items")
      .select("*, products(*, product_images(*))")
      .eq("order_id", id);

    const { data: profile } = await supabase.from("profiles").select("*").eq("id", order.user_id).single();

    return jsonOk({ ...mapOrder(order, items || []), customer: profile ? mapProfile(profile) : null });
  }

  // PUT /admin/orders/:id
  if (method === "PUT" && resource === "orders" && id) {
    const body = await request.json();
    const updates: Record<string, unknown> = {};
    if (body.order_status) updates.order_status = body.order_status;
    if (body.payment_status) updates.payment_status = body.payment_status;

    const { data, error } = await supabase.from("orders").update(updates).eq("id", id).select().single();
    if (error) return jsonError(error.message, 400);

    await logAudit(admin!._id, "update_order", "orders", id, updates, request.headers.get("x-forwarded-for"));
    return jsonOk(mapOrder(data));
  }

  // GET /admin/inventory
  if (method === "GET" && resource === "inventory") {
    const { data } = await supabase
      .from("product_variants")
      .select("*, products(title, slug, sku)")
      .order("inventory_quantity", { ascending: true });

    const inventory = (data || []).map((v) => ({
      _id: v.id,
      product: v.products,
      size: v.size,
      color: v.color,
      sku: v.sku,
      inventory_quantity: v.inventory_quantity,
      status: v.inventory_quantity <= 0 ? "out_of_stock" : v.inventory_quantity < 10 ? "low_stock" : "in_stock",
    }));
    return jsonOk(inventory);
  }

  // GET /admin/stock
  if (method === "GET" && resource === "stock") {
    const { data } = await supabase
      .from("stock")
      .select("*, warehouses(name), products(title), product_variants(size, color)")
      .order("updated_at", { ascending: false });
    return jsonOk(toMongoIds(data || []));
  }

  // POST /admin/stock
  if (method === "POST" && resource === "stock") {
    const body = await request.json();
    const { data, error } = await supabase
      .from("stock")
      .insert({
        warehouse_id: body.warehouse_id || body.warehouse,
        product_id: body.product_id || body.product,
        variant_id: body.variant_id || body.variant || null,
        quantity: body.quantity || 0,
      })
      .select()
      .single();
    if (error) return jsonError(error.message, 400);
    return jsonOk(toMongoId(data), 201);
  }

  // GET /admin/users
  if (method === "GET" && resource === "users") {
    const page = parseInt(request.nextUrl.searchParams.get("page") || "1");
    const limit = parseInt(request.nextUrl.searchParams.get("limit") || "20");
    const role = request.nextUrl.searchParams.get("role");
    const status = request.nextUrl.searchParams.get("status");
    const search = request.nextUrl.searchParams.get("search");

    let query = supabase.from("profiles").select("*", { count: "exact" });

    if (role) query = query.eq("role", role);
    if (status) query = query.eq("status", status);
    if (search) {
      query = query.or(`email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%`);
    }

    const from = (page - 1) * limit;
    query = query.range(from, from + limit - 1).order("created_at", { ascending: false });

    const { data, count } = await query;
    const totalPages = Math.max(1, Math.ceil((count || 0) / limit));
    return jsonData((data || []).map(mapProfile), { totalPages });
  }

  // POST /admin/users
  if (method === "POST" && resource === "users") {
    const body = await request.json();
    const { data: authData, error } = await supabase.auth.admin.createUser({
      email: body.email,
      password: body.password || "TempPass123!",
      email_confirm: true,
      user_metadata: {
        first_name: body.first_name || body.firstName,
        last_name: body.last_name || body.lastName,
        username: body.username,
      },
    });

    if (error) return jsonError(error.message, 400);

    const role = body.role || "customer";
    await supabase
      .from("profiles")
      .update({
        first_name: body.first_name || body.firstName,
        last_name: body.last_name || body.lastName,
        username: body.username,
        phone: body.phone,
        role,
        status: body.status || "active",
        permissions: getPermissionsForRole(role),
      })
      .eq("id", authData.user.id);

    const { data: profile } = await supabase.from("profiles").select("*").eq("id", authData.user.id).single();
    return jsonOk(mapProfile(profile!), 201);
  }

  // PUT /admin/users/:id
  if (method === "PUT" && resource === "users" && id) {
    const body = await request.json();
    const updates: Record<string, unknown> = {};
    if (body.first_name !== undefined) updates.first_name = body.first_name;
    if (body.last_name !== undefined) updates.last_name = body.last_name;
    if (body.phone !== undefined) updates.phone = body.phone;
    if (body.role) {
      updates.role = body.role;
      updates.permissions = getPermissionsForRole(body.role);
    }
    if (body.status) updates.status = body.status;

    const { data, error } = await supabase.from("profiles").update(updates).eq("id", id).select().single();
    if (error) return jsonError(error.message, 400);
    return jsonOk(mapProfile(data));
  }

  // POST /admin/users/bulk
  if (method === "POST" && resource === "users" && id === "bulk") {
    const body = await request.json();
    const { userIds, action } = body;
    if (!userIds?.length) return jsonError("No users selected", 400);

    const statusMap: Record<string, string> = {
      block: "blocked",
      activate: "active",
      suspend: "suspended",
    };

    if (statusMap[action]) {
      await supabase.from("profiles").update({ status: statusMap[action] }).in("id", userIds);
    }

    return jsonOk({ message: `Bulk action ${action} completed` });
  }

  // GET /admin/customers
  if (method === "GET" && resource === "customers") {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "customer")
      .order("created_at", { ascending: false });
    return jsonOk((data || []).map(mapProfile));
  }

  // GET /admin/roles
  if (method === "GET" && resource === "roles") {
    const { data } = await supabase.from("roles").select("*").order("name");
    return jsonOk(toMongoIds(data || []));
  }

  // POST /admin/roles
  if (method === "POST" && resource === "roles") {
    const body = await request.json();
    const { data, error } = await supabase.from("roles").insert(body).select().single();
    if (error) return jsonError(error.message, 400);
    return jsonOk(toMongoId(data), 201);
  }

  // PUT /admin/roles/:id
  if (method === "PUT" && resource === "roles" && id) {
    const body = await request.json();
    const { data, error } = await supabase.from("roles").update(body).eq("id", id).select().single();
    if (error) return jsonError(error.message, 400);
    return jsonOk(toMongoId(data));
  }

  // GET /admin/permissions
  if (method === "GET" && resource === "permissions") {
    const { data } = await supabase.from("permissions").select("*").order("name");
    return jsonOk(toMongoIds(data || []));
  }

  // POST /admin/permissions
  if (method === "POST" && resource === "permissions") {
    const body = await request.json();
    const { data, error } = await supabase.from("permissions").insert(body).select().single();
    if (error) return jsonError(error.message, 400);
    return jsonOk(toMongoId(data), 201);
  }

  // PUT /admin/permissions/:id
  if (method === "PUT" && resource === "permissions" && id) {
    const body = await request.json();
    const { data, error } = await supabase.from("permissions").update(body).eq("id", id).select().single();
    if (error) return jsonError(error.message, 400);
    return jsonOk(toMongoId(data));
  }

  // GET /admin/settings
  if (method === "GET" && resource === "settings" && !id) {
    const { data } = await supabase.from("app_settings").select("*");
    const settings: Record<string, unknown> = {};
    for (const row of data || []) {
      settings[row.category] = row.settings;
    }
    return jsonOk(settings);
  }

  // PUT /admin/settings
  if (method === "PUT" && resource === "settings" && !id) {
    const body = await request.json();
    const categories = Object.keys(body);
    for (const category of categories) {
      await supabase
        .from("app_settings")
        .upsert({ category, settings: body[category] }, { onConflict: "category" });
    }
    return jsonOk({ message: "Settings updated" });
  }

  // PUT /admin/settings/:id — legacy single-setting update
  if (method === "PUT" && resource === "settings" && id) {
    const body = await request.json();
    const { data, error } = await supabase
      .from("app_settings")
      .update({ settings: body })
      .eq("id", id)
      .select()
      .single();
    if (error) return jsonError(error.message, 400);
    return jsonOk(toMongoId(data));
  }

  // POST /admin/settings
  if (method === "POST" && resource === "settings") {
    const body = await request.json();
    const { data, error } = await supabase.from("app_settings").insert(body).select().single();
    if (error) return jsonError(error.message, 400);
    return jsonOk(toMongoId(data), 201);
  }

  // GET /admin/logs
  if (method === "GET" && resource === "logs") {
    const limit = parseInt(request.nextUrl.searchParams.get("limit") || "50");
    const { data } = await supabase
      .from("audit_logs")
      .select("*, profiles(first_name, last_name, email)")
      .order("created_at", { ascending: false })
      .limit(limit);
    return jsonOk(toMongoIds(data || []));
  }

  // GET /admin/logs/export
  if (method === "GET" && resource === "logs" && id === "export") {
    const { data } = await supabase.from("audit_logs").select("*").order("created_at", { ascending: false });
    const csv = ["id,action,resource,created_at", ...(data || []).map((l) =>
      `${l.id},${l.action},${l.resource},${l.created_at}`
    )].join("\n");

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": "attachment; filename=audit-logs.csv",
      },
    });
  }

  // GET /admin/shipments
  if (method === "GET" && resource === "shipments") {
    const { data } = await supabase
      .from("shipments")
      .select("*, orders(order_number)")
      .order("created_at", { ascending: false });
    return jsonOk(toMongoIds(data || []));
  }

  // GET /admin/system/health
  if (method === "GET" && resource === "system" && id === "health") {
    const checks = {
      database: "healthy",
      api: "healthy",
      storage: "healthy",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };

    try {
      await supabase.from("profiles").select("id").limit(1);
    } catch {
      checks.database = "unhealthy";
    }

    return jsonOk(checks);
  }

  return jsonError("Not found", 404);
}
