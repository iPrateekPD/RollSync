"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateLeaveRequestSchema = exports.createLeaveRequestSchema = void 0;
const zod_1 = require("zod");
exports.createLeaveRequestSchema = zod_1.z.object({
    body: zod_1.z.object({
        leaveType: zod_1.z.string().min(2),
        startDate: zod_1.z.string().datetime(),
        endDate: zod_1.z.string().datetime(),
        reason: zod_1.z.string().min(5),
        attachmentUrl: zod_1.z.string().url().optional(),
    }).refine(data => data.startDate <= data.endDate, {
        message: "Start date must be before or equal to end date",
        path: ["endDate"],
    }),
});
exports.updateLeaveRequestSchema = zod_1.z.object({
    body: zod_1.z.object({
        status: zod_1.z.enum(['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED']),
    }),
});
