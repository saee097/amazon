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
  // Check stock records
  const { data: stock, error: stockErr } = await supabase
    .from("stock")
    .select("*, products(title)")
    .limit(10);

  console.log("Stock records:", stockErr ? "ERROR: " + stockErr.message : "Found " + stock.length + " stock records");
  if (!stockErr && stock) {
    stock.forEach(s => {
      console.log("  - " + (s.products?.title || "unknown") + " | warehouse: " + s.warehouse_id.slice(0, 8) + " | qty: " + s.available_quantity + " | reserved: " + s.reserved_quantity);
    });
  }

  // Check customer seed user
  const { data: customer, error: custErr } = await supabase
    .from("profiles")
    .select("email, role, status, permissions")
    .eq("email", "customer@amazonstore.com")
    .maybeSingle();

  console.log("\nCustomer seed user:", custErr ? "ERROR: " + custErr.message : JSON.stringify(customer));
}

main().catch(console.error);
