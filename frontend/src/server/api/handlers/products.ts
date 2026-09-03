import { NextRequest } from "next/server";
import { getSupabaseAdmin } from "../../supabase/admin";
import { requireAdmin, requireAuth } from "../../lib/auth";
import { mapBrand, mapCategory, mapProduct, toMongoId, toMongoIds } from "../../lib/mapper";
import { jsonError, jsonOk } from "../../lib/response";

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function handleProducts(
  method: string,
  path: string[],
  request: NextRequest
) {
  const supabase = getSupabaseAdmin();

  // GET /categories
  if (method === "GET" && path[0] === "categories" && !path[1]) {
    const { data } = await supabase.from("categories").select("*").order("category_name");
    return jsonOk((data || []).map(mapCategory));
  }

  // POST /categories
  if (method === "POST" && path[0] === "categories" && !path[1]) {
    const { error: authError } = await requireAdmin(request);
    if (authError) return authError;

    const body = await request.json();
    const slug = body.slug || slugify(body.category_name || body.name || "category");

    const { data, error } = await supabase
      .from("categories")
      .insert({
        category_name: body.category_name || body.name,
        slug,
        description: body.description,
        status: body.status || "active",
      })
      .select()
      .single();

    if (error) return jsonError(error.message, 400);
    return jsonOk(mapCategory(data), 201);
  }

  // GET /brands
  if (method === "GET" && path[0] === "brands" && !path[1]) {
    const { data } = await supabase.from("brands").select("*").order("brand_name");
    return jsonOk((data || []).map(mapBrand));
  }

  // GET /banners
  if (method === "GET" && path[0] === "banners") {
    const { data } = await supabase.from("banners").select("*").eq("status", "active").order("sort_order");
    return jsonOk(toMongoIds(data || []));
  }

  // GET /menu-items
  if (method === "GET" && path[0] === "menu-items") {
    const { data } = await supabase.from("menu_items").select("*").eq("status", "active").order("sort_order");
    return jsonOk(toMongoIds(data || []));
  }

  // GET /warehouses
  if (method === "GET" && path[0] === "warehouses") {
    const { data } = await supabase.from("warehouses").select("*").order("name");
    return jsonOk(toMongoIds(data || []));
  }

  // GET /coupons
  if (method === "GET" && path[0] === "coupons") {
    const { data } = await supabase.from("coupons").select("*").order("created_at", { ascending: false });
    return jsonOk(toMongoIds(data || []));
  }

  // GET /addresses
  if (method === "GET" && path[0] === "addresses") {
    const { user, error } = await requireAuth(request);
    if (error) return error;

    const { data } = await supabase.from("addresses").select("*").eq("user_id", user!._id);
    return jsonOk(toMongoIds(data || []));
  }

  // POST /addresses
  if (method === "POST" && path[0] === "addresses") {
    const { user, error } = await requireAuth(request);
    if (error) return error;

    const body = await request.json();
    const { data, error: insertError } = await supabase
      .from("addresses")
      .insert({
        user_id: user!._id,
        type: body.type || "shipping",
        street: body.street,
        city: body.city,
        state: body.state,
        country: body.country || "US",
        zip: body.zip,
        is_default: body.is_default || false,
      })
      .select()
      .single();

    if (insertError) return jsonError(insertError.message, 400);
    return jsonOk(toMongoId(data), 201);
  }

  // GET /returns?order=
  if (method === "GET" && path[0] === "returns") {
    const { user, error } = await requireAuth(request);
    if (error) return error;

    const orderId = request.nextUrl.searchParams.get("order");
    let query = supabase.from("returns").select("*").eq("user_id", user!._id);
    if (orderId) query = query.eq("order_id", orderId);

    const { data } = await query;
    return jsonOk(toMongoIds(data || []));
  }

  // GET /products/:id
  if (method === "GET" && path[0] === "products" && path[1]) {
    const { data: product, error } = await supabase
      .from("products")
      .select("*, categories(*), brands(*), product_variants(*), product_images(*)")
      .eq("id", path[1])
      .single();

    if (error || !product) return jsonError("Product not found", 404);

    return jsonOk(
      mapProduct(product, {
        category: product.categories,
        brand: product.brands,
        variants: product.product_variants || [],
        images: product.product_images || [],
      })
    );
  }

  // POST /products
  if (method === "POST" && path[0] === "products" && !path[1]) {
    const { error: authError } = await requireAdmin(request);
    if (authError) return authError;

    const body = await request.json();
    const slug = body.slug || slugify(body.title);

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

    if (error) return jsonError(error.message, 400);

    // Variants
    const variants = Array.isArray(body.variants) && body.variants.length > 0
      ? body.variants
      : [{ size: "One Size", color: "Default", price: body.price || 0, compare_price: body.compare_price, inventory_quantity: body.inventory_quantity || 0, sku: body.sku }];

    if (variants.length > 0) {
      await supabase.from("product_variants").insert(
        variants.map((v: Record<string, unknown>) => ({
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

    // Images
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
      .select("*, categories(*), brands(*), product_variants(*), product_images(*)")
      .eq("id", product.id)
      .single();

    return jsonOk(
      mapProduct(full, {
        category: full.categories,
        brand: full.brands,
        variants: full.product_variants || [],
        images: full.product_images || [],
      }),
      201
    );
  }

  // PUT /products/:id
  if (method === "PUT" && path[0] === "products" && path[1]) {
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

    const { data, error } = await supabase
      .from("products")
      .update(updates)
      .eq("id", path[1])
      .select()
      .single();

    if (error) return jsonError(error.message, 400);

    // Replace images if provided
    if (Array.isArray(body.images)) {
      await supabase.from("product_images").delete().eq("product_id", path[1]);
      if (body.images.length > 0) {
        await supabase.from("product_images").insert(
          body.images.map((img: Record<string, unknown>, idx: number) => ({
            product_id: path[1],
            image_url: img.image_url,
            alt_text: img.alt_text || data.title,
            sort_order: img.sort_order ?? idx,
            is_primary: img.is_primary ?? idx === 0,
          }))
        );
      }
    }

    // Replace variants if provided
    if (Array.isArray(body.variants)) {
      await supabase.from("product_variants").delete().eq("product_id", path[1]);
      if (body.variants.length > 0) {
        await supabase.from("product_variants").insert(
          body.variants.map((v: Record<string, unknown>) => ({
            product_id: path[1],
            size: v.size || "One Size",
            color: v.color || "Default",
            price: v.price ?? data.price,
            compare_price: v.compare_price ?? data.compare_price,
            inventory_quantity: v.inventory_quantity ?? 0,
            sku: v.sku ?? data.sku,
            weight: v.weight,
          }))
        );
      }
    }

    const { data: full } = await supabase
      .from("products")
      .select("*, categories(*), brands(*), product_variants(*), product_images(*)")
      .eq("id", path[1])
      .single();

    return jsonOk(
      mapProduct(full, {
        category: full.categories,
        brand: full.brands,
        variants: full.product_variants || [],
        images: full.product_images || [],
      })
    );
  }

  return jsonError("Not found", 404);
}

function jsonRawSuccess(data: Record<string, unknown>) {
  return jsonOk(mapProduct(data, { variants: [], images: [] }));
}
