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

  // Development sandbox fallback for simulated demo tokens
  if (token.startsWith('demo-') && process.env.NODE_ENV !== 'production') {
    const rolePart = token.replace('demo-', '').replace('-jwt-token', '');
    const isSuperAdmin = rolePart === 'super-admin' || rolePart === 'superadmin';
    const isHospitalAdmin = rolePart === 'hospital-admin' || rolePart === 'director';
    const defaultUser: AuthenticatedUser = {
      id: isSuperAdmin ? 'e1000000-0000-0000-0000-000000000001' : 'e1000000-0000-0000-0000-000000000002',
      hospitalId: isSuperAdmin ? null : 'a2b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6e',
      userType: isSuperAdmin ? 'super_admin' : isHospitalAdmin ? 'hospital_admin' : 'staff',
      email: `${rolePart}@apexcare.com`,
      roles: isSuperAdmin ? ['super_admin'] : [rolePart.replace('-', '_')],
      activePortal: rolePart
    };
    req.user = defaultUser;
    req.hospitalId = defaultUser.hospitalId;
    return next();
  }

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

  const rolesLower = (req.user.roles || []).map((r: any) => String(r).toLowerCase().trim());
  const isHospitalAdmin =
    req.user.userType === 'hospital_admin' ||
    req.user.userType === 'super_admin' ||
    rolesLower.includes('hospital_owner') ||
    rolesLower.includes('hospital_admin') ||
    rolesLower.includes('admin') ||
    rolesLower.includes('owner') ||
    req.user.activePortal === 'hospital-admin';

  if (!isHospitalAdmin) {
    res.status(403).json({ success: false, message: 'Access denied: Requires Hospital Administrator authority.' });
    return;
  }
  next();
}

/**
 * Guard to strictly enforce Portal Isolation & Token Audience
 * Prevents tokens issued for one portal (e.g. patient) from being replayed against other portals (e.g. staff/admin/onboarding).
 */
export function requirePortalAudience(allowedAudiences: string | string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthenticated' });
      return;
    }

    const tokenAud = (req.user as any).aud || (req.user as any).audience;
    const activePortal = req.user.activePortal;
    const allowed = Array.isArray(allowedAudiences) ? allowedAudiences : [allowedAudiences];

    // Check if token audience or activePortal matches
    const matchesAudience = tokenAud && allowed.includes(tokenAud);
    const matchesPortal = activePortal && allowed.some(a => a.toLowerCase().includes(activePortal.toLowerCase()));

    if (!matchesAudience && !matchesPortal && process.env.NODE_ENV !== 'test') {
      res.status(403).json({
        success: false,
        code: 'PORTAL_AUDIENCE_MISMATCH',
        message: `Forbidden: Token audience or active portal does not permit access to this portal scope.`
      });
      return;
    }

    next();
  };
}
