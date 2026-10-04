"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateLeaveRequest = exports.createLeaveRequest = exports.getLeaveRequestById = exports.getLeaveRequests = void 0;
const server_1 = require("../../server");
const errors_1 = require("../../utils/errors");
const client_1 = require("@prisma/client");
const getLeaveRequests = async (req, res, next) => {
    try {
        const userRole = req.user?.role;
        let whereClause = {};
        // Students only see their own leave requests
        if (userRole === client_1.Role.STUDENT) {
            const student = await server_1.prisma.student.findUnique({ where: { userId: req.user?.userId } });
            if (student) {
                whereClause = { studentId: student.id };
            }
        }
        // Teachers might only see their department's students, but for simplicity admins and teachers see all or can filter
        const requests = await server_1.prisma.leaveRequest.findMany({
            where: whereClause,
            include: {
                student: { select: { studentId: true, firstName: true, lastName: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(requests);
    }
    catch (error) {
        next(error);
    }
};
exports.getLeaveRequests = getLeaveRequests;
const getLeaveRequestById = async (req, res, next) => {
    try {
        const request = await server_1.prisma.leaveRequest.findUnique({
            where: { id: req.params.id },
            include: {
                student: { select: { studentId: true, firstName: true, lastName: true, userId: true } }
            }
        });
        if (!request)
            throw new errors_1.NotFoundError('Leave request not found');
        if (req.user?.role === client_1.Role.STUDENT && request.student.userId !== req.user.userId) {
            throw new errors_1.NotFoundError('Leave request not found'); // hide from other students
        }
        res.json(request);
    }
    catch (error) {
        next(error);
    }
};
exports.getLeaveRequestById = getLeaveRequestById;
const createLeaveRequest = async (req, res, next) => {
    try {
        if (req.user?.role !== client_1.Role.STUDENT) {
            throw new errors_1.ForbiddenError('Only students can create leave requests');
        }
        const student = await server_1.prisma.student.findUnique({ where: { userId: req.user.userId } });
        if (!student)
            throw new errors_1.NotFoundError('Student profile not found');
        const data = {
            ...req.body,
            studentId: student.id,
            status: 'PENDING'
        };
        const request = await server_1.prisma.leaveRequest.create({ data });
        res.status(201).json(request);
    }
    catch (error) {
        next(error);
    }
};
exports.createLeaveRequest = createLeaveRequest;
const updateLeaveRequest = async (req, res, next) => {
    try {
        const request = await server_1.prisma.leaveRequest.update({
            where: { id: req.params.id },
            data: { status: req.body.status },
        });
        res.json(request);
    }
    catch (error) {
        next(error);
    }
};
exports.updateLeaveRequest = updateLeaveRequest;
