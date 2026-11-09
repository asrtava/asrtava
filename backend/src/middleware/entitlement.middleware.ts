import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.middleware';
import { db } from '../database';
import { LicenseService } from '../modules/licensing/license.service';

/**
 * Plan Feature Matrix (Fallback defaults if not queried from DB)
 */
const DEFAULT_PLAN_ENTITLEMENTS: Record<string, string[]> = {
  basic: [
    'module:patient_mgmt',
    'module:appointments',
    'module:opd',
    'module:billing',
    'module:reception'
  ],
  starter: [
    'module:patient_mgmt',
    'module:appointments',
    'module:opd',
    'module:billing',
    'module:reception',
    'module:pharmacy'
  ],
  professional: [
    'module:patient_mgmt',
    'module:appointments',
    'module:opd',
    'module:ipd',
    'module:nursing',
    'module:pharmacy',
    'module:lims',
    'module:ris',
    'module:billing',
    'module:hr',
    'module:reception'
  ],
  enterprise: [
    'module:patient_mgmt',
    'module:appointments',
    'module:opd',
    'module:ipd',
    'module:nursing',
    'module:pharmacy',
    'module:lims',
    'module:ris',
    'module:billing',
    'module:hr',
    'module:payroll',
    'module:ot',
    'module:emergency',
    'module:inventory',
    'module:pacs_dicom',
    'module:advanced_analytics',
    'feature:multi_branch',
    'feature:api_access',
    'feature:white_label',
    'module:reception'
  ]
};

/**
 * Express Middleware to enforce SaaS subscription feature entitlements
 * Verifies that the tenant's current plan allows access to a specific module/feature.
 */
export function requirePlanFeature(featureCode: string) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Platform super admins are exempt from tenant feature locks
      if (req.user?.userType === 'super_admin') {
        return next();
      }

      const hospitalId = req.hospitalId || req.user?.hospitalId;
      if (!hospitalId) {
        res.status(400).json({ success: false, message: 'Hospital tenant context is missing.' });
        return;
      }

      // Check tenant lifecycle status
      const hospital = await db('hospitals')
        .where({ id: hospitalId })
        .select('subscription_plan', 'subscription_status', 'lifecycle_status', 'is_active')
        .first();

      if (!hospital) {
        res.status(404).json({ success: false, message: 'Hospital tenant not found.' });
        return;
      }

      if (!hospital.is_active || hospital.lifecycle_status === 'suspended') {
        res.status(403).json({
          success: false,
          code: 'TENANT_SUSPENDED',
          message: 'Hospital tenant account is currently suspended. Please contact ASRTAVA Platform Support.'
        });
        return;
      }

      if (hospital.lifecycle_status === 'deactivated' || hospital.lifecycle_status === 'cancelled') {
        res.status(403).json({
          success: false,
          code: 'TENANT_DEACTIVATED',
          message: 'Hospital tenant account is cancelled. Access to new transactions is restricted.'
        });
        return;
      }

      // 1. Check Perpetual Software License Entitlements first
      const perpetualEntitlement = LicenseService.checkModuleEntitlement(hospitalId, featureCode);
      if (perpetualEntitlement.license) {
        if (perpetualEntitlement.allowed) {
          return next();
        } else {
          res.status(403).json({
            success: false,
            code: 'MODULE_NOT_LICENSED',
            feature: featureCode,
            edition: perpetualEntitlement.license.edition,
            message: perpetualEntitlement.reason,
            upgradeContact: 'sales@asrtava.health'
          });
          return;
        }
      }

      // Fail-Safe Clinical Continuity Check (even without active license)
      if (perpetualEntitlement.isFailSafeBypass) {
        return next();
      }

      // 2. Check if there is an explicit custom enterprise override for this tenant
      try {
        const override = await db('tenant_feature_overrides')
          .where({ hospital_id: hospitalId, feature_code: featureCode })
          .first();

        if (override) {
          if (override.is_enabled && (!override.valid_until || new Date(override.valid_until) > new Date())) {
            return next();
          } else if (!override.is_enabled) {
            res.status(403).json({
              success: false,
              code: 'FEATURE_DISABLED_BY_POLICY',
              message: `Access to feature ${featureCode} has been administratively disabled for your organization.`
            });
            return;
          }
        }
      } catch {
        // Table may be migrating or empty; proceed to plan lookup
      }

      // 2. Query subscription plan entitlements
      const currentPlan = (hospital.subscription_plan || 'basic').toLowerCase();
      const entitledFeatures = DEFAULT_PLAN_ENTITLEMENTS[currentPlan] || DEFAULT_PLAN_ENTITLEMENTS['basic'];

      if (!entitledFeatures.includes(featureCode)) {
        res.status(403).json({
          success: false,
          code: 'FEATURE_NOT_ENTITLED',
          feature: featureCode,
          currentPlan,
          message: `Your current subscription plan (${currentPlan.toUpperCase()}) does not include access to ${featureCode}. Please upgrade to a higher tier.`,
          upgradeUrl: '/hospital/billing/plans'
        });
        return;
      }

      next();
    } catch (err: any) {
      // Fail closed for security
      res.status(500).json({ success: false, message: 'Entitlement validation error: ' + err.message });
    }
  };
}

