import { z } from 'zod';

export const createProgramSchema = z.object({
  body: z.object({
    code: z.string().min(2),
    name: z.string().min(2),
    departmentId: z.string().uuid(),
  }),
});

export const updateProgramSchema = z.object({
  body: z.object({
    code: z.string().min(2).optional(),
    name: z.string().min(2).optional(),
    departmentId: z.string().uuid().optional(),
  }),
});
