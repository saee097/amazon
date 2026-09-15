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
  // Check stock table columns
  const { data: stockCols } = await supabase.rpc("get_table_columns", { table_name: "stock" });
  console.log("Stock columns (via RPC):", stockCols ? JSON.stringify(stockCols) : "not available");

  // Try SQL query instead
  const { data: columns, error: colErr } = await supabase
    .from("information_schema.columns")
    .select("column_name, data_type")
    .eq("table_name", "stock")
    .eq("table_schema", "public");

  console.log("\nStock table columns:");
  if (colErr) {
    console.log("  Error:", colErr.message);
  } else if (columns) {
    columns.forEach(c => console.log(`  - ${c.column_name} (${c.data_type})`));
  }

  // Check if inventory functions exist
  const { data: funcs, error: fnErr } = await supabase
    .from("information_schema.routines")
    .select("routine_name, routine_type")
    .eq("routine_schema", "public")
    .like("routine_name", "%inventory%");

  console.log("\nInventory functions:");
  if (fnErr) {
    console.log("  Error:", fnErr.message);
  } else if (funcs && funcs.length > 0) {
    funcs.forEach(f => console.log(`  - ${f.routine_name} (${f.routine_type})`));
  } else {
    console.log("  None found");
  }

  // Check profiles columns
  const { data: profileCols } = await supabase
    .from("information_schema.columns")
    .select("column_name, data_type")
    .eq("table_name", "profiles")
    .eq("table_schema", "public")
    .order("ordinal_position");

  console.log("\nProfiles table columns:");
  if (profileCols) {
    profileCols.forEach(c => console.log(`  - ${c.column_name} (${c.data_type})`));
  }

  // Check for notifications table columns
  const { data: notifCols } = await supabase
    .from("information_schema.columns")
    .select("column_name, data_type")
    .eq("table_name", "notifications")
    .eq("table_schema", "public");

  console.log("\nNotifications table columns:");
  if (notifCols) {
    notifCols.forEach(c => console.log(`  - ${c.column_name} (${c.data_type})`));
  }
}

main().catch(console.error);
