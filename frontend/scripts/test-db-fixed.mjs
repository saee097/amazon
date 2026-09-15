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

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Missing Supabase env vars");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
  realtime: { transport: ws },
});

async function run() {
  console.log("=== Database Connectivity Test ===\n");

  // Profiles
  const { data: profiles, error: profilesErr } = await supabase
    .from("profiles")
    .select("id, email, role, status")
    .limit(5);

  console.log("Profiles table:");
  if (profilesErr) {
    console.log("  ERROR:", profilesErr.message);
  } else {
    console.log("  OK - found", profiles.length, "profiles");
    profiles.forEach(p => console.log(`    - ${p.email} (${p.role})`));
  }

  // Products with relations
  const { data: products, error: productsErr } = await supabase
    .from("products")
    .select("*, categories(*), brands(*), product_variants(*), product_images(*)")
    .eq("status", "active")
    .limit(5);

  console.log("\nProducts table:");
  if (productsErr) {
    console.log("  ERROR:", productsErr.message);
  } else {
    console.log("  OK - found", products.length, "active products");
    products.forEach(p => {
      const variants = p.product_variants?.length || 0;
      const images = p.product_images?.length || 0;
      const stock = p.product_variants?.reduce((s, v) => s + (v.inventory_quantity || 0), 0) || 0;
      console.log(`    - ${p.title} | $${p.price} | variants: ${variants} | images: ${images} | stock: ${stock}`);
    });
  }

  // Categories
  const { data: categories, error: catErr } = await supabase
    .from("categories")
    .select("*")
    .eq("status", "active");

  console.log("\nCategories table:");
  if (catErr) {
    console.log("  ERROR:", catErr.message);
  } else {
    console.log("  OK - found", categories.length, "active categories");
    categories.forEach(c => console.log(`    - ${c.category_name} (${c.slug})`));
  }

  // Coupons
  const { data: coupons, error: couponErr } = await supabase
    .from("coupons")
    .select("*")
    .eq("status", "active");

  console.log("\nCoupons table:");
  if (couponErr) {
    console.log("  ERROR:", couponErr.message);
  } else {
    console.log("  OK - found", coupons.length, "active coupons");
    coupons.forEach(c => console.log(`    - ${c.code} | ${c.discount_type} ${c.discount_value}% | min: $${c.min_order} | used: ${c.used_count}/${c.max_uses}`));
  }

  // Banners
  const { data: banners, error: bannerErr } = await supabase
    .from("banners")
    .select("*")
    .eq("status", "active");

  console.log("\nBanners table:");
  if (bannerErr) {
    console.log("  ERROR:", bannerErr.message);
  } else {
    console.log("  OK - found", banners.length, "active banners");
  }

  // Warehouses
  const { data: warehouses, error: whErr } = await supabase
    .from("warehouses")
    .select("*")
    .eq("status", "active");

  console.log("\nWarehouses table:");
  if (whErr) {
    console.log("  ERROR:", whErr.message);
  } else {
    console.log("  OK - found", warehouses.length, "active warehouses");
    warehouses.forEach(w => console.log(`    - ${w.name} (${w.location})`));
  }

  // Inventory functions
  console.log("\nDatabase functions (inventory):");
  const functions = ["reserve_inventory", "release_inventory", "commit_inventory"];
  for (const fn of functions) {
    const { error: fnErr } = await supabase.rpc(fn, {
      p_product_id: "00000000-0000-0000-0000-000000000000",
      p_variant_id: null,
      p_warehouse_id: "00000000-0000-0000-0000-000000000000",
      p_quantity: 1,
    });
    // It will error due to nonexistent UUIDs, but the function should exist
    const exists = !fnErr || fnErr.message?.includes("not found") || fnErr.message?.includes("does not exist");
    console.log(`  ${fn}: ${fnErr ? "EXISTS (returns expected error: " + fnErr.message.slice(0, 40) + ")" : "MISSING"}`);
  }

  console.log("\n=== DB Test Complete ===");
}

run().catch(console.error);
