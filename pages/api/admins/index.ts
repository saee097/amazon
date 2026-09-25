// pages/api/admins/index.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getSupabase } from '../../../lib/supabase';
import { requireRole } from '../../../middleware/auth';
import { Database } from '../../../types/supabase';

/**
 * /api/admins
 *
 * GET  – list all admins (superadmin only)
 * POST – create a new admin (superadmin only)
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only superadmin can access these routes
  const auth = await requireRole(req, res, ['superadmin']);
  if (!auth) return; // response already sent

  const supabase = getSupabase();

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from<Database['public']['Tables']['admins']['Row']>('admins')
      .select('*');
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ admins: data });
  }

  if (req.method === 'POST') {
    const { email, password } = req.body as { email?: string; password?: string };
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password required' });
    }

    // Create auth user using service role
    const { data: created, error: createErr } = await supabase.auth.admin.createUser({
      email,
      password,
    });
    if (createErr) return res.status(500).json({ error: createErr.message });

    // Insert profile with role admin
    const { error: profileErr } = await supabase
      .from<Database['public']['Tables']['profiles']['Insert']>('profiles')
      .insert({ id: created.user?.id, role: 'admin' });
    if (profileErr) {
      // Rollback auth user if profile fails
      await supabase.auth.admin.deleteUser(created.user?.id as string);
      return res.status(500).json({ error: profileErr.message });
    }

    // Insert admin row (for convenience, mirrors auth user)
    const { error: adminErr } = await supabase
      .from<Database['public']['Tables']['admins']['Insert']>('admins')
      .insert({ id: created.user?.id, email });
    if (adminErr) {
      // Cleanup both auth user and profile if admin insert fails
      await supabase.auth.admin.deleteUser(created.user?.id as string);
      await supabase.from('profiles').delete().eq('id', created.user?.id);
      return res.status(500).json({ error: adminErr.message });
    }

    return res.status(201).json({ adminId: created.user?.id, email });
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ error: `Method ${req.method} not allowed` });
}
