import { Router } from 'express';
import * as CoursesController from './courses.controller';
import { authenticate, requireRole } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { createCourseSchema, updateCourseSchema } from './courses.schema';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticate);

// Publicly readable
router.get('/', CoursesController.getCourses);
router.get('/:id', CoursesController.getCourseById);

// Modifiable only by ADMIN
router.use(requireRole([Role.ADMIN]));
router.post('/', validate(createCourseSchema), CoursesController.createCourse);
router.patch('/:id', validate(updateCourseSchema), CoursesController.updateCourse);

export default router;
