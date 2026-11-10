import { Request, Response, NextFunction } from 'express';
import { supabase } from '../supabase';
import { prisma } from '../config/prisma';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';

export interface AuthenticatedUser {
  userId: string;
  email: string;
  role: 'ADMIN' | 'TEACHER';
  teacherId?: string;
}
declare global {
  namespace Express { interface Request { user?: AuthenticatedUser; } }
}

export const authenticate = async (req: Request, _res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return next(new UnauthorizedError('Missing or invalid bearer token'));
  const token = authHeader.slice(7).trim();
  if (!token) return next(new UnauthorizedError('Missing bearer token'));

  try {
    const { data, error } = await supabase.auth.getUser(token);
    const authUser = data.user;
    if (error || !authUser) return next(new UnauthorizedError('Invalid or expired Supabase session'));

    const role = authUser.app_metadata?.role;
    if (role === 'ADMIN') {
      req.user = { userId: authUser.id, email: authUser.email || '', role: 'ADMIN' };
      return next();
    }
    if (role !== 'TEACHER') return next(new ForbiddenError('This account has no RollSync staff role'));

    const teacher = await prisma.teachers.findUnique({
      where: { auth_id: authUser.id },
      select: { id: true, email: true },
    });
    if (!teacher || !teacher.email || teacher.email.toLowerCase() !== (authUser.email || '').toLowerCase()) {
      return next(new ForbiddenError('This account is not linked to a RollSync teacher record'));
    }
    req.user = { userId: authUser.id, email: authUser.email || '', role: 'TEACHER', teacherId: teacher.id };
    return next();
  } catch (error) {
    return next(error instanceof Error ? error : new UnauthorizedError('Unable to validate session'));
  }
};

export const requireRole = (roles: string[]) => (req: Request, _res: Response, next: NextFunction) => {
  if (!req.user) return next(new UnauthorizedError());
  if (!roles.includes(req.user.role)) return next(new ForbiddenError(`Requires one of roles: ${roles.join(', ')}`));
  return next();
};
