import { Router } from 'express';
import * as ClassSessionsController from './class-sessions.controller';
import { authenticate, requireRole } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { createClassSessionSchema, updateClassSessionSchema } from './class-sessions.schema';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticate);

// List sessions (filtered by role)
router.get('/', ClassSessionsController.getClassSessions);
router.get('/:id', ClassSessionsController.getClassSessionById);

// Teachers & Admins can start/end sessions
router.use(requireRole([Role.ADMIN, Role.TEACHER]));
router.post('/', validate(createClassSessionSchema), ClassSessionsController.createClassSession);
router.patch('/:id', validate(updateClassSessionSchema), ClassSessionsController.updateClassSession);

// Actions
router.post('/:id/start', ClassSessionsController.startClassSession);
router.post('/:id/end', ClassSessionsController.endClassSession);

export default router;
