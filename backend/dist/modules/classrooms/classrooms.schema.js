"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateClassroomSchema = exports.createClassroomSchema = void 0;
const zod_1 = require("zod");
exports.createClassroomSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(2),
        capacity: zod_1.z.number().int().min(1),
    }),
});
exports.updateClassroomSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(2).optional(),
        capacity: zod_1.z.number().int().min(1).optional(),
    }),
});
