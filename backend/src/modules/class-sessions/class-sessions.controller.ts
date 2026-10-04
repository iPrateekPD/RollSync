import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/prisma';
import { NotFoundError, ConflictError } from '../../utils/errors';
import { Role } from '@prisma/client';

export const getClassSessions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userRole = req.user?.role;
    let whereClause = {};

    // For teacher, show only their courses' sessions
    if (userRole === Role.TEACHER) {
      const teacher = await prisma.teacher.findUnique({ where: { userId: req.user?.userId } });
      if (teacher) {
        whereClause = { course: { teacherId: teacher.id } };
      }
    }
    // For student, show only sessions for courses they are enrolled in
    else if (userRole === Role.STUDENT) {
      const student = await prisma.student.findUnique({ where: { userId: req.user?.userId } });
      if (student) {
        whereClause = {
          course: {
            enrollments: { some: { studentId: student.id } }
          }
        };
      }
    }

    const sessions = await prisma.classSession.findMany({
      where: whereClause,
      include: {
        course: { select: { name: true, code: true, teacher: { select: { firstName: true, lastName: true } } } },
        classroom: { select: { name: true } },
      },
      orderBy: { startTime: 'desc' }
    });
    
    res.json(sessions);
  } catch (error) {
    next(error);
  }
};

export const getClassSessionById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const session = await prisma.classSession.findUnique({
      where: { id: req.params.id as string },
      include: {
        course: { include: { teacher: true } },
        classroom: true,
        attendanceSessions: {
          include: { student: { select: { studentId: true, firstName: true, lastName: true } } }
        }
      }
    });
    
    if (!session) throw new NotFoundError('Class Session not found');
    res.json(session);
  } catch (error) {
    next(error);
  }
};

export const createClassSession = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Teachers and Admins can create sessions ad-hoc.
    const data = req.body;
    
    const session = await prisma.classSession.create({ data });
    res.status(201).json(session);
  } catch (error) {
    next(error);
  }
};

export const updateClassSession = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const session = await prisma.classSession.update({
      where: { id: req.params.id as string },
      data: req.body,
    });
    res.json(session);
  } catch (error) {
    next(error);
  }
};

// Start a session explicitly (useful for teachers on their portal)
export const startClassSession = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Check if the teacher owns this course...
    const session = await prisma.classSession.findUnique({
      where: { id: req.params.id as string },
      include: { course: true }
    });
    
    if (!session) throw new NotFoundError('Session not found');

    if (req.user?.role === Role.TEACHER) {
      const teacher = await prisma.teacher.findUnique({ where: { userId: req.user.userId } });
      if (session.course.teacherId !== teacher?.id) {
        throw new ConflictError('You do not have permission to start this session');
      }
    }
    
    if (session.status !== 'SCHEDULED') {
      throw new ConflictError('Session is already started or completed');
    }

    const updatedSession = await prisma.classSession.update({
      where: { id: session.id },
      data: { status: 'ACTIVE', startTime: new Date() } // Update start time to actual click time
    });

    res.json(updatedSession);
  } catch (error) {
    next(error);
  }
};

// End a session explicitly
export const endClassSession = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const session = await prisma.classSession.findUnique({
      where: { id: req.params.id as string },
      include: { course: true }
    });
    
    if (!session) throw new NotFoundError('Session not found');

    if (req.user?.role === Role.TEACHER) {
      const teacher = await prisma.teacher.findUnique({ where: { userId: req.user.userId } });
      if (session.course.teacherId !== teacher?.id) {
        throw new ConflictError('You do not have permission to end this session');
      }
    }
    
    if (session.status !== 'ACTIVE') {
      throw new ConflictError('Only ACTIVE sessions can be completed');
    }

    const updatedSession = await prisma.classSession.update({
      where: { id: session.id },
      data: { status: 'COMPLETED', actualEndTime: new Date() }
    });

    // We would trigger the attendance finalization engine here in the future
    
    res.json(updatedSession);
  } catch (error) {
    next(error);
  }
};
