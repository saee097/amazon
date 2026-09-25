import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Singleton Supabase client used on the server side (API routes).
 * It is initialised with the Service Role key for privileged operations
 * (e.g., creating users, managing data). The public anon key is used on
 * the client side – that part is omitted here because this repository
 * focuses on the backend API.
 */
let supabase: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (supabase) return supabase;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
  if (!url || !serviceKey) {
    throw new Error('Supabase credentials are not set in environment variables');
  }
  supabase = createClient(url, serviceKey);
  return supabase;
}

/**
 * Helper to obtain the public client (for client‑side calls).
 * Not used in the server code but exported for completeness.
 */
export function getPublicSupabase(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
  if (!url || !anonKey) {
    throw new Error('Public Supabase credentials missing');
  }
  return createClient(url, anonKey);
}
