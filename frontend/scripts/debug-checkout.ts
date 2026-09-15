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
  // Login
  const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
    email: "customer@amazonstore.com",
    password: "Customer@123456",
  });
  console.log("Login:", loginError ? loginError.message : "OK");
  if (loginError) process.exit(1);

  // Get warehouse
  const { data: wh } = await supabase
    .from("warehouses")
    .select("id")
    .eq("status", "active")
    .limit(1)
    .maybeSingle();
  console.log("Warehouse:", wh?.id);

  // Get user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", "customer@amazonstore.com")
    .single();
  console.log("Profile:", profile?.id);

  // Get cart
  const { data: cart } = await supabase
    .from("carts")
    .select("id")
    .eq("user_id", profile!.id)
    .maybeSingle();
  console.log("Cart:", cart?.id);

  if (cart) {
    const { data: cartItems } = await supabase
      .from("cart_items")
      .select("product_id, variant_id, quantity, price")
      .eq("cart_id", cart.id);
    console.log("Cart items:", cartItems);

    for (const item of cartItems || []) {
      console.log(`Calling reserve_inventory: product=${item.product_id.slice(0,8)} variant=${item.variant_id ? item.variant_id.slice(0,8) : 'NULL'} wh=${wh?.id.slice(0,8)} qty=${item.quantity}`);

      const { data: rpcData, error: rpcError } = await supabase.rpc("reserve_inventory", {
        p_product_id: item.product_id,
        p_variant_id: item.variant_id,
        p_warehouse_id: wh!.id,
        p_quantity: item.quantity,
      });
      console.log("RPC result:", rpcData, rpcError?.message);

      if (!rpcError) {
        await supabase.rpc("release_inventory", {
          p_product_id: item.product_id,
          p_variant_id: item.variant_id,
          p_warehouse_id: wh!.id,
          p_quantity: item.quantity,
        });
        console.log("Released");
      }
    }
  }

  process.exit(0);
}

main().catch((err) => console.error(err));
