import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export const generateToken = (userId: string, email: string, role: string) => {
  const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
  return jwt.sign(
    { id: userId, email, role },
    jwtSecret,
    { expiresIn: '7d' }
  );
};

export const verifyToken = (token: string) => {
  try {
    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
    return jwt.verify(token, jwtSecret);
  } catch (error) {
    return null;
  }
};

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = decoded as any;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Authentication failed' });
  }
};

export const adminMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};
