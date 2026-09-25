import { NextApiRequest, NextApiResponse } from 'next';
import { ZodSchema } from 'zod';

/**
 * Generic validation middleware for API routes.
 * Returns true if validation passes, otherwise sends 400 and returns false.
 */
export function validateRequest(
  req: NextApiRequest,
  res: NextApiResponse,
  schema: ZodSchema
): boolean {
  try {
    schema.parse(req.body);
    return true;
  } catch (e: any) {
    res.status(400).json({ error: 'Invalid request payload', details: e.errors });
    return false;
  }
}
