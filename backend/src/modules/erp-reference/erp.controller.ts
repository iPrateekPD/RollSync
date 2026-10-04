import { Request, Response, NextFunction } from 'express';
import { erpReferenceService } from './erp.service';
import { cache } from '../../utils/cache';
import { ValidationError } from '../../utils/errors';

// 5 minutes cache for attendance
const CACHE_TTL = 300; 

function validateRollNo(rollno: any) {
  if (!rollno || typeof rollno !== 'string') {
    throw new ValidationError('Roll number is required');
  }
  // Optional: add strict regex check for roll number format here
  if (!/^[a-zA-Z0-9]+$/.test(rollno)) {
    throw new ValidationError('Invalid roll number format');
  }
}

export const getAttendance = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { rollno, semester = '-1', startDate = '', endDate = '' } = req.query;
    
    validateRollNo(rollno);

    const cacheKey = `attendance_${rollno}_${semester}_${startDate}_${endDate}`;
    const cachedData = cache.get(cacheKey);

    if (cachedData) {
      return res.json(cachedData);
    }

    const data = await erpReferenceService.getAttendance(
      rollno as string, 
      semester as string, 
      startDate as string, 
      endDate as string
    );

    cache.set(cacheKey, data, CACHE_TTL);
    res.json(data);
  } catch (error) {
    next(error);
  }
};

export const getExams = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { rollno, sem = '-1', examType = '0' } = req.query;

    validateRollNo(rollno);

    const cacheKey = `exams_${rollno}_${sem}_${examType}`;
    const cachedData = cache.get(cacheKey);

    if (cachedData) {
      return res.json(cachedData);
    }

    const data = await erpReferenceService.getExams(
      rollno as string,
      sem as string,
      examType as string
    );

    cache.set(cacheKey, data, CACHE_TTL);
    res.json(data);
  } catch (error) {
    next(error);
  }
};

export const getExamSubjects = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { rollno, sem = '-1', examScheduleId, studentId } = req.query;

    validateRollNo(rollno);

    const cacheKey = `exam_subj_${rollno}_${sem}_${examScheduleId}_${studentId}`;
    const cachedData = cache.get(cacheKey);

    if (cachedData) {
      return res.json(cachedData);
    }

    const data = await erpReferenceService.getExamSubjects(
      rollno as string,
      sem as string,
      examScheduleId as string,
      studentId as string
    );

    cache.set(cacheKey, data, CACHE_TTL);
    res.json(data);
  } catch (error) {
    next(error);
  }
};
