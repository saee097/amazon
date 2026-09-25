// pages/api/customers/index.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getSupabase } from '../../../lib/supabase';
import { requireRole } from '../../../middleware/auth';
import { Database } from '../../../types/supabase';

/**
 * /api/customers
 *
 * GET  – list customers (admin sees own, superadmin sees all)
 * POST – create a new customer (admin or superadmin)
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only admin or superadmin can access this endpoint
  const auth = await requireRole(req, res, ['admin', 'superadmin']);
  if (!auth) return; // requireRole already responded

  const supabase = getSupabase();

  if (req.method === 'GET') {
    // Admin sees only customers they created; superadmin sees all
    const query = supabase.from<Database['public']['Tables']['customers']['Row']>('customers');
    const filtered = auth.role === 'admin' ? query.eq('created_by', auth.userId) : query;
    const { data, error } = await filtered.select('*');
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ customers: data });
  }

  if (req.method === 'POST') {
    const { name, email } = req.body as { name?: string; email?: string };
    if (!name || !email) {
      return res.status(400).json({ error: 'name and email required' });
    }
    const { data, error } = await supabase
      .from<Database['public']['Tables']['customers']['Insert']>('customers')
      .insert({ name, email, created_by: auth.userId });
    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json({ customer: data[0] });
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ error: `Method ${req.method} not allowed` });
}
