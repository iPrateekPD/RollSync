import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/prisma';
import { NotFoundError, ConflictError } from '../../utils/errors';

export const getPrograms = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const programs = await prisma.program.findMany({
      include: { department: { select: { name: true } } }
    });
    res.json(programs);
  } catch (error) {
    next(error);
  }
};

export const getProgramById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const program = await prisma.program.findUnique({
      where: { id: req.params.id as string },
      include: { department: true }
    });
    if (!program) throw new NotFoundError('Program not found');
    res.json(program);
  } catch (error) {
    next(error);
  }
};

export const createProgram = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const existing = await prisma.program.findUnique({ where: { code: req.body.code } });
    if (existing) throw new ConflictError('Program code already exists');
    
    const program = await prisma.program.create({ data: req.body });
    res.status(201).json(program);
  } catch (error) {
    next(error);
  }
};

export const updateProgram = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const program = await prisma.program.update({
      where: { id: req.params.id as string },
      data: req.body,
    });
    res.json(program);
  } catch (error) {
    next(error);
  }
};
