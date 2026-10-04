"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateSectionSchema = exports.createSectionSchema = exports.updateSemesterSchema = exports.createSemesterSchema = exports.updateAcademicYearSchema = exports.createAcademicYearSchema = void 0;
const zod_1 = require("zod");
exports.createAcademicYearSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(2),
        startDate: zod_1.z.string().datetime(),
        endDate: zod_1.z.string().datetime(),
        isActive: zod_1.z.boolean().optional(),
    }),
});
exports.updateAcademicYearSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(2).optional(),
        startDate: zod_1.z.string().datetime().optional(),
        endDate: zod_1.z.string().datetime().optional(),
        isActive: zod_1.z.boolean().optional(),
    }),
});
exports.createSemesterSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(2),
        number: zod_1.z.number().int().min(1),
        academicYearId: zod_1.z.string().uuid(),
    }),
});
exports.updateSemesterSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(2).optional(),
        number: zod_1.z.number().int().min(1).optional(),
        academicYearId: zod_1.z.string().uuid().optional(),
    }),
});
exports.createSectionSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(1),
    }),
});
exports.updateSectionSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(1).optional(),
    }),
});
