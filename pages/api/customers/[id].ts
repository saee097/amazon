// pages/api/customers/[id].ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getSupabase } from '../../../lib/supabase';
import { requireRole } from '../../../middleware/auth';
import { Database } from '../../../types/supabase';

/**
 * /api/customers/:id
 *
 * GET    – fetch a single customer (admin can only fetch own customers)
 * PUT    – update a customer (admin can only update own customers)
 * DELETE – delete a customer (admin can only delete own customers)
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query as { id: string };
  if (!id) return res.status(400).json({ error: 'Missing customer id' });

  const auth = await requireRole(req, res, ['admin', 'superadmin']);
  if (!auth) return; // role check handled inside requireRole

  const supabase = getSupabase();
  const table = supabase.from<Database['public']['Tables']['customers']['Row']>('customers');

  // Helper to ensure admin only accesses own customers
  const filter = auth.role === 'admin' ? table.eq('created_by', auth.userId) : table;

  if (req.method === 'GET') {
    const { data, error } = await filter.select('*').eq('id', id).single();
    if (error) return res.status(404).json({ error: error.message });
    return res.status(200).json({ customer: data });
  }

  if (req.method === 'PUT') {
    const { name, email } = req.body as { name?: string; email?: string };
    if (!name && !email) return res.status(400).json({ error: 'nothing to update' });
    const updates: any = {};
    if (name) updates.name = name;
    if (email) updates.email = email;
    const { data, error } = await filter.update(updates).eq('id', id).select('*').single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ customer: data });
  }

  if (req.method === 'DELETE') {
    const { error } = await filter.delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(204).end();
  }

  res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
  return res.status(405).json({ error: `Method ${req.method} not allowed` });
}
