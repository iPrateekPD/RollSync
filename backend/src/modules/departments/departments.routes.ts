import { Router } from 'express';
import * as DepartmentsController from './departments.controller';
import { authenticate, requireRole } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { createDepartmentSchema, updateDepartmentSchema } from './departments.schema';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticate);

// Publicly readable by all roles for dropdowns, etc.
router.get('/', DepartmentsController.getDepartments);
router.get('/:id', DepartmentsController.getDepartmentById);

// Modifiable only by ADMIN
router.use(requireRole([Role.ADMIN]));
router.post('/', validate(createDepartmentSchema), DepartmentsController.createDepartment);
router.patch('/:id', validate(updateDepartmentSchema), DepartmentsController.updateDepartment);

export default router;
