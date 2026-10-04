import { Router } from 'express';
import * as AuthController from './auth.controller';
import { validate } from '../../middleware/validate';
import { loginSchema, refreshSchema } from './auth.schema';
import { authenticate } from '../../middleware/auth';

const router = Router();

router.post('/login', validate(loginSchema), AuthController.login);
router.post('/refresh', validate(refreshSchema), AuthController.refresh);
router.post('/logout', authenticate, AuthController.logout);

export default router;
