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

// Create the inventory functions using proper dollar-quoting
const functions = [
  {
    name: "reserve_inventory",
    sql: `CREATE OR REPLACE FUNCTION reserve_inventory(
  p_product_id UUID,
  p_variant_id UUID,
  p_warehouse_id UUID,
  p_quantity INTEGER
)
RETURNS VOID AS $$
DECLARE
  v_available INTEGER;
BEGIN
  IF p_quantity <= 0 THEN
    RAISE EXCEPTION 'Quantity must be positive';
  END IF;

  SELECT available_quantity INTO v_available
  FROM stock
  WHERE product_id = p_product_id
    AND (variant_id = p_variant_id OR (variant_id IS NULL AND p_variant_id IS NULL))
    AND warehouse_id = p_warehouse_id
  FOR UPDATE;

  IF v_available IS NULL THEN
    RAISE EXCEPTION 'Stock record not found';
  END IF;

  IF v_available < p_quantity THEN
    RAISE EXCEPTION 'Insufficient inventory: requested %, available %', p_quantity, v_available;
  END IF;

  UPDATE stock
  SET available_quantity = available_quantity - p_quantity,
      reserved_quantity = reserved_quantity + p_quantity,
      updated_at = NOW()
  WHERE product_id = p_product_id
    AND (variant_id = p_variant_id OR (variant_id IS NULL AND p_variant_id IS NULL))
    AND warehouse_id = p_warehouse_id;
END;
$$ LANGUAGE plpgsql;`
  },
  {
    name: "commit_inventory",
    sql: `CREATE OR REPLACE FUNCTION commit_inventory(
  p_product_id UUID,
  p_variant_id UUID,
  p_warehouse_id UUID,
  p_quantity INTEGER
)
RETURNS VOID AS $$
BEGIN
  IF p_quantity <= 0 THEN
    RAISE EXCEPTION 'Quantity must be positive';
  END IF;

  UPDATE stock
  SET reserved_quantity = reserved_quantity - p_quantity,
      quantity = quantity - p_quantity,
      available_quantity = available_quantity - p_quantity,
      updated_at = NOW()
  WHERE product_id = p_product_id
    AND (variant_id = p_variant_id OR (variant_id IS NULL AND p_variant_id IS NULL))
    AND warehouse_id = p_warehouse_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Stock record not found';
  END IF;
END;
$$ LANGUAGE plpgsql;`
  },
  {
    name: "release_inventory",
    sql: `CREATE OR REPLACE FUNCTION release_inventory(
  p_product_id UUID,
  p_variant_id UUID,
  p_warehouse_id UUID,
  p_quantity INTEGER
)
RETURNS VOID AS $$
BEGIN
  IF p_quantity <= 0 THEN
    RAISE EXCEPTION 'Quantity must be positive';
  END IF;

  UPDATE stock
  SET reserved_quantity = reserved_quantity - p_quantity,
      available_quantity = available_quantity + p_quantity,
      updated_at = NOW()
  WHERE product_id = p_product_id
    AND (variant_id = p_variant_id OR (variant_id IS NULL AND p_variant_id IS NULL))
    AND warehouse_id = p_warehouse_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Stock record not found';
  END IF;
END;
$$ LANGUAGE plpgsql;`
  },
  {
    name: "adjust_inventory",
    sql: `CREATE OR REPLACE FUNCTION adjust_inventory(
  p_warehouse_id UUID,
  p_product_id UUID,
  p_variant_id UUID,
  p_quantity INTEGER,
  p_movement_type TEXT,
  p_notes TEXT DEFAULT NULL,
  p_created_by UUID DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  IF p_quantity = 0 THEN
    RETURN;
  END IF;

  UPDATE stock
  SET quantity = quantity + p_quantity,
      available_quantity = available_quantity + p_quantity,
      updated_at = NOW()
  WHERE product_id = p_product_id
    AND (variant_id = p_variant_id OR (variant_id IS NULL AND p_variant_id IS NULL))
    AND warehouse_id = p_warehouse_id;

  IF NOT FOUND THEN
    INSERT INTO stock (warehouse_id, product_id, variant_id, quantity, available_quantity)
    VALUES (p_warehouse_id, p_product_id, p_variant_id, p_quantity, p_quantity);
  END IF;

  INSERT INTO inventory_movements (warehouse_id, product_id, variant_id, movement_type, quantity, notes, created_by)
  VALUES (p_warehouse_id, p_product_id, p_variant_id, p_movement_type, p_quantity, p_notes, p_created_by);
END;
$$ LANGUAGE plpgsql;`
  }
];

for (const fn of functions) {
  try {
    await client.query(fn.sql);
    console.log(`OK: Created function ${fn.name}`);
  } catch (err) {
    console.error(`ERROR: ${fn.name} - ${err.message}`);
  }
}

// Verify functions exist
const fnCheck = await client.query(`
  SELECT routine_name FROM information_schema.routines 
  WHERE routine_schema = 'public' AND routine_name IN ('reserve_inventory', 'release_inventory', 'commit_inventory', 'adjust_inventory')
  ORDER BY routine_name;
`);
console.log("\nInventory functions:", fnCheck.rows.map(r => r.routine_name));

// Verify stock columns
const colCheck = await client.query(`
  SELECT column_name FROM information_schema.columns 
  WHERE table_name = 'stock'
  ORDER BY ordinal_position;
`);
console.log("Stock table columns:", colCheck.rows.map(r => r.column_name));

await client.end();
console.log("\nDone!");
