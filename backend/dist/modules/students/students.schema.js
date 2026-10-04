"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateStudentSchema = exports.createStudentSchema = void 0;
const zod_1 = require("zod");
exports.createStudentSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email(),
        password: zod_1.z.string().min(6),
        studentId: zod_1.z.string().min(1),
        firstName: zod_1.z.string().min(1),
        lastName: zod_1.z.string().min(1),
        programId: zod_1.z.string().uuid(),
        semesterId: zod_1.z.string().uuid(),
        sectionId: zod_1.z.string().uuid(),
    }),
});
exports.updateStudentSchema = zod_1.z.object({
    body: zod_1.z.object({
        firstName: zod_1.z.string().min(1).optional(),
        lastName: zod_1.z.string().min(1).optional(),
        programId: zod_1.z.string().uuid().optional(),
        semesterId: zod_1.z.string().uuid().optional(),
        sectionId: zod_1.z.string().uuid().optional(),
    }),
});
