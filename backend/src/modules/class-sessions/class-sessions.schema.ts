import { z } from 'zod';

export const createClassSessionSchema = z.object({
  body: z.object({
    courseId: z.string().uuid(),
    classroomId: z.string().uuid(),
    date: z.string().datetime(), // ISO datetime string
    startTime: z.string().datetime(),
    endTime: z.string().datetime().optional(),
    requiredDwell: z.number().int().min(0).optional(),
    rssiEnter: z.number().int().optional(),
    rssiExit: z.number().int().optional(),
    gracePeriod: z.number().int().min(0).optional(),
  }),
});

export const updateClassSessionSchema = z.object({
  body: z.object({
    status: z.enum(['SCHEDULED', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED']).optional(),
    actualEndTime: z.string().datetime().optional(),
    requiredDwell: z.number().int().min(0).optional(),
    rssiEnter: z.number().int().optional(),
    rssiExit: z.number().int().optional(),
    gracePeriod: z.number().int().min(0).optional(),
  }),
});
