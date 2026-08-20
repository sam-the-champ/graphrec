import { z } from 'zod';

const idArray = z.array(z.string().min(1)).max(20).optional().default([]);

export const createTutorialSchema = z.object({
  body: z.object({
    title: z.string().trim().min(3).max(200),
    description: z.string().trim().min(1).max(2000),
    contentUrl: z.string().trim().url().optional(),
    difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
    duration: z.number().int().positive().max(100_000), // minutes
    topicIds: idArray,
    skillIds: idArray,
    courseId: z.string().min(1).optional(),
    instructorId: z.string().min(1).optional(),
  }),
});

export const updateTutorialSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
  body: z
    .object({
      title: z.string().trim().min(3).max(200).optional(),
      description: z.string().trim().min(1).max(2000).optional(),
      contentUrl: z.string().trim().url().optional(),
      difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
      duration: z.number().int().positive().max(100_000).optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'at least one field must be provided',
    }),
});

export const listTutorialsSchema = z.object({
  query: z.object({
    difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional().default(20),
    offset: z.coerce.number().int().min(0).optional().default(0),
  }),
});

export const tutorialIdParamSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
});
