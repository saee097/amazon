// pages/api/auth/signup.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getSupabase } from '../../../lib/supabase';
import { requireRole } from '../../../middleware/auth';
import { Database } from '../../../types/supabase';

/**
 * Sign‑up endpoint – creates a new Supabase auth user and a profile entry.
 *
 * Expected body (JSON):
 *   {
 *     "email": "user@example.com",
 *     "password": "secret",
 *     "role": "admin" | "customer"
 *   }
 *
 * Only a **superadmin** may create an `admin`. Anyone (including unauthenticated)
 * may sign up as a `customer`. The endpoint validates the role and then uses the
 * service‑role key to create the user. After creation a profile row is inserted
 * with the chosen role.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password, role } = req.body as {
    email?: string;
    password?: string;
    role?: string;
  };

  if (!email || !password || !role) {
    return res.status(400).json({ error: 'email, password and role are required' });
  }

  // If role is admin, ensure the caller is a superadmin.
  if (role === 'admin') {
    const auth = await requireRole(req, res, ['superadmin']);
    if (!auth) return; // requireRole already sent response
  }

  const supabase = getSupabase();
  const { data: created, error } = await supabase.auth.admin.createUser({
    email,
    password,
    // No need to set role here – we store it in the profiles table.
  });

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  // Insert profile with appropriate role
  const { error: profileErr } = await supabase
    .from<Database['public']['Tables']['profiles']['Insert']>('profiles')
    .insert({ id: created.user?.id, role: role as any });

  if (profileErr) {
    // Attempt to clean up the auth user if profile creation fails
    await supabase.auth.admin.deleteUser(created.user?.id as string);
    return res.status(500).json({ error: profileErr.message });
  }

  return res.status(201).json({ message: 'User created', userId: created.user?.id });
}
