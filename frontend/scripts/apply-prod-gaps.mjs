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

const sql = readFileSync(resolve(__dirname, "..", "..", "supabase/migrations/20260906000001_production_gaps.sql"), "utf-8");

// Split the SQL into statements, handling DO $$ blocks properly
function splitSqlStatements(sql) {
  const statements = [];
  let current = "";
  let inDollarQuote = false;
  let dollarTag = "";
  let i = 0;

  while (i < sql.length) {
    // Check for dollar quote start/end
    if (sql[i] === "$" && (i === 0 || !/\w/.test(sql[i - 1]))) {
      // Find the dollar tag
      let j = i + 1;
      let tag = "";
      while (j < sql.length && sql[j] !== "$") {
        tag += sql[j];
        j++;
      }
      if (j < sql.length && sql[j] === "$") {
        if (tag === dollarTag) {
          // End of dollar quote
          inDollarQuote = false;
          dollarTag = "";
          current += sql.slice(i, j + 1);
          i = j + 1;
          continue;
        } else if (!inDollarQuote) {
          // Start of dollar quote
          inDollarQuote = true;
          dollarTag = tag;
          current += sql.slice(i, j + 1);
          i = j + 1;
          continue;
        }
      }
    }

    if (!inDollarQuote && sql[i] === ";") {
      statements.push(current.trim());
      current = "";
    } else {
      current += sql[i];
    }
    i++;
  }

  if (current.trim()) {
    statements.push(current.trim());
  }

  return statements.filter(s => s.length > 0);
}

const statements = splitSqlStatements(sql);
console.log(`Found ${statements.length} statements to run`);

for (let idx = 0; idx < statements.length; idx++) {
  const stmt = statements[idx];
  // Get a preview for logging
  const preview = stmt.slice(0, 80).replace(/\s+/g, " ");
  try {
    await client.query(stmt);
    console.log(`  OK [${idx + 1}/${statements.length}]: ${preview}...`);
  } catch (err) {
    console.error(`  ERROR [${idx + 1}/${statements.length}]: ${preview}...`);
    console.error(`    ${err.message.split("\n")[0]}`);
  }
}

// Verify
const colCheck = await client.query(`
  SELECT column_name FROM information_schema.columns 
  WHERE table_name = 'stock' AND column_name IN ('available_quantity', 'reserved_quantity', 'damaged_quantity', 'incoming_quantity', 'reorder_threshold')
  ORDER BY column_name;
`);
console.log("\nStock extra columns:", colCheck.rows.map(r => r.column_name));

const fnCheck = await client.query(`
  SELECT routine_name FROM information_schema.routines 
  WHERE routine_schema = 'public' AND routine_name IN ('reserve_inventory', 'release_inventory', 'commit_inventory', 'adjust_inventory')
  ORDER BY routine_name;
`);
console.log("Inventory functions:", fnCheck.rows.map(r => r.routine_name));

await client.end();
