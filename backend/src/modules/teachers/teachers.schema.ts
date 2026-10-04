import { z } from 'zod';

export const createTeacherSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(6),
    teacherId: z.string().min(1),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    departmentId: z.string().uuid(),
  }),
});

export const updateTeacherSchema = z.object({
  body: z.object({
    firstName: z.string().min(1).optional(),
    lastName: z.string().min(1).optional(),
    departmentId: z.string().uuid().optional(),
  }),
});
