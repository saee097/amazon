import { createClient } from "@supabase/supabase-js";
import { envVar } from "../lib/env";
import ws from "ws";

let adminClient: ReturnType<typeof createClient> | null = null;

export function getSupabaseAdmin() {
  const url = envVar("NEXT_PUBLIC_SUPABASE_URL") || envVar("SUPABASE_URL");
  const serviceKey = envVar("SUPABASE_SERVICE_ROLE_KEY") || envVar("SUPABASE_SECRET_KEY");

  if (!url || !serviceKey) {
    throw new Error("Missing Supabase environment variables");
  }

  if (!adminClient) {
    adminClient = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
      realtime: { transport: ws as any },
    });
  }

  try {
    (adminClient.auth as any).setAuth(null);
  } catch {
    /* non-browser safe */
  }

  return adminClient;
}
