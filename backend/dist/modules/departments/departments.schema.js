"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateDepartmentSchema = exports.createDepartmentSchema = void 0;
const zod_1 = require("zod");
exports.createDepartmentSchema = zod_1.z.object({
    body: zod_1.z.object({
        code: zod_1.z.string().min(2, 'Code is required'),
        name: zod_1.z.string().min(2, 'Name is required'),
    }),
});
exports.updateDepartmentSchema = zod_1.z.object({
    body: zod_1.z.object({
        code: zod_1.z.string().min(2).optional(),
        name: zod_1.z.string().min(2).optional(),
    }),
});
