import { Router } from 'express';
import * as ERPController from './erp.controller';
import { rateLimiter } from '../../middleware/rateLimit';

const router = Router();

// Apply a 1 hour rate limit block if spamming (e.g., > 100 requests per hour)
const spamBlocker = rateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100
});

router.use(spamBlocker);

router.get('/attendance', ERPController.getAttendance);
router.get('/exams', ERPController.getExams);
router.get('/exam-subjects', ERPController.getExamSubjects);

export default router;
