"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.endClassSession = exports.startClassSession = exports.updateClassSession = exports.createClassSession = exports.getClassSessionById = exports.getClassSessions = void 0;
const server_1 = require("../../server");
const errors_1 = require("../../utils/errors");
const client_1 = require("@prisma/client");
const getClassSessions = async (req, res, next) => {
    try {
        const userRole = req.user?.role;
        let whereClause = {};
        // For teacher, show only their courses' sessions
        if (userRole === client_1.Role.TEACHER) {
            const teacher = await server_1.prisma.teacher.findUnique({ where: { userId: req.user?.userId } });
            if (teacher) {
                whereClause = { course: { teacherId: teacher.id } };
            }
        }
        // For student, show only sessions for courses they are enrolled in
        else if (userRole === client_1.Role.STUDENT) {
            const student = await server_1.prisma.student.findUnique({ where: { userId: req.user?.userId } });
            if (student) {
                whereClause = {
                    course: {
                        enrollments: { some: { studentId: student.id } }
                    }
                };
            }
        }
        const sessions = await server_1.prisma.classSession.findMany({
            where: whereClause,
            include: {
                course: { select: { name: true, code: true, teacher: { select: { firstName: true, lastName: true } } } },
                classroom: { select: { name: true } },
            },
            orderBy: { startTime: 'desc' }
        });
        res.json(sessions);
    }
    catch (error) {
        next(error);
    }
};
exports.getClassSessions = getClassSessions;
const getClassSessionById = async (req, res, next) => {
    try {
        const session = await server_1.prisma.classSession.findUnique({
            where: { id: req.params.id },
            include: {
                course: { include: { teacher: true } },
                classroom: true,
                attendanceSessions: {
                    include: { student: { select: { studentId: true, firstName: true, lastName: true } } }
                }
            }
        });
        if (!session)
            throw new errors_1.NotFoundError('Class Session not found');
        res.json(session);
    }
    catch (error) {
        next(error);
    }
};
exports.getClassSessionById = getClassSessionById;
const createClassSession = async (req, res, next) => {
    try {
        // Teachers and Admins can create sessions ad-hoc.
        const data = req.body;
        const session = await server_1.prisma.classSession.create({ data });
        res.status(201).json(session);
    }
    catch (error) {
        next(error);
    }
};
exports.createClassSession = createClassSession;
const updateClassSession = async (req, res, next) => {
    try {
        const session = await server_1.prisma.classSession.update({
            where: { id: req.params.id },
            data: req.body,
        });
        res.json(session);
    }
    catch (error) {
        next(error);
    }
};
exports.updateClassSession = updateClassSession;
// Start a session explicitly (useful for teachers on their portal)
const startClassSession = async (req, res, next) => {
    try {
        // Check if the teacher owns this course...
        const session = await server_1.prisma.classSession.findUnique({
            where: { id: req.params.id },
            include: { course: true }
        });
        if (!session)
            throw new errors_1.NotFoundError('Session not found');
        if (req.user?.role === client_1.Role.TEACHER) {
            const teacher = await server_1.prisma.teacher.findUnique({ where: { userId: req.user.userId } });
            if (session.course.teacherId !== teacher?.id) {
                throw new errors_1.ConflictError('You do not have permission to start this session');
            }
        }
        if (session.status !== 'SCHEDULED') {
            throw new errors_1.ConflictError('Session is already started or completed');
        }
        const updatedSession = await server_1.prisma.classSession.update({
            where: { id: session.id },
            data: { status: 'ACTIVE', startTime: new Date() } // Update start time to actual click time
        });
        res.json(updatedSession);
    }
    catch (error) {
        next(error);
    }
};
exports.startClassSession = startClassSession;
// End a session explicitly
const endClassSession = async (req, res, next) => {
    try {
        const session = await server_1.prisma.classSession.findUnique({
            where: { id: req.params.id },
            include: { course: true }
        });
        if (!session)
            throw new errors_1.NotFoundError('Session not found');
        if (req.user?.role === client_1.Role.TEACHER) {
            const teacher = await server_1.prisma.teacher.findUnique({ where: { userId: req.user.userId } });
            if (session.course.teacherId !== teacher?.id) {
                throw new errors_1.ConflictError('You do not have permission to end this session');
            }
        }
        if (session.status !== 'ACTIVE') {
            throw new errors_1.ConflictError('Only ACTIVE sessions can be completed');
        }
        const updatedSession = await server_1.prisma.classSession.update({
            where: { id: session.id },
            data: { status: 'COMPLETED', actualEndTime: new Date() }
        });
        // We would trigger the attendance finalization engine here in the future
        res.json(updatedSession);
    }
    catch (error) {
        next(error);
    }
};
exports.endClassSession = endClassSession;
