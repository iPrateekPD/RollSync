import { z } from 'zod';

export const createLeaveRequestSchema = z.object({
  body: z.object({
    leaveType: z.string().min(2),
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
    reason: z.string().min(5),
    attachmentUrl: z.string().url().optional(),
  }).refine(data => data.startDate <= data.endDate, {
    message: "Start date must be before or equal to end date",
    path: ["endDate"],
  }),
});

export const updateLeaveRequestSchema = z.object({
  body: z.object({
    status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED']),
  }),
});
