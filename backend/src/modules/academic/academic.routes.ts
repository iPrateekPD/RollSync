import { Router } from 'express';
import * as AcademicController from './academic.controller';
import { authenticate, requireRole } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import * as schemas from './academic.schema';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticate);

// Public reads
router.get('/years', AcademicController.getAcademicYears);
router.get('/semesters', AcademicController.getSemesters);
router.get('/sections', AcademicController.getSections);

// Admin writes
router.use(requireRole([Role.ADMIN]));

router.post('/years', validate(schemas.createAcademicYearSchema), AcademicController.createAcademicYear);
router.patch('/years/:id', validate(schemas.updateAcademicYearSchema), AcademicController.updateAcademicYear);

router.post('/semesters', validate(schemas.createSemesterSchema), AcademicController.createSemester);
router.patch('/semesters/:id', validate(schemas.updateSemesterSchema), AcademicController.updateSemester);

router.post('/sections', validate(schemas.createSectionSchema), AcademicController.createSection);
router.patch('/sections/:id', validate(schemas.updateSectionSchema), AcademicController.updateSection);

export default router;
