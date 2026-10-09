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
        day: queryDay,
        active: true
      },
      include: {
        subjects: true,
        teachers: true,
        attendance_sessions: {
          where: {
            class_date: new Date(new Date().setHours(0,0,0,0))
          },
          include: {
            attendance_records: true
          }
        }
      },
      orderBy: {
        start_time: 'asc'
      }
    });

    const enrichedClasses = classes.map(cls => {
      let status = 'UPCOMING';
      let present = 0;
      let absent = 0; // We might need to know total students to calculate absent correctly, or we just count present for now.
      let exceptions = 0;
      
      const session = cls.attendance_sessions?.[0];
      if (session) {
        if (session.confirmed) status = 'CONFIRMED';
        else if (session.status === 'completed') status = 'REVIEW';
        else if (session.active) status = 'LIVE';
        else status = 'REVIEW'; // Finished but not confirmed
        
        present = session.attendance_records.filter((r: any) => r.status === 'present').length;
        exceptions = session.attendance_records.filter((r: any) => r.status === 'needs_review').length;
      } else {
         // Check if time has passed
         const now = new Date();
         const [endHour, endMin] = cls.end_time.split(':');
         if (now.getHours() > Number(endHour) || (now.getHours() === Number(endHour) && now.getMinutes() > Number(endMin))) {
             status = 'REVIEW';
         }
      }

      return {
        ...cls,
        status,
        present,
        absent,
        exceptions
      };
    });

    res.json({
      teacher,
      day: queryDay,
      classes: enrichedClasses
    });

  } catch (error) {
    console.error('Error fetching today timetable:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
