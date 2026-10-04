"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateTeacherSchema = exports.createTeacherSchema = void 0;
const zod_1 = require("zod");
exports.createTeacherSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email(),
        password: zod_1.z.string().min(6),
        teacherId: zod_1.z.string().min(1),
        firstName: zod_1.z.string().min(1),
        lastName: zod_1.z.string().min(1),
        departmentId: zod_1.z.string().uuid(),
    }),
});
exports.updateTeacherSchema = zod_1.z.object({
    body: zod_1.z.object({
        firstName: zod_1.z.string().min(1).optional(),
        lastName: zod_1.z.string().min(1).optional(),
        departmentId: zod_1.z.string().uuid().optional(),
    }),
});
