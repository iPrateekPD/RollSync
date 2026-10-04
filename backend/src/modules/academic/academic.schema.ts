import { z } from 'zod';

export const createAcademicYearSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
    isActive: z.boolean().optional(),
  }),
});

export const updateAcademicYearSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const createSemesterSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    number: z.number().int().min(1),
    academicYearId: z.string().uuid(),
  }),
});

export const updateSemesterSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    number: z.number().int().min(1).optional(),
    academicYearId: z.string().uuid().optional(),
  }),
});

export const createSectionSchema = z.object({
  body: z.object({
    name: z.string().min(1),
  }),
});

export const updateSectionSchema = z.object({
  body: z.object({
    name: z.string().min(1).optional(),
  }),
});
