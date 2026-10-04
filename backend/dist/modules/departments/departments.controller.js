"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateDepartment = exports.createDepartment = exports.getDepartmentById = exports.getDepartments = void 0;
const server_1 = require("../../server");
const errors_1 = require("../../utils/errors");
const getDepartments = async (req, res, next) => {
    try {
        const departments = await server_1.prisma.department.findMany({
            include: {
                _count: {
                    select: { programs: true, teachers: true }
                }
            }
        });
        res.json(departments);
    }
    catch (error) {
        next(error);
    }
};
exports.getDepartments = getDepartments;
const getDepartmentById = async (req, res, next) => {
    try {
        const department = await server_1.prisma.department.findUnique({
            where: { id: req.params.id },
            include: {
                programs: true,
                teachers: {
                    select: {
                        id: true,
                        teacherId: true,
                        firstName: true,
                        lastName: true
                    }
                }
            }
        });
        if (!department)
            throw new errors_1.NotFoundError('Department not found');
        res.json(department);
    }
    catch (error) {
        next(error);
    }
};
exports.getDepartmentById = getDepartmentById;
const createDepartment = async (req, res, next) => {
    try {
        const { code, name } = req.body;
        const existing = await server_1.prisma.department.findUnique({ where: { code } });
        if (existing)
            throw new errors_1.ConflictError('Department code already exists');
        const department = await server_1.prisma.department.create({
            data: { code, name },
        });
        res.status(201).json(department);
    }
    catch (error) {
        next(error);
    }
};
exports.createDepartment = createDepartment;
const updateDepartment = async (req, res, next) => {
    try {
        const { code, name } = req.body;
        if (code) {
            const existing = await server_1.prisma.department.findUnique({ where: { code } });
            if (existing && existing.id !== req.params.id) {
                throw new errors_1.ConflictError('Department code already exists');
            }
        }
        const department = await server_1.prisma.department.update({
            where: { id: req.params.id },
            data: { code, name },
        });
        res.json(department);
    }
    catch (error) {
        next(error);
    }
};
exports.updateDepartment = updateDepartment;
