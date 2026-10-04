"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateNoticeSchema = exports.createNoticeSchema = void 0;
const zod_1 = require("zod");
exports.createNoticeSchema = zod_1.z.object({
    body: zod_1.z.object({
        title: zod_1.z.string().min(2),
        description: zod_1.z.string().min(5),
        category: zod_1.z.enum(['ACADEMIC', 'EXAMINATION', 'ATTENDANCE', 'HOLIDAY', 'GENERAL', 'EMERGENCY']),
        priority: zod_1.z.enum(['LOW', 'NORMAL', 'HIGH']),
        audience: zod_1.z.array(zod_1.z.enum(['ADMIN', 'TEACHER', 'STUDENT'])),
        publishDate: zod_1.z.string().datetime(),
        expiryDate: zod_1.z.string().datetime().optional(),
        attachmentUrl: zod_1.z.string().url().optional(),
    }),
});
exports.updateNoticeSchema = zod_1.z.object({
    body: zod_1.z.object({
        title: zod_1.z.string().min(2).optional(),
        description: zod_1.z.string().min(5).optional(),
        category: zod_1.z.enum(['ACADEMIC', 'EXAMINATION', 'ATTENDANCE', 'HOLIDAY', 'GENERAL', 'EMERGENCY']).optional(),
        priority: zod_1.z.enum(['LOW', 'NORMAL', 'HIGH']).optional(),
        audience: zod_1.z.array(zod_1.z.enum(['ADMIN', 'TEACHER', 'STUDENT'])).optional(),
        publishDate: zod_1.z.string().datetime().optional(),
        expiryDate: zod_1.z.string().datetime().optional(),
        attachmentUrl: zod_1.z.string().url().optional(),
    }),
});
