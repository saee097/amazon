// @ts-nocheck
import { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/server/supabase/admin";
import { requireAuth, logAudit } from "../../lib/auth";
import {
  generateOrderNumber,
  mapCategory,
  mapOrder,
  mapProduct,
  toMongoIds,
} from "../../lib/mapper";
import { jsonError, jsonOk, jsonData } from "../../lib/response";
import { cartItemSchema, checkoutSchema } from "../../lib/validation";
import { validateJson } from "../../lib/validate";
import { parseProductFilters } from "../../lib/params";

async function loadProductsWithRelations(filters: {
  q?: string;
  slug?: string;
  id?: string;
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: string;
  inStock?: string;
  sizes?: string;
  colors?: string;
  page: number;
  limit: number;
  skip: number;
}) {
  const supabase = getSupabaseAdmin();
  let query = supabase
    .from("products")
    .select("*, categories(*), brands(*), product_variants(*), product_images(*)", { count: "exact" })
    .eq("status", "active");

  let categoryId: string | null = null;
  let brandId: string | null = null;

  if (filters.category) {
    const { data: catData } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", filters.category)
      .single();
    if (catData) categoryId = catData.id;
    else return { data: [], count: 0, pagination: { page: filters.page, limit: filters.limit, total: 0, totalPages: 0 } };
  }

  if (filters.brand) {
    const { data: brandData } = await supabase
      .from("brands")
      .select("id")
      .eq("slug", filters.brand)
      .single();
    if (brandData) brandId = brandData.id;
    else return { data: [], count: 0, pagination: { page: filters.page, limit: filters.limit, total: 0, totalPages: 0 } };
  }

  if (filters.slug) query = query.eq("slug", filters.slug);
  if (filters.id) query = query.eq("id", filters.id);
  if (filters.q) query = query.ilike("title", `%${filters.q}%`);
  if (categoryId) query = query.eq("category_id", categoryId);
  if (brandId) query = query.eq("brand_id", brandId);
  if (filters.minPrice) query = query.gte("price", filters.minPrice);
  if (filters.maxPrice) query = query.lte("price", filters.maxPrice);
  if (filters.inStock === "true") {
    query = query.gt("product_variants!inner.inventory_quantity", 0);
  }
  if (filters.sizes) {
    const sizeArr = filters.sizes.split(",").filter(Boolean);
    if (sizeArr.length > 0) {
      query = query.or(sizeArr.map((s) => `product_variants!inner.size.eq.${s}`).join(","));
    }
  }
  if (filters.colors) {
    const colorArr = filters.colors.split(",").filter(Boolean);
    if (colorArr.length > 0) {
      query = query.or(colorArr.map((c) => `product_variants!inner.color.eq.${c}`).join(","));
    }
  }

  const sortField = filters.sort ? filters.sort.replace(/^-/, "") : "created_at";
  const ascending = filters.sort ? !filters.sort.startsWith("-") : false;
  query = query.order(sortField, { ascending });

  query = query.range(filters.skip, filters.skip + filters.limit - 1);

  const { data, error, count } = await query;
  if (error) throw error;

  const products = (data || []).map((p) =>
    mapProduct(p, {
      category: p.categories,
      brand: p.brands,
      variants: p.product_variants || [],
      images: (p.product_images || []).sort(
        (a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order
      ),
    })
  );

  const total = count || 0;
  return {
    data: products,
    count: total,
    pagination: {
      page: filters.page,
      limit: filters.limit,
      total,
      totalPages: Math.ceil(total / filters.limit),
    },
  };
}

async function getOrCreateCart(userId: string) {
  const supabase = getSupabaseAdmin();
  let { data: cart } = await supabase.from("carts").select("*").eq("user_id", userId).single();

  if (!cart) {
    const { data: newCart } = await supabase
      .from("carts")
      .insert({ user_id: userId })
      .select()
      .single();
    cart = newCart;
  }
  return cart;
}

function calcCartTotals(items: { price: number; quantity: number }[], discount = 0) {
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const shipping = subtotal > 100 ? 0 : subtotal > 0 ? 9.99 : 0;
  const total = Math.max(0, subtotal + shipping - discount);
  return { subtotal: +subtotal.toFixed(2), shipping: +shipping.toFixed(2), discount, total: +total.toFixed(2) };
}

export async function handleStore(
  method: string,
  path: string[],
  request: NextRequest
) {
  const supabase = getSupabaseAdmin();
  const resource = path[1];

  // GET /store/products
  if (method === "GET" && resource === "products" && !path[2]) {
    const searchParams = request.nextUrl.searchParams;
    const filters = parseProductFilters(searchParams);
    const result = await loadProductsWithRelations(filters);
    return jsonData(result.data, { pagination: result.pagination });
  }

  // GET /store/products/:idOrSlug
  if (method === "GET" && resource === "products" && path[2]) {
    const idOrSlug = path[2];
    const isUuid = /^[0-9a-f-]{36}$/i.test(idOrSlug);

    let query = supabase
      .from("products")
      .select("*, categories(*), brands(*), product_variants(*), product_images(*), reviews(*, profiles(first_name, last_name))")
      .eq("status", "active");

    query = isUuid ? query.eq("id", idOrSlug) : query.eq("slug", idOrSlug);

    const { data: product, error } = await query.single();
    if (error || !product) return jsonError("Product not found", 404);

    return jsonOk(
      mapProduct(product, {
        category: product.categories,
        brand: product.brands,
        variants: product.product_variants || [],
        images: (product.product_images || []).sort(
          (a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order
        ),
        reviews: product.reviews || [],
      })
    );
  }

  // GET /store/categories
  if (method === "GET" && resource === "categories") {
    const { data } = await supabase
      .from("categories")
      .select("*")
      .eq("status", "active")
      .order("category_name");
    return jsonOk((data || []).map(mapCategory));
  }

  // GET /store/cart
  if (method === "GET" && resource === "cart") {
    const { user, error } = await requireAuth(request);
    if (error) return error;

    const cart = await getOrCreateCart(user!._id);
    const { data: items } = await supabase
      .from("cart_items")
      .select("*, products(*, product_images(*), categories(*), brands(*), product_variants(*))")
      .eq("cart_id", cart!.id);

    const mappedItems = (items || []).map((item) => ({
      _id: item.id,
      quantity: item.quantity,
      price: Number(item.price),
      lineTotal: +(Number(item.price) * item.quantity).toFixed(2),
      product: item.products
        ? mapProduct(item.products, {
            category: item.products.categories,
            brand: item.products.brands,
            variants: item.products.product_variants || [],
            images: item.products.product_images || [],
          })
        : null,
    }));

    const totals = calcCartTotals(
      mappedItems.map((i) => ({ price: i.price, quantity: i.quantity }))
    );

    return jsonOk({ _id: cart!.id, items: mappedItems, totals });
  }

  // DELETE /store/cart/items/:id
  if (method === "DELETE" && resource === "cart" && path[2] === "items" && path[3]) {
    const { user, error } = await requireAuth(request);
    if (error) return error;

    const { data: cart } = await supabase
      .from("carts")
      .select("id")
      .eq("user_id", user!._id)
      .single();

    if (!cart) return jsonError("Cart not found", 404);

    const { error: deleteError } = await supabase
      .from("cart_items")
      .delete()
      .eq("id", path[3])
      .eq("cart_id", cart.id);

    if (deleteError) return jsonError("Failed to remove item", 400);

    return jsonOk({ message: "Item removed from cart" });
  }

  // POST /store/cart
  if (method === "POST" && resource === "cart") {
    const { user, error } = await requireAuth(request);
    if (error) return error;

    const { data: body, error: validationError } = await validateJson(request, cartItemSchema);
    if (validationError) return validationError;

    const { productId, quantity = 1, variantId } = body;

    const { data: product } = await supabase
      .from("products")
      .select("id, status, price, product_variants(id, price, inventory_quantity)")
      .eq("id", productId)
      .eq("status", "active")
      .single();

    if (!product) return jsonError("Product not found or unavailable", 404);

    const variant = variantId
      ? product.product_variants?.find((v) => v.id === variantId)
      : product.product_variants?.[0];

    if (!variant) return jsonError("Product variant not found", 404);

    if ((variant.inventory_quantity ?? 0) < quantity) {
      return jsonError(`Only ${variant.inventory_quantity} units available`, 400);
    }

    const price = Number(variant.price);
    const cart = await getOrCreateCart(user!._id);

    const { data: existing } = await supabase
      .from("cart_items")
      .select("*")
      .eq("cart_id", cart!.id)
      .eq("product_id", productId)
      .eq("variant_id", variant.id)
      .maybeSingle();

    if (existing) {
      const newQty = existing.quantity + quantity;
      if ((variant.inventory_quantity ?? 0) < newQty) {
        return jsonError(`Only ${variant.inventory_quantity} units available`, 400);
      }
      await supabase
        .from("cart_items")
        .update({ quantity: newQty, price })
        .eq("id", existing.id);
    } else {
      await supabase.from("cart_items").insert({
        cart_id: cart!.id,
        product_id: productId,
        variant_id: variant.id,
        quantity,
        price,
      });
    }

    return jsonOk({ message: "Added to cart" });
  }

  // GET /store/wishlist
  if (method === "GET" && resource === "wishlist") {
    const { user, error } = await requireAuth(request);
    if (error) return error;

    const { data } = await supabase
      .from("wishlists")
      .select("*, products(*, product_images(*), categories(*), brands(*), product_variants(*))")
      .eq("user_id", user!._id);

    const items = (data || []).map((w) =>
      mapProduct(w.products, {
        category: w.products?.categories,
        brand: w.products?.brands,
        variants: w.products?.product_variants || [],
        images: w.products?.product_images || [],
      })
    );

    return jsonOk(items);
  }

  // GET /store/orders
  if (method === "GET" && resource === "orders") {
    const { user, error } = await requireAuth(request);
    if (error) return error;

    const { data: orders } = await supabase
      .from("orders")
      .select("*")
      .eq("user_id", user!._id)
      .order("created_at", { ascending: false });

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

  // GET /store/coupons/validate?code=XXX&subtotal=123
  if (method === "GET" && resource === "coupons" && path[2] === "validate") {
    const { user, error } = await requireAuth(request);
    if (error) return error;

    const code = (request.nextUrl.searchParams.get("code") || "").toUpperCase();
    const subtotal = Number(request.nextUrl.searchParams.get("subtotal") || 0);

    if (!code) return jsonError("Coupon code is required", 400);

    const { data: coupon } = await supabase
      .from("coupons")
      .select("*")
      .eq("code", code)
      .eq("status", "active")
      .single();

    if (!coupon) return jsonError("Coupon not found or inactive", 400);

    const now = new Date();
    if (coupon.start_date && new Date(coupon.start_date) > now) {
      return jsonError("Coupon is not yet active", 400);
    }
    if (coupon.expires_at && new Date(coupon.expires_at) <= now) {
      return jsonError("Coupon has expired", 400);
    }
    if (coupon.max_uses && coupon.used_count >= coupon.max_uses) {
      return jsonError("Coupon usage limit reached", 400);
    }
    if (subtotal < Number(coupon.min_order || 0)) {
      return jsonError(`Minimum order of $${Number(coupon.min_order || 0).toFixed(2)} required`, 400);
    }

    // Per-user usage check
    const { count: userUsageCount } = await supabase
      .from("coupon_usage")
      .select("*", { count: "exact", head: true })
      .eq("coupon_id", coupon.id)
      .eq("user_id", user!._id);

    if (coupon.per_user_usage_limit && (userUsageCount || 0) >= coupon.per_user_usage_limit) {
      return jsonError("You have already used this coupon the maximum number of times", 400);
    }

    let discount = 0;
    if (coupon.discount_type === "percentage") {
      discount = (subtotal * Number(coupon.discount_value)) / 100;
      if (coupon.max_discount && discount > Number(coupon.max_discount)) {
        discount = Number(coupon.max_discount);
      }
    } else {
      discount = Number(coupon.discount_value);
    }

    return jsonOk({
      valid: true,
      coupon: {
        code: coupon.code,
        discount_type: coupon.discount_type,
        discount_value: Number(coupon.discount_value),
        discount: +discount.toFixed(2),
        max_discount: coupon.max_discount ? Number(coupon.max_discount) : null,
        min_order: Number(coupon.min_order || 0),
      },
    });
  }

  // POST /store/checkout
  if (method === "POST" && resource === "checkout") {
    const { user, error } = await requireAuth(request);
    if (error) return error;

    const { data: body, error: validationError } = await validateJson(request, checkoutSchema);
    if (validationError) return validationError;

    const { addressId, paymentMethod = "cash_on_delivery", couponCode, idempotencyKey } = body;

    if (paymentMethod !== "cash_on_delivery") {
      return jsonError("This store is currently configured for cash on delivery only", 400);
    }

    if (!addressId) return jsonError("A saved shipping address is required", 400);

    if (!idempotencyKey) return jsonError("Idempotency key is required", 400);

    const existingKey = await supabase
      .from("idempotency_keys")
      .select("order_id, orders!inner(order_number, order_status)")
      .eq("key", idempotencyKey)
      .eq("user_id", user!._id)
      .maybeSingle();

    if (existingKey.data) {
      const orderId = (existingKey.data as { order_id: string }).order_id;
      const { data: existingOrder } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single();
      const { data: existingItems } = await supabase
        .from("order_items")
        .select("*, products(*, product_images(*))")
        .eq("order_id", orderId);
      return jsonOk(mapOrder(existingOrder!, existingItems || []), 200);
    }

    const { data: address } = await supabase
      .from("addresses")
      .select("id, street, city, state, country, zip")
      .eq("id", addressId)
      .eq("user_id", user!._id)
      .maybeSingle();

    if (!address) return jsonError("Shipping address was not found", 400);

    const cart = await getOrCreateCart(user!._id);
    const { data: items } = await supabase
      .from("cart_items")
      .select("*")
      .eq("cart_id", cart!.id);

    if (!items?.length) return jsonError("Cart is empty", 400);

    const productIds = items.map((i) => i.product_id);
    const { data: products } = await supabase
      .from("products")
      .select("id, status, price, product_variants(id, price, inventory_quantity, product_id)")
      .in("id", productIds);

    const productMap = new Map((products || []).map((p) => [p.id, p]));

    for (const item of items) {
      const product = productMap.get(item.product_id);
      if (!product || product.status !== "active") {
        return jsonError(`Product "${product?.title || item.product_id}" is no longer available`, 400);
      }

      const variant = item.variant_id
        ? product.product_variants?.find((v) => v.id === item.variant_id)
        : product.product_variants?.[0];

      if (!variant) {
        return jsonError(`Variant not found for product ${product.id}`, 400);
      }

      const currentPrice = Number(variant.price);
      const cartPrice = Number(item.price);

      if (currentPrice !== cartPrice) {
        return jsonError(
          `Price changed for "${product.title}". Current price: $${currentPrice.toFixed(2)}, cart price: $${cartPrice.toFixed(2)}. Please refresh your cart.`,
          400
        );
      }

      if ((variant.inventory_quantity ?? 0) < item.quantity) {
        return jsonError(`Insufficient inventory for "${product.title}". Only ${variant.inventory_quantity} left.`, 400);
      }
    }

    let discount = 0;
    let appliedCoupon: any = null;
    if (couponCode) {
      const { data: coupon } = await supabase
        .from("coupons")
        .select("*")
        .eq("code", couponCode.toUpperCase())
        .eq("status", "active")
        .single();

      if (!coupon) return jsonError("Coupon not found or inactive", 400);

      const now = new Date();
      if (coupon.start_date && new Date(coupon.start_date) > now) {
        return jsonError("Coupon is not yet active", 400);
      }
      if (coupon.expires_at && new Date(coupon.expires_at) <= now) {
        return jsonError("Coupon has expired", 400);
      }

      const subtotal = items.reduce((s, i) => s + Number(i.price) * i.quantity, 0);
      const meetsMinimum = subtotal >= Number(coupon.min_order || 0);
      const hasUsesRemaining = !coupon.max_uses || coupon.used_count < coupon.max_uses;
      if (!meetsMinimum || !hasUsesRemaining) {
        return jsonError("Coupon is no longer valid for this order", 400);
      }

      // Per-user usage check
      const { count: userUsageCount } = await supabase
        .from("coupon_usage")
        .select("*", { count: "exact", head: true })
        .eq("coupon_id", coupon.id)
        .eq("user_id", user!._id);

      if (coupon.per_user_usage_limit && (userUsageCount || 0) >= coupon.per_user_usage_limit) {
        return jsonError("You have already used this coupon the maximum number of times", 400);
      }

      if (coupon.discount_type === "percentage") {
        discount = (subtotal * Number(coupon.discount_value)) / 100;
        if (coupon.max_discount && discount > Number(coupon.max_discount)) {
          discount = Number(coupon.max_discount);
        }
      } else {
        discount = Number(coupon.discount_value);
      }

      appliedCoupon = coupon;

      await supabase
        .from("coupons")
        .update({ used_count: (coupon.used_count || 0) + 1 })
        .eq("id", coupon.id);
    }

    const totals = calcCartTotals(
      items.map((i) => ({ price: Number(i.price), quantity: i.quantity })),
      discount
    );

    const { data: warehouse } = await supabase
      .from("warehouses")
      .select("id")
      .eq("status", "active")
      .limit(1)
      .maybeSingle();

    if (!warehouse) return jsonError("No active warehouse available for inventory", 500);

    const reservedItems: { productId: string; variantId: string | null; quantity: number }[] = [];
    try {
      for (const item of items) {
        const variantId = item.variant_id;
        const { error: reserveError } = await supabase.rpc("reserve_inventory", {
          p_product_id: item.product_id,
          p_variant_id: variantId,
          p_warehouse_id: (warehouse as { id: string }).id,
          p_quantity: item.quantity,
        });
        if (reserveError) {
          throw new Error(`Insufficient inventory for product ${item.product_id}: ${reserveError.message}`);
        }
        reservedItems.push({ productId: item.product_id, variantId: variantId, quantity: item.quantity });
      }
    } catch (err) {
      for (const reserved of reservedItems) {
        try {
          await supabase.rpc("release_inventory", {
            p_product_id: reserved.productId,
            p_variant_id: reserved.variantId,
            p_warehouse_id: (warehouse as { id: string }).id,
            p_quantity: reserved.quantity,
          });
        } catch {
          // best-effort release
        }
      }
      return jsonError(err instanceof Error ? err.message : "Inventory reservation failed", 400);
    }

    const orderNumber = generateOrderNumber();
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: user!._id,
        order_number: orderNumber,
        order_status: "confirmed",
        payment_status: paymentMethod === "cash_on_delivery" ? "pending" : "paid",
        payment_method: paymentMethod,
        subtotal: totals.subtotal,
        shipping: totals.shipping,
        discount: totals.discount,
        total: totals.total,
        shipping_address: address,
        coupon_code: couponCode || null,
      })
      .select()
      .single();

    if (orderError) {
      for (const reserved of reservedItems) {
        try {
          await supabase.rpc("release_inventory", {
            p_product_id: reserved.productId,
            p_variant_id: reserved.variantId,
            p_warehouse_id: (warehouse as { id: string }).id,
            p_quantity: reserved.quantity,
          });
        } catch {
          // best-effort release
        }
      }
      return jsonError(orderError.message, 400);
    }

    const orderItems = items.map((item) => ({
      order_id: order.id,
      product_id: item.product_id,
      variant_id: item.variant_id,
      quantity: item.quantity,
      price: item.price,
      line_total: +(Number(item.price) * item.quantity).toFixed(2),
    }));

    await supabase.from("order_items").insert(orderItems);
    await supabase.from("cart_items").delete().eq("cart_id", cart!.id);

    await supabase.from("idempotency_keys").insert({
      key: idempotencyKey,
      order_id: order.id,
      user_id: user!._id,
    });

    // Record coupon usage for per-user tracking
    if (appliedCoupon) {
      await supabase.from("coupon_usage").insert({
        coupon_id: appliedCoupon.id,
        user_id: user!._id,
        order_id: order.id,
      });
    }

    for (const reserved of reservedItems) {
      try {
        await supabase.rpc("commit_inventory", {
          p_product_id: reserved.productId,
          p_variant_id: reserved.variantId,
          p_warehouse_id: (warehouse as { id: string }).id,
          p_quantity: reserved.quantity,
        });
      } catch {
        // Log but don't fail the order - inventory is already reserved
        console.error("Failed to commit inventory for order", order.id);
      }
    }

    await logAudit(user!._id, "ORDER_CREATED", "order", order.id, { order_number: order.order_number, total: totals.total });

    return jsonOk(mapOrder(order, orderItems), 201);
  }

  // GET /store/refunds
  if (method === "GET" && resource === "refunds") {
    const { user, error } = await requireAuth(request);
    if (error) return error;

    const { data } = await supabase
      .from("refunds")
      .select("*, orders(order_number)")
      .eq("user_id", user!._id)
      .order("created_at", { ascending: false });

    return jsonOk(toMongoIds(data || []));
  }

  return jsonError("Not found", 404);
}
