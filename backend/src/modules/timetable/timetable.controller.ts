import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/prisma';
import { NotFoundError, ConflictError } from '../../utils/errors';
import { Role } from '@prisma/client';

export const getTimetable = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userRole = req.user?.role;
    let whereClause = {};

    // If teacher, only return their timetable
    if (userRole === Role.TEACHER) {
      const teacher = await prisma.teacher.findUnique({ where: { userId: req.user?.userId } });
      if (teacher) {
        whereClause = { teacherId: teacher.id };
      }
    } 
    // If student, return their section's timetable
    else if (userRole === Role.STUDENT) {
      const student = await prisma.student.findUnique({ where: { userId: req.user?.userId } });
      if (student) {
        whereClause = { sectionId: student.sectionId };
      }
    }

    const timetable = await prisma.timetableEntry.findMany({
      where: whereClause,
      include: {
        course: { select: { name: true, code: true } },
        teacher: { select: { firstName: true, lastName: true } },
        classroom: { select: { name: true } },
        section: { select: { name: true } }
      },
      orderBy: [
        { dayOfWeek: 'asc' },
        { startTime: 'asc' }
      ]
    });
    
    res.json(timetable);
  } catch (error) {
    next(error);
  }
};

export const createTimetableEntry = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = req.body;
    
    // Check for classroom conflicts (same room, same day, overlapping time)
    const classroomConflict = await prisma.timetableEntry.findFirst({
      where: {
        classroomId: data.classroomId,
        dayOfWeek: data.dayOfWeek,
        OR: [
          {
            startTime: { lte: data.startTime },
            endTime: { gt: data.startTime }
          },
          {
            startTime: { lt: data.endTime },
            endTime: { gte: data.endTime }
          },
          {
            startTime: { gte: data.startTime },
            endTime: { lte: data.endTime }
          }
        ]
      }
    });

    if (classroomConflict) {
      throw new ConflictError('Classroom is already booked for this time slot');
    }

    // Check for teacher conflicts (same teacher, same day, overlapping time)
    const teacherConflict = await prisma.timetableEntry.findFirst({
      where: {
        teacherId: data.teacherId,
        dayOfWeek: data.dayOfWeek,
        OR: [
          { startTime: { lte: data.startTime }, endTime: { gt: data.startTime } },
          { startTime: { lt: data.endTime }, endTime: { gte: data.endTime } },
          { startTime: { gte: data.startTime }, endTime: { lte: data.endTime } }
        ]
      }
    });

    if (teacherConflict) {
      throw new ConflictError('Teacher is already assigned to another class during this time slot');
    }

    const entry = await prisma.timetableEntry.create({ data });
    res.status(201).json(entry);
  } catch (error) {
    next(error);
  }
};

export const updateTimetableEntry = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Basic update, assuming frontend checked conflicts or we add conflict checks here too
    const entry = await prisma.timetableEntry.update({
      where: { id: req.params.id as string },
      data: req.body,
    });
    res.json(entry);
  } catch (error) {
    next(error);
  }
};

export const deleteTimetableEntry = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.timetableEntry.delete({
      where: { id: req.params.id as string },
    });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
