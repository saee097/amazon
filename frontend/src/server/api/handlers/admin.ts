// @ts-nocheck
import { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/server/supabase/admin";
import { logAudit, requireAdmin } from "../../lib/auth";
import { handleLogs } from "./logs";
import { mapBrand, mapCategory, mapOrder, mapProduct, mapProfile, toMongoId, toMongoIds } from "../../lib/mapper";
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

  if (resource === "logs") {
    return handleLogs(method, path.slice(1), request);
  }

  const { user: admin, error: authError } = await requireAdmin(request);
  if (authError) return authError;

  // GET /admin/products
  if (method === "GET" && resource === "products") {
    const { data } = await supabase
      .from("products")
      .select("*, categories(*), brands(*)")
      .order("created_at", { ascending: false });

    const products = (data || []).map((p: any) =>
      mapProduct(p, {
        category: p.categories,
        brand: p.brands,
      })
    );
    return jsonOk(products);
  }

  // POST /admin/products
  if (method === "POST" && resource === "products") {
    const { error: authError } = await requireAdmin(request);
    if (authError) return authError;

    const body = await request.json();
    const slug = body.slug || body.title?.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

    const { data: product, error } = await supabase
      .from("products")
      .insert({
        title: body.title,
        slug,
        description: body.description,
        short_description: body.shortDescription,
        price: body.price || 0,
        compare_price: body.compare_price,
        cost_price: body.cost_price,
        category_id: body.category || null,
        brand_id: body.brand || null,
        sku: body.sku,
        barcode: body.barcode,
        status: body.status || "draft",
        weight: body.weight,
        weight_unit: body.weight_unit,
        dimensions: body.dimensions,
        taxable: body.taxable,
        requires_shipping: body.requires_shipping,
        is_featured: body.is_featured,
        meta_title: body.meta_title,
        meta_description: body.meta_description,
        tags: body.tags || [],
        low_stock_threshold: body.low_stock_threshold,
      })
      .select()
      .single();

    if (error || !product) return jsonError(error?.message || "Failed to create product", 400);

    const variants = Array.isArray(body.variants) && body.variants.length > 0
      ? body.variants as any[]
      : [{ size: "One Size", color: "Default", price: body.price || 0, compare_price: body.compare_price, inventory_quantity: body.inventory_quantity || 0, sku: body.sku }];

    if (variants.length > 0) {
      await supabase.from("product_variants").insert(
        variants.map((v: any) => ({
          product_id: product.id,
          size: v.size || "One Size",
          color: v.color || "Default",
          price: v.price ?? body.price ?? 0,
          compare_price: v.compare_price ?? body.compare_price,
          inventory_quantity: v.inventory_quantity ?? 0,
          sku: v.sku ?? body.sku,
          weight: v.weight,
        }))
      );
    }

    if (Array.isArray(body.images) && body.images.length > 0) {
      await supabase.from("product_images").insert(
        body.images.map((img: Record<string, unknown>, idx: number) => ({
          product_id: product.id,
          image_url: img.image_url,
          alt_text: img.alt_text || body.title,
          sort_order: img.sort_order ?? idx,
          is_primary: img.is_primary ?? idx === 0,
        }))
      );
    }

    const { data: full } = await supabase
      .from("products")
      .select("*, categories(*), brands(*)")
      .eq("id", product.id)
      .single();

    const { data: productVariants } = await supabase.from("product_variants").select("*").eq("product_id", product.id);
    const { data: images } = await supabase.from("product_images").select("*").eq("product_id", product.id).order("sort_order", { ascending: true });

    if (!full) return jsonOk(mapProduct(product as any, { category: null, brand: null, variants: [], images: [] }), 201);

    return jsonOk(mapProduct(full, { category: full.categories, brand: full.brands, variants: productVariants || [], images: (images || []) }), 201);
  }

  // PUT /admin/products/:id
  if (method === "PUT" && resource === "products" && id) {
    const { error: authError } = await requireAdmin(request);
    if (authError) return authError;

    const body = await request.json();
    const updates: Record<string, unknown> = {};
    if (body.title !== undefined) updates.title = body.title;
    if (body.slug !== undefined) updates.slug = body.slug;
    if (body.description !== undefined) updates.description = body.description;
    if (body.shortDescription !== undefined) updates.short_description = body.shortDescription;
    if (body.price !== undefined) updates.price = body.price;
    if (body.compare_price !== undefined) updates.compare_price = body.compare_price;
    if (body.cost_price !== undefined) updates.cost_price = body.cost_price;
    if (body.category !== undefined) updates.category_id = body.category || null;
    if (body.brand !== undefined) updates.brand_id = body.brand || null;
    if (body.sku !== undefined) updates.sku = body.sku;
    if (body.barcode !== undefined) updates.barcode = body.barcode;
    if (body.status !== undefined) updates.status = body.status;
    if (body.weight !== undefined) updates.weight = body.weight;
    if (body.weight_unit !== undefined) updates.weight_unit = body.weight_unit;
    if (body.dimensions !== undefined) updates.dimensions = body.dimensions;
    if (body.taxable !== undefined) updates.taxable = body.taxable;
    if (body.requires_shipping !== undefined) updates.requires_shipping = body.requires_shipping;
    if (body.is_featured !== undefined) updates.is_featured = body.is_featured;
    if (body.meta_title !== undefined) updates.meta_title = body.meta_title;
    if (body.meta_description !== undefined) updates.meta_description = body.meta_description;
    if (body.tags !== undefined) updates.tags = body.tags;
    if (body.low_stock_threshold !== undefined) updates.low_stock_threshold = body.low_stock_threshold;

    const { data, error } = await supabase.from("products").update(updates).eq("id", id).select().single();
    if (error || !data) return jsonError(error?.message || "Failed to update product", 400);

    if (Array.isArray(body.images)) {
      await supabase.from("product_images").delete().eq("product_id", id);
      if (body.images.length > 0) {
        await supabase.from("product_images").insert(
          body.images.map((img: Record<string, unknown>, idx: number) => ({
            product_id: id,
            image_url: img.image_url,
            alt_text: img.alt_text || (data as any).title,
            sort_order: img.sort_order ?? idx,
            is_primary: img.is_primary ?? idx === 0,
          }))
        );
      }
    }

    if (Array.isArray(body.variants)) {
      await supabase.from("product_variants").delete().eq("product_id", id);
      if (body.variants.length > 0) {
        await supabase.from("product_variants").insert(
          body.variants.map((v: Record<string, unknown>) => ({
            product_id: id,
            size: v.size || "One Size",
            color: v.color || "Default",
            price: v.price ?? (data as any).price,
            compare_price: v.compare_price ?? (data as any).compare_price,
            inventory_quantity: v.inventory_quantity ?? 0,
            sku: v.sku ?? (data as any).sku,
            weight: v.weight,
          }))
        );
      }
    }

    const { data: full } = await supabase
      .from("products")
      .select("*, categories(*), brands(*)")
      .eq("id", id)
      .single();

    const { data: productVariants } = await supabase.from("product_variants").select("*").eq("product_id", id);
    const { data: images } = await supabase.from("product_images").select("*").eq("product_id", id).order("sort_order", { ascending: true });

    if (!full) return jsonOk(mapProduct(data as any, { category: null, brand: null, variants: [], images: [] }));

    return jsonOk(mapProduct(full, { category: full.categories, brand: full.brands, variants: productVariants || [], images: (images || []) }));
  }

  // DELETE /admin/products/:id
  if (method === "DELETE" && resource === "products" && id) {
    const { error: authError } = await requireAdmin(request);
    if (authError) return authError;

    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) return jsonError(error.message, 400);
    return jsonOk({ message: "Product deleted" });
  }

  // GET /admin/categories
  if (method === "GET" && resource === "categories") {
    const { data } = await supabase.from("categories").select("*").order("category_name");
    return jsonOk((data || []).map(mapCategory));
  }

  // POST /admin/categories
  if (method === "POST" && resource === "categories") {
    const body = await request.json();
    const { data, error } = await supabase.from("categories").insert(body).select().single();
    if (error) return jsonError(error.message, 400);
    await logAudit(admin!._id, "create_category", "categories", data.id, body, request.headers.get("x-forwarded-for"));
    return jsonOk(mapCategory(data), 201);
  }

  // PUT /admin/categories/:id
  if (method === "PUT" && resource === "categories" && id) {
    const body = await request.json();
    const { data, error } = await supabase.from("categories").update(body).eq("id", id).select().single();
    if (error) return jsonError(error.message, 400);
    await logAudit(admin!._id, "update_category", "categories", id, body, request.headers.get("x-forwarded-for"));
    return jsonOk(mapCategory(data));
  }

  // DELETE /admin/categories/:id
  if (method === "DELETE" && resource === "categories" && id) {
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) return jsonError(error.message, 400);
    await logAudit(admin!._id, "delete_category", "categories", id, {}, request.headers.get("x-forwarded-for"));
    return jsonOk({ message: "Category deleted" });
  }

  // ─── BRANDS ─────────────────────────────────────────────────────────

  // GET /admin/brands
  if (method === "GET" && resource === "brands" && !id) {
    const { data } = await supabase.from("brands").select("*").order("brand_name");
    return jsonOk((data || []).map(mapBrand));
  }

  // GET /admin/brands/:id
  if (method === "GET" && resource === "brands" && id) {
    const { data, error } = await supabase.from("brands").select("*").eq("id", id).single();
    if (error || !data) return jsonError("Brand not found", 404);
    return jsonOk(mapBrand(data));
  }

  // POST /admin/brands
  if (method === "POST" && resource === "brands" && !id) {
    const { error: authError } = await requireAdmin(request);
    if (authError) return authError;
    const body = await request.json();
    const slug = body.slug || body.brand_name?.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const { data, error } = await supabase.from("brands").insert({ brand_name: body.brand_name, slug, description: body.description, logo_url: body.logo_url, status: body.status || "active" }).select().single();
    if (error) return jsonError(error.message, 400);
    return jsonOk(mapBrand(data), 201);
  }

  // PUT /admin/brands/:id
  if (method === "PUT" && resource === "brands" && id) {
    const { error: authError } = await requireAdmin(request);
    if (authError) return authError;
    const body = await request.json();
    const updates: Record<string, unknown> = {};
    if (body.brand_name !== undefined) updates.brand_name = body.brand_name;
    if (body.slug !== undefined) updates.slug = body.slug;
    if (body.description !== undefined) updates.description = body.description;
    if (body.logo_url !== undefined) updates.logo_url = body.logo_url;
    if (body.status !== undefined) updates.status = body.status;
    const { data, error } = await supabase.from("brands").update(updates).eq("id", id).select().single();
    if (error) return jsonError(error.message, 400);
    return jsonOk(mapBrand(data));
  }

  // DELETE /admin/brands/:id
  if (method === "DELETE" && resource === "brands" && id) {
    const { error: authError } = await requireAdmin(request);
    if (authError) return authError;
    const { error } = await supabase.from("brands").delete().eq("id", id);
    if (error) return jsonError(error.message, 400);
    return jsonOk({ message: "Brand deleted" });
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
      const { data: profile } = await supabase.from("profiles").select("*").eq("id", order.user_id).single();
      result.push({ ...mapOrder(order, items || []), customer: profile ? mapProfile(profile) : null });
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

  // DELETE /admin/orders/:id
  if (method === "DELETE" && resource === "orders" && id) {
    const { error } = await supabase.from("orders").delete().eq("id", id);
    if (error) return jsonError(error.message, 400);
    await logAudit(admin!._id, "delete_order", "orders", id, {}, request.headers.get("x-forwarded-for"));
    return jsonOk({ message: "Order deleted" });
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
        available_quantity: body.available_quantity ?? body.quantity ?? 0,
        reserved_quantity: body.reserved_quantity || 0,
        damaged_quantity: body.damaged_quantity || 0,
        incoming_quantity: body.incoming_quantity || 0,
      })
      .select()
      .single();
    if (error) return jsonError(error.message, 400);
    return jsonOk(toMongoId(data), 201);
  }

  // POST /admin/inventory/adjust
  if (method === "POST" && resource === "inventory" && id === "adjust") {
    const body = await request.json();
    const { warehouse_id, product_id, variant_id, quantity, movement_type, notes } = body;
    if (!warehouse_id || !product_id || !quantity || !movement_type) {
      return jsonError("warehouse_id, product_id, quantity, and movement_type are required", 400);
    }

    const { error: rpcError } = await supabase.rpc("adjust_inventory", {
      p_warehouse_id: warehouse_id,
      p_product_id: product_id,
      p_variant_id: variant_id || null,
      p_quantity: quantity,
      p_movement_type: movement_type,
      p_notes: notes || null,
      p_created_by: admin!._id,
    });
    if (rpcError) return jsonError(rpcError.message, 400);

    await logAudit(admin!._id, "inventory_adjusted", "inventory", product_id, { warehouse_id, quantity, movement_type }, request.headers.get("x-forwarded-for"));
    return jsonOk({ message: "Inventory adjusted" });
  }

  // GET /admin/inventory/movements
  if (method === "GET" && resource === "inventory" && id === "movements") {
    const limit = parseInt(request.nextUrl.searchParams.get("limit") || "50");
    const { data } = await supabase
      .from("inventory_movements")
      .select("*, warehouses(name), products(title), product_variants(size, color)")
      .order("created_at", { ascending: false })
      .limit(limit);
    return jsonOk(toMongoIds(data || []));
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

  // DELETE /admin/users/:id
  if (method === "DELETE" && resource === "users" && id) {
    const { error } = await supabase.from("profiles").delete().eq("id", id);
    if (error) return jsonError(error.message, 400);
    await logAudit(admin!._id, "delete_user", "users", id, {}, request.headers.get("x-forwarded-for"));
    return jsonOk({ message: "User deleted" });
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

  // POST /admin/customers
  if (method === "POST" && resource === "customers" && !id) {
    const { error: authError } = await requireAdmin(request);
    if (authError) return authError;
    const body = await request.json();
    const { data, error } = await supabase.from("profiles").insert({
      email: body.email,
      first_name: body.first_name,
      last_name: body.last_name,
      phone: body.phone || null,
      role: "customer",
      status: body.status || "active",
    }).select().single();
    if (error) return jsonError(error.message, 400);
    return jsonOk(mapProfile(data), 201);
  }

  // PUT /admin/customers/:id
  if (method === "PUT" && resource === "customers" && id) {
    const { error: authError } = await requireAdmin(request);
    if (authError) return authError;
    const body = await request.json();
    const updates: Record<string, unknown> = {};
    if (body.first_name !== undefined) updates.first_name = body.first_name;
    if (body.last_name !== undefined) updates.last_name = body.last_name;
    if (body.email !== undefined) updates.email = body.email;
    if (body.phone !== undefined) updates.phone = body.phone;
    if (body.status !== undefined) updates.status = body.status;
    if (body.role !== undefined) updates.role = body.role;
    const { data, error } = await supabase.from("profiles").update(updates).eq("id", id).select().single();
    if (error) return jsonError(error.message, 400);
    return jsonOk(mapProfile(data));
  }

  // DELETE /admin/customers/:id
  if (method === "DELETE" && resource === "customers" && id) {
    const { error: authError } = await requireAdmin(request);
    if (authError) return authError;
    const { error } = await supabase.from("profiles").delete().eq("id", id);
    if (error) return jsonError(error.message, 400);
    return jsonOk({ message: "Customer deleted" });
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

  // DELETE /admin/roles/:id
  if (method === "DELETE" && resource === "roles" && id) {
    const { error } = await supabase.from("roles").delete().eq("id", id);
    if (error) return jsonError(error.message, 400);
    return jsonOk({ message: "Role deleted" });
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

  // DELETE /admin/permissions/:id
  if (method === "DELETE" && resource === "permissions" && id) {
    const { error } = await supabase.from("permissions").delete().eq("id", id);
    if (error) return jsonError(error.message, 400);
    return jsonOk({ message: "Permission deleted" });
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

  // POST /admin/upload/image
  if (method === "POST" && resource === "upload" && id === "image") {
    const { error: authError } = await requireAdmin(request);
    if (authError) return authError;

    const formData = await request.formData();
    const file = formData.get("image") as File | null;

    if (!file) {
      return jsonError("No image file provided", 400);
    }

    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!validTypes.includes(file.type)) {
      return jsonError("Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed", 400);
    }

    if (file.size > 5 * 1024 * 1024) {
      return jsonError("File size must be less than 5MB", 400);
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 10);
    const ext = file.name.split(".").pop() || "jpg";
    const fileName = `${timestamp}-${random}.${ext}`;
    const filePath = `uploads/${fileName}`;

    // Ensure bucket exists
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some((b) => b.name === "images");
    if (!bucketExists) {
      await supabase.storage.createBucket("images", { public: true });
    }

    const { error: uploadError } = await supabase.storage
      .from("images")
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return jsonError("Failed to upload image", 500);
    }

    const { data: urlData } = supabase.storage.from("images").getPublicUrl(filePath);

    return jsonOk({ url: urlData.publicUrl });
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
