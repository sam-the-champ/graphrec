import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2, 'name must be at least 2 characters').max(100),
    email: z.string().trim().toLowerCase().email('invalid email address'),
    password: z.string().min(8, 'password must be at least 8 characters').max(128),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().trim().toLowerCase().email('invalid email address'),
    password: z.string().min(1, 'password is required'),
  }),
});
