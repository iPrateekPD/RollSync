import { Router } from 'express';
import { prisma } from '../config/prisma';
import { authenticate } from '../middleware/auth';
import crypto from 'crypto';

const router = Router();

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

    res.json(session || null);
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

    const token = crypto.randomBytes(16).toString('hex');

    const session = await prisma.demo_class_sessions.create({
      data: {
        teacher_id: teacherId,
        section: 'SEC B',
        classroom: 'RDB 6',
        duration_minutes: 3,
        status: 'waiting',
        token: token
      }
    });

    // Take snapshot of SEC B roster
    const students = await prisma.students.findMany({
      where: { section: 'SEC B', active: true }
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

// POST start demo phone (triggered when phone starts)
router.post('/session/:token/start', async (req, res) => {
  try {
    const { token } = req.params;
    const session = await prisma.demo_class_sessions.findUnique({ where: { token } });
    if (!session) return res.status(404).json({ error: 'Not found' });
    if (session.status !== 'waiting') return res.status(400).json({ error: 'Session already started' });

    const updated = await prisma.demo_class_sessions.update({
      where: { id: session.id },
      data: {
        status: 'in_progress',
        started_at: new Date(),
        ended_at: new Date(Date.now() + session.duration_minutes * 60000)
      }
    });
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
    res.json(session);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST mark processing complete (from backend or after 3 minutes)
router.post('/session/:id/complete', async (req, res) => {
  try {
    const id = req.params.id as string;
    
    // First find all students in roster
    const roster = await prisma.demo_class_roster.findMany({ where: { session_id: id } });
    
    // For each student, get captures
    const captures = await prisma.demo_class_captures.findMany({
      where: { session_id: id, status: 'success' }
    });

    const studentValidFrames = new Map();
    const studentRecognized = new Map();
    const studentDecision = new Map();

    roster.forEach((r: any) => {
      studentValidFrames.set(r.student_id, 0);
      studentRecognized.set(r.student_id, 0);
    });

    const totalValidFrames = captures.length;

    captures.forEach((c: any) => {
      const results = c.results as any[];
      if (!results) return;
      
      results.forEach(r => {
        if (r.student_id && r.status === 'VERIFIED') {
          const current = studentRecognized.get(r.student_id) || 0;
          studentRecognized.set(r.student_id, current + 1);
        }
      });
    });

    // For simplicity, every student shares the total valid frames
    for (const [studentId, recognizedCount] of studentRecognized.entries()) {
      let decision = 'Maybe';
      if (recognizedCount > totalValidFrames / 2) {
        decision = 'Present';
      } else if (recognizedCount === 0 && totalValidFrames > 0) {
        decision = 'Absent';
      } else if (totalValidFrames === 0) {
        decision = 'Needs Review';
      }

      // Upsert into demo_class_attendance
      await prisma.demo_class_attendance.upsert({
        where: {
          session_id_student_id: { session_id: id, student_id: studentId }
        },
        create: {
          session_id: id,
          student_id: studentId,
          valid_frames: totalValidFrames,
          frames_recognized: recognizedCount,
          ai_classification: decision,
        },
        update: {
          valid_frames: totalValidFrames,
          frames_recognized: recognizedCount,
          ai_classification: decision,
        }
      });
    }

    const updated = await prisma.demo_class_sessions.update({
      where: { id },
      data: { status: 'review_ready' }
    });

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
    const roster = await prisma.demo_class_roster.findMany({
      where: { session_id: id },
      include: { student: true }
    });
    const attendance = await prisma.demo_class_attendance.findMany({
      where: { session_id: id }
    });

    const results = roster.map((r: any) => {
      const att = attendance.find((a: any) => a.student_id === r.student_id);
      return {
        id: r.student_id,
        name: r.name,
        roll_number: r.roll_number,
        frames_recognized: att?.frames_recognized || 0,
        valid_frames: att?.valid_frames || 0,
        ai_classification: att?.ai_classification || 'Needs Review',
        teacher_decision: att?.teacher_decision || null
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
    const { decisions } = req.body; // { [studentId]: 'Present' | 'Absent' }
    const teacherId = (req as any).user?.userId;

    if (!teacherId) return res.status(401).json({ error: 'Unauthorized' });

    for (const [studentId, decision] of Object.entries(decisions)) {
      await prisma.demo_class_attendance.update({
        where: { session_id_student_id: { session_id: id, student_id: studentId } },
        data: {
          teacher_decision: decision as string,
          review_status: 'confirmed'
        }
      });
    }

    await prisma.demo_class_sessions.update({
      where: { id },
      data: { status: 'confirmed', confirmed_at: new Date() }
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
