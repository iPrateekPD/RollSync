import { Router } from 'express';
import { prisma } from '../config/prisma';
import { supabase } from '../supabase';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

// Authentication is performed by Supabase in the browser. Legacy demo-password login is disabled.
router.post('/login', (_req, res) => res.status(410).json({
  message: 'Legacy demo login is disabled. Sign in through Supabase Auth.',
}));

router.get('/me', authenticate, async (req, res, next) => {
  try {
    const identity = req.user!;
    if (identity.role === 'ADMIN') {
      return res.json({
        id: identity.userId, authUserId: identity.userId, profileId: identity.userId,
        email: identity.email, role: 'ADMIN', firstName: 'RollSync', lastName: 'Administrator',
      });
    }
    const teacher = await prisma.teachers.findUnique({
      where: { id: identity.teacherId! },
      select: { id: true, name: true, email: true },
    });
    if (!teacher) return res.status(403).json({ message: 'Teacher profile is not linked.' });
    const parts = teacher.name.trim().split(/\\s+/);
    return res.json({
      id: teacher.id, authUserId: identity.userId, profileId: teacher.id,
      email: teacher.email || identity.email, role: 'TEACHER',
      firstName: parts[0] || '', lastName: parts.slice(1).join(' '),
    });
  } catch (error) { return next(error); }
});

router.get('/teachers', authenticate, requireRole(['ADMIN']), async (_req, res, next) => {
  try {
    const teachers = await prisma.teachers.findMany({
      select: { id: true, name: true, email: true, auth_id: true, department: true },
      orderBy: { name: 'asc' },
    });
    return res.json(teachers.map(teacher => ({
      ...teacher, accountStatus: teacher.auth_id ? 'INVITED' : 'NOT_INVITED',
    })));
  } catch (error) { return next(error); }
});

router.post('/teachers/:teacherId/invite', authenticate, requireRole(['ADMIN']), async (req, res, next) => {
  const { teacherId } = req.params;
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)) {
    return res.status(400).json({ message: 'A valid institutional email address is required.' });
  }

  try {
    const teacher = await prisma.teachers.findUnique({ where: { id: teacherId } });
    if (!teacher) return res.status(404).json({ message: 'Teacher record not found.' });
    if (teacher.auth_id) return res.status(409).json({ message: 'This teacher already has a linked login.' });

    const duplicate = await prisma.teachers.findFirst({
      where: { email, NOT: { id: teacherId } }, select: { id: true },
    });
    if (duplicate) return res.status(409).json({ message: 'This email is already assigned to another teacher.' });
    if (teacher.email && teacher.email.toLowerCase() !== email) {
      return res.status(409).json({ message: 'Email does not match the email already assigned to this teacher.' });
    }

    const redirectTo = process.env.FRONTEND_URL;
    const { data: inviteData, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email, {
      data: { full_name: teacher.name },
      ...(redirectTo ? { redirectTo } : {}),
    });
    if (inviteError || !inviteData.user) {
      return res.status(400).json({ message: inviteError?.message || 'Unable to send invitation.' });
    }

    const authUserId = inviteData.user.id;
    const { error: roleError } = await supabase.auth.admin.updateUserById(authUserId, {
      app_metadata: { role: 'TEACHER' },
    });
    if (roleError) {
      await supabase.auth.admin.deleteUser(authUserId);
      return res.status(500).json({ message: 'Unable to assign the teacher role to the invitation.' });
    }

    try {
      await prisma.teachers.update({ where: { id: teacherId }, data: { email, auth_id: authUserId } });
    } catch (databaseError) {
      await supabase.auth.admin.deleteUser(authUserId);
      throw databaseError;
    }
    return res.status(201).json({ success: true, teacherId, email, message: 'Teacher invitation sent.' });
  } catch (error) { return next(error); }
});

export default router;
