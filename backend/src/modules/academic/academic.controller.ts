import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/prisma';
import { NotFoundError, ConflictError } from '../../utils/errors';

// ACADEMIC YEAR
export const getAcademicYears = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const years = await prisma.academicYear.findMany({ include: { semesters: true } });
    res.json(years);
  } catch (error) { next(error); }
};

export const createAcademicYear = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const year = await prisma.academicYear.create({ data: req.body });
    res.status(201).json(year);
  } catch (error) { next(error); }
};

export const updateAcademicYear = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const year = await prisma.academicYear.update({
      where: { id: req.params.id as string },
      data: req.body,
    });
    res.json(year);
  } catch (error) { next(error); }
};

// SEMESTER
export const getSemesters = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const semesters = await prisma.semester.findMany({ include: { academicYear: true } });
    res.json(semesters);
  } catch (error) { next(error); }
};

export const createSemester = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const semester = await prisma.semester.create({ data: req.body });
    res.status(201).json(semester);
  } catch (error) { next(error); }
};

export const updateSemester = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const semester = await prisma.semester.update({
      where: { id: req.params.id as string },
      data: req.body,
    });
    res.json(semester);
  } catch (error) { next(error); }
};

// SECTION
export const getSections = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sections = await prisma.section.findMany();
    res.json(sections);
  } catch (error) { next(error); }
};

export const createSection = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const section = await prisma.section.create({ data: req.body });
    res.status(201).json(section);
  } catch (error) { next(error); }
};

export const updateSection = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const section = await prisma.section.update({
      where: { id: req.params.id as string },
      data: req.body,
    });
    res.json(section);
  } catch (error) { next(error); }
};
