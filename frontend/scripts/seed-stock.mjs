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
  // Get all active warehouses
  const { data: warehouses } = await supabase.from("warehouses").select("id, name").eq("status", "active");
  const mainWarehouse = warehouses?.find(w => w.name === "Main Warehouse") || warehouses?.[0];
  console.log("Main warehouse:", mainWarehouse?.name, mainWarehouse?.id?.slice(0, 8));

  // Get all products with their variants
  const { data: products, error: prodErr } = await supabase
    .from("products")
    .select("*, product_variants(*)")
    .eq("status", "active");

  if (prodErr) {
    console.error("Failed to fetch products:", prodErr.message);
    return;
  }

  console.log("Found", products.length, "active products");

  // For each product, create stock records for each variant (and product-level)
  for (const product of products) {
    const variants = product.product_variants || [];
    
    if (variants.length === 0) {
      // No variants - create product-level stock
      const inventory = product.inventory_quantity || 100;
      await supabase.from("stock").insert({
        warehouse_id: mainWarehouse.id,
        product_id: product.id,
        variant_id: null,
        quantity: inventory,
        available_quantity: inventory,
        reserved_quantity: 0,
      });
      console.log("  Created product-level stock for:", product.title, "| qty:", inventory);
    } else {
      // Create variant-level stock
      for (const variant of variants) {
        const inventory = variant.inventory_quantity || 50;
        await supabase.from("stock").insert({
          warehouse_id: mainWarehouse.id,
          product_id: product.id,
          variant_id: variant.id,
          quantity: inventory,
          available_quantity: inventory,
          reserved_quantity: 0,
        });
        console.log("  Created variant stock for:", product.title, `| ${variant.color}/${variant.size}`, "| qty:", inventory);
      }
    }
  }

  // Verify
  const { data: totalStock, count } = await supabase
    .from("stock")
    .select("*", { count: "exact" });

  console.log("\nTotal stock records:", count);
  console.log("Stock seeding complete!");
}

main().catch(console.error);
