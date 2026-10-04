import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import { prisma } from '../../config/prisma';
import { generateTokens, verifyRefreshToken } from '../../utils/jwt';
import { UnauthorizedError } from '../../utils/errors';

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    
    const user = await prisma.user.findUnique({
      where: { email },
    });
    
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }
    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid email or password');
    }
    
    const tokens = generateTokens({ userId: user.id, role: user.role });
    
    res.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      ...tokens,
    });
  } catch (error) {
    next(error);
  }
};

export const refresh = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;
    
    const payload = verifyRefreshToken(refreshToken);
    
    // Verify user still exists and hasn't been deactivated
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });
    
    if (!user) {
      throw new UnauthorizedError('User no longer exists');
    }
    
    const tokens = generateTokens({ userId: user.id, role: user.role });
    
    res.json(tokens);
  } catch (error) {
    next(new UnauthorizedError('Invalid refresh token'));
  }
};

export const logout = async (req: Request, res: Response) => {
  // Since we use stateless JWT, logout is mostly handled client-side by deleting the token.
  // We could implement a token blacklist here in the future using Redis or DB.
  res.json({ success: true, message: 'Logged out successfully' });
};
