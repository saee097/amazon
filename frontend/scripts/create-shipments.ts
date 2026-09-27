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
  // Get existing orders
  const { data: orders } = await supabase.from("orders").select("id, order_number");
  console.log("Found orders:", orders?.length);

  if (!orders?.length) {
    console.log("No orders found");
    return;
  }

  // Create shipments for each order
  const shipments = [
    {
      order_id: orders[0].id,
      tracking_number: "TRK" + Math.random().toString(36).substring(2, 10).toUpperCase(),
      carrier: "FedEx",
      status: "in_transit",
      shipped_at: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      order_id: orders[1].id,
      tracking_number: "TRK" + Math.random().toString(36).substring(2, 10).toUpperCase(),
      carrier: "UPS",
      status: "delivered",
      shipped_at: new Date(Date.now() - 172800000).toISOString(),
      delivered_at: new Date(Date.now() - 86400000).toISOString(),
    },
  ];

  for (const shipment of shipments) {
    const { data, error } = await supabase.from("shipments").insert(shipment).select().single();
    if (error) {
      console.error("Error creating shipment:", error);
    } else {
      console.log("Created shipment:", data.tracking_number, data.status);
    }
  }

  console.log("Done!");
}

main().catch(console.error);