import { Router } from 'express';
import * as NoticesController from './notices.controller';
import { authenticate, requireRole } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { createNoticeSchema, updateNoticeSchema } from './notices.schema';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticate);

// Everyone can view their notices
router.get('/', NoticesController.getNotices);
router.get('/:id', NoticesController.getNoticeById);

// Only Admins can manage notices
router.use(requireRole([Role.ADMIN]));
router.post('/', validate(createNoticeSchema), NoticesController.createNotice);
router.patch('/:id', validate(updateNoticeSchema), NoticesController.updateNotice);
router.delete('/:id', NoticesController.deleteNotice);

export default router;
