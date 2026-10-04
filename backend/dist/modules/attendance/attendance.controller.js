"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.finalizeSessionAttendance = exports.updateAttendanceResult = exports.getSessionAttendance = void 0;
const server_1 = require("../../server");
const attendance_service_1 = require("./attendance.service");
const getSessionAttendance = async (req, res, next) => {
    try {
        const classSessionId = req.params.sessionId;
        const results = await server_1.prisma.attendanceResult.findMany({
            where: {
                attendanceSession: { classSessionId }
            },
            include: {
                student: { select: { studentId: true, firstName: true, lastName: true } }
            }
        });
        res.json(results);
    }
    catch (error) {
        next(error);
    }
};
exports.getSessionAttendance = getSessionAttendance;
const updateAttendanceResult = async (req, res, next) => {
    try {
        const { status, reason } = req.body;
        const result = await server_1.prisma.attendanceResult.update({
            where: { id: req.params.resultId },
            data: {
                status: status,
                reason,
                updatedBy: req.user?.userId
            }
        });
        res.json(result);
    }
    catch (error) {
        next(error);
    }
};
exports.updateAttendanceResult = updateAttendanceResult;
const finalizeSessionAttendance = async (req, res, next) => {
    try {
        const classSessionId = req.params.sessionId;
        await attendance_service_1.AttendanceService.finalizeClassSession(classSessionId);
        res.json({ message: 'Attendance finalized successfully' });
    }
    catch (error) {
        next(error);
    }
};
exports.finalizeSessionAttendance = finalizeSessionAttendance;
