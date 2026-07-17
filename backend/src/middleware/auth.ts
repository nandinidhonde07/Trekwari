import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'treckwari-jwt-super-secret-key-9322340365';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

/**
 * Middleware to require user authentication via JWT.
 */
export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access denied. No authentication token provided.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: string };
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

/**
 * Middleware to enforce Admin / Super Admin authorization.
 */
export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized. Login required.' });
  }

  const role = req.user.role;
  if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Access denied. Administrative privileges required.' });
  }

  next();
}

/**
 * Middleware to enforce Trek Leader / Admin authorization.
 */
export function requireLeader(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized. Login required.' });
  }

  const role = req.user.role;
  const hasLeaderAccess = 
    role === 'TREK_LEADER' || 
    role === 'VOLUNTEER' || 
    role === 'ADMIN' || 
    role === 'SUPER_ADMIN';

  if (!hasLeaderAccess) {
    return res.status(403).json({ error: 'Access denied. Trek Leader or staff role required.' });
  }

  next();
}
