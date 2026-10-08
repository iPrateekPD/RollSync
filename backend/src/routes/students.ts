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

export default router;
