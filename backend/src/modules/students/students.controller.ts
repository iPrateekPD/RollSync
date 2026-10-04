import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import { prisma } from '../../config/prisma';
import { NotFoundError, ConflictError } from '../../utils/errors';
import { Role } from '@prisma/client';

export const getStudents = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const students = await prisma.student.findMany({
      include: {
        program: { select: { name: true, department: { select: { name: true } } } },
        semester: { select: { name: true, number: true } },
        section: { select: { name: true } },
      }
    });
    res.json(students);
  } catch (error) {
    next(error);
  }
};

export const getStudentById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const studentId = req.params.id;
    
    // Authorization check: if student, can only view own profile
    if (req.user?.role === Role.STUDENT && req.user.userId !== studentId && req.user.userId /* which is actually User.id */) {
      // We need to map User.id to Student.id to check properly
      const requestingStudent = await prisma.student.findUnique({ where: { userId: req.user.userId } });
      if (!requestingStudent || requestingStudent.id !== studentId) {
         throw new NotFoundError('Student not found'); // hide existence for unauthorized
      }
    }

    const student = await prisma.student.findUnique({
      where: { id: studentId as string },
      include: {
        program: true,
        semester: true,
        section: true,
        user: { select: { email: true, createdAt: true } },
        rfidCard: true,
        bleIdentity: true,
      }
    });
    
    if (!student) throw new NotFoundError('Student not found');
    res.json(student);
  } catch (error) {
    next(error);
  }
};

export const createStudent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, studentId, firstName, lastName, programId, semesterId, sectionId } = req.body;
    
    // Check conflicts
    const [existingUser, existingStudent] = await Promise.all([
      prisma.user.findUnique({ where: { email } }),
      prisma.student.findUnique({ where: { studentId } })
    ]);
    
    if (existingUser) throw new ConflictError('Email already in use');
    if (existingStudent) throw new ConflictError('Student ID already exists');
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user and student transactionally
    const student = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          role: Role.STUDENT,
        }
      });
      
      return tx.student.create({
        data: {
          userId: user.id,
          studentId,
          firstName,
          lastName,
          programId,
          semesterId,
          sectionId,
        },
        include: {
          user: { select: { email: true } }
        }
      });
    });
    
    res.status(201).json(student);
  } catch (error) {
    next(error);
  }
};

export const updateStudent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = req.body;
    
    const student = await prisma.student.update({
      where: { id: req.params.id as string },
      data,
    });
    
    res.json(student);
  } catch (error) {
    next(error);
  }
};
