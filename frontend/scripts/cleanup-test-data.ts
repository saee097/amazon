import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import ws from "ws";

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

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

const supabase = createClient(url!, serviceKey!, {
  auth: { autoRefreshToken: false, persistSession: false },
  realtime: { transport: ws },
});

async function main() {
  console.log("Cleaning up test data...");

  // Clear test carts and cart items
  await supabase.from("cart_items").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("carts").delete().neq("id", "00000000-0000-0000-0000-000000000000");

  // Clear test orders
  await supabase.from("order_items").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("orders").delete().neq("id", "00000000-0000-0000-0000-000000000000");

  // Clear test addresses (keep original ones)
  const user = (await supabase.from("profiles").select("id").eq("email", "customer@amazonstore.com").single()).data;
  if (user) {
    await supabase.from("addresses").delete().eq("user_id", user.id);
    // Clear idempotency keys
    await supabase.from("idempotency_keys").delete().eq("user_id", user.id);
    // Clear test returns
    await supabase.from("returns").delete().eq("user_id", user.id);
  }

  // Reset inventory reservations
  const { data: stockRows } = await supabase.from("stock").select("id, reserved_quantity");
  for (const row of stockRows || []) {
    if (row.reserved_quantity > 0) {
      await supabase
        .from("stock")
        .update({ reserved_quantity: 0 })
        .eq("id", row.id);
    }
  }

  console.log("Test data cleaned up.");
  process.exit(0);
}

main().catch((err) => console.error(err));
