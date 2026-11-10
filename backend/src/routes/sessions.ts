import { Router } from 'express';
import { supabase } from '../supabase';
import { prisma } from '../config/prisma';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

// GET /api/sessions
router.get('/', async (req, res) => {
  const { data, error } = await supabase.from('attendance_sessions').select('*').order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// GET /api/sessions/active
router.get('/active', async (req, res) => {
  const { data, error } = await supabase.from('attendance_sessions').select('*').eq('active', true);
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// POST /api/sessions
router.post('/', async (req, res) => {
  const { subject_id, classroom, start_time, end_time } = req.body;
  if (!subject_id || !classroom || !start_time || !end_time) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const { data, error } = await supabase
    .from('attendance_sessions')
    .insert({
      subject_id,
      classroom,
      start_time,
      end_time,
      active: false
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// POST /api/sessions/:id/start
router.post('/:id/start', async (req, res) => {
  const { id } = req.params;
  
  // Optional: Prevent conflicting active sessions for the same classroom
  const { data: session } = await supabase.from('attendance_sessions').select('classroom').eq('id', id).single();
  
  if (session) {
    // End any currently active sessions for this classroom
    await supabase.from('attendance_sessions').update({ active: false }).eq('classroom', session.classroom).eq('active', true);
  }

  const { data, error } = await supabase
    .from('attendance_sessions')
    .update({ active: true })
    .eq('id', id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// POST /api/sessions/:id/end
router.post('/:id/end', async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase
    .from('attendance_sessions')
    .update({ active: false })
    .eq('id', id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});
// POST /api/sessions/:id/confirm
router.post('/:id/confirm', authenticate, requireRole(['TEACHER']), async (req, res) => {
  const { id } = req.params;
  const { records } = req.body || [];
  const teacherId = req.user?.teacherId;

  if (!teacherId || !Array.isArray(records)) {
    return res.status(400).json({ error: 'A valid attendance record list is required.' });
  }

  const allowedStatuses = new Set(['present', 'absent', 'late', 'excused']);
  if (records.some((record: any) =>
    !record || typeof record.student_id !== 'string' || !allowedStatuses.has(record.status)
  )) {
    return res.status(400).json({ error: 'Attendance records contain an invalid student or status.' });
  }

  try {
    const session = await prisma.attendance_sessions.findUnique({
      where: { id },
      include: { timetable: { select: { teacher_id: true } } },
    });
    if (!session || !session.timetable) {
      return res.status(404).json({ error: 'Attendance session is not linked to a timetable class.' });
    }
    if (session.timetable.teacher_id !== teacherId) {
      return res.status(403).json({ error: 'You cannot confirm attendance for another teacher’s class.' });
    }

    const now = new Date().toISOString();
    const { error: sessionError } = await supabase.from('attendance_sessions').update({
      active: false,
      status: 'completed',
      confirmed: true,
      confirmed_by: teacherId,
      confirmed_at: now,
    }).eq('id', id);
    if (sessionError) throw sessionError;

    if (records.length) {
      const rows = records.map((record: any) => ({
        session_id: id,
        student_id: record.student_id,
        status: record.status,
        source: 'manual',
        timestamp: now,
        teacher_confirmed: true,
        confirmed_by: teacherId,
        confirmed_at: now,
        updated_at: now,
      }));
      const { error: recordsError } = await supabase
        .from('attendance_records')
        .upsert(rows, { onConflict: 'session_id,student_id' });
      if (recordsError) throw recordsError;
    }

    return res.json({ success: true });
  } catch (err: any) {
    console.error('Confirmation error:', err);
    return res.status(500).json({ error: err.message || 'Unable to confirm attendance.' });
  }
});

export default router;
