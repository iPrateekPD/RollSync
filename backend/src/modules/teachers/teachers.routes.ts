import { Router } from 'express';
import * as TeachersController from './teachers.controller';
import { authenticate, requireRole } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { createTeacherSchema, updateTeacherSchema } from './teachers.schema';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticate);

// Publicly readable for dropdowns, directories
router.get('/', TeachersController.getTeachers);
router.get('/:id', TeachersController.getTeacherById);

// Modifiable only by ADMIN
router.use(requireRole([Role.ADMIN]));
router.post('/', validate(createTeacherSchema), TeachersController.createTeacher);
router.patch('/:id', validate(updateTeacherSchema), TeachersController.updateTeacher);

export default router;
