import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnv(file) {
  const env = {};
  for (const line of readFileSync(resolve(__dirname, "..", file), "utf-8").split("\n")) {
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

const env = loadEnv(".env.production.local");
const connectionString = env.POSTGRES_URL_NON_POOLING || env.POSTGRES_URL;

if (!connectionString) {
  console.error("Missing POSTGRES_URL in .env.production.local");
  process.exit(1);
}

const client = new pg.Client({
  connectionString,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : { rejectUnauthorized: false },
});

async function runSqlFile(label, filePath) {
  const sql = readFileSync(filePath, "utf-8");
  console.log(`Running ${label}...`);
  await client.query(sql);
  console.log(`✓ ${label} complete`);
}

await client.connect();

try {
  await runSqlFile(
    "migration",
    resolve(__dirname, "../../supabase/migrations/20260101000000_initial_schema.sql")
  );
  await runSqlFile("seed", resolve(__dirname, "../../supabase/seed.sql"));
  console.log("\n✓ Database setup complete!");
} catch (err) {
  console.error("Migration failed:", err.message);
  process.exit(1);
} finally {
  await client.end();
}
