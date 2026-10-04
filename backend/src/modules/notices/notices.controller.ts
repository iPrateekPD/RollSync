import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/prisma';
import { NotFoundError } from '../../utils/errors';
import { Role } from '@prisma/client';

export const getNotices = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userRole = req.user?.role as Role;
    
    // Only show notices intended for this role
    const notices = await prisma.notice.findMany({
      where: {
        audience: { has: userRole },
        publishDate: { lte: new Date() },
        OR: [
          { expiryDate: null },
          { expiryDate: { gt: new Date() } }
        ]
      },
      orderBy: [
        { priority: 'desc' },
        { publishDate: 'desc' }
      ]
    });
    
    res.json(notices);
  } catch (error) {
    next(error);
  }
};

export const getNoticeById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const notice = await prisma.notice.findUnique({
      where: { id: req.params.id as string }
    });
    
    if (!notice) throw new NotFoundError('Notice not found');
    
    // Check audience
    if (!notice.audience.includes(req.user?.role as Role)) {
      throw new NotFoundError('Notice not found'); // hide existence
    }
    
    res.json(notice);
  } catch (error) {
    next(error);
  }
};

export const createNotice = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const notice = await prisma.notice.create({ data: req.body });
    res.status(201).json(notice);
  } catch (error) {
    next(error);
  }
};

export const updateNotice = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const notice = await prisma.notice.update({
      where: { id: req.params.id as string },
      data: req.body,
    });
    res.json(notice);
  } catch (error) {
    next(error);
  }
};

export const deleteNotice = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.notice.delete({
      where: { id: req.params.id as string }
    });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
