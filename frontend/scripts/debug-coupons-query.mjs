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
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      process.env[key] = val;
    }
  }
}

loadEnvFile(".env.local");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log("URL:", url);
console.log("Has service key:", !!serviceKey);

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
  realtime: { transport: ws },
});

async function main() {
  // Exact same query as the handler
  console.log("\n--- Exact handler query ---");
  const { data, error } = await supabase
    .from("coupons")
    .select("*")
    .order("created_at", { ascending: false });
  console.log("data:", JSON.stringify(data));
  console.log("error:", error?.message);

  // With setAuth(null) like the server does
  console.log("\n--- With setAuth(null) ---");
  supabase.auth.setAuth(null);
  const { data: data2, error: error2 } = await supabase
    .from("coupons")
    .select("*")
    .order("created_at", { ascending: false });
  console.log("data2:", JSON.stringify(data2));
  console.log("error2:", error2?.message);

  // With status filter like test-db
  console.log("\n--- With status filter (like test-db) ---");
  supabase.auth.setAuth(null);
  const { data: data3, error: error3 } = await supabase
    .from("coupons")
    .select("*")
    .eq("status", "active");
  console.log("data3:", JSON.stringify(data3));
  console.log("error3:", error3?.message);

  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
