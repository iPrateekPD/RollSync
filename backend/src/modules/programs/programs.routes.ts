import { Router } from 'express';
import * as ProgramsController from './programs.controller';
import { authenticate, requireRole } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { createProgramSchema, updateProgramSchema } from './programs.schema';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticate);

router.get('/', ProgramsController.getPrograms);
router.get('/:id', ProgramsController.getProgramById);

router.use(requireRole([Role.ADMIN]));
router.post('/', validate(createProgramSchema), ProgramsController.createProgram);
router.patch('/:id', validate(updateProgramSchema), ProgramsController.updateProgram);

export default router;
