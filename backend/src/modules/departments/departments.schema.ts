import { z } from 'zod';

export const createDepartmentSchema = z.object({
  body: z.object({
    code: z.string().min(2, 'Code is required'),
    name: z.string().min(2, 'Name is required'),
  }),
});

export const updateDepartmentSchema = z.object({
  body: z.object({
    code: z.string().min(2).optional(),
    name: z.string().min(2).optional(),
  }),
});
