"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateTeacher = exports.createTeacher = exports.getTeacherById = exports.getTeachers = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const server_1 = require("../../server");
const errors_1 = require("../../utils/errors");
const client_1 = require("@prisma/client");
const getTeachers = async (req, res, next) => {
    try {
        const teachers = await server_1.prisma.teacher.findMany({
            include: {
                department: { select: { name: true } }
            }
        });
        res.json(teachers);
    }
    catch (error) {
        next(error);
    }
};
exports.getTeachers = getTeachers;
const getTeacherById = async (req, res, next) => {
    try {
        const teacherId = req.params.id;
        const teacher = await server_1.prisma.teacher.findUnique({
            where: { id: teacherId },
            include: {
                department: true,
                user: { select: { email: true, createdAt: true } },
            }
        });
        if (!teacher)
            throw new errors_1.NotFoundError('Teacher not found');
        res.json(teacher);
    }
    catch (error) {
        next(error);
    }
};
exports.getTeacherById = getTeacherById;
const createTeacher = async (req, res, next) => {
    try {
        const { email, password, teacherId, firstName, lastName, departmentId } = req.body;
        const [existingUser, existingTeacher] = await Promise.all([
            server_1.prisma.user.findUnique({ where: { email } }),
            server_1.prisma.teacher.findUnique({ where: { teacherId } })
        ]);
        if (existingUser)
            throw new errors_1.ConflictError('Email already in use');
        if (existingTeacher)
            throw new errors_1.ConflictError('Teacher ID already exists');
        const hashedPassword = await bcrypt_1.default.hash(password, 10);
        const teacher = await server_1.prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    role: client_1.Role.TEACHER,
                }
            });
            return tx.teacher.create({
                data: {
                    userId: user.id,
                    teacherId,
                    firstName,
                    lastName,
                    departmentId,
                },
                include: {
                    user: { select: { email: true } }
                }
            });
        });
        res.status(201).json(teacher);
    }
    catch (error) {
        next(error);
    }
};
exports.createTeacher = createTeacher;
const updateTeacher = async (req, res, next) => {
    try {
        const data = req.body;
        const teacher = await server_1.prisma.teacher.update({
            where: { id: req.params.id },
            data,
        });
        res.json(teacher);
    }
    catch (error) {
        next(error);
    }
};
exports.updateTeacher = updateTeacher;
