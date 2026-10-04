"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateTimetableEntrySchema = exports.createTimetableEntrySchema = void 0;
const zod_1 = require("zod");
exports.createTimetableEntrySchema = zod_1.z.object({
    body: zod_1.z.object({
        courseId: zod_1.z.string().uuid(),
        teacherId: zod_1.z.string().uuid(),
        classroomId: zod_1.z.string().uuid(),
        sectionId: zod_1.z.string().uuid(),
        dayOfWeek: zod_1.z.number().int().min(0).max(6), // 0-6 (Sun-Sat)
        startTime: zod_1.z.string().regex(/^([01]\d|2[0-3]):?([0-5]\d)$/, 'Invalid time format (HH:MM)'),
        endTime: zod_1.z.string().regex(/^([01]\d|2[0-3]):?([0-5]\d)$/, 'Invalid time format (HH:MM)'),
    }).refine(data => data.startTime < data.endTime, {
        message: "Start time must be before end time",
        path: ["endTime"],
    }),
});
exports.updateTimetableEntrySchema = zod_1.z.object({
    body: zod_1.z.object({
        courseId: zod_1.z.string().uuid().optional(),
        teacherId: zod_1.z.string().uuid().optional(),
        classroomId: zod_1.z.string().uuid().optional(),
        sectionId: zod_1.z.string().uuid().optional(),
        dayOfWeek: zod_1.z.number().int().min(0).max(6).optional(),
        startTime: zod_1.z.string().regex(/^([01]\d|2[0-3]):?([0-5]\d)$/).optional(),
        endTime: zod_1.z.string().regex(/^([01]\d|2[0-3]):?([0-5]\d)$/).optional(),
    }),
});
