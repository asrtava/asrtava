import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.middleware';
import { db } from '../database';
import { LicenseService } from '../modules/licensing/license.service';
import { SurgicalContinuityService } from '../modules/ot/surgical-continuity.service';
import { logger } from '../utils/logger';

export interface ClinicalContinuityOptions {
  requiredModule?: string;
  allowReadContinuity?: boolean;
  resourceType?: string;
  action?: string;
}

/**
 * Server-Side Inpatient/Emergency Encounter Context Validator.
 * NEVER trusts client-supplied headers or body parameters without database or verified state validation.
 */
export async function validateServerEncounterContext(params: {
  hospitalId: string;
  encounterId?: string;
  patientId?: string;
}): Promise<{
  isValid: boolean;
  isActive: boolean;
  encounterType?: 'INPATIENT' | 'EMERGENCY' | 'OT_SURGERY' | 'OPD';
  status?: string;
  reason?: string;
}> {
  const { hospitalId, encounterId, patientId } = params;

  if (!encounterId && !patientId) {
    return { isValid: false, isActive: false, reason: 'No encounter or patient reference provided.' };
  }

  try {
    // 1. Check Inpatient Admissions (Primary Encounter Context)
    if (encounterId) {
      const admission = await db('admissions')
        .where({ id: encounterId, hospital_id: hospitalId })
        .select('id', 'patient_id', 'status', 'admission_date', 'discharge_date')
        .first();

      if (admission) {
        // Cross-verify patient relationship if patientId was also provided
        if (patientId && admission.patient_id !== patientId) {
          return {
            isValid: false,
            isActive: false,
            reason: `ENCOUNTER_PATIENT_MISMATCH: Encounter ${encounterId} does not belong to patient ${patientId}.`
          };
        }

        const activeStatuses = ['ADMITTED', 'IN_TREATMENT', 'IN_SURGERY', 'PRE_OP', 'PACU_RECOVERY', 'active'];
        const isActive = activeStatuses.includes(admission.status) && !admission.discharge_date;

        return {
          isValid: true,
          isActive,
          encounterType: 'INPATIENT',
          status: admission.status,
          reason: isActive ? 'Active inpatient encounter validated.' : `Inpatient encounter is ${admission.status}.`
        };
      }

      // 2. Check Emergency Encounters
      const emergency = await db('emergency_admissions')
        .where({ id: encounterId, hospital_id: hospitalId })
        .select('id', 'patient_id', 'triage_priority', 'status')
        .first();

      if (emergency) {
        if (patientId && emergency.patient_id !== patientId) {
          return {
            isValid: false,
            isActive: false,
            reason: `EMERGENCY_PATIENT_MISMATCH: Emergency record ${encounterId} does not match patient ${patientId}.`
          };
        }

        const isEmergencyActive = ['TRIAGED', 'UNDER_RESUSCITATION', 'OBSERVATION', 'ACTIVE', 'admitted'].includes(emergency.status);
        return {
          isValid: true,
          isActive: isEmergencyActive,
          encounterType: 'EMERGENCY',
          status: emergency.status,
          reason: isEmergencyActive ? 'Active emergency encounter validated.' : `Emergency encounter is ${emergency.status}.`
        };
      }
    }

    // 3. Fallback: If only patientId provided, verify patient exists and belongs to this hospital tenant
    if (patientId) {
      const patient = await db('patients')
        .where({ id: patientId, hospital_id: hospitalId })
        .select('id', 'status')
        .first();

      if (!patient) {
        return {
          isValid: false,
          isActive: false,
          reason: `PATIENT_TENANT_MISMATCH: Patient ${patientId} not found in tenant ${hospitalId}.`
        };
      }

      // Check if patient has any active admission
      const activeAdmission = await db('admissions')
        .where({ patient_id: patientId, hospital_id: hospitalId })
        .whereIn('status', ['ADMITTED', 'IN_TREATMENT', 'IN_SURGERY', 'active'])
        .whereNull('discharge_date')
        .first();

      return {
        isValid: true,
        isActive: !!activeAdmission,
        encounterType: activeAdmission ? 'INPATIENT' : 'OPD',
        status: activeAdmission ? activeAdmission.status : 'OUTPATIENT',
        reason: activeAdmission ? 'Active inpatient admission resolved for patient.' : 'Patient resolved without active inpatient admission.'
      };
    }

    return { isValid: false, isActive: false, reason: 'Encounter could not be resolved from server database.' };
  } catch (err: any) {
    // If DB tables are during migration/test sandbox fallback, check in-memory state or fail safely
    logger.warn('Encounter verification database query fallback', { error: err.message, encounterId, patientId });
    return { isValid: false, isActive: false, reason: 'Encounter verification query failure: ' + err.message };
  }
}

/**
 * P0-01: Express Middleware for Perpetual Licensing & Clinical Continuity.
 * Enforces:
 * 1. Strict tenant boundary & authenticated identity.
 * 2. Absolute precedence of explicit individual user DENY (is_granted = false).
 * 3. Server-side validated encounter resolution (never trusts client headers blindly).
 * 4. Clinical continuity exception for active inpatient/emergency care & historical read-only queries.
 * 5. Structured, correlated audit logging for any granted continuity bypass.
 */
export function requireLicensedModule(moduleCode: string, options: ClinicalContinuityOptions = {}) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const correlationId = (req.headers['x-request-id'] as string) || `corr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    try {
      // 1. Authentication & Tenant Context Check
      if (!req.user) {
        res.status(401).json({ success: false, code: 'UNAUTHENTICATED', message: 'Authentication required.' });
        return;
      }

      // Platform Super Admins are exempt from tenant licensing checks (platform governance)
      if (req.user.userType === 'super_admin') {
        return next();
      }

      const hospitalId = req.hospitalId || req.user.hospitalId;
      if (!hospitalId) {
        res.status(400).json({ success: false, code: 'MISSING_TENANT_CONTEXT', message: 'Hospital tenant context is missing.' });
        return;
      }

      // 2. Individual User DENY Precedence Check (Clinical safety must NOT bypass personal authorization revokation)
      const action = options.action || (req.method === 'GET' ? 'view' : req.method === 'POST' ? 'create' : 'edit');
      const resource = options.resourceType || moduleCode.replace('module:', '');

      try {
        const userDeny = await db('user_permissions as up')
          .join('permissions as p', 'up.permission_id', 'p.id')
          .where({
            'up.user_id': req.user.id,
            'up.hospital_id': hospitalId,
            'p.action': action,
            'p.resource': resource,
            'up.is_granted': false
          })
          .where(builder => {
            builder.whereNull('up.expires_at').orWhere('up.expires_at', '>', new Date());
          })
          .first();

        if (userDeny) {
          logger.warn('AUTHORIZATION_BLOCKED: Explicit individual user DENY override in effect', {
            userId: req.user.id,
            action,
            resource,
            correlationId
          });
          res.status(403).json({
            success: false,
            code: 'PERMISSION_EXPLICIT_DENIED',
            message: `Action [${action}:${resource}] is explicitly denied for your user account by hospital administration.`
          });
          return;
        }
      } catch {
        // Table may be migrating or empty; proceed to licensing checks
      }

      // 3. Extract Encounter & Patient Context from Server Request
      // Check params, body, and query systematically
      const encounterId = (req.params?.admissionId || req.params?.encounterId || req.params?.scheduleId ||
        req.body?.admissionId || req.body?.encounterId || req.body?.scheduleId ||
        req.query?.admissionId || req.query?.encounterId) as string | undefined;

      const patientId = (req.params?.patientId || req.body?.patientId || req.query?.patientId) as string | undefined;
      const isReadOperation = req.method === 'GET' || req.method === 'HEAD' || options.allowReadContinuity === true;

      // 4. Server-Side Validation of Encounter (if provided)
      let validatedEncounter: { isValid: boolean; isActive: boolean; encounterType?: string; status?: string; reason?: string } = {
        isValid: false,
        isActive: false
      };

      if (encounterId || patientId) {
        validatedEncounter = await validateServerEncounterContext({ hospitalId, encounterId, patientId });

        // If client passed an explicit encounter ID that failed tenant validation, reject immediately
        if (encounterId && !validatedEncounter.isValid && validatedEncounter.reason?.includes('MISMATCH')) {
          res.status(403).json({
            success: false,
            code: 'CROSS_TENANT_ENCOUNTER_REJECTED',
            message: validatedEncounter.reason,
            correlationId
          });
          return;
        }
      }

      // 5. Evaluate Licensing & Clinical Continuity via LicenseService
      const isSurgicalProtected = encounterId ? SurgicalContinuityService.isSessionProtected(encounterId, hospitalId) : false;
      const continuityContext = {
        operation: isReadOperation ? ('read' as const) : ('write' as const),
        isExistingRecord: isReadOperation && !!(encounterId || patientId),
        hasActiveEncounter: validatedEncounter.isActive,
        scheduleId: encounterId,
        isSurgicalSessionActive: isSurgicalProtected,
        clinicalOverrideReason: (req.headers['x-clinical-emergency-reason'] as string) || (req.body?.clinicalOverrideReason as string)
      };

      const entitlement = LicenseService.checkModuleEntitlement(hospitalId, moduleCode, continuityContext);

      // 6. Case A: License is Active and Module is Entitled
      if (entitlement.allowed && !entitlement.isClinicalContinuity && !entitlement.isFailSafeBypass && !entitlement.isClinicalOverride) {
        return next();
      }

      // 7. Case B: Permitted Under Clinical Continuity Safeguard
      if (entitlement.allowed && (entitlement.isClinicalContinuity || entitlement.isFailSafeBypass || entitlement.isClinicalOverride)) {
        // Audit log the continuity bypass
        logger.warn('CLINICAL_CONTINUITY_EXCEPTION_GRANTED', {
          correlationId,
          hospitalId,
          userId: req.user.id,
          moduleCode,
          operation: req.method,
          path: req.originalUrl,
          patientId,
          encounterId,
          encounterStatus: validatedEncounter.status,
          bypassType: entitlement.isClinicalContinuity ? 'CLINICAL_CONTINUITY' : entitlement.isFailSafeBypass ? 'EMERGENCY_FAILSAFE' : 'CLINICAL_OVERRIDE',
          reason: entitlement.reason
        });

        // Attach verified continuity metadata to request for downstream controllers
        (req as any).clinicalContinuity = {
          isContinuitySession: true,
          bypassType: entitlement.isClinicalContinuity ? 'CLINICAL_CONTINUITY' : entitlement.isFailSafeBypass ? 'EMERGENCY_FAILSAFE' : 'CLINICAL_OVERRIDE',
          correlationId,
          encounterValidated: validatedEncounter.isValid,
          isActiveEncounter: validatedEncounter.isActive,
          reason: entitlement.reason
        };

        return next();
      }

      // 8. Case C: Access Strictly Denied (Commercial license missing/expired and does NOT meet continuity criteria)
      logger.info('MODULE_ACCESS_DENIED_BY_LICENSE', {
        hospitalId,
        userId: req.user.id,
        moduleCode,
        path: req.originalUrl,
        reason: entitlement.reason,
        correlationId
      });

      res.status(403).json({
        success: false,
        code: 'MODULE_NOT_LICENSED',
        feature: moduleCode,
        message: entitlement.reason,
        correlationId,
        continuityEligible: false,
        guidance: 'Non-continuity clinical transactions and administrative operations require an active perpetual license tier.'
      });
    } catch (err: any) {
      logger.error('Licensing middleware unexpected exception', { error: err.message, stack: err.stack, correlationId });
      res.status(500).json({
        success: false,
        code: 'LICENSING_EVALUATION_ERROR',
        message: 'Internal error evaluating licensing entitlements: ' + err.message,
        correlationId
      });
    }
  };
}
