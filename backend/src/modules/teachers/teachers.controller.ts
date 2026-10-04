import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import { prisma } from '../../config/prisma';
import { NotFoundError, ConflictError } from '../../utils/errors';
import { Role } from '@prisma/client';

export const getTeachers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const teachers = await prisma.teacher.findMany({
      include: {
        department: { select: { name: true } }
      }
    });
    res.json(teachers);
  } catch (error) {
    next(error);
  }
};

export const getTeacherById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const teacherId = req.params.id;

    const teacher = await prisma.teacher.findUnique({
      where: { id: teacherId as string },
      include: {
        department: true,
        user: { select: { email: true, createdAt: true } },
      }
    });
    
    if (!teacher) throw new NotFoundError('Teacher not found');
    res.json(teacher);
  } catch (error) {
    next(error);
  }
};

export const createTeacher = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, teacherId, firstName, lastName, departmentId } = req.body;
    
    const [existingUser, existingTeacher] = await Promise.all([
      prisma.user.findUnique({ where: { email } }),
      prisma.teacher.findUnique({ where: { teacherId } })
    ]);
    
    if (existingUser) throw new ConflictError('Email already in use');
    if (existingTeacher) throw new ConflictError('Teacher ID already exists');
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const teacher = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          role: Role.TEACHER,
        }
      });
      
      return tx.teacher.create({
        data: {
          userId: user.id,
          teacherId,
          firstName,
          lastName,
          departmentId,
        },
        include: {
          user: { select: { email: true } }
        }
      });
    });
    
    res.status(201).json(teacher);
  } catch (error) {
    next(error);
  }
};

export const updateTeacher = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = req.body;
    
    const teacher = await prisma.teacher.update({
      where: { id: req.params.id as string },
      data,
    });
    
    res.json(teacher);
  } catch (error) {
    next(error);
  }
};
