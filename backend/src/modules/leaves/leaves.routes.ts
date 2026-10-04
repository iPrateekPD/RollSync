import { Router } from 'express';
import * as LeavesController from './leaves.controller';
import { authenticate, requireRole } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { createLeaveRequestSchema, updateLeaveRequestSchema } from './leaves.schema';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticate);

// Get leave requests
router.get('/', LeavesController.getLeaveRequests);
router.get('/:id', LeavesController.getLeaveRequestById);

// Students apply for leave
router.post('/', requireRole([Role.STUDENT]), validate(createLeaveRequestSchema), LeavesController.createLeaveRequest);

// Teachers and Admins approve/reject leave
router.patch('/:id', requireRole([Role.ADMIN, Role.TEACHER]), validate(updateLeaveRequestSchema), LeavesController.updateLeaveRequest);

export default router;
