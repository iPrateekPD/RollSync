import { Request, Response, NextFunction } from 'express';
import { erpService } from './erp.service';
import { prisma } from '../../config/prisma';
import { UnauthorizedError } from '../../utils/errors';
import { Role } from '@prisma/client';

export const loginToERP = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, password } = req.body;
    
    // We expect the user calling this to already be authenticated with our app as a Student
    if (!req.user || req.user.role !== Role.STUDENT) {
      throw new UnauthorizedError('Only authenticated students can link their ERP account');
    }

    const student = await prisma.student.findUnique({ where: { userId: req.user.userId } });
    if (!student) {
      throw new UnauthorizedError('Student profile not found');
    }

    // Authenticate with ERP and get the session cookie
    const sessionCookie = await erpService.authenticate(username, password);
    
    if (!sessionCookie) {
      throw new UnauthorizedError('Invalid ERP credentials');
    }

    // Store it securely encrypted
    await erpService.storeSessionCookie(student.id, sessionCookie);

    res.json({ message: 'ERP account linked successfully' });
  } catch (error) {
    next(error);
  }
};

export const getDayWiseAttendance = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const student = await getStudentFromReq(req);
    const data = await erpService.getDayWiseAttendance(student.id, student.studentId);
    
    res.json({
      student: { rollNo: student.studentId },
      attendance: data
    });
  } catch (error) {
    next(error);
  }
};

export const getSubjectWiseAttendance = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const student = await getStudentFromReq(req);
    const data = await erpService.getSubjectWiseAttendance(student.id, student.studentId);
    
    res.json({
      student: { rollNo: student.studentId },
      attendance: data
    });
  } catch (error) {
    next(error);
  }
};

export const getAcademicDetails = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const student = await getStudentFromReq(req);
    const data = await erpService.getAcademicDetails(student.id, student.studentId);
    
    res.json({
      student: { rollNo: student.studentId },
      academicDetails: data
    });
  } catch (error) {
    next(error);
  }
};

export const getSubjectWiseGrades = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const student = await getStudentFromReq(req);
    const data = await erpService.getSubjectWiseGrades(student.id, student.studentId);
    
    res.json({
      student: { rollNo: student.studentId },
      grades: data
    });
  } catch (error) {
    next(error);
  }
};

// Helper to ensure the user is a student and grab their profile
async function getStudentFromReq(req: Request) {
  if (!req.user || req.user.role !== Role.STUDENT) {
    throw new UnauthorizedError('Unauthorized access');
  }
  const student = await prisma.student.findUnique({ where: { userId: req.user.userId } });
  if (!student) {
    throw new UnauthorizedError('Student profile not found');
  }
  return student;
}
