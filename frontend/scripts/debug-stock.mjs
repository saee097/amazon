import { createClient } from "@supabase/supabase-js";
import ws from "ws";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

function loadEnvFile(filename) {
  const envPath = resolve(process.cwd(), filename);
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
loadEnvFile(".env.production.local");

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false }, realtime: { transport: ws } }
);

async function main() {
  // Check if stock table exists and has data
  const { data: stock, error: stockErr, count } = await supabase
    .from("stock")
    .select("*", { count: "exact" })
    .limit(5);

  console.log("Stock query result:");
  console.log("  Error:", stockErr ? stockErr.message : "none");
  console.log("  Count:", count);
  console.log("  Data:", stock ? JSON.stringify(stock) : "null");

  // Try direct insert with explicit checking
  const { data: warehouses } = await supabase.from("warehouses").select("id, name");
  const wh = warehouses?.[0];
  console.log("\nWarehouse:", wh?.name, wh?.id);

  // Check products
  const { data: products } = await supabase.from("products").select("id, title").eq("status", "active").limit(2);
  console.log("Products:", products?.map(p => p.title));

  if (wh && products && products.length > 0) {
    const { data: insertResult, error: insertErr } = await supabase.from("stock").insert({
      warehouse_id: wh.id,
      product_id: products[0].id,
      variant_id: null,
      quantity: 50,
      available_quantity: 50,
      reserved_quantity: 0,
    }).select();

    console.log("\nInsert result:", insertErr ? "ERROR: " + insertErr.message : JSON.stringify(insertResult));

    // Re-check
    const { data: finalStock, count: finalCount } = await supabase.from("stock").select("*", { count: "exact" }).limit(5);
    console.log("After insert - Count:", finalCount, "Data:", finalStock);
  }
}

main().catch(console.error);
