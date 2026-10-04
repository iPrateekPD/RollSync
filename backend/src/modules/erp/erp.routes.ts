import { Router } from 'express';
import * as ERPController from './erp.controller';
import { authenticate, requireRole } from '../../middleware/auth';
import { Role } from '@prisma/client';

const router = Router();

// All ERP routes require authentication and specifically the STUDENT role
router.use(authenticate);
router.use(requireRole([Role.STUDENT]));

// Link ERP account
router.post('/login', ERPController.loginToERP);

// Attendance Endpoints
router.get('/attendance/day-wise', ERPController.getDayWiseAttendance);
router.get('/attendance/subject-wise', ERPController.getSubjectWiseAttendance);

// Academic Endpoints
router.get('/student/academic', ERPController.getAcademicDetails);
router.get('/student/grades', ERPController.getSubjectWiseGrades);

export default router;
