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
  console.log("Testing Supabase client RPC...");

  // Test 1: Check warehouses
  const { data: warehouses, error: whError } = await supabase
    .from("warehouses")
    .select("id, name, status")
    .eq("status", "active");
  console.log("Warehouses:", warehouses?.length, whError?.message);

  // Test 2: Check stock
  const { data: stock, error: stockError } = await supabase
    .from("stock")
    .select("product_id, variant_id, available_quantity, warehouse_id")
    .eq("product_id", "41d39561-9451-4f10-bdc6-c1d7633c8f70");
  console.log("Stock for product:", stock?.length, stockError?.message);

  // Test 3: Call reserve_inventory RPC
  if (warehouses && warehouses.length > 0 && stock && stock.length > 0) {
    const wh = warehouses[0];
    const st = stock[0];
    console.log(`Calling reserve_inventory with product=${st.product_id}, variant=${st.variant_id}, warehouse=${wh.id}, qty=1`);

    const { data: rpcData, error: rpcError } = await supabase.rpc("reserve_inventory", {
      p_product_id: st.product_id,
      p_variant_id: st.variant_id,
      p_warehouse_id: wh.id,
      p_quantity: 1,
    });
    console.log("RPC result:", rpcData, rpcError?.message);

    // Release the inventory
    if (!rpcError) {
      const { error: relError } = await supabase.rpc("release_inventory", {
        p_product_id: st.product_id,
        p_variant_id: st.variant_id,
        p_warehouse_id: wh.id,
        p_quantity: 1,
      });
      console.log("Release result:", relError?.message || "OK");
    }
  }

  process.exit(0);
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
