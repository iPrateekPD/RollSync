import { Router } from 'express';
import * as AttendanceController from './attendance.controller';
import { authenticate, requireRole } from '../../middleware/auth';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticate);

// Everyone can view attendance for a session (filtered by role in controller conceptually, but here we just get it)
router.get('/session/:sessionId', AttendanceController.getSessionAttendance);

// Only Teachers & Admins can manually update or finalize
router.use(requireRole([Role.ADMIN, Role.TEACHER]));
router.post('/session/:sessionId/finalize', AttendanceController.finalizeSessionAttendance);
router.patch('/result/:resultId', AttendanceController.updateAttendanceResult);

export default router;
