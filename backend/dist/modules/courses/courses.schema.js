"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCourseSchema = exports.createCourseSchema = void 0;
const zod_1 = require("zod");
exports.createCourseSchema = zod_1.z.object({
    body: zod_1.z.object({
        code: zod_1.z.string().min(2),
        name: zod_1.z.string().min(2),
        credits: zod_1.z.number().int().min(1),
        semesterId: zod_1.z.string().uuid(),
        teacherId: zod_1.z.string().uuid(),
    }),
});
exports.updateCourseSchema = zod_1.z.object({
    body: zod_1.z.object({
        code: zod_1.z.string().min(2).optional(),
        name: zod_1.z.string().min(2).optional(),
        credits: zod_1.z.number().int().min(1).optional(),
        semesterId: zod_1.z.string().uuid().optional(),
        teacherId: zod_1.z.string().uuid().optional(),
    }),
});
