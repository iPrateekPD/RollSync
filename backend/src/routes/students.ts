import { Router } from 'express';
import { prisma } from '../config/prisma';

const router = Router();

// GET /api/students
router.get('/', async (req, res) => {
  try {
    const { limit, orderAsc } = req.query;
    
    let queryOptions: any = {};
    
    if (limit) {
      queryOptions.take = parseInt(limit as string);
    }
    
    if (orderAsc !== undefined) {
      queryOptions.orderBy = {
        roll_number: orderAsc === 'true' ? 'asc' : 'desc'
      };
    } else {
      queryOptions.orderBy = { roll_number: 'asc' }; // Default
    }

    const students = await prisma.students.findMany(queryOptions);
    res.json(students);
  } catch (error) {
    console.error('[STUDENTS] Error fetching students:', error);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

// POST /api/students
router.post('/', async (req, res) => {
  try {
    const studentData = req.body;
    
    // Convert property names if needed (frontend sends roll_number, ug_no, name, email, department, semester, section)
    const newStudent = await prisma.students.create({
      data: {
        roll_number: studentData.roll_number,
        ug_no: studentData.ug_no,
        name: studentData.name,
        email: studentData.email,
        department: studentData.department,
        semester: studentData.semester ? parseInt(studentData.semester) : null,
        section: studentData.section
      }
    });
    
    res.status(201).json(newStudent);
  } catch (error: any) {
    console.error('[STUDENTS] Error inserting student:', error);
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'A student with this roll number already exists.' });
    }
    res.status(500).json({ error: 'Failed to insert student' });
  }
});

// GET /api/students/:id
router.get('/:id', async (req, res) => {
  try {
    const student = await prisma.students.findUnique({
      where: { id: req.params.id }
    });
    
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    res.json(student);
  } catch (error) {
    console.error('[STUDENTS] Error fetching student:', error);
    res.status(500).json({ error: 'Failed to fetch student' });
  }
});

// GET /api/students/:id/dashboard
router.get('/:id/dashboard', async (req, res) => {
  try {
    const studentId = req.params.id;
    
    // 1. Get student and face registration status
    const student = await prisma.students.findUnique({
      where: { id: studentId },
      include: {
        face_profiles: true
      }
    });
    
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    const faceRegistered = student.face_profiles && student.face_profiles.length > 0;
    
    // 2. Get overall attendance
    const attendanceRecords = await prisma.attendance_records.findMany({
      where: { student_id: studentId },
      include: {
        attendance_sessions: {
          include: { subjects: true }
        }
      },
      orderBy: { timestamp: 'desc' }
    });
    
    const totalClasses = attendanceRecords.length; // Simplified for demo
    const attendedClasses = attendanceRecords.filter(r => r.status.toLowerCase() === 'present').length;
    const attendancePercentage = totalClasses > 0 ? Math.round((attendedClasses / totalClasses) * 100) : 0;
    
    // 3. Get recent attendance (last 5)
    const recentAttendance = attendanceRecords.slice(0, 5).map(record => ({
      id: record.id,
      date: record.timestamp,
      subject: record.attendance_sessions.subjects.subject_name,
      method: record.source,
      status: record.status,
      teacher: 'Assigned Teacher' // Simplified for demo
    }));
    
    // 4. Get classes today (mocked for demo since timetable query can be complex)
    const today = new Date().getDay();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDayName = dayNames[today];
    
    const classesTodayRaw = await prisma.timetable.findMany({
      where: {
        section: student.section || 'SEC A',
        day: currentDayName
      },
      include: {
        subjects: true,
        teachers: true
      },
      orderBy: { start_time: 'asc' }
    });
    
    const classesToday = classesTodayRaw.map(c => ({
      id: c.id,
      subject: c.subjects.subject_name,
      teacher: c.teachers.name,
      room: c.room,
      startTime: c.start_time,
      endTime: c.end_time
    }));
    
    res.json({
      faceRegistered,
      attendanceSummary: {
        percentage: attendancePercentage,
        total: totalClasses,
        attended: attendedClasses
      },
      classesToday,
      recentAttendance,
      alerts: 0 // Mock alerts
    });
  } catch (error) {
    console.error('[STUDENTS] Error fetching dashboard data:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// GET /api/students/:id/attendance
router.get('/:id/attendance', async (req, res) => {
  try {
    const studentId = req.params.id;
    
    // Get full attendance records
    const attendanceRecords = await prisma.attendance_records.findMany({
      where: { student_id: studentId },
      include: {
        attendance_sessions: {
          include: { subjects: true }
        }
      },
      orderBy: { timestamp: 'desc' }
    });
    
    const totalClasses = attendanceRecords.length;
    const attendedClasses = attendanceRecords.filter(r => r.status.toLowerCase() === 'present').length;
    const absentClasses = totalClasses - attendedClasses;
    const attendancePercentage = totalClasses > 0 ? Math.round((attendedClasses / totalClasses) * 100) : 0;
    
    // Group for chart data
    const courseMap = new Map();
    attendanceRecords.forEach(r => {
      const subjectName = r.attendance_sessions.subjects.subject_name;
      if (!courseMap.has(subjectName)) {
        courseMap.set(subjectName, { name: subjectName, Present: 0, Absent: 0 });
      }
      const stats = courseMap.get(subjectName);
      if (r.status.toLowerCase() === 'present') stats.Present += 1;
      else stats.Absent += 1;
    });
    
    const records = attendanceRecords.map(record => ({
      id: record.id,
      date: record.timestamp,
      subject: record.attendance_sessions.subjects.subject_name,
      method: record.source,
      status: record.status,
      teacher: 'Assigned Teacher' // Mock
    }));
    
    res.json({
      stats: {
        percentage: attendancePercentage,
        total: totalClasses,
        present: attendedClasses,
        absent: absentClasses
      },
      chartData: Array.from(courseMap.values()),
      records
    });
  } catch (error) {
    console.error('[STUDENTS] Error fetching attendance data:', error);
    res.status(500).json({ error: 'Failed to fetch attendance data' });
  }
});

export default router;
