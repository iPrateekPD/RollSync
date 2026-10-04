"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateStudent = exports.createStudent = exports.getStudentById = exports.getStudents = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const server_1 = require("../../server");
const errors_1 = require("../../utils/errors");
const client_1 = require("@prisma/client");
const getStudents = async (req, res, next) => {
    try {
        const students = await server_1.prisma.student.findMany({
            include: {
                program: { select: { name: true, department: { select: { name: true } } } },
                semester: { select: { name: true, number: true } },
                section: { select: { name: true } },
            }
        });
        res.json(students);
    }
    catch (error) {
        next(error);
    }
};
exports.getStudents = getStudents;
const getStudentById = async (req, res, next) => {
    try {
        const studentId = req.params.id;
        // Authorization check: if student, can only view own profile
        if (req.user?.role === client_1.Role.STUDENT && req.user.userId !== studentId && req.user.userId /* which is actually User.id */) {
            // We need to map User.id to Student.id to check properly
            const requestingStudent = await server_1.prisma.student.findUnique({ where: { userId: req.user.userId } });
            if (!requestingStudent || requestingStudent.id !== studentId) {
                throw new errors_1.NotFoundError('Student not found'); // hide existence for unauthorized
            }
        }
        const student = await server_1.prisma.student.findUnique({
            where: { id: studentId },
            include: {
                program: true,
                semester: true,
                section: true,
                user: { select: { email: true, createdAt: true } },
                rfidCard: true,
                bleIdentity: true,
            }
        });
        if (!student)
            throw new errors_1.NotFoundError('Student not found');
        res.json(student);
    }
    catch (error) {
        next(error);
    }
};
exports.getStudentById = getStudentById;
const createStudent = async (req, res, next) => {
    try {
        const { email, password, studentId, firstName, lastName, programId, semesterId, sectionId } = req.body;
        // Check conflicts
        const [existingUser, existingStudent] = await Promise.all([
            server_1.prisma.user.findUnique({ where: { email } }),
            server_1.prisma.student.findUnique({ where: { studentId } })
        ]);
        if (existingUser)
            throw new errors_1.ConflictError('Email already in use');
        if (existingStudent)
            throw new errors_1.ConflictError('Student ID already exists');
        const hashedPassword = await bcrypt_1.default.hash(password, 10);
        // Create user and student transactionally
        const student = await server_1.prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    role: client_1.Role.STUDENT,
                }
            });
            return tx.student.create({
                data: {
                    userId: user.id,
                    studentId,
                    firstName,
                    lastName,
                    programId,
                    semesterId,
                    sectionId,
                },
                include: {
                    user: { select: { email: true } }
                }
            });
        });
        res.status(201).json(student);
    }
    catch (error) {
        next(error);
    }
};
exports.createStudent = createStudent;
const updateStudent = async (req, res, next) => {
    try {
        const data = req.body;
        const student = await server_1.prisma.student.update({
            where: { id: req.params.id },
            data,
        });
        res.json(student);
    }
    catch (error) {
        next(error);
    }
};
exports.updateStudent = updateStudent;
