import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { prisma } from '../config/prisma';
import crypto from 'crypto';

const router = Router();

// A short-lived, purpose-bound token lets the camera service process only
// the authenticated student's enrollment. The signing secret is shared only
// by the Node API and the private FastAPI service.
router.post('/token', authenticate, async (req, res) => {
  try {
    const studentId = (req as any).user?.userId;
    const role = (req as any).user?.role;
    if (!studentId || role !== 'STUDENT') {
      return res.status(403).json({ error: 'Only a signed-in student can register their own face.' });
    }

    const requestedStudentId = req.body?.studentId;
    if (requestedStudentId && requestedStudentId !== studentId) {
      return res.status(403).json({ error: 'You can only register your own face profile.' });
    }

    const student = await prisma.students.findUnique({
      where: { id: studentId },
      select: { id: true, roll_number: true, name: true, active: true }
    });
    if (!student || !student.active) return res.status(404).json({ error: 'Active student record not found.' });

    const secret = process.env.FACE_ENROLLMENT_SECRET;
    if (!secret) return res.status(503).json({ error: 'Face enrollment is not configured on the backend.' });

    const expiresAt = Math.floor(Date.now() / 1000) + 10 * 60;
    const payload = Buffer.from(JSON.stringify({
      student_id: student.id,
      purpose: 'face-enrollment',
      exp: expiresAt,
      nonce: crypto.randomBytes(16).toString('hex')
    })).toString('base64url');
    const signature = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
    return res.json({
      token: payload + '.' + signature,
      expires_at: new Date(expiresAt * 1000).toISOString(),
      student: { id: student.id, name: student.name, roll_number: student.roll_number }
    });
  } catch (error) {
    console.error('[FACE-ENROLLMENT] Token issue failed:', error);
    return res.status(500).json({ error: 'Could not start face registration.' });
  }
});

export default router;
