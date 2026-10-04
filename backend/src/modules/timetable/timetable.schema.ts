import { z } from 'zod';

export const createTimetableEntrySchema = z.object({
  body: z.object({
    courseId: z.string().uuid(),
    teacherId: z.string().uuid(),
    classroomId: z.string().uuid(),
    sectionId: z.string().uuid(),
    dayOfWeek: z.number().int().min(0).max(6), // 0-6 (Sun-Sat)
    startTime: z.string().regex(/^([01]\d|2[0-3]):?([0-5]\d)$/, 'Invalid time format (HH:MM)'),
    endTime: z.string().regex(/^([01]\d|2[0-3]):?([0-5]\d)$/, 'Invalid time format (HH:MM)'),
  }).refine(data => data.startTime < data.endTime, {
    message: "Start time must be before end time",
    path: ["endTime"],
  }),
});

export const updateTimetableEntrySchema = z.object({
  body: z.object({
    courseId: z.string().uuid().optional(),
    teacherId: z.string().uuid().optional(),
    classroomId: z.string().uuid().optional(),
    sectionId: z.string().uuid().optional(),
    dayOfWeek: z.number().int().min(0).max(6).optional(),
    startTime: z.string().regex(/^([01]\d|2[0-3]):?([0-5]\d)$/).optional(),
    endTime: z.string().regex(/^([01]\d|2[0-3]):?([0-5]\d)$/).optional(),
  }),
});
