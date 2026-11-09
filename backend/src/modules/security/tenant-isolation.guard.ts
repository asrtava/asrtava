import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';
import { db } from '../../database';
import { logger } from '../../utils/logger';

export class TenantIsolationGuard {
  /**
   * Verifies that a specific database entity strictly belongs to the authenticated user's hospital tenant.
   * If a cross-tenant access attempt is detected, immediately flags security incident and returns false.
   */
  public static async verifyResourceTenantOwnership(params: {
    tableName: string;
    resourceId: string;
    expectedHospitalId: string | null;
    userType: string;
    userId?: string;
  }): Promise<{ isAllowed: boolean; crossTenantBreach: boolean; reason?: string }> {
    // Platform super admins operating in valid platform mode
    if (params.userType === 'super_admin') {
      return { isAllowed: true, crossTenantBreach: false };
    }

    if (!params.expectedHospitalId) {
      return { isAllowed: false, crossTenantBreach: false, reason: 'User not associated with any active tenant.' };
    }

    try {
      const record = await db(params.tableName).where({ id: params.resourceId }).first();

      if (!record) {
        // Record does not exist (not a tenant breach, simple 404)
        return { isAllowed: false, crossTenantBreach: false, reason: 'Resource not found.' };
      }

      // Check tenant ownership field
      const resourceHospitalId = record.hospital_id || record.hospitalId;
      if (resourceHospitalId && resourceHospitalId !== params.expectedHospitalId) {
        logger.error(
          `CROSS-TENANT VIOLATION DETECTED: User ${params.userId} of hospital ${params.expectedHospitalId} attempted to access ${params.tableName}:${params.resourceId} belonging to hospital ${resourceHospitalId}`
        );

        // Record security incident
        try {
          await db('security_incidents').insert({
            incident_number: `INC-${Date.now().toString().slice(-8)}`,
            hospital_id: params.expectedHospitalId,
            title: `Unauthorized Cross-Tenant Access Attempt on ${params.tableName}`,
            description: `User attempted to read/modify resource ${params.resourceId} from foreign tenant ${resourceHospitalId}.`,
            severity: 'high',
            category: 'cross_tenant_attempt',
            status: 'contained',
            affected_user_id: params.userId,
            affected_resource_type: params.tableName,
            affected_resource_id: params.resourceId,
            containment_action: 'Request rejected with 403 Forbidden; incident logged.',
            created_at: new Date(),
          });
        } catch {}

        return {
          isAllowed: false,
          crossTenantBreach: true,
          reason: 'Access denied: Resource belongs to a different hospital tenant (BOLA/IDOR protection).',
        };
      }

      return { isAllowed: true, crossTenantBreach: false };
    } catch (err: any) {
      return { isAllowed: false, crossTenantBreach: false, reason: err.message };
    }
  }

  /**
   * Express middleware to guard routes accepting an entity ID parameter (e.g. :id or :patientId)
   */
  public static guardResource(tableName: string, paramName: string = 'id') {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
      const rawId = req.params[paramName];
      if (!rawId) {
        next();
        return;
      }
      const resourceId = String(rawId);

      const result = await TenantIsolationGuard.verifyResourceTenantOwnership({
        tableName,
        resourceId,
        expectedHospitalId: req.hospitalId || null,
        userType: req.user?.userType || 'staff',
        userId: req.user?.id,
      });

      if (!result.isAllowed) {
        const statusCode = result.crossTenantBreach ? 403 : 404;
        res.status(statusCode).json({
          success: false,
          code: result.crossTenantBreach ? 'CROSS_TENANT_FORBIDDEN' : 'NOT_FOUND',
          message: result.reason || 'Access denied.',
        });
        return;
      }

      next();
    };
  }
}
