"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockERPProvider = void 0;
const errors_1 = require("../../utils/errors");
class MockERPProvider {
    async authenticate(username, password) {
        if (username === 'wrong')
            throw new errors_1.UnauthorizedError('Invalid ERP credentials');
        return 'mock_erp_session_cookie_12345';
    }
    async getDayWiseAttendance(rollNo, sessionCookie, semester = -1) {
        this.validateSession(sessionCookie);
        return [
            { date: '2026-09-28', subject: 'DSP', attended: 1, held: 1, percentage: 100 },
            { date: '2026-09-27', subject: 'VLSI', attended: 0, held: 1, percentage: 0 },
            { date: '2026-09-26', subject: 'MPMC', attended: 1, held: 1, percentage: 100 },
        ];
    }
    async getSubjectWiseAttendance(rollNo, sessionCookie) {
        this.validateSession(sessionCookie);
        return [
            { subjectCode: 'ECE301', subjectName: 'DSP', attended: 25, held: 30, percentage: 83.33 },
            { subjectCode: 'ECE302', subjectName: 'VLSI', attended: 28, held: 30, percentage: 93.33 },
            { subjectCode: 'ECE303', subjectName: 'MPMC', attended: 20, held: 30, percentage: 66.67 },
        ];
    }
    async getAcademicDetails(studentId, sessionCookie) {
        this.validateSession(sessionCookie);
        return {
            studentId,
            branch: 'Electronics and Communication',
            currentSemester: 5,
            cgpa: 8.2
        };
    }
    async getSubjectWiseGrades(rollNo, sessionCookie) {
        this.validateSession(sessionCookie);
        return [
            { semester: 4, subjectCode: 'EM 4', grade: 'A', result: 'P', sgpa: '8.5' },
            { semester: 4, subjectCode: 'AEC', grade: 'B', result: 'P', sgpa: '8.5' },
        ];
    }
    validateSession(sessionCookie) {
        if (!sessionCookie || sessionCookie === 'expired') {
            throw new errors_1.UnauthorizedError('ERP_SESSION_EXPIRED');
        }
    }
}
exports.MockERPProvider = MockERPProvider;
