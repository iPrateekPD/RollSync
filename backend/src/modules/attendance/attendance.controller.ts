import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/prisma';
import { AttendanceService } from './attendance.service';
import { ResultStatus } from '@prisma/client';
import { NotFoundError } from '../../utils/errors';

export const getSessionAttendance = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const classSessionId = req.params.sessionId as string;
    
    const results = await prisma.attendanceResult.findMany({
      where: {
        attendanceSession: { classSessionId }
      },
      include: {
        student: { select: { studentId: true, firstName: true, lastName: true } }
      }
    });
    
    res.json(results);
  } catch (error) {
    next(error);
  }
};

export const updateAttendanceResult = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, reason } = req.body;
    
    const result = await prisma.attendanceResult.update({
      where: { id: req.params.resultId as string },
      data: {
        status: status as ResultStatus,
        reason,
        updatedBy: req.user?.userId
      }
    });
    
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const finalizeSessionAttendance = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const classSessionId = req.params.sessionId as string;
    await AttendanceService.finalizeClassSession(classSessionId);
    res.json({ message: 'Attendance finalized successfully' });
  } catch (error) {
    next(error);
  }
};
