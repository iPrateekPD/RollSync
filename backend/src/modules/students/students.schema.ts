import { z } from 'zod';

export const createStudentSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(6),
    studentId: z.string().min(1),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    programId: z.string().uuid(),
    semesterId: z.string().uuid(),
    sectionId: z.string().uuid(),
  }),
});

export const updateStudentSchema = z.object({
  body: z.object({
    firstName: z.string().min(1).optional(),
    lastName: z.string().min(1).optional(),
    programId: z.string().uuid().optional(),
    semesterId: z.string().uuid().optional(),
    sectionId: z.string().uuid().optional(),
  }),
});
