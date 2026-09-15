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
const connectionString = (env.POSTGRES_URL_NON_POOLING || env.POSTGRES_URL).split("?")[0];

const client = new pg.Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

await client.connect();

// Test PostgreSQL version
const versionRes = await client.query("SHOW server_version");
console.log("PostgreSQL version:", versionRes.rows[0].server_version);

// Test ALTER TYPE ADD VALUE IF NOT EXISTS
try {
  await client.query(`DO \$\$
BEGIN
  ALTER TYPE payment_status ADD VALUE IF NOT EXISTS 'authorized';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END \$\$;`);
  console.log("ALTER TYPE ADD VALUE IF NOT EXISTS: OK");
} catch (err) {
  console.error("ALTER TYPE ADD VALUE IF NOT EXISTS: ERROR -", err.message);
}

// Check if the functions were created by the earlier run
const fnCheck = await client.query(`
  SELECT routine_name FROM information_schema.routines 
  WHERE routine_schema = 'public' AND routine_name IN ('reserve_inventory', 'release_inventory', 'commit_inventory', 'adjust_inventory')
  ORDER BY routine_name;
`);
console.log("Inventory functions:", fnCheck.rows.map(r => r.routine_name));

// Check stock columns
const colCheck = await client.query(`
  SELECT column_name FROM information_schema.columns 
  WHERE table_name = 'stock'
  ORDER BY ordinal_position;
`);
console.log("Stock table columns:", colCheck.rows.map(r => r.column_name));

await client.end();
