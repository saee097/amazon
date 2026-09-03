import { createClient } from "@supabase/supabase-js";
import { envVar } from "../lib/env";

let adminClient: ReturnType<typeof createClient> | null = null;

export function getSupabaseAdmin() {
  if (adminClient) return adminClient;

  const url = envVar("NEXT_PUBLIC_SUPABASE_URL") || envVar("SUPABASE_URL");
  const serviceKey = envVar("SUPABASE_SERVICE_ROLE_KEY") || envVar("SUPABASE_SECRET_KEY");

  if (!url || !serviceKey) {
    throw new Error("Missing Supabase environment variables");
  }

  adminClient = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  return adminClient;
}
