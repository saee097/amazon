import { z } from 'zod';

// Schemas for request payloads
export const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['admin', 'customer']),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const createCustomerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

export const updateCustomerSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
});

export const createAdminSchema = z.object({
  email: z.string().email(),
});

export const updateAdminSchema = z.object({
  email: z.string().email().optional(),
});
