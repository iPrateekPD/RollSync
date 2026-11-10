import { Router } from 'express';
import { prisma } from '../config/prisma';
import { authenticate } from '../middleware/auth';
import crypto from 'crypto';
import { publishRfidControl } from '../mqtt';

const router = Router();

async function closeExpiredDemoSession(session: any) {
  if (session.status !== 'in_progress' || !session.ended_at || session.ended_at.getTime() > Date.now()) return session;
  const roster = await prisma.demo_class_roster.findMany({ where: { session_id: session.id } });
  const captures = await prisma.demo_class_captures.findMany({ where: { session_id: session.id, status: 'success' } });
  const rfidEvents = await prisma.demo_class_rfid_events.findMany({ where: { session_id: session.id, processing_status: 'matched' } });
  const rfidStudents = new Set(rfidEvents.map(event => event.student_id).filter((value): value is string => Boolean(value)));
  const recognizedByStudent = new Map<string, number>();
  captures.forEach((capture: any) => {
    const frameStudents = new Set<string>();
    (Array.isArray(capture.results) ? capture.results : []).forEach((result: any) => {
      if (result?.student_id && result.status === 'VERIFIED') frameStudents.add(result.student_id);
    });
    frameStudents.forEach(id => recognizedByStudent.set(id, (recognizedByStudent.get(id) || 0) + 1));
  });
  for (const student of roster) {
    const recognized = recognizedByStudent.get(student.student_id) || 0;
    const classification = recognized >= 3 && rfidStudents.has(student.student_id) ? 'Present' : 'Needs Review';
    await prisma.demo_class_attendance.upsert({
      where: { session_id_student_id: { session_id: session.id, student_id: student.student_id } },
      create: { session_id: session.id, student_id: student.student_id, valid_frames: captures.length, frames_recognized: recognized, ai_classification: classification },
      update: { valid_frames: captures.length, frames_recognized: recognized, ai_classification: classification }
    });
  }
  const closed = await prisma.demo_class_sessions.update({ where: { id: session.id }, data: { status: 'review_ready' } });
  try { publishRfidControl(session.classroom, false); } catch (error) { console.error('[DEMO] RFID auto-stop failed:', error); }
  return closed;
}

// GET active demo session for a teacher
router.get('/session', authenticate, async (req, res) => {
  try {
    const teacherId = (req as any).user?.userId;
    if (!teacherId) return res.status(401).json({ error: 'Unauthorized' });

    const session = await prisma.demo_class_sessions.findFirst({
      where: {
        teacher_id: teacherId,
        status: { notIn: ['confirmed'] }
      },
      orderBy: { created_at: 'desc' }
    });

    const refreshed = session ? await closeExpiredDemoSession(session) : null;
    res.json(refreshed || null);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST start demo session
router.post('/session', authenticate, async (req, res) => {
  try {
    const teacherId = (req as any).user?.userId;
    if (!teacherId) return res.status(401).json({ error: 'Unauthorized' });

    // Check if one exists
    const existing = await prisma.demo_class_sessions.findFirst({
      where: {
        teacher_id: teacherId,
        status: { notIn: ['confirmed', 'cancelled'] }
      }
    });

    if (existing) {
      return res.status(400).json({ error: 'Demo session already exists', session: existing });
    }

    const { section = 'SEC B', classroom = 'RDB 6', duration_minutes = 2, subject_id = null } = req.body || {};
    const allowedSections = ['SEC A', 'SEC B'];
    const duration = Number(duration_minutes);
    if (!allowedSections.includes(section) || typeof classroom !== 'string' || !classroom.trim() || !Number.isInteger(duration) || duration < 1 || duration > 180) {
      return res.status(400).json({ error: 'Choose a valid section, classroom, and duration (1–180 minutes).' });
    }
    if (subject_id && !(await prisma.subjects.findUnique({ where: { id: subject_id } }))) return res.status(400).json({ error: 'Selected subject was not found.' });
    const normalizedClassroom = classroom.trim().replace(/[^a-zA-Z0-9_-]/g, '-');
    const token = crypto.randomBytes(24).toString('hex');

    const session = await prisma.demo_class_sessions.create({
      data: {
        teacher_id: teacherId,
        section,
        classroom: normalizedClassroom,
        subject_id: subject_id || null,
        duration_minutes: duration,
        status: 'waiting',
        token
      }
    });

    // Snapshot the selected section roster when the teacher creates the class.
    const students = await prisma.students.findMany({
      where: { section, active: true }
    });

    if (students.length > 0) {
      await prisma.demo_class_roster.createMany({
        data: students.map((s: any) => ({
          session_id: session.id,
          student_id: s.id,
          name: s.name,
          roll_number: s.roll_number
        }))
      });
    }

    res.json(session);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create demo session' });
  }
});

// The teacher starts the class from the authenticated dashboard. Phone camera consent is separate.
router.post('/session/:token/start', authenticate, async (req, res) => {
  try {
    const { token } = req.params;
    const teacherId = (req as any).user?.userId;
    const session = await prisma.demo_class_sessions.findUnique({ where: { token } });
    if (!session) return res.status(404).json({ error: 'Not found' });
    if (session.teacher_id !== teacherId) return res.status(403).json({ error: 'You do not own this class session.' });
    if (session.status !== 'waiting') return res.status(400).json({ error: 'Session is not waiting to start.' });

    const updated = await prisma.demo_class_sessions.update({
      where: { id: session.id },
      data: {
        status: 'in_progress',
        started_at: new Date(),
        ended_at: new Date(Date.now() + session.duration_minutes * 60000)
      }
    });
    try {
      publishRfidControl(updated.classroom, true);
    } catch (mqttError) {
      console.error('[DEMO] Class started but RFID command could not be sent:', mqttError);
    }
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET session by token (for phone)
router.get('/session/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const session = await prisma.demo_class_sessions.findUnique({ where: { token } });
    if (!session) return res.status(404).json({ error: 'Not found' });
    // Only expose fields needed by the phone camera; never return the teacher id or roster.
    res.json({ id: session.id, section: session.section, classroom: session.classroom, duration_minutes: session.duration_minutes, status: session.status, started_at: session.started_at, ended_at: session.ended_at });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST mark processing complete (from backend or after 3 minutes)
router.post('/session/:token/complete', async (req, res) => {
  try {
    const { token } = req.params;
    const session = await prisma.demo_class_sessions.findUnique({ where: { token } });
    if (!session) return res.status(404).json({ error: 'Session not found' });
    const id = session.id;
    const roster = await prisma.demo_class_roster.findMany({ where: { session_id: id } });
    if (session.status === 'review_ready' || session.status === 'confirmed') return res.json(session);
    if (session.status !== 'in_progress' && session.status !== 'processing') {
      return res.status(400).json({ error: 'Only a running class can be completed.' });
    }
    if (session.ended_at && Date.now() < session.ended_at.getTime()) {
      return res.status(409).json({ error: 'The selected class duration has not finished yet.', ends_at: session.ended_at });
    }

    const captures = await prisma.demo_class_captures.findMany({
      where: { session_id: id, status: 'success' }
    });
    const recognizedByStudent = new Map<string, number>();
    const rfidEvents = await prisma.demo_class_rfid_events.findMany({ where: { session_id: id, processing_status: 'matched' } });
    const rfidStudents = new Set(rfidEvents.map(event => event.student_id).filter((value): value is string => Boolean(value)));
    captures.forEach((capture: any) => {
      const results = Array.isArray(capture.results) ? capture.results : [];
      const recognizedThisFrame = new Set<string>();
      results.forEach((result: any) => {
        if (result?.student_id && result.status === 'VERIFIED') recognizedThisFrame.add(result.student_id);
      });
      recognizedThisFrame.forEach(studentId => recognizedByStudent.set(studentId, (recognizedByStudent.get(studentId) || 0) + 1));
    });

    for (const student of roster) {
      const recognized = recognizedByStudent.get(student.student_id) || 0;
      const hasRfid = rfidStudents.has(student.student_id);
      const classification = recognized >= 3 && hasRfid ? 'Present' : 'Needs Review';
      await prisma.demo_class_attendance.upsert({
        where: { session_id_student_id: { session_id: id, student_id: student.student_id } },
        create: { session_id: id, student_id: student.student_id, valid_frames: captures.length, frames_recognized: recognized, ai_classification: classification },
        update: { valid_frames: captures.length, frames_recognized: recognized, ai_classification: classification }
      });
    }

    const updated = await prisma.demo_class_sessions.update({ where: { id }, data: { status: 'review_ready' } });
    try { publishRfidControl(session.classroom, false); } catch (mqttError) { console.error('[DEMO] Could not disable RFID reader:', mqttError); }
    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET demo attendance results
router.get('/session/:id/attendance', authenticate, async (req, res) => {
  try {
    const id = req.params.id as string;
    const teacherId = (req as any).user?.userId;
    const ownedSession = await prisma.demo_class_sessions.findFirst({ where: { id, teacher_id: teacherId } });
    if (!ownedSession) return res.status(404).json({ error: 'Session not found' });
    const roster = await prisma.demo_class_roster.findMany({
      where: { session_id: id },
      include: { student: true }
    });
    const attendance = await prisma.demo_class_attendance.findMany({ where: { session_id: id } });
    const rfidEvents = await prisma.demo_class_rfid_events.findMany({ where: { session_id: id } });

    const results = roster.map((r: any) => {
      const att = attendance.find((a: any) => a.student_id === r.student_id);
      return {
        id: r.student_id,
        name: r.name,
        roll_number: r.roll_number,
        frames_recognized: att?.frames_recognized || 0,
        valid_frames: att?.valid_frames || 0,
        ai_classification: att?.ai_classification || 'Needs Review',
        teacher_decision: att?.teacher_decision || null,
        review_status: att?.review_status || 'pending',
        rfid_taps: rfidEvents.filter(event => event.student_id === r.student_id).length,
        evidence: rfidEvents.some(event => event.student_id === r.student_id) ? (att?.frames_recognized ? 'RFID + face' : 'RFID only') : (att?.frames_recognized ? 'Face only' : 'No evidence')
      };
    });

    res.json(results);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST confirm attendance
router.post('/session/:id/confirm', authenticate, async (req, res) => {
  try {
    const id = req.params.id as string;
    const { decisions } = req.body;
    const teacherId = (req as any).user?.userId;
    if (!teacherId) return res.status(401).json({ error: 'Unauthorized' });
    const session = await prisma.demo_class_sessions.findFirst({ where: { id, teacher_id: teacherId } });
    if (!session) return res.status(404).json({ error: 'Session not found' });
    const decisionEntries: [string, unknown][] = Array.isArray(decisions)
      ? decisions.map((item: any) => [item.student_id, item.decision])
      : Object.entries(decisions || {});
    if (!decisionEntries.length) return res.status(400).json({ error: 'At least one attendance decision is required.' });

    for (const [studentId, decision] of decisionEntries) {
      if (!['Present', 'Absent'].includes(String(decision))) return res.status(400).json({ error: 'Decisions must be Present or Absent.' });
      await prisma.demo_class_attendance.update({
        where: { session_id_student_id: { session_id: id, student_id: studentId } },
        data: {
          teacher_decision: decision as string,
          review_status: 'confirmed'
        }
      });
    }

    await prisma.demo_class_sessions.update({ where: { id }, data: { status: 'confirmed', confirmed_at: new Date() } });
    try { publishRfidControl(session.classroom, false); } catch (mqttError) { console.error('[DEMO] Could not disable RFID reader after confirmation:', mqttError); }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
