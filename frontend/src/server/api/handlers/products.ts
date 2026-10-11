// @ts-nocheck
// Module reloaded to pick up updated getSupabaseAdmin client with ws transport
import { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/server/supabase/admin";
import { requireAdmin, requireAuth } from "../../lib/auth";
import { mapBrand, mapCategory, mapProduct, toMongoId, toMongoIds } from "../../lib/mapper";
import { jsonError, jsonOk } from "../../lib/response";
import { validateJson } from "../../lib/validate";
import { couponSchema, warehouseSchema, bannerSchema, menuItemSchema, brandSchema } from "../../lib/validation";

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
  const resource = path[0];
  const id = path[1];

  // ─── PRODUCTS ───────────────────────────────────────────────────────────────

  if (resource === "products") {
    if (method === "GET" && !id) {
      const q = request.nextUrl.searchParams.get("q");
      let query = supabase
        .from("products")
        .select("*, categories(*), brands(*)")
        .order("created_at", { ascending: false });
      if (q) query = query.ilike("title", `%${q}%`);
      const { data } = await query;
      return jsonOk((data || []).map((p) => mapProduct(p, { category: p.categories, brand: p.brands })));
    }

    if (method === "GET" && id) {
      const { data: product, error } = await supabase
        .from("products")
        .select("*, categories(*), brands(*)")
        .eq("id", id)
        .single();
      if (error || !product) return jsonError("Product not found", 404);

      const { data: productVariants } = await supabase.from("product_variants").select("*").eq("product_id", id);
      const { data: images } = await supabase.from("product_images").select("*").eq("product_id", id).order("sort_order", { ascending: true });
      const { data: reviews } = await supabase.from("reviews").select("*, profiles(first_name, last_name)").eq("product_id", id);

      return jsonOk(mapProduct(product, { category: product.categories, brand: product.brands, variants: productVariants || [], images: (images || []), reviews: reviews || [] }));
    }

    if (method === "POST" && !id) {
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

      return jsonOk(mapProduct(full, { category: full.categories, brand: full.brands, variants: productVariants || [], images: (images || []) }), 201);
    }

    if (method === "PUT" && id) {
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
      if (error) return jsonError(error.message, 400);

      if (Array.isArray(body.images)) {
        await supabase.from("product_images").delete().eq("product_id", id);
        if (body.images.length > 0) {
          await supabase.from("product_images").insert(
            body.images.map((img: Record<string, unknown>, idx: number) => ({
              product_id: id,
              image_url: img.image_url,
              alt_text: img.alt_text || data.title,
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
        .select("*, categories(*), brands(*)")
        .eq("id", id)
        .single();

      const { data: productVariants } = await supabase.from("product_variants").select("*").eq("product_id", id);
      const { data: images } = await supabase.from("product_images").select("*").eq("product_id", id).order("sort_order", { ascending: true });

      return jsonOk(mapProduct(full, { category: full.categories, brand: full.brands, variants: productVariants || [], images: (images || []) }));
    }

    if (method === "DELETE" && id) {
      const { error: authError } = await requireAdmin(request);
      if (authError) return authError;

      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) return jsonError(error.message, 400);
      return jsonOk({ message: "Product deleted" });
    }
  }

  // ─── CATEGORIES ─────────────────────────────────────────────────────────────

  if (resource === "categories") {
    if (method === "GET" && !id) {
      const { data } = await supabase.from("categories").select("*").order("category_name");
      return jsonOk((data || []).map(mapCategory));
    }

    if (method === "GET" && id) {
      const { data, error } = await supabase.from("categories").select("*").eq("id", id).single();
      if (error || !data) return jsonError("Category not found", 404);
      return jsonOk(mapCategory(data));
    }

    if (method === "POST" && !id) {
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

    if (method === "PUT" && id) {
      const { error: authError } = await requireAdmin(request);
      if (authError) return authError;

      const body = await request.json();
      const updates: Record<string, unknown> = {};
      if (body.category_name !== undefined) updates.category_name = body.category_name;
      if (body.name !== undefined) updates.category_name = body.name;
      if (body.slug !== undefined) updates.slug = body.slug;
      if (body.description !== undefined) updates.description = body.description;
      if (body.status !== undefined) updates.status = body.status;
      if (body.image_url !== undefined) updates.image_url = body.image_url;
      if (body.parent_id !== undefined) updates.parent_id = body.parent_id || null;

      const { data, error } = await supabase.from("categories").update(updates).eq("id", id).select().single();
      if (error) return jsonError(error.message, 400);
      return jsonOk(mapCategory(data));
    }

    if (method === "DELETE" && id) {
      const { error: authError } = await requireAdmin(request);
      if (authError) return authError;

      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) return jsonError(error.message, 400);
      return jsonOk({ message: "Category deleted" });
    }
  }

  // ─── BRANDS ─────────────────────────────────────────────────────────────────

  if (resource === "brands") {
    if (method === "GET" && !id) {
      const { data } = await supabase.from("brands").select("*").order("brand_name");
      return jsonOk((data || []).map(mapBrand));
    }

    if (method === "GET" && id) {
      const { data, error } = await supabase.from("brands").select("*").eq("id", id).single();
      if (error || !data) return jsonError("Brand not found", 404);
      return jsonOk(mapBrand(data));
    }

    if (method === "POST" && !id) {
      const { error: authError } = await requireAdmin(request);
      if (authError) return authError;

      const { data: body, error: validationError } = await validateJson(request, brandSchema);
      if (validationError) return validationError;
      const slug = body.slug || slugify(body.brand_name || "brand");

      const { data, error } = await supabase
        .from("brands")
        .insert({
          brand_name: body.brand_name,
          slug,
          description: body.description,
          logo_url: body.logo_url,
          status: body.status || "active",
        })
        .select()
        .single();

      if (error) return jsonError(error.message, 400);
      return jsonOk(mapBrand(data), 201);
    }

    if (method === "PUT" && id) {
      const { error: authError } = await requireAdmin(request);
      if (authError) return authError;

      const { data: body, error: validationError } = await validateJson(request, brandSchema.partial());
      if (validationError) return validationError;
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

    if (method === "DELETE" && id) {
      const { error: authError } = await requireAdmin(request);
      if (authError) return authError;

      const { error } = await supabase.from("brands").delete().eq("id", id);
      if (error) return jsonError(error.message, 400);
      return jsonOk({ message: "Brand deleted" });
    }
  }

  // ─── BANNERS ────────────────────────────────────────────────────────────────

  if (resource === "banners") {
    if (method === "GET" && !id) {
      const { data } = await supabase.from("banners").select("*").order("sort_order");
      return jsonOk(toMongoIds(data || []));
    }

    if (method === "GET" && id) {
      const { data, error } = await supabase.from("banners").select("*").eq("id", id).single();
      if (error || !data) return jsonError("Banner not found", 404);
      return jsonOk(toMongoId(data));
    }

    if (method === "POST" && !id) {
      const { error: authError } = await requireAdmin(request);
      if (authError) return authError;

      const { data: body, error: validationError } = await validateJson(request, bannerSchema);
      if (validationError) return validationError;
      const cleanBody = {
        heading: body.heading,
        subheading: body.subheading ?? null,
        image: body.image,
        link_url: body.link_url ?? null,
        sort_order: body.sort_order ?? 0,
        status: body.status ?? "active",
      };
      const { data, error } = await supabase.from("banners").insert(cleanBody).select().single();
      if (error) return jsonError(error.message, 400);
      return jsonOk(toMongoId(data), 201);
    }

    if (method === "PUT" && id) {
      const { error: authError } = await requireAdmin(request);
      if (authError) return authError;

      const { data: body, error: validationError } = await validateJson(request, bannerSchema.partial());
      if (validationError) return validationError;
      const cleanBody: Record<string, unknown> = {};
      if (body.heading !== undefined) cleanBody.heading = body.heading;
      if (body.subheading !== undefined) cleanBody.subheading = body.subheading ?? null;
      if (body.image !== undefined) cleanBody.image = body.image;
      if (body.link_url !== undefined) cleanBody.link_url = body.link_url ?? null;
      if (body.sort_order !== undefined) cleanBody.sort_order = Number(body.sort_order);
      if (body.status !== undefined) cleanBody.status = body.status;
      const { data, error } = await supabase.from("banners").update(cleanBody).eq("id", id).select().single();
      if (error) return jsonError(error.message, 400);
      return jsonOk(toMongoId(data));
    }

    if (method === "DELETE" && id) {
      const { error: authError } = await requireAdmin(request);
      if (authError) return authError;

      const { error } = await supabase.from("banners").delete().eq("id", id);
      if (error) return jsonError(error.message, 400);
      return jsonOk({ message: "Banner deleted" });
    }
  }

  // ─── MENU ITEMS ─────────────────────────────────────────────────────────────

  if (resource === "menu-items") {
    if (method === "GET" && !id) {
      const { data } = await supabase.from("menu_items").select("*").order("sort_order");
      return jsonOk(toMongoIds(data || []));
    }

    if (method === "GET" && id) {
      const { data, error } = await supabase.from("menu_items").select("*").eq("id", id).single();
      if (error || !data) return jsonError("Menu item not found", 404);
      return jsonOk(toMongoId(data));
    }

    if (method === "POST" && !id) {
      const { error: authError } = await requireAdmin(request);
      if (authError) return authError;

      const { data: body, error: validationError } = await validateJson(request, menuItemSchema);
      if (validationError) return validationError;
      const cleanBody = {
        title: body.title,
        url: body.url || "/",
        sort_order: body.sort_order ?? 0,
        status: body.status ?? "active",
      };
      const { data, error } = await supabase.from("menu_items").insert(cleanBody).select().single();
      if (error) return jsonError(error.message, 400);
      return jsonOk(toMongoId(data), 201);
    }

    if (method === "PUT" && id) {
      const { error: authError } = await requireAdmin(request);
      if (authError) return authError;

      const { data: body, error: validationError } = await validateJson(request, menuItemSchema.partial());
      if (validationError) return validationError;
      const cleanBody: Record<string, unknown> = {};
      if (body.title !== undefined) cleanBody.title = body.title;
      if (body.url !== undefined) cleanBody.url = body.url || "/";
      if (body.sort_order !== undefined) cleanBody.sort_order = Number(body.sort_order);
      if (body.status !== undefined) cleanBody.status = body.status;
      const { data, error } = await supabase.from("menu_items").update(cleanBody).eq("id", id).select().single();
      if (error) return jsonError(error.message, 400);
      return jsonOk(toMongoId(data));
    }

    if (method === "DELETE" && id) {
      const { error: authError } = await requireAdmin(request);
      if (authError) return authError;

      const { error } = await supabase.from("menu_items").delete().eq("id", id);
      if (error) return jsonError(error.message, 400);
      return jsonOk({ message: "Menu item deleted" });
    }
  }

  // ─── WAREHOUSES ─────────────────────────────────────────────────────────────

  if (resource === "warehouses") {
    if (method === "GET" && !id) {
      const { data } = await supabase.from("warehouses").select("*").order("name");
      return jsonOk(toMongoIds(data || []));
    }

    if (method === "GET" && id) {
      const { data, error } = await supabase.from("warehouses").select("*").eq("id", id).single();
      if (error || !data) return jsonError("Warehouse not found", 404);
      return jsonOk(toMongoId(data));
    }

    if (method === "POST" && !id) {
      const { error: authError } = await requireAdmin(request);
      if (authError) return authError;

      const { data: body, error: validationError } = await validateJson(request, warehouseSchema);
      if (validationError) return validationError;
      const { data, error } = await supabase.from("warehouses").insert(body).select().single();
      if (error) return jsonError(error.message, 400);
      return jsonOk(toMongoId(data), 201);
    }

    if (method === "PUT" && id) {
      const { error: authError } = await requireAdmin(request);
      if (authError) return authError;

      const { data: body, error: validationError } = await validateJson(request, warehouseSchema.partial());
      if (validationError) return validationError;
      const { data, error } = await supabase.from("warehouses").update(body).eq("id", id).select().single();
      if (error) return jsonError(error.message, 400);
      return jsonOk(toMongoId(data));
    }

    if (method === "DELETE" && id) {
      const { error: authError } = await requireAdmin(request);
      if (authError) return authError;

      const { error } = await supabase.from("warehouses").delete().eq("id", id);
      if (error) return jsonError(error.message, 400);
      return jsonOk({ message: "Warehouse deleted" });
    }
  }

  // ─── COUPONS ────────────────────────────────────────────────────────────────

  if (resource === "coupons") {
    if (method === "GET" && !id) {
    const { data } = await supabase.from("coupons").select("*").order("created_at", { ascending: false });
    return jsonOk(toMongoIds(data || []));
    }

    if (method === "GET" && id) {
      const { data, error } = await supabase.from("coupons").select("*").eq("id", id).single();
      if (error || !data) return jsonError("Coupon not found", 404);
      return jsonOk(toMongoId(data));
    }

    if (method === "POST" && !id) {
      const { error: authError } = await requireAdmin(request);
      if (authError) return authError;

      const { data: body, error: validationError } = await validateJson(request, couponSchema);
      if (validationError) return validationError;
      const { data, error } = await supabase.from("coupons").insert(body).select().single();
      if (error) return jsonError(error.message, 400);
      return jsonOk(toMongoId(data), 201);
    }

    if (method === "PUT" && id) {
      const { error: authError } = await requireAdmin(request);
      if (authError) return authError;

      const { data: body, error: validationError } = await validateJson(request, couponSchema.partial());
      if (validationError) return validationError;
      const { data, error } = await supabase.from("coupons").update(body).eq("id", id).select().single();
      if (error) return jsonError(error.message, 400);
      return jsonOk(toMongoId(data));
    }

    if (method === "DELETE" && id) {
      const { error: authError } = await requireAdmin(request);
      if (authError) return authError;

      const { error } = await supabase.from("coupons").delete().eq("id", id);
      if (error) return jsonError(error.message, 400);
      return jsonOk({ message: "Coupon deleted" });
    }
  }

  // ─── ADDRESSES ──────────────────────────────────────────────────────────────

  if (resource === "addresses") {
    if (method === "GET" && !id) {
      const { user, error } = await requireAuth(request);
      if (error) return error;

      const { data } = await supabase.from("addresses").select("*").eq("user_id", user!._id);
      return jsonOk(toMongoIds(data || []));
    }

    if (method === "GET" && id) {
      const { user, error } = await requireAuth(request);
      if (error) return error;

      const { data, error: fetchError } = await supabase.from("addresses").select("*").eq("id", id).eq("user_id", user!._id).single();
      if (fetchError || !data) return jsonError("Address not found", 404);
      return jsonOk(toMongoId(data));
    }

    if (method === "POST" && !id) {
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

    if (method === "PUT" && id) {
      const { user, error } = await requireAuth(request);
      if (error) return error;

      const body = await request.json();
      const { data, error: updateError } = await supabase
        .from("addresses")
        .update(body)
        .eq("id", id)
        .eq("user_id", user!._id)
        .select()
        .single();

      if (updateError) return jsonError(updateError.message, 400);
      return jsonOk(toMongoId(data));
    }

    if (method === "DELETE" && id) {
      const { user, error } = await requireAuth(request);
      if (error) return error;

      const { error: deleteError } = await supabase.from("addresses").delete().eq("id", id).eq("user_id", user!._id);
      if (deleteError) return jsonError(deleteError.message, 400);
      return jsonOk({ message: "Address deleted" });
    }
  }

  // ─── RETURNS ────────────────────────────────────────────────────────────────

  if (resource === "returns") {
    if (method === "GET" && !id) {
      const { user, error } = await requireAuth(request);
      if (error) return error;

      const orderId = request.nextUrl.searchParams.get("order");
      let query = supabase.from("returns").select("*").eq("user_id", user!._id);
      if (orderId) query = query.eq("order_id", orderId);

      const { data } = await query;
      return jsonOk(toMongoIds(data || []));
    }

    if (method === "GET" && id) {
      const { user, error } = await requireAuth(request);
      if (error) return error;

      const { data, error: fetchError } = await supabase.from("returns").select("*").eq("id", id).eq("user_id", user!._id).single();
      if (fetchError || !data) return jsonError("Return not found", 404);
      return jsonOk(toMongoId(data));
    }

    if (method === "POST" && !id) {
      const { user, error } = await requireAuth(request);
      if (error) return error;

      const body = await request.json();
      const { data, error: insertError } = await supabase
        .from("returns")
        .insert({
          user_id: user!._id,
          order_id: body.order_id,
          reason: body.reason,
          status: "requested",
        })
        .select()
        .single();

      if (insertError) return jsonError(insertError.message, 400);
      return jsonOk(toMongoId(data), 201);
    }
  }

  return jsonError("Not found", 404);
}
