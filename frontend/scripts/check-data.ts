import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import ws from "ws";

const env = readFileSync(".env.local", "utf-8");
env.split("\n").forEach(line => {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) return;
  const eq = trimmed.indexOf("=");
  if (eq < 0) return;
  const key = trimmed.slice(0, eq).trim();
  const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
  process.env[key] = value;
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { realtime: { transport: ws } }
);

async function main() {
  const { data: orders, error: oErr } = await supabase.from("orders").select("*").limit(5);
  console.log("Orders:", JSON.stringify(orders, null, 2), oErr);

  const { data: shipments, error: sErr } = await supabase.from("shipments").select("*");
  console.log("Shipments:", JSON.stringify(shipments, null, 2), sErr);
}

main().catch(console.error);