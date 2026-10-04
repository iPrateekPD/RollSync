import { z } from 'zod';

export const createCourseSchema = z.object({
  body: z.object({
    code: z.string().min(2),
    name: z.string().min(2),
    credits: z.number().int().min(1),
    semesterId: z.string().uuid(),
    teacherId: z.string().uuid(),
  }),
});

export const updateCourseSchema = z.object({
  body: z.object({
    code: z.string().min(2).optional(),
    name: z.string().min(2).optional(),
    credits: z.number().int().min(1).optional(),
    semesterId: z.string().uuid().optional(),
    teacherId: z.string().uuid().optional(),
  }),
});
