import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnv(file) {
  const env = {};
  const filePath = resolve(__dirname, "..", file);
  if (!existsSync(filePath)) return env;
  for (const line of readFileSync(filePath, "utf-8").split("\n")) {
    if (!line || line.startsWith("#")) continue;
    const i = line.indexOf("=");
    if (i < 0) continue;
    let val = line.slice(i + 1);
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    env[line.slice(0, i)] = val;
  }
  return env;
}

const env = { ...loadEnv(".env.local"), ...loadEnv(".env.production.local") };
// Strip any query params from the connection string and use ssl config instead
const connectionString = (env.POSTGRES_URL_NON_POOLING || env.POSTGRES_URL).split("?")[0];

if (!connectionString) {
  console.error("Missing POSTGRES_URL in env files");
  process.exit(1);
}

const client = new pg.Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
});
const migrationsToRun = [
  "20260905000000_auth_production_refinements.sql",
  "20260906000000_add_product_columns.sql",
  "20260906000001_production_gaps.sql",
  "20260907000000_admin_profile_preferences.sql",
  "20260913000000_inventory_threshold_override.sql",
];

await client.connect();

for (const file of migrationsToRun) {
  const filePath = resolve(__dirname, "..", "..", "supabase/migrations", file);
  if (!existsSync(filePath)) {
    console.log(`SKIP: ${file} (file not found)`);
    continue;
  }
  try {
    const sql = readFileSync(filePath, "utf-8");
    await client.query(sql);
    console.log(`OK: ${file}`);
  } catch (err) {
    console.error(`ERROR: ${file} - ${err.message}`);
  }
}

// Verify critical columns now exist
const { rows } = await client.query(`
  SELECT column_name FROM information_schema.columns 
  WHERE table_name = 'stock' AND column_name IN ('available_quantity', 'reserved_quantity')
  ORDER BY column_name;
`);
console.log("\nStock columns after migration:", rows.map(r => r.column_name));

// Verify inventory functions exist
const { rows: fnRows } = await client.query(`
  SELECT routine_name FROM information_schema.routines 
  WHERE routine_schema = 'public' AND routine_name IN ('reserve_inventory', 'release_inventory', 'commit_inventory')
  ORDER BY routine_name;
`);
console.log("Inventory functions:", fnRows.map(r => r.routine_name));

// Verify profile preferences columns
const { rows: prefRows } = await client.query(`
  SELECT column_name FROM information_schema.columns 
  WHERE table_name = 'profiles' AND column_name IN ('notification_prefs', 'privacy_prefs', 'last_login_at', 'display_name')
  ORDER BY column_name;
`);
console.log("Profile preference columns:", prefRows.map(r => r.column_name));

await client.end();
console.log("\n=== Migration complete ===");
