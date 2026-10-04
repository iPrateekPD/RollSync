import { z } from 'zod';

export const createNoticeSchema = z.object({
  body: z.object({
    title: z.string().min(2),
    description: z.string().min(5),
    category: z.enum(['ACADEMIC', 'EXAMINATION', 'ATTENDANCE', 'HOLIDAY', 'GENERAL', 'EMERGENCY']),
    priority: z.enum(['LOW', 'NORMAL', 'HIGH']),
    audience: z.array(z.enum(['ADMIN', 'TEACHER', 'STUDENT'])),
    publishDate: z.string().datetime(),
    expiryDate: z.string().datetime().optional(),
    attachmentUrl: z.string().url().optional(),
  }),
});

export const updateNoticeSchema = z.object({
  body: z.object({
    title: z.string().min(2).optional(),
    description: z.string().min(5).optional(),
    category: z.enum(['ACADEMIC', 'EXAMINATION', 'ATTENDANCE', 'HOLIDAY', 'GENERAL', 'EMERGENCY']).optional(),
    priority: z.enum(['LOW', 'NORMAL', 'HIGH']).optional(),
    audience: z.array(z.enum(['ADMIN', 'TEACHER', 'STUDENT'])).optional(),
    publishDate: z.string().datetime().optional(),
    expiryDate: z.string().datetime().optional(),
    attachmentUrl: z.string().url().optional(),
  }),
});
