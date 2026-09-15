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

  // Reset ALL stock to full availability and original quantity
  await client.query(`
    UPDATE stock s
    SET reserved_quantity = 0,
        available_quantity = pv.inventory_quantity,
        quantity = pv.inventory_quantity
    FROM product_variants pv
    WHERE s.variant_id = pv.id
  `);

  // Also reset product-level stock (variant_id = NULL)
  await client.query(`
    UPDATE stock
    SET reserved_quantity = 0,
        available_quantity = 50,
        quantity = 50
    WHERE variant_id IS NULL
  `);

  const totalStock = await client.query("SELECT COUNT(*)::int as cnt FROM stock");
  console.log("Total stock records:", totalStock.rows[0].cnt);

  // Verify stock for product 41d39561
  const stockRes = await client.query(`
    SELECT s.product_id, s.variant_id, s.quantity, s.available_quantity, s.warehouse_id
    FROM stock s
    WHERE s.product_id = '41d39561-9451-4f10-bdc6-c1d7633c8f70'
    ORDER BY s.warehouse_id
  `);
  console.log("\nStock for product 41d39561:");
  for (const row of stockRes.rows) {
    console.log(`  wh=${row.warehouse_id.slice(0,8)} variant=${row.variant_id.slice(0,8)} avail=${row.available_quantity}/${row.quantity}`);
  }

  // Verify all stock
  const allStock = await client.query("SELECT COUNT(*)::int as cnt, SUM(available_quantity)::int as total_qty FROM stock");
  console.log("\nTotal stock records:", allStock.rows[0]);

  await client.end();
  console.log("Done");
}

main().catch((err) => console.error("Error:", err.message));
