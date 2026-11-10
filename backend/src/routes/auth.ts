import { Router } from 'express';
import { prisma } from '../config/prisma';
import { authenticate } from '../middleware/auth';
import { generateTokens } from '../utils/jwt';

const router = Router();

// Controlled demo login. Replace with the institution's real identity provider
// before production. The demo student account is explicitly mapped to 24ECE002.
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (typeof email !== 'string' || password !== 'password123') {
      return res.status(401).json({ message: 'Invalid demo credentials.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    let role = 'TEACHER';
    let id = '123';
    let firstName = 'Prateek';
    let lastName = 'PD';

    if (normalizedEmail.includes('admin')) {
      role = 'ADMIN';
      id = '123';
      firstName = 'Admin';
      lastName = 'User';
    } else if (normalizedEmail.includes('student')) {
      role = 'STUDENT';
      id = '83719bfd-83a0-4e3d-b032-1423d192690c';
      const student = await prisma.students.findUnique({
        where: { id },
        select: { id: true, name: true, roll_number: true, active: true }
      });
      if (!student || !student.active || student.roll_number !== '24ECE002') {
        return res.status(500).json({ message: 'The configured demo student 24ECE002 was not found or is inactive.' });
      }
      const parts = student.name.trim().split(/\\s+/);
      firstName = parts[0] || 'Pratik';
      lastName = parts.slice(1).join(' ') || 'Das';
    }

    const tokens = generateTokens({ userId: id, role });
    return res.json({
      ...tokens,
      user: { id, profileId: id, email: normalizedEmail, role, firstName, lastName }
    });
  } catch (error) {
    console.error('[AUTH] Demo login failed:', error);
    return res.status(500).json({ message: 'Unable to sign in to the demo.' });
  }
});

router.get('/me', authenticate, async (req, res) => {
  const payload = req.user!;
  if (payload.role === 'STUDENT') {
    const student = await prisma.students.findUnique({
      where: { id: payload.userId },
      select: { id: true, name: true, roll_number: true, active: true }
    });
    if (!student || !student.active) return res.status(401).json({ message: 'Student account is unavailable.' });
    const parts = student.name.trim().split(/\\s+/);
    return res.json({
      id: student.id,
      profileId: student.id,
      role: 'STUDENT',
      firstName: parts[0] || '',
      lastName: parts.slice(1).join(' '),
      rollNumber: student.roll_number
    });
  }
  return res.json({
    id: payload.userId,
    profileId: payload.userId,
    role: payload.role,
    firstName: payload.role === 'ADMIN' ? 'Admin' : 'Prateek',
    lastName: payload.role === 'ADMIN' ? 'User' : 'PD'
  });
});

export default router;
