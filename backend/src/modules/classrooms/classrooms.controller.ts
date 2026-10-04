import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/prisma';
import { NotFoundError, ConflictError } from '../../utils/errors';

export const getClassrooms = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const classrooms = await prisma.classroom.findMany();
    res.json(classrooms);
  } catch (error) {
    next(error);
  }
};

export const getClassroomById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const classroom = await prisma.classroom.findUnique({
      where: { id: req.params.id as string },
      include: {
        device: true,
      }
    });
    
    if (!classroom) throw new NotFoundError('Classroom not found');
    res.json(classroom);
  } catch (error) {
    next(error);
  }
};

export const createClassroom = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = req.body;
    
    const existing = await prisma.classroom.findUnique({ where: { name: data.name } });
    if (existing) throw new ConflictError('Classroom name already exists');
    
    const classroom = await prisma.classroom.create({ data });
    res.status(201).json(classroom);
  } catch (error) {
    next(error);
  }
};

export const updateClassroom = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = req.body;
    
    if (data.name) {
      const existing = await prisma.classroom.findUnique({ where: { name: data.name } });
      if (existing && existing.id !== req.params.id) {
        throw new ConflictError('Classroom name already exists');
      }
    }
    
    const classroom = await prisma.classroom.update({
      where: { id: req.params.id as string },
      data,
    });
    res.json(classroom);
  } catch (error) {
    next(error);
  }
};
