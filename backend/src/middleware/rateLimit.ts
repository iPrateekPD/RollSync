import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';

const rateLimitMap = new Map<string, { count: number, resetTime: number }>();

export const rateLimiter = (options: { windowMs: number, max: number }) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Determine the IP address or identifier
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();

    const record = rateLimitMap.get(ip);
    
    if (!record || now > record.resetTime) {
      rateLimitMap.set(ip, { count: 1, resetTime: now + options.windowMs });
      return next();
    }

    if (record.count >= options.max) {
      return next(new AppError('Your Device is blocked for 1 hour due to Spamming.', 'RATE_LIMIT_EXCEEDED', 429));
    }

    record.count += 1;
    next();
  };
};
