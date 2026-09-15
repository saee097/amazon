/**
 * Database seed script — creates admin users and sample data.
 *
 * Usage:
 *   cd frontend
 *   npx tsx scripts/seed.ts
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL in .env.local
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { envVar } from "../src/server/lib/env";
import ws from "ws";

function loadEnvFile(filename: string) {
  const envPath = resolve(process.cwd(), filename);
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf-8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    if (!process.env[key]) process.env[key] = trimmed.slice(eq + 1).trim();
  }
}

loadEnvFile(".env.local");
loadEnvFile(".env.production.local");

const url = envVar("NEXT_PUBLIC_SUPABASE_URL") || envVar("SUPABASE_URL");
const serviceKey = envVar("SUPABASE_SERVICE_ROLE_KEY") || envVar("SUPABASE_SECRET_KEY");

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
  realtime: { transport: ws },
});

const ADMIN_PERMISSIONS = [
  "dashboard:view", "users:view", "users:edit", "products:view",
  "products:create", "products:edit", "orders:view", "orders:edit",
  "settings:view", "settings:edit", "logs:view", "categories:view",
  "categories:create", "categories:edit", "inventory:view", "analytics:view",
  "customers:view", "vendors:view", "reports:view",
];

const SUPERADMIN_PERMISSIONS = [
  ...ADMIN_PERMISSIONS,
  "users:create", "users:delete", "admins:view", "admins:create",
  "admins:edit", "admins:delete", "roles:view", "roles:create",
  "roles:edit", "roles:delete", "permissions:view", "permissions:create",
  "permissions:edit", "permissions:delete", "logs:export",
  "products:delete", "orders:delete", "categories:delete",
  "inventory:edit", "customers:edit", "vendors:edit", "reports:export",
];

async function createUser(
  email: string,
  password: string,
  role: "customer" | "admin" | "superadmin",
  firstName: string,
  lastName: string
) {
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("profiles")
      .update({
        role,
        status: "active",
        permissions: role === "superadmin" ? SUPERADMIN_PERMISSIONS : role === "admin" ? ADMIN_PERMISSIONS : [],
        first_name: firstName,
        last_name: lastName,
      })
      .eq("id", existing.id);
    console.log(`✓ Updated existing user: ${email} (${role})`);
    return;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { first_name: firstName, last_name: lastName },
  });

  if (error) {
    console.error(`✗ Failed to create ${email}:`, error.message);
    return;
  }

  await supabase
    .from("profiles")
    .update({
      role,
      status: "active",
      permissions: role === "superadmin" ? SUPERADMIN_PERMISSIONS : role === "admin" ? ADMIN_PERMISSIONS : [],
      first_name: firstName,
      last_name: lastName,
      email_verified: true,
    })
    .eq("id", data.user.id);

  console.log(`✓ Created ${role}: ${email}`);
}

async function main() {
  console.log("Seeding demo users...\n");

  await createUser(
    process.env.SEED_CUSTOMER_EMAIL || "customer@amazonstore.com",
    process.env.SEED_CUSTOMER_PASSWORD || "Customer@123456",
    "customer",
    "Demo",
    "Customer"
  );

  await createUser(
    process.env.SEED_ADMIN_EMAIL || "admin@amazonstore.com",
    process.env.SEED_ADMIN_PASSWORD || "Admin@123456",
    "admin",
    "Store",
    "Admin"
  );

  await createUser(
    process.env.SEED_SUPERADMIN_EMAIL || "superadmin@amazonstore.com",
    process.env.SEED_SUPERADMIN_PASSWORD || "Super@123456",
    "superadmin",
    "Super",
    "Admin"
  );

  console.log("\n✓ Seed complete!");
  console.log("\nDemo credentials:");
  console.log(`  Customer:   ${process.env.SEED_CUSTOMER_EMAIL || "customer@amazonstore.com"}`);
  console.log(`  Admin:      ${process.env.SEED_ADMIN_EMAIL || "admin@amazonstore.com"}`);
  console.log(`  Superadmin: ${process.env.SEED_SUPERADMIN_EMAIL || "superadmin@amazonstore.com"}`);
  console.log("\nPasswords are read from SEED_*_PASSWORD variables and are intentionally not logged.");
}

main().catch(console.error);
