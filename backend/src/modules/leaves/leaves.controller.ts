import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/prisma';
import { NotFoundError, ForbiddenError } from '../../utils/errors';
import { Role } from '@prisma/client';

export const getLeaveRequests = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userRole = req.user?.role;
    let whereClause = {};

    // Students only see their own leave requests
    if (userRole === Role.STUDENT) {
      const student = await prisma.student.findUnique({ where: { userId: req.user?.userId } });
      if (student) {
        whereClause = { studentId: student.id };
      }
    }
    // Teachers might only see their department's students, but for simplicity admins and teachers see all or can filter
    
    const requests = await prisma.leaveRequest.findMany({
      where: whereClause,
      include: {
        student: { select: { studentId: true, firstName: true, lastName: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json(requests);
  } catch (error) {
    next(error);
  }
};

export const getLeaveRequestById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const request = await prisma.leaveRequest.findUnique({
      where: { id: req.params.id as string },
      include: {
        student: { select: { studentId: true, firstName: true, lastName: true, userId: true } }
      }
    });
    
    if (!request) throw new NotFoundError('Leave request not found');
    
    if (req.user?.role === Role.STUDENT && request.student.userId !== req.user.userId) {
      throw new NotFoundError('Leave request not found'); // hide from other students
    }
    
    res.json(request);
  } catch (error) {
    next(error);
  }
};

export const createLeaveRequest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.user?.role !== Role.STUDENT) {
      throw new ForbiddenError('Only students can create leave requests');
    }
    
    const student = await prisma.student.findUnique({ where: { userId: req.user.userId } });
    if (!student) throw new NotFoundError('Student profile not found');

    const data = {
      ...req.body,
      studentId: student.id,
      status: 'PENDING'
    };
    
    const request = await prisma.leaveRequest.create({ data });
    res.status(201).json(request);
  } catch (error) {
    next(error);
  }
};

export const updateLeaveRequest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const request = await prisma.leaveRequest.update({
      where: { id: req.params.id as string },
      data: { status: req.body.status },
    });
    res.json(request);
  } catch (error) {
    next(error);
  }
};
