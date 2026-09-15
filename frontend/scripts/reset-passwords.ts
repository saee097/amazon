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
  console.log("Resetting customer@amazonstore.com password...");
  const { error } = await supabase.auth.admin.updateUserById(
    (await supabase
      .from("profiles")
      .select("id")
      .eq("email", "customer@amazonstore.com")
      .single()).data!.id,
    { password: "Customer@123456" }
  );

  if (error) {
    console.error("Failed:", error.message);
    process.exit(1);
  }

  console.log("Customer password reset to Customer@123456");

  // Also reset admin and superadmin
  for (const [email, pass] of [
    ["admin@amazonstore.com", "Admin@123456"],
    ["superadmin@amazonstore.com", "Super@123456"],
  ] as const) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email)
      .single();

    const { error: e } = await supabase.auth.admin.updateUserById(profile!.id, { password: pass });
    if (e) console.error(`Failed to reset ${email}:`, e.message);
    else console.log(`${email} password reset to ${pass}`);
  }
}

main().catch(console.error);
