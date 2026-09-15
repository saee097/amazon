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

  // Check if reserve_inventory function exists and its security context
  const funcRes = await client.query(`
    SELECT routine_name, routine_type, security_type
    FROM information_schema.routines
    WHERE routine_name = 'reserve_inventory' AND routine_schema = 'public'
  `);
  console.log("Function info:", funcRes.rows);

  // Get the active warehouse (same query as checkout handler)
  const whRes = await client.query("SELECT id FROM warehouses WHERE status = 'active' ORDER BY id LIMIT 1");
  console.log("Active warehouse:", whRes.rows[0]?.id);

  // Get a product variant from the cart
  const varRes = await client.query("SELECT id, product_id FROM product_variants WHERE product_id = '41d39561-9451-4f10-bdc6-c1d7633c8f70' LIMIT 1");
  console.log("Variant:", varRes.rows[0]);

  // Test the stock query directly (simulating what reserve_inventory does)
  if (whRes.rows[0] && varRes.rows[0]) {
    const whId = whRes.rows[0].id;
    const varId = varRes.rows[0].id;
    const prodId = varRes.rows[0].product_id;

    // Test as regular user (no BYPASSRLS)
    console.log("\n--- Query as default user ---");
    const directRes = await client.query(
      "SELECT available_quantity FROM stock WHERE product_id = $1 AND (variant_id = $2 OR (variant_id IS NULL AND $2 IS NULL)) AND warehouse_id = $3",
      [prodId, varId, whId]
    );
    console.log("Direct query result:", directRes.rows);

    // Test with service_role explicitly
    console.log("\n--- Query as service_role ---");
    const roleRes = await client.query("SELECT current_user, current_role, current_setting('is_superuser') as is_super");
    console.log("Current user:", roleRes.rows[0]);

    // Check if the function has any RLS issues by calling it directly
    console.log("\n--- Calling reserve_inventory directly ---");
    try {
      // Note: can't SET ROLE and CALL in same prepared statement
      await client.query("SET ROLE service_role");
      const beforeRes = await client.query("SELECT current_user, rolbypassrls FROM pg_roles WHERE rolname = current_user");
      console.log("As service_role - current_user:", beforeRes.rows);

      const stockBefore = await client.query(
        "SELECT available_quantity FROM stock WHERE product_id = $1 AND variant_id = $2 AND warehouse_id = $3",
        [prodId, varId, whId]
      );
      console.log("Stock before (as service_role):", stockBefore.rows);

      // Call the function
      const rpcRes = await client.query(
        "SELECT reserve_inventory($1, $2, $3, $4)",
        [prodId, varId, whId, 1]
      );
      console.log("reserve_inventory result:", rpcRes.rows);

      // Check stock after
      const stockAfter = await client.query(
        "SELECT available_quantity FROM stock WHERE product_id = $1 AND variant_id = $2 AND warehouse_id = $3",
        [prodId, varId, whId]
      );
      console.log("Stock after (as service_role):", stockAfter.rows);

      // Release the inventory (undo)
      await client.query(
        "SELECT release_inventory($1, $2, $3, $4)",
        [prodId, varId, whId, 1]
      );
      console.log("Inventory released");

      await client.query("RESET ROLE");
    } catch (e) {
      console.error("Error calling reserve_inventory:", e.message);
      await client.query("RESET ROLE");
    }

    // Check policies on stock table
    const policyRes = await client.query("SELECT policyname, polpermissive, polroles, polcmd FROM pg_policies WHERE tablename = 'stock'");
    console.log("\nStock policies:", policyRes.rows);

    await client.end();
    console.log("Done");
  }
}

main().catch((err) => console.error("Error:", err.message, err.stack));
