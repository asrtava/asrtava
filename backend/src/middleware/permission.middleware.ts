import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.middleware';
import { db } from '../database';

/**
 * Checks if the user holds the required canonical permission:
 * action: e.g. 'view', 'create', 'edit', 'delete', 'approve'
 * resource: e.g. 'patients', 'prescriptions', 'beds', 'invoices', 'users'
 *
 * Evaluation Precedence:
 * 1. Explicit Individual DENY (is_granted = false) -> Immediate 403 Forbidden.
 * 2. Explicit Individual ALLOW (is_granted = true, expires_at > NOW()) -> Granted.
 * 3. Role-Based Access Control (Active role assigned with valid role_permission) -> Granted.
 * 4. Default Deny -> 403 Forbidden.
 */
export function requirePermission(requiredAction: string, resource: string) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthenticated request.' });
      return;
    }

    // Super Admin: Has full access to platform management resources, but CANNOT access patient/clinical records
    // without an active, audited platform support session.
    if (req.user.userType === 'super_admin') {
      const isClinicalOrPatientData = ['patients', 'prescriptions', 'consultations', 'lab_results', 'radiology_reports'].includes(resource);
      if (isClinicalOrPatientData) {
        // Check for active platform support session for this tenant
        const activeSupport = await db('platform_support_sessions')
          .where({
            support_user_id: req.user.id,
            hospital_id: req.hospitalId,
            status: 'active',
          })
          .where('expires_at', '>', new Date())
          .first();

        if (!activeSupport) {
          res.status(403).json({
            success: false,
            code: 'SUPPORT_SESSION_REQUIRED',
            message: 'Super Admin access to protected hospital patient health data requires an approved, time-limited Support Session (DPDP & HIPAA requirement).',
          });
          return;
        }
      } else {
        // Platform administration resource
        next();
        return;
      }
    }

    // Hospital Owner & Hospital Admin: Full administrative authority over their tenant's resources
    const isHospitalAdmin =
      req.user.userType === 'hospital_admin' ||
      req.user.roles?.includes('hospital_owner') ||
      req.user.roles?.includes('hospital_admin');

    if (isHospitalAdmin) {
      next();
      return;
    }

    try {
      const activeHospitalId = req.hospitalId;

      // 1. Check individual user custom permissions (Overrides)
      const userPermQuery = db('user_permissions as up')
        .join('permissions as p', 'up.permission_id', 'p.id')
        .where({
          'up.user_id': req.user.id,
          'p.action': requiredAction,
          'p.resource': resource,
        });

      if (activeHospitalId) {
        userPermQuery.where('up.hospital_id', activeHospitalId);
      }

      const userPerm = await userPermQuery
        .select('up.is_granted', 'up.expires_at')
        .first();

      if (userPerm !== undefined) {
        // Check if override has expired
        const isExpired = userPerm.expires_at && new Date(userPerm.expires_at) < new Date();
        if (!isExpired) {
          if (!userPerm.is_granted) {
            // Explicit Individual DENY takes absolute precedence
            res.status(403).json({
              success: false,
              code: 'PERMISSION_EXPLICIT_DENIED',
              message: `Permission for [${requiredAction}:${resource}] is explicitly denied for your account by the hospital administrator.`,
            });
            return;
          } else {
            // Explicit Individual ALLOW granted
            next();
            return;
          }
        }
      }

      // 2. Check Role-Based Access Control (RBAC)
      const rolePermQuery = db('user_roles as ur')
        .join('role_permissions as rp', 'ur.role_id', 'rp.role_id')
        .join('permissions as p', 'rp.permission_id', 'p.id')
        .join('roles as r', 'ur.role_id', 'r.id')
        .where({
          'ur.user_id': req.user.id,
          'p.action': requiredAction,
          'p.resource': resource,
          'r.is_active': true,
        });

      if (activeHospitalId) {
        rolePermQuery.where((builder) => {
          builder.where('r.hospital_id', activeHospitalId).orWhere('r.is_system_role', true);
        });
      }

      const rolePerm = await rolePermQuery.first();

      if (rolePerm) {
        next();
        return;
      }

      // 3. Default Deny
      res.status(403).json({
        success: false,
        code: 'PERMISSION_DENIED',
        message: `Access denied: Missing required permission [${requiredAction}:${resource}].`,
      });
    } catch (err: any) {
      next(err);
    }
  };
}
