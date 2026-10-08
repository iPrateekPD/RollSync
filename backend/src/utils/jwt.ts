import jwt from 'jsonwebtoken';


const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key-replace-in-production';
const JWT_EXPIRES_IN = '1d';
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'super-secret-refresh-key-replace-in-production';
const REFRESH_EXPIRES_IN = '7d';

export interface TokenPayload {
  userId: string;
  role: string;
}

export const generateTokens = (payload: TokenPayload) => {
  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  const refreshToken = jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES_IN });
  
  return { accessToken, refreshToken };
};

export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
};

export const verifyRefreshToken = (token: string): TokenPayload => {
  return jwt.verify(token, REFRESH_SECRET) as TokenPayload;
};
