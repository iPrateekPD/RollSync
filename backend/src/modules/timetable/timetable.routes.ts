import { Router } from 'express';
import * as TimetableController from './timetable.controller';
import { authenticate, requireRole } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { createTimetableEntrySchema, updateTimetableEntrySchema } from './timetable.schema';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticate);

// Get timetable (filtered automatically based on requester's role)
router.get('/', TimetableController.getTimetable);

// Only ADMIN can modify timetable
router.use(requireRole([Role.ADMIN]));
router.post('/', validate(createTimetableEntrySchema), TimetableController.createTimetableEntry);
router.patch('/:id', validate(updateTimetableEntrySchema), TimetableController.updateTimetableEntry);
router.delete('/:id', TimetableController.deleteTimetableEntry);

export default router;
