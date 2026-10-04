import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/prisma';
import { NotFoundError, ConflictError } from '../../utils/errors';

export const getDepartments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const departments = await prisma.department.findMany({
      include: {
        _count: {
          select: { programs: true, teachers: true }
        }
      }
    });
    res.json(departments);
  } catch (error) {
    next(error);
  }
};

export const getDepartmentById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const department = await prisma.department.findUnique({
      where: { id: req.params.id as string },
      include: {
        programs: true,
        teachers: {
          select: {
            id: true,
            teacherId: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });
    
    if (!department) throw new NotFoundError('Department not found');
    res.json(department);
  } catch (error) {
    next(error);
  }
};

export const createDepartment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code, name } = req.body;
    
    const existing = await prisma.department.findUnique({ where: { code } });
    if (existing) throw new ConflictError('Department code already exists');
    
    const department = await prisma.department.create({
      data: { code, name },
    });
    
    res.status(201).json(department);
  } catch (error) {
    next(error);
  }
};

export const updateDepartment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code, name } = req.body;
    
    if (code) {
      const existing = await prisma.department.findUnique({ where: { code } });
      if (existing && existing.id !== req.params.id) {
        throw new ConflictError('Department code already exists');
      }
    }
    
    const department = await prisma.department.update({
      where: { id: req.params.id as string },
      data: { code, name },
    });
    
    res.json(department);
  } catch (error) {
    next(error);
  }
};
