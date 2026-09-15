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
    if (!process.env[key]) {
      let val = trimmed.slice(eq + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'") )) {
        val = val.slice(1, -1);
      }
      process.env[key] = val;
    }
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
  // Check for test customer user
  const { data: user, error: userErr } = await supabase
    .from("profiles")
    .select("id, email, role, status")
    .eq("email", "customer@amazonstore.com")
    .maybeSingle();
  console.log("Test customer user:", JSON.stringify({ user, error: userErr?.message }));

  // Check if admin user exists
  const { data: admin } = await supabase
    .from("profiles")
    .select("id, email, role, status")
    .eq("email", "admin@amazonstore.com")
    .maybeSingle();
  console.log("Test admin user:", JSON.stringify({ admin }));

  // Check product with categories (to determine if categories is array or object)
  const { data: products, error: prodErr } = await supabase
    .from("products")
    .select("*, categories(*), brands(*), product_variants(*), product_images(*)")
    .eq("status", "active")
    .limit(1);
  if (prodErr) {
    console.log("Product error:", prodErr.message);
  } else {
    const p = products[0];
    console.log("\nProduct:", p.title);
    console.log("categories is array:", Array.isArray(p.categories));
    console.log("categories:", JSON.stringify(p.categories));
    console.log("brands is array:", Array.isArray(p.brands));
    console.log("brands:", JSON.stringify(p.brands));
  }

  // Check if stock records exist
  const { data: stock, count: stockCount, error: stockErr } = await supabase
    .from("stock")
    .select("*", { count: "exact" });
  console.log("\nStock records:", stockCount, stockErr?.message);

  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
