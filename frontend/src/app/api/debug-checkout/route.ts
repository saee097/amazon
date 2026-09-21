// @ts-nocheck
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/server/supabase/admin";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const userId = url.searchParams.get("userId") || "82b3d361-5494-410a-8448-d4cc5d94a9ba";

  try {
    const supabase = getSupabaseAdmin();

    // Get warehouse (same as checkout handler)
    const { data: warehouse, error: whError } = await supabase
      .from("warehouses")
      .select("id")
      .eq("status", "active")
      .limit(1)
      .maybeSingle();

    if (whError || !warehouse) {
      return NextResponse.json({ error: "No warehouse", whError: whError?.message });
    }

    // Get cart items (same as checkout handler)
    const { data: cart } = await supabase
      .from("carts")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (!cart) {
      return NextResponse.json({ error: "No cart found", warehouse: (warehouse as { id: string }).id });
    }

    const { data: items, error: itemsError } = await supabase
      .from("cart_items")
      .select("*")
      .eq("cart_id", (cart as { id: string }).id);

    if (itemsError) {
      return NextResponse.json({ error: "Items query failed", itemsError: itemsError.message, cart: (cart as { id: string }).id });
    }

    // Get products (same as checkout handler)
    const productIds = items?.map((i) => i.product_id) || [];
    const { data: products } = await supabase
      .from("products")
      .select("id, status, price, product_variants(id, price, inventory_quantity)")
      .in("id", productIds);

    const productMap = new Map((products || []).map((p) => [p.id, p]));

    const results = [];
    for (const item of items || []) {
      const product = productMap.get(item.product_id);
      const variant = item.variant_id
        ? product?.product_variants?.find((v) => v.id === item.variant_id)
        : product?.product_variants?.[0];

      const itemResult = {
        product_id: item.product_id,
        variant_id: item.variant_id,
        found_variant: variant ? variant.id : null,
        quantity: item.quantity,
        warehouse_id: (warehouse as { id: string }).id,
        has_stock: false,
        rpc_result: null as any,
      };

      if (variant) {
        // Check stock record directly
        const { data: stock } = await supabase
          .from("stock")
          .select("available_quantity")
          .eq("product_id", item.product_id)
          .eq("variant_id", item.variant_id || null)
          .eq("warehouse_id", (warehouse as { id: string }).id);
        itemResult.has_stock = stock && stock.length > 0;

        // Call reserve_inventory
        const { data: rpcData, error: rpcError } = await supabase.rpc("reserve_inventory", {
          p_product_id: item.product_id,
          p_variant_id: item.variant_id,
          p_warehouse_id: (warehouse as { id: string }).id,
          p_quantity: item.quantity,
        });
        itemResult.rpc_result = {
          data: rpcData,
          error: rpcError ? { message: rpcError.message, code: rpcError.code, details: rpcError.details, hint: rpcError.hint } : null,
        };

        // Release if succeeded
        if (!rpcError) {
          await supabase.rpc("release_inventory", {
            p_product_id: item.product_id,
            p_variant_id: item.variant_id,
            p_warehouse_id: (warehouse as { id: string }).id,
            p_quantity: item.quantity,
          });
        }
      }

      results.push(itemResult);
    }

    return NextResponse.json({
      user_id: userId,
      cart_id: (cart as { id: string }).id,
      warehouse: (warehouse as { id: string }).id,
      items_count: items?.length || 0,
      results,
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message, stack: (err as Error).stack }, { status: 500 });
  }
}
