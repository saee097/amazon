// pages/api/auth/login.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getSupabase } from '../../../lib/supabase';

/**
 * Login endpoint – verifies email/password using Supabase auth and returns a JWT.
 * The client should store the token (e.g., in an HttpOnly cookie) and send it
 * in the `Authorization: Bearer <token>` header for subsequent API calls.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password } = req.body as { email?: string; password?: string };
  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }

  const supabase = getSupabase();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return res.status(401).json({ error: error.message });
  }

  // Extract the access token (session JWT)
  const token = data.session?.access_token;
  if (!token) {
    return res.status(500).json({ error: 'Failed to obtain access token' });
  }

  // In a real app you would set an HttpOnly cookie here. For simplicity we return it.
  return res.status(200).json({ token, user: data.user });
}
