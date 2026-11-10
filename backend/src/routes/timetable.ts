import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

router.get('/today', authenticate, requireRole(['TEACHER']), async (req, res) => {
  try {
    const teacherId = req.user?.teacherId;
    if (!teacherId) return res.status(403).json({ error: 'Teacher account is not linked.' });

    const requestedDay = typeof req.query.day === 'string' ? req.query.day : undefined;
    const currentDay = (requestedDay || new Date().toLocaleDateString('en-US', { weekday: 'short' })).substring(0, 3).toUpperCase();
    const dayMap: Record<string, string> = { MON:'MON', TUE:'TUE', WED:'WED', THU:'THU', FRI:'FRI', SAT:'SAT', SUN:'SUN' };
    const queryDay = dayMap[currentDay];
    if (!queryDay) return res.status(400).json({ error: 'Invalid weekday.' });

    const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay); endOfDay.setDate(endOfDay.getDate() + 1);
    const [teacher, classes] = await Promise.all([
      prisma.teachers.findUnique({ where: { id: teacherId } }),
      prisma.timetable.findMany({
        where: { teacher_id: teacherId, day: queryDay, active: true },
        include: {
          subjects: true, teachers: true,
          attendance_sessions: {
            where: { class_date: { gte: startOfDay, lt: endOfDay } },
            include: { attendance_records: true },
          },
        },
        orderBy: { start_time: 'asc' },
      }),
    ]);
    if (!teacher) return res.status(404).json({ error: 'Teacher profile not found.' });

    const enrichedClasses = classes.map(cls => {
      const session = cls.attendance_sessions[0];
      let status = 'UPCOMING', present = 0, absent = 0, exceptions = 0;
      if (session) {
        if (session.confirmed) status = 'CONFIRMED';
        else if (session.status === 'completed') status = 'REVIEW';
        else if (session.active) status = 'LIVE';
        else status = 'REVIEW';
        present = session.attendance_records.filter(record => record.status === 'present').length;
        absent = session.attendance_records.filter(record => record.status === 'absent').length;
        exceptions = session.attendance_records.filter(record => record.status === 'needs_review').length;
      }
      return { ...cls, status, present, absent, exceptions };
    });
    return res.json({ teacher, day: queryDay, classes: enrichedClasses });
  } catch (error) {
    console.error('Error fetching authenticated teacher timetable:', error);
    return res.status(500).json({ error: 'Unable to fetch timetable.' });
  }
});

export default router;
