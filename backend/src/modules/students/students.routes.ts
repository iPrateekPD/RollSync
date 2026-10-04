import { Router } from 'express';
import * as StudentsController from './students.controller';
import { authenticate, requireRole } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { createStudentSchema, updateStudentSchema } from './students.schema';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticate);

// Student can view themselves, Teachers/Admins can view anyone
router.get('/:id', StudentsController.getStudentById);

// Admins & Teachers can list all students
router.get('/', requireRole([Role.ADMIN, Role.TEACHER]), StudentsController.getStudents);

// Modifiable only by ADMIN
router.use(requireRole([Role.ADMIN]));
router.post('/', validate(createStudentSchema), StudentsController.createStudent);
router.patch('/:id', validate(updateStudentSchema), StudentsController.updateStudent);

export default router;
