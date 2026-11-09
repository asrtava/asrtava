import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.middleware';

/**
 * Ensures non-superadmin users are strictly locked to their verified token hospital tenant.
 * Rejects requests attempting cross-tenant injection.
 */
export function tenantMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Unauthenticated' });
    return;
  }

  // Super Admin is platform-wide
  if (req.user.userType === 'super_admin') {
    next();
    return;
  }

  // Hospital staff and hospital admin MUST have a verified hospitalId
  if (!req.user.hospitalId) {
    res.status(403).json({ success: false, message: 'Access denied: User is not linked to any active hospital tenant' });
    return;
  }

  // Cross-tenant payload tamper prevention:
  // If the client submitted a hospitalId in body or query that doesn't match their token, reject it immediately
  const requestedHospitalId = req.body?.hospitalId || req.query?.hospitalId;
  if (requestedHospitalId && requestedHospitalId !== req.user.hospitalId) {
    res.status(403).json({ success: false, message: 'Security Alert: Cross-tenant access violation detected' });
    return;
  }

  req.hospitalId = req.user.hospitalId;
  next();
}

