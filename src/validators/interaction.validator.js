import { z } from 'zod';

export const interactionParamSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'tutorial id is required'),
  }),
});

export const recommendationQuerySchema = z.object({
  query: z.object({
    limit: z.coerce.number().int().min(1).max(50).optional().default(10),
  }),
});
