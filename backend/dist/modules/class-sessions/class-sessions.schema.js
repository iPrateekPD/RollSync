"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateClassSessionSchema = exports.createClassSessionSchema = void 0;
const zod_1 = require("zod");
exports.createClassSessionSchema = zod_1.z.object({
    body: zod_1.z.object({
        courseId: zod_1.z.string().uuid(),
        classroomId: zod_1.z.string().uuid(),
        date: zod_1.z.string().datetime(), // ISO datetime string
        startTime: zod_1.z.string().datetime(),
        endTime: zod_1.z.string().datetime().optional(),
        requiredDwell: zod_1.z.number().int().min(0).optional(),
        rssiEnter: zod_1.z.number().int().optional(),
        rssiExit: zod_1.z.number().int().optional(),
        gracePeriod: zod_1.z.number().int().min(0).optional(),
    }),
});
exports.updateClassSessionSchema = zod_1.z.object({
    body: zod_1.z.object({
        status: zod_1.z.enum(['SCHEDULED', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED']).optional(),
        actualEndTime: zod_1.z.string().datetime().optional(),
        requiredDwell: zod_1.z.number().int().min(0).optional(),
        rssiEnter: zod_1.z.number().int().optional(),
        rssiExit: zod_1.z.number().int().optional(),
        gracePeriod: zod_1.z.number().int().min(0).optional(),
    }),
});
