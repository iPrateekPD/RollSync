import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Get today's classes for a specific teacher
router.get('/today', async (req, res) => {
  try {
    const { teacher_id, day } = req.query;

    if (!teacher_id) {
      return res.status(400).json({ error: 'Teacher ID is required' });
    }

    const currentDay = day ? String(day) : new Date().toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
    
    // We expect day to be MON, TUE, WED, etc.
    const dayMap: Record<string, string> = {
      'MON': 'MON', 'TUE': 'TUE', 'WED': 'WED', 'THU': 'THU', 'FRI': 'FRI', 'SAT': 'SAT', 'SUN': 'SUN'
    };
    const queryDay = dayMap[currentDay.substring(0, 3)] || 'MON'; // fallback to MON for testing on Sunday if needed

    let teacher = null;
    
    // Check if teacher_id is an email or name or ID (since we mock auth from frontend using just role or name)
    // Actually the prompt says use "teacher_id = current_teacher". Let's support searching by ID or Name.
    if (String(teacher_id).includes('-')) {
      teacher = await prisma.teachers.findUnique({ where: { id: String(teacher_id) } });
    } else {
      teacher = await prisma.teachers.findFirst({ where: { name: { contains: String(teacher_id) } } });
    }

    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    const classes = await prisma.timetable.findMany({
      where: {
        teacher_id: teacher.id,
        day: queryDay
      },
      include: {
        subjects: true,
        teachers: true
      },
      orderBy: {
        start_time: 'asc'
      }
    });

    res.json({
      teacher,
      day: queryDay,
      classes
    });

  } catch (error) {
    console.error('Error fetching today timetable:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
