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
const connectionString = (env.POSTGRES_URL_NON_POOLING || env.POSTGRES_URL) + "&sslmode=require&channel_binding=disable";

if (!connectionString) {
  console.error("Missing POSTGRES_URL in .env.production.local");
  process.exit(1);
}

const client = new pg.Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

async function runSqlFile(label, filePath) {
  const sql = readFileSync(filePath, "utf-8");
  console.log(`Running ${label}...`);
  await client.query(sql);
  console.log(`✓ ${label} complete`);
}

async function runSqlFilesInOrder(dir, pattern) {
  const { readdirSync, statSync } = await import("fs");
  const entries = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();
  for (const file of entries) {
    const fullPath = resolve(dir, file);
    await runSqlFile(file, fullPath);
  }
}

await client.connect();

try {
  const migrationsDir = resolve(__dirname, "../../supabase/migrations");
  const { readdirSync, statSync } = await import("fs");
  const entries = readdirSync(migrationsDir).filter((f) => f.endsWith(".sql")).sort();
  for (const file of entries) {
    await runSqlFile(file, resolve(migrationsDir, file));
  }

  const seedPath = resolve(__dirname, "../../supabase/seed.sql");
  if (statSync(seedPath).isFile()) {
    await runSqlFile("seed", seedPath);
  }
  console.log("\n✓ Database setup complete!");
} catch (err) {
  console.error("Migration failed:", err.message);
  process.exit(1);
} finally {
  await client.end();
}
