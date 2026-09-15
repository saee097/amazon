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
  // Get customer profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", "customer@amazonstore.com")
    .single();
  console.log("Profile:", profile?.id?.slice(0, 8));

  // Get carts for this user
  const { data: carts } = await supabase
    .from("carts")
    .select("id, user_id, created_at")
    .eq("user_id", profile!.id);
  console.log("Carts:", carts?.length);

  for (const cart of carts || []) {
    console.log(`\nCart: ${cart.id.slice(0, 8)}`);

    // Get cart items with full product/variant info
    const { data: items } = await supabase
      .from("cart_items")
      .select("*, products(id, title), product_variants(id, product_id, inventory_quantity)")
      .eq("cart_id", cart.id);
    console.log("Items:", items?.length);

    for (const item of items || []) {
      console.log(`  - product=${item.product_id.slice(0,8)} variant=${item.variant_id ? item.variant_id.slice(0,8) : 'NULL'} qty=${item.quantity} price=${item.price}`);
      console.log(`    variant inventory: ${item.product_variants?.inventory_quantity}`);
    }
  }

  // Get warehouse
  const { data: wh } = await supabase
    .from("warehouses")
    .select("id")
    .eq("status", "active")
    .limit(1)
    .maybeSingle();
  console.log("\nActive warehouse:", wh?.id?.slice(0, 8));

  // Check stock records for each product in the cart
  if (carts && carts.length > 0) {
    const { data: items } = await supabase
      .from("cart_items")
      .select("product_id, variant_id, quantity")
      .eq("cart_id", carts[0].id);

    for (const item of items || []) {
      const { data: stock } = await supabase
        .from("stock")
        .select("variant_id, available_quantity, warehouse_id")
        .eq("product_id", item.product_id)
        .eq("warehouse_id", wh!.id);
      console.log(`\nStock for product ${item.product_id.slice(0,8)} at warehouse ${wh!.id.slice(0,8)}:`);
      for (const s of stock || []) {
        const match = s.variant_id === item.variant_id;
        console.log(`  - variant=${s.variant_id ? s.variant_id.slice(0,8) : 'NULL'} avail=${s.available_quantity} ${match ? '✓ MATCH' : '✗ NO MATCH'}`);
      }
    }
  }

  process.exit(0);
}

main().catch((err) => console.error(err));
