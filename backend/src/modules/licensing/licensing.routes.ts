import { Router, Response } from 'express';
import { LicenseService, SoftwareEdition, DeploymentModel, AmcPlanTier } from './license.service';
import { authMiddleware, requireSuperAdmin, AuthenticatedRequest } from '../../middleware/auth.middleware';

const router = Router();

function getParamId(param: string | string[]): string {
  return Array.isArray(param) ? param[0] : param;
}

// ============================================================================
// SUPER ADMIN ENDPOINTS (CENTRAL LICENSE GOVERNANCE & COMMERCIAL MANAGEMENT)
// ============================================================================

/**
 * Issue a new perpetual software license
 * POST /api/v1/licensing/issue
 */
router.post('/issue', authMiddleware, requireSuperAdmin, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const {
      hospitalId,
      edition,
      licenseType,
      customModules,
      deploymentModel,
      authorizedLocations,
      authorizedInstallations,
      maxBeds,
      maxDoctors,
      maxActiveUsers,
      hardwareFingerprintHash,
      notes
    } = req.body;

    if (!hospitalId || !edition) {
      res.status(400).json({ success: false, message: 'hospitalId and edition are required.' });
      return;
    }

    const license = await LicenseService.issueLicense({
      hospitalId,
      edition: edition as SoftwareEdition,
      licenseType,
      customModules,
      deploymentModel: deploymentModel as DeploymentModel,
      authorizedLocations,
      authorizedInstallations,
      maxBeds,
      maxDoctors,
      maxActiveUsers,
      hardwareFingerprintHash,
      issuedBy: req.user?.id,
      notes
    });

    res.status(201).json({
      success: true,
      message: 'Perpetual software license issued successfully.',
      license
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Activate an issued license
 * POST /api/v1/licensing/activate
 */
router.post('/activate', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { hospitalId, activationKey, activationToken, hardwareFingerprintHash } = req.body;
    const targetHospitalId = (hospitalId || req.hospitalId || req.user?.hospitalId) as string;

    if (!targetHospitalId) {
      res.status(400).json({ success: false, message: 'Hospital context is required.' });
      return;
    }

    const result = await LicenseService.activateLicense({
      hospitalId: targetHospitalId,
      activationKey,
      activationToken,
      hardwareFingerprintHash,
      activatedBy: req.user?.id
    });

    if (!result.success) {
      res.status(400).json(result);
      return;
    }

    res.json({
      success: true,
      message: 'License activated successfully. Modular entitlements are active.',
      license: result.license
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * List all perpetual licenses (Super Admin)
 * GET /api/v1/licensing/licenses
 */
router.get('/licenses', authMiddleware, requireSuperAdmin, (_req: AuthenticatedRequest, res: Response): void => {
  const licenses = LicenseService.getAllLicenses();
  res.json({ success: true, count: licenses.length, licenses });
});

/**
 * Get specific license details and maintenance agreements (Super Admin)
 * GET /api/v1/licensing/licenses/:id
 */
router.get('/licenses/:id', authMiddleware, requireSuperAdmin, (req: AuthenticatedRequest, res: Response): void => {
  const licenseId = getParamId(req.params.id);
  const license = LicenseService.getLicenseById(licenseId);
  if (!license) {
    res.status(404).json({ success: false, message: 'License not found.' });
    return;
  }
  const details = LicenseService.getHospitalLicense(license.hospital_id);
  res.json({ success: true, ...details });
});

/**
 * Add modular entitlements to an existing perpetual license (Super Admin)
 * POST /api/v1/licensing/:id/add-modules
 */
router.post('/:id/add-modules', authMiddleware, requireSuperAdmin, (req: AuthenticatedRequest, res: Response): void => {
  try {
    const { modules, notes } = req.body;
    if (!Array.isArray(modules) || modules.length === 0) {
      res.status(400).json({ success: false, message: 'modules array is required.' });
      return;
    }

    const licenseId = getParamId(req.params.id);
    const updated = LicenseService.addModulesToLicense(licenseId, modules, req.user?.id, notes);
    res.json({
      success: true,
      message: 'Modules successfully added to perpetual license.',
      license: updated
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Create or renew an Annual Maintenance & Support Agreement (AMC) (Super Admin)
 * POST /api/v1/licensing/:id/maintenance
 */
router.post('/:id/maintenance', authMiddleware, requireSuperAdmin, (req: AuthenticatedRequest, res: Response): void => {
  try {
    const {
      hospitalId,
      planTier,
      slaResponseHours,
      includesUpgrades,
      includesCloudHosting,
      includesCustomDevHours,
      startDate,
      endDate,
      annualFeeInr,
      notes
    } = req.body;

    if (!startDate || !endDate || !planTier) {
      res.status(400).json({ success: false, message: 'planTier, startDate and endDate are required.' });
      return;
    }

    const licenseId = getParamId(req.params.id);
    const amc = LicenseService.createMaintenanceAgreement({
      licenseId,
      hospitalId,
      planTier: planTier as AmcPlanTier,
      slaResponseHours,
      includesUpgrades,
      includesCloudHosting,
      includesCustomDevHours,
      startDate,
      endDate,
      annualFeeInr: annualFeeInr || 0,
      notes
    });

    res.status(201).json({
      success: true,
      message: 'Maintenance & Support Agreement (AMC) registered successfully.',
      agreement: amc
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Transfer license to another hospital entity (Super Admin)
 * POST /api/v1/licensing/:id/transfer
 */
router.post('/:id/transfer', authMiddleware, requireSuperAdmin, (req: AuthenticatedRequest, res: Response): void => {
  try {
    const { targetHospitalId, transferReason } = req.body;
    if (!targetHospitalId || !transferReason) {
      res.status(400).json({ success: false, message: 'targetHospitalId and transferReason are required.' });
      return;
    }

    const licenseId = getParamId(req.params.id);
    const result = LicenseService.transferLicense({
      licenseId,
      targetHospitalId,
      transferredBy: req.user?.id,
      transferReason
    });

    res.json({
      success: true,
      message: 'License transferred successfully.',
      ...result
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Administrative suspension of a license (Super Admin)
 * POST /api/v1/licensing/:id/suspend
 */
router.post('/:id/suspend', authMiddleware, requireSuperAdmin, (req: AuthenticatedRequest, res: Response): void => {
  try {
    const { reason } = req.body;
    if (!reason) {
      res.status(400).json({ success: false, message: 'Suspension reason is required.' });
      return;
    }
    const licenseId = getParamId(req.params.id);
    const suspended = LicenseService.suspendLicense(licenseId, reason, req.user?.id);
    res.json({ success: true, message: 'License suspended.', license: suspended });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Administrative reinstatement of a suspended license (Super Admin)
 * POST /api/v1/licensing/:id/reinstate
 */
router.post('/:id/reinstate', authMiddleware, requireSuperAdmin, (req: AuthenticatedRequest, res: Response): void => {
  try {
    const licenseId = getParamId(req.params.id);
    const reinstated = LicenseService.reinstateLicense(licenseId, req.user?.id);
    res.json({ success: true, message: 'License reinstated.', license: reinstated });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Create commercial sales order (Super Admin)
 * POST /api/v1/licensing/commercial/orders
 */
router.post('/commercial/orders', authMiddleware, requireSuperAdmin, (req: AuthenticatedRequest, res: Response): void => {
  try {
    const { hospitalId, licenseId, edition, licenseFeeInr, implementationFeeInr, amcFeeInr, paymentTerms, notes } = req.body;
    const order = LicenseService.createCommercialOrder({
      hospitalId,
      licenseId,
      edition: edition as SoftwareEdition,
      licenseFeeInr,
      implementationFeeInr,
      amcFeeInr,
      paymentTerms,
      notes
    });
    res.status(201).json({ success: true, order });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Record commercial payment (Super Admin)
 * POST /api/v1/licensing/commercial/payments
 */
router.post('/commercial/payments', authMiddleware, requireSuperAdmin, (req: AuthenticatedRequest, res: Response): void => {
  try {
    const { orderId, amount } = req.body;
    if (!orderId || !amount) {
      res.status(400).json({ success: false, message: 'orderId and amount are required.' });
      return;
    }
    const updatedOrder = LicenseService.recordPayment(orderId, amount);
    res.json({ success: true, message: 'Payment recorded.', order: updatedOrder });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * View licensing audit trail (Super Admin)
 * GET /api/v1/licensing/audit-trail
 */
router.get('/audit-trail', authMiddleware, requireSuperAdmin, (req: AuthenticatedRequest, res: Response): void => {
  const licenseId = req.query.licenseId as string | undefined;
  const logs = LicenseService.getAuditLogs(licenseId);
  res.json({ success: true, count: logs.length, logs });
});

// ============================================================================
// HOSPITAL ADMIN ENDPOINTS (TENANT LICENSE & AMC MANAGEMENT)
// ============================================================================

/**
 * Hospital Admin views their active license, modules, capacity and AMC
 * GET /api/v1/licensing/my-license
 */
router.get('/my-license', authMiddleware, (req: AuthenticatedRequest, res: Response): void => {
  const hospitalId = (req.hospitalId || req.user?.hospitalId) as string;
  if (!hospitalId) {
    res.status(400).json({ success: false, message: 'Hospital context is required.' });
    return;
  }

  const { license, maintenanceAgreements } = LicenseService.getHospitalLicense(hospitalId);
  if (!license) {
    res.status(404).json({ success: false, message: 'No license record found for your hospital.' });
    return;
  }

  res.json({
    success: true,
    license: {
      licenseNumber: license.license_number,
      edition: license.edition,
      licenseType: license.license_type,
      status: license.status,
      deploymentModel: license.deployment_model,
      licensedModules: license.licensed_modules,
      authorizedLocations: license.authorized_locations,
      authorizedInstallations: license.authorized_installations,
      maxBeds: license.max_beds,
      maxDoctors: license.max_doctors,
      maxActiveUsers: license.max_active_users,
      issuedAt: license.issued_at,
      activatedAt: license.activated_at
    },
    maintenanceAgreements
  });
});

/**
 * Check software upgrade eligibility based on AMC
 * GET /api/v1/licensing/my-license/upgrade-check
 */
router.get('/my-license/upgrade-check', authMiddleware, (req: AuthenticatedRequest, res: Response): void => {
  const hospitalId = (req.hospitalId || req.user?.hospitalId) as string;
  if (!hospitalId) {
    res.status(400).json({ success: false, message: 'Hospital context is required.' });
    return;
  }

  const eligibility = LicenseService.checkUpgradeEligibility(hospitalId);
  res.json({ success: true, ...eligibility });
});

// ============================================================================
// PUBLIC / OFFLINE VERIFICATION ENDPOINT
// ============================================================================

/**
 * Cryptographically verify an offline claims token (.asrtalic file contents)
 * POST /api/v1/licensing/verify-claim
 */
router.post('/verify-claim', (req: AuthenticatedRequest, res: Response): void => {
  const { token } = req.body;
  if (!token) {
    res.status(400).json({ success: false, message: 'Claims token is required.' });
    return;
  }

  const result = LicenseService.verifyClaimsToken(token);
  if (!result.valid) {
    res.status(400).json(result);
    return;
  }

  res.json({
    success: true,
    message: 'Cryptographic digital signature verified. Claim is authentic and untampered.',
    claims: result.claims
  });
});

export const licensingRouter = router;
