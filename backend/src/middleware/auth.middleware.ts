import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { db } from '../database';

export interface AuthenticatedUser {
  id: string;
  hospitalId: string | null;
  userType: 'super_admin' | 'hospital_admin' | 'staff' | 'patient';
  email: string;
  roles: string[];
  activePortal?: string;
  sessionId?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
  hospitalId?: string | null;
}

/**
 * Standard JWT Authentication Middleware
 */
export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: 'Authentication required. Authorization header missing or malformed.' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, config.jwt.secret) as AuthenticatedUser;
    req.user = decoded;
    req.hospitalId = decoded.hospitalId;
    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      res.status(401).json({ success: false, code: 'TOKEN_EXPIRED', message: 'Authentication token expired. Please refresh your session.' });
      return;
    }
    res.status(401).json({ success: false, code: 'INVALID_TOKEN', message: 'Invalid or forged authentication token.' });
  }
}

/**
 * Guard for Super Admin Platform Routes Only
 * Ensures platform operations cannot be performed by regular hospital staff.
 */
export function requireSuperAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (!req.user || req.user.userType !== 'super_admin') {
    res.status(403).json({ success: false, message: 'Access denied: Requires platform Super Admin authorization.' });
    return;
  }
  next();
}

/**
 * Guard for Hospital Administration Routes
 */
export function requireHospitalAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Unauthenticated' });
    return;
  }

  const isHospitalAdmin =
    req.user.userType === 'hospital_admin' ||
    req.user.roles.includes('hospital_owner') ||
    req.user.roles.includes('hospital_admin');

  if (!isHospitalAdmin && req.user.userType !== 'super_admin') {
    res.status(403).json({ success: false, message: 'Access denied: Requires Hospital Administrator authority.' });
    return;
  }
  next();
}
