import pg from "pg";
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

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

const connectionString = process.env.POSTGRES_URL_NON_POOLING!.replace("sslmode=require", "sslmode=no-verify");

const client = new pg.Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

async function main() {
  await client.connect();
  console.log("Connected");

  // Check current enum values
  const enumsRes = await client.query(`
    SELECT t.typname as enum_type, e.enumlabel as enum_value
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname IN ('order_status', 'payment_status', 'return_status')
    ORDER BY t.typname, e.oid
  `);
  console.log("Current enum values:");
  for (const row of enumsRes.rows) {
    console.log(`  ${row.enum_type}: ${row.enum_value}`);
  }

  // Add missing enum values
  console.log("\nAdding missing enum values...");

  const enumsToAdd = {
    order_status: ["confirmed", "packed", "out_for_delivery", "failed"],
    return_status: ["in_transit", "received", "inspected", "cancelled"],
    payment_status: ["authorized", "cancelled", "partially_refunded"],
  };

  for (const [typeName, values] of Object.entries(enumsToAdd)) {
    // Get existing values
    const existingRes = await client.query(
      "SELECT enumlabel FROM pg_enum WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = $1)",
      [typeName]
    );
    const existing = new Set(existingRes.rows.map((r) => r.enumlabel));

    for (const value of values!) {
      if (!existing.has(value)) {
        await client.query(`ALTER TYPE ${typeName} ADD VALUE '${value}'`);
        console.log(`  Added ${value} to ${typeName}`);
      } else {
        console.log(`  ${value} already exists in ${typeName}`);
      }
    }
  }

  // Verify
  const verifyRes = await client.query(`
    SELECT t.typname as enum_type, e.enumlabel as enum_value
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname IN ('order_status', 'payment_status', 'return_status')
    ORDER BY t.typname, e.oid
  `);
  console.log("\nUpdated enum values:");
  for (const row of verifyRes.rows) {
    console.log(`  ${row.enum_type}: ${row.enum_value}`);
  }

  await client.end();
  console.log("\nDone");
}

main().catch((err) => console.error("Error:", err.message));
