import { NextRequest } from "next/server";
import { getSupabaseAdmin } from "../../supabase/admin";
import { requireAuth } from "../../lib/auth";
import {
  generateOrderNumber,
  mapCategory,
  mapOrder,
  mapProduct,
  toMongoIds,
} from "../../lib/mapper";
import { jsonError, jsonOk } from "../../lib/response";

async function loadProductsWithRelations(filters?: { q?: string; slug?: string; id?: string }) {
  const supabase = getSupabaseAdmin();
  let query = supabase
    .from("products")
    .select("*, categories(*), brands(*), product_variants(*), product_images(*)")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (filters?.slug) query = query.eq("slug", filters.slug);
  if (filters?.id) query = query.eq("id", filters.id);
  if (filters?.q) query = query.ilike("title", `%${filters.q}%`);

  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map((p) =>
    mapProduct(p, {
      category: p.categories,
      brand: p.brands,
      variants: p.product_variants || [],
      images: (p.product_images || []).sort(
        (a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order
      ),
    })
  );
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
    const q = request.nextUrl.searchParams.get("q") || undefined;
    const products = await loadProductsWithRelations({ q });
    return jsonOk(products);
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

  // POST /store/cart
  if (method === "POST" && resource === "cart") {
    const { user, error } = await requireAuth(request);
    if (error) return error;

    const body = await request.json();
    const { productId, quantity = 1 } = body;
    if (!productId) return jsonError("Product ID required", 400);

    const { data: product } = await supabase.from("products").select("*, product_variants(*)").eq("id", productId).single();
    if (!product) return jsonError("Product not found", 404);

    const variant = product.product_variants?.[0];
    const price = variant ? Number(variant.price) : Number(product.price);
    const cart = await getOrCreateCart(user!._id);

    const { data: existing } = await supabase
      .from("cart_items")
      .select("*")
      .eq("cart_id", cart!.id)
      .eq("product_id", productId)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("cart_items")
        .update({ quantity: existing.quantity + quantity })
        .eq("id", existing.id);
    } else {
      await supabase.from("cart_items").insert({
        cart_id: cart!.id,
        product_id: productId,
        variant_id: variant?.id || null,
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

  // POST /store/checkout
  if (method === "POST" && resource === "checkout") {
    const { user, error } = await requireAuth(request);
    if (error) return error;

    const body = await request.json();
    const { addressId, paymentMethod = "cash_on_delivery", couponCode } = body;

    if (paymentMethod !== "cash_on_delivery") {
      return jsonError("This store is currently configured for cash on delivery only", 400);
    }

    if (!addressId) return jsonError("A saved shipping address is required", 400);

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

    let discount = 0;
    if (couponCode) {
      const { data: coupon } = await supabase
        .from("coupons")
        .select("*")
        .eq("code", couponCode.toUpperCase())
        .eq("status", "active")
        .single();

      if (!coupon) return jsonError("Coupon not found or inactive", 400);

      const subtotal = items.reduce((s, i) => s + Number(i.price) * i.quantity, 0);
      const meetsMinimum = subtotal >= Number(coupon.min_order || 0);
      const hasUsesRemaining = !coupon.max_uses || coupon.used_count < coupon.max_uses;
      if (!meetsMinimum || !hasUsesRemaining || (coupon.expires_at && new Date(coupon.expires_at) <= new Date())) {
        return jsonError("Coupon is no longer valid for this order", 400);
      }
      if (coupon.discount_type === "percentage") {
        discount = (subtotal * Number(coupon.discount_value)) / 100;
      } else {
        discount = Number(coupon.discount_value);
      }
      await supabase
        .from("coupons")
        .update({ used_count: (coupon.used_count || 0) + 1 })
        .eq("id", coupon.id);
    }

    const totals = calcCartTotals(
      items.map((i) => ({ price: Number(i.price), quantity: i.quantity })),
      discount
    );

    const orderNumber = generateOrderNumber();
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: user!._id,
        order_number: orderNumber,
        order_status: "pending",
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

    if (orderError) return jsonError(orderError.message, 400);

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

    return jsonOk(mapOrder(order, orderItems));
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
