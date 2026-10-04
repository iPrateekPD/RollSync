import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/prisma';
import { NotFoundError, ConflictError } from '../../utils/errors';

export const getCourses = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const courses = await prisma.course.findMany({
      include: {
        semester: { select: { name: true, number: true } },
        teacher: { select: { firstName: true, lastName: true } },
      }
    });
    res.json(courses);
  } catch (error) {
    next(error);
  }
};

export const getCourseById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const course = await prisma.course.findUnique({
      where: { id: req.params.id as string },
      include: {
        semester: true,
        teacher: true,
        enrollments: {
          include: { student: { select: { studentId: true, firstName: true, lastName: true } } }
        }
      }
    });
    
    if (!course) throw new NotFoundError('Course not found');
    res.json(course);
  } catch (error) {
    next(error);
  }
};

export const createCourse = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = req.body;
    
    const existing = await prisma.course.findUnique({ where: { code: data.code } });
    if (existing) throw new ConflictError('Course code already exists');
    
    const course = await prisma.course.create({ data });
    res.status(201).json(course);
  } catch (error) {
    next(error);
  }
};

export const updateCourse = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = req.body;
    const course = await prisma.course.update({
      where: { id: req.params.id as string },
      data,
    });
    res.json(course);
  } catch (error) {
    next(error);
  }
};
