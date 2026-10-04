import { z } from 'zod';

export const createClassroomSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    capacity: z.number().int().min(1),
  }),
});

export const updateClassroomSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    capacity: z.number().int().min(1).optional(),
  }),
});
