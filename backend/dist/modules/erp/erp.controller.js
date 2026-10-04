"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSubjectWiseGrades = exports.getAcademicDetails = exports.getSubjectWiseAttendance = exports.getDayWiseAttendance = exports.loginToERP = void 0;
const erp_service_1 = require("./erp.service");
const server_1 = require("../../server");
const errors_1 = require("../../utils/errors");
const client_1 = require("@prisma/client");
const loginToERP = async (req, res, next) => {
    try {
        const { username, password } = req.body;
        // We expect the user calling this to already be authenticated with our app as a Student
        if (!req.user || req.user.role !== client_1.Role.STUDENT) {
            throw new errors_1.UnauthorizedError('Only authenticated students can link their ERP account');
        }
        const student = await server_1.prisma.student.findUnique({ where: { userId: req.user.userId } });
        if (!student) {
            throw new errors_1.UnauthorizedError('Student profile not found');
        }
        // Authenticate with ERP and get the session cookie
        const sessionCookie = await erp_service_1.erpService.authenticate(username, password);
        if (!sessionCookie) {
            throw new errors_1.UnauthorizedError('Invalid ERP credentials');
        }
        // Store it securely encrypted
        await erp_service_1.erpService.storeSessionCookie(student.id, sessionCookie);
        res.json({ message: 'ERP account linked successfully' });
    }
    catch (error) {
        next(error);
    }
};
exports.loginToERP = loginToERP;
const getDayWiseAttendance = async (req, res, next) => {
    try {
        const student = await getStudentFromReq(req);
        const data = await erp_service_1.erpService.getDayWiseAttendance(student.id, student.studentId);
        res.json({
            student: { rollNo: student.studentId },
            attendance: data
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getDayWiseAttendance = getDayWiseAttendance;
const getSubjectWiseAttendance = async (req, res, next) => {
    try {
        const student = await getStudentFromReq(req);
        const data = await erp_service_1.erpService.getSubjectWiseAttendance(student.id, student.studentId);
        res.json({
            student: { rollNo: student.studentId },
            attendance: data
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getSubjectWiseAttendance = getSubjectWiseAttendance;
const getAcademicDetails = async (req, res, next) => {
    try {
        const student = await getStudentFromReq(req);
        const data = await erp_service_1.erpService.getAcademicDetails(student.id, student.studentId);
        res.json({
            student: { rollNo: student.studentId },
            academicDetails: data
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getAcademicDetails = getAcademicDetails;
const getSubjectWiseGrades = async (req, res, next) => {
    try {
        const student = await getStudentFromReq(req);
        const data = await erp_service_1.erpService.getSubjectWiseGrades(student.id, student.studentId);
        res.json({
            student: { rollNo: student.studentId },
            grades: data
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getSubjectWiseGrades = getSubjectWiseGrades;
// Helper to ensure the user is a student and grab their profile
async function getStudentFromReq(req) {
    if (!req.user || req.user.role !== client_1.Role.STUDENT) {
        throw new errors_1.UnauthorizedError('Unauthorized access');
    }
    const student = await server_1.prisma.student.findUnique({ where: { userId: req.user.userId } });
    if (!student) {
        throw new errors_1.UnauthorizedError('Student profile not found');
    }
    return student;
}
