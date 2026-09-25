import { NextApiRequest, NextApiResponse } from 'next';
import { getSupabase } from '../../lib/supabase';
import { Database } from '../../types/supabase';

/**
 * Middleware helper to extract the user from the `Authorization` header.
 * Returns an object with `userId` and `role` (if profile exists).
 */
export async function getAuth(req: NextApiRequest): Promise<{ userId: string; role: string } | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  const token = authHeader.replace('Bearer', '').trim();
  if (!token) return null;

  const supabase = getSupabase();
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;

  // Fetch role from profiles table
  const { data: profile } = await supabase
    .from<Database['public']['Tables']['profiles']['Row']>('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile) return null;
  return { userId: user.id, role: profile.role };
}

/**
 * Simple role guard. Pass the required role(s) – if the authenticated user
 * does not have one of them, the response is ended with 403.
 */
export async function requireRole(
  req: NextApiRequest,
  res: NextApiResponse,
  allowedRoles: string[]
): Promise<{ userId: string; role: string } | null> {
  const auth = await getAuth(req);
  if (!auth) {
    res.status(401).json({ error: 'Missing or invalid token' });
    return null;
  }
  if (!allowedRoles.includes(auth.role)) {
    res.status(403).json({ error: 'Insufficient permissions' });
    return null;
  }
  return auth;
}
