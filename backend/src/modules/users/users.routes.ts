import { Router } from 'express';
import * as UsersController from './users.controller';
import { authenticate, requireRole } from '../../middleware/auth';
import { Role } from '@prisma/client';

const router = Router();

// All user routes require ADMIN role
router.use(authenticate, requireRole([Role.ADMIN]));

router.get('/', UsersController.getUsers);
router.post('/', UsersController.createUser);
router.get('/:id', UsersController.getUserById);
router.delete('/:id', UsersController.deleteUser);

export default router;
