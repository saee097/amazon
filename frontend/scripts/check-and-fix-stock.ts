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

const connectionString = (process.env.POSTGRES_URL_NON_POOLING || "").replace("sslmode=require", "sslmode=no-verify");

const client = new pg.Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

async function main() {
  await client.connect();
  console.log("Connected");

  // Check stock records
  const stockRes = await client.query("SELECT s.warehouse_id, s.product_id, s.variant_id, s.available_quantity FROM stock s ORDER BY s.product_id, s.variant_id NULLS FIRST");
  console.log("Stock records:", stockRes.rows.length);
  stockRes.rows.forEach(r => {
    console.log(`  - product=${r.product_id.slice(0,8)} variant=${r.variant_id ? r.variant_id.slice(0,8) : 'NULL'} avail=${r.available_quantity} wh=${r.warehouse_id.slice(0,8)}`);
  });

  // Check warehouses
  const whRes = await client.query("SELECT id, name, status FROM warehouses");
  console.log("Warehouses:", whRes.rows.length, whRes.rows);

  // Check products
  const prodRes = await client.query("SELECT id, title, sku FROM products");
  console.log("Products:", prodRes.rows.length);

  // Check product variants
  const varRes = await client.query("SELECT id, product_id, inventory_quantity FROM product_variants");
  console.log("Variants:", varRes.rows.length);

  // Check cart items
  const cartRes = await client.query("SELECT ci.cart_id, ci.product_id, ci.variant_id, ci.quantity, ci.price FROM cart_items ci LIMIT 20");
  console.log("Cart items:", cartRes.rows.length);
  cartRes.rows.forEach(r => {
    console.log(`  - cart=${r.cart_id.slice(0,8)} product=${r.product_id.slice(0,8)} variant=${r.variant_id ? r.variant_id.slice(0,8) : 'NULL'} qty=${r.quantity} price=${r.price}`);
  });

  // Create stock records if none exist
  if (parseInt(stockRes.rows[0].cnt) === 0) {
    console.log("\nCreating stock records...");

    // Get the first active warehouse
    const wh = whRes.rows[0];
    if (!wh) {
      console.log("No warehouses found, creating one...");
      const createWh = await client.query("INSERT INTO warehouses (name, location, status) VALUES ('Main Warehouse', 'New York, NY', 'active') RETURNING id");
      whRes.rows.push(createWh.rows[0]);
    }

    const warehouse = whRes.rows[0];
    const whId = warehouse.id;
    console.log("Using warehouse:", whId);

    // For each variant, create stock record
    let created = 0;
    for (const variant of varRes.rows) {
      const qty = variant.inventory_quantity || 50;
      await client.query(
        "INSERT INTO stock (warehouse_id, product_id, variant_id, quantity, available_quantity, reserved_quantity) VALUES ($1, $2, $3, $4, $4, 0) ON CONFLICT DO NOTHING",
        [whId, variant.product_id, variant.id, qty]
      );
      created++;
    }

    // Also create product-level stock (variant_id = NULL) for products without variants
    const prodsWithoutVariants = await client.query(`
      SELECT p.id, p.product_variants as has_variants
      FROM products p
      LEFT JOIN product_variants pv ON pv.product_id = p.id
      WHERE pv.id IS NULL
    `);
    for (const prod of prodsWithoutVariants.rows) {
      const qty = 50;
      await client.query(
        "INSERT INTO stock (warehouse_id, product_id, variant_id, quantity, available_quantity, reserved_quantity) VALUES ($1, $2, NULL, $3, $3, 0) ON CONFLICT DO NOTHING",
        [whId, prod.id, qty]
      );
      created++;
    }

    console.log(`Created ${created} stock records`);

    // Verify
    const checkRes = await client.query("SELECT COUNT(*)::int as cnt FROM stock");
    console.log("Stock records now:", checkRes.rows[0].cnt);
  }

  // Check coupons
  const couponRes = await client.query("SELECT code, discount_type, discount_value, status FROM coupons");
  console.log("Coupons:", couponRes.rows.length, couponRes.rows);

  // Check user profiles for roles
  const profileRes = await client.query("SELECT email, role FROM profiles ORDER BY role, email");
  console.log("Profiles by role:", profileRes.rows);

  await client.end();
  console.log("Done");
}

main().catch((err) => console.error("Error:", err.message));
