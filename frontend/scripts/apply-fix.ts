import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnvFile(filename: string) {
  const envPath = resolve(__dirname, "..", filename);
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

const connectionString = process.env.POSTGRES_URL_NON_POOLING;
if (!connectionString) {
  console.error("Missing POSTGRES_URL_NON_POOLING");
  process.exit(1);
}

const client = new pg.Client({
  connectionString: connectionString.replace("sslmode=require", "sslmode=no-verify"),
  ssl: { rejectUnauthorized: false },
});

async function main() {
  await client.connect();
  console.log("Connected to database");

  const migrationPath = resolve(__dirname, "..", "..", "supabase", "migrations", "20260913000000_fix_rls_recursion.sql");
  const sql = readFileSync(migrationPath, "utf-8");
  await client.query(sql);
  console.log("Migration applied successfully");

  const { rows } = await client.query("SELECT id, email, role FROM profiles LIMIT 10");
  console.log(`Profiles found: ${rows.length}`);
  for (const row of rows) {
    console.log(`  - ${row.email} (${row.role})`);
  }

  await client.end();
  console.log("Done");
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
