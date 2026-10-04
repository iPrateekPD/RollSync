"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProgramSchema = exports.createProgramSchema = void 0;
const zod_1 = require("zod");
exports.createProgramSchema = zod_1.z.object({
    body: zod_1.z.object({
        code: zod_1.z.string().min(2),
        name: zod_1.z.string().min(2),
        departmentId: zod_1.z.string().uuid(),
    }),
});
exports.updateProgramSchema = zod_1.z.object({
    body: zod_1.z.object({
        code: zod_1.z.string().min(2).optional(),
        name: zod_1.z.string().min(2).optional(),
        departmentId: zod_1.z.string().uuid().optional(),
    }),
});
