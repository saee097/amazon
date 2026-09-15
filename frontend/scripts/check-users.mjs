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
  const roles = ["customer", "admin", "superadmin"];
  for (const role of roles) {
    const { data, error } = await supabase
      .from("profiles")
      .select("email, role, status")
      .eq("role", role);
    
    console.log(`${role} users (${data?.length || 0}):`);
    if (error) {
      console.log("  ERROR:", error.message);
    } else if (data && data.length > 0) {
      data.forEach(p => console.log(`  - ${p.email} (${p.status})`));
    } else {
      console.log("  None found");
    }
  }

  // Check idempotency_keys table
  const { data: idem, error: idemErr } = await supabase.from("idempotency_keys").select("id").limit(1);
  console.log("\nidempotency_keys table:", idemErr ? "ERROR: " + idemErr.message : "OK - exists");
}

main().catch(console.error);
