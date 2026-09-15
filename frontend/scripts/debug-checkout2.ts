import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import ws from "ws";

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnvFile(filename: string) {
  const envPath = resolve(__dirname, "..", filename);
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf-8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnvFile(".env.local");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

const supabase = createClient(url!, serviceKey!, {
  auth: { autoRefreshToken: false, persistSession: false },
  realtime: { transport: ws },
});

async function main() {
  console.log("=== Testing reserve_inventory via Supabase client ===\n");

  // Get warehouse (same query as checkout handler)
  const { data: wh, error: whError } = await supabase
    .from("warehouses")
    .select("id")
    .eq("status", "active")
    .limit(1)
    .maybeSingle();
  console.log("Warehouse:", wh?.id, whError?.message);
  if (whError) return;

  // Get cart items (simulating checkout handler)
  const userId = "82b3d361-5494-410a-8448-d4cc5d94a9ba";
  const { data: cart } = await supabase
    .from("carts")
    .select("id")
    .eq("user_id", userId);
  console.log("Carts:", cart?.length);

  if (cart && cart.length > 0) {
    const { data: items } = await supabase
      .from("cart_items")
      .select("*")
      .eq("cart_id", cart[0].id);
    console.log("Cart items:", items?.length);

    for (const item of items || []) {
      console.log(`\nItem: product=${item.product_id.slice(0,8)} variant=${item.variant_id ? item.variant_id.slice(0,8) : 'NULL'} qty=${item.quantity}`);

      // Check stock record exists
      const { data: stock } = await supabase
        .from("stock")
        .select("available_quantity, reserved_quantity, warehouse_id")
        .eq("product_id", item.product_id)
        .eq("warehouse_id", wh.id);
      console.log("Stock records:", stock);

      // Test reserve_inventory RPC
      console.log("Calling reserve_inventory...");
      const { data: rpcData, error: rpcError } = await supabase.rpc("reserve_inventory", {
        p_product_id: item.product_id,
        p_variant_id: item.variant_id,
        p_warehouse_id: wh.id,
        p_quantity: item.quantity,
      });
      console.log("RPC result:", rpcData, rpcError?.message, rpcError?.code);

      if (!rpcError) {
        // Release
        const { error: relError } = await supabase.rpc("release_inventory", {
          p_product_id: item.product_id,
          p_variant_id: item.variant_id,
          p_warehouse_id: wh.id,
          p_quantity: item.quantity,
        });
        console.log("Release:", relError?.message || "OK");
      }
    }
  }

  process.exit(0);
}

main().catch((err) => console.error(err));
