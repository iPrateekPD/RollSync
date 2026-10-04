import { Router } from 'express';
import * as ClassroomsController from './classrooms.controller';
import { authenticate, requireRole } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { createClassroomSchema, updateClassroomSchema } from './classrooms.schema';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticate);

// Publicly readable
router.get('/', ClassroomsController.getClassrooms);
router.get('/:id', ClassroomsController.getClassroomById);

// Modifiable only by ADMIN
router.use(requireRole([Role.ADMIN]));
router.post('/', validate(createClassroomSchema), ClassroomsController.createClassroom);
router.patch('/:id', validate(updateClassroomSchema), ClassroomsController.updateClassroom);

export default router;
