import { Router, Response } from 'express';
import { AuthenticatedRequest, authMiddleware } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/permission.middleware';
import { FederatedCoordinationService } from './federated-coordination.service';

const router = Router();

// Apply base authentication to all federated endpoints
router.use(authMiddleware);

/**
 * GET /api/federated-network/participating-hospitals
 * Discover participating hospitals and published capabilities (trauma, transplant, blood bank)
 */
router.get('/participating-hospitals', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { city, state, capability } = req.query as {
      city?: string;
      state?: string;
      capability?: 'organTransplant' | 'level1Trauma' | 'bloodBank' | 'icuCapacity';
    };
    const hospitals = FederatedCoordinationService.listParticipatingHospitals({ city, state, capability });
    res.json({ success: true, count: hospitals.length, data: hospitals });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/federated-network/bed-availability/publish
 * Publish active bed/ICU/ventilator capacity
 */
router.post('/bed-availability/publish', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const hospitalId = req.user?.hospital_id;
    if (!hospitalId) {
      res.status(403).json({ success: false, message: 'Missing tenant context.' });
      return;
    }

    const { generalWardVacant, icuBedsVacant, ventilatorBedsVacant, emergencyResusBaysVacant, otEmergencySlotsVacant, ttlMinutes, notes } = req.body;
    const ttl = ttlMinutes || 120;
    const expiresAt = new Date(Date.now() + ttl * 60 * 1000).toISOString();

    const record = FederatedCoordinationService.publishBedAvailability({
      hospitalId,
      generalWardVacant: Number(generalWardVacant) || 0,
      icuBedsVacant: Number(icuBedsVacant) || 0,
      ventilatorBedsVacant: Number(ventilatorBedsVacant) || 0,
      emergencyResusBaysVacant: Number(emergencyResusBaysVacant) || 0,
      otEmergencySlotsVacant: Number(otEmergencySlotsVacant) || 0,
      verifiedByUserId: req.user!.id,
      expiresAt,
      notes,
    });

    res.json({ success: true, message: 'Bed availability successfully published to coordination network.', data: record });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/federated-network/bed-availability
 * Query current active bed availability across participating hospitals
 */
router.get('/bed-availability', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const reports = FederatedCoordinationService.queryActiveBedAvailability();
    res.json({ success: true, count: reports.length, data: reports });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/federated-network/coordination-requests
 * Create an inter-hospital coordination request (transplant, emergency transfer, blood, specialist)
 */
router.post('/coordination-requests', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const hospitalId = req.user?.hospital_id;
    if (!hospitalId) {
      res.status(403).json({ success: false, message: 'Missing tenant context.' });
      return;
    }

    const { requestType, receivingHospitalId, urgencyLevel, purposeStatement, clinicalSummary, consentType, ttlMinutes } = req.body;

    const request = FederatedCoordinationService.createCoordinationRequest({
      requestType,
      requestingHospitalId: hospitalId,
      receivingHospitalId,
      requestingUserId: req.user!.id,
      requestingUserRole: req.user!.role,
      urgencyLevel: urgencyLevel || 'urgent',
      purposeStatement,
      clinicalSummary,
      consentType,
      ttlMinutes,
    });

    res.status(201).json({ success: true, message: 'Coordination request submitted successfully.', data: request });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/federated-network/organ-transplant/initiate-case
 * Initiate NOTTO/SOTTO compliant organ donor coordination
 */
router.post('/organ-transplant/initiate-case', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const hospitalId = req.user?.hospital_id;
    if (!hospitalId) {
      res.status(403).json({ success: false, message: 'Missing tenant context.' });
      return;
    }

    const {
      coordinationRequestId,
      donorType,
      donorBloodGroup,
      donorAgeApprox,
      donorGender,
      brainDeathFirstApneaTestAt,
      brainDeathSecondApneaTestAt,
      brainDeathBoardCertified,
      form8LegalDeclarationSigned,
      organsAuthorized,
      sottoCaseReference,
      nottoRegistryReference,
      nonCommercialAffidavitHash,
    } = req.body;

    const txCase = FederatedCoordinationService.initiateOrganDonorCase({
      coordinationRequestId,
      donorHospitalId: hospitalId,
      donorType,
      donorBloodGroup,
      donorAgeApprox: Number(donorAgeApprox),
      donorGender,
      brainDeathFirstApneaTestAt,
      brainDeathSecondApneaTestAt,
      brainDeathBoardCertified: Boolean(brainDeathBoardCertified),
      form8LegalDeclarationSigned: Boolean(form8LegalDeclarationSigned),
      organsAuthorized: organsAuthorized || [],
      sottoCaseReference,
      nottoRegistryReference,
      nonCommercialAffidavitHash,
      actingUserId: req.user!.id,
      actingUserRole: req.user!.role,
    });

    res.status(201).json({
      success: true,
      message: 'Organ donor coordination case registered. SOTTO notified; allocation remains strictly under official authority.',
      data: txCase,
    });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/federated-network/emergency-transfer/initiate
 * Initiate emergency transfer with minimum necessary clinical payload
 */
router.post('/emergency-transfer/initiate', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const hospitalId = req.user?.hospital_id;
    if (!hospitalId) {
      res.status(403).json({ success: false, message: 'Missing tenant context.' });
      return;
    }

    const {
      coordinationRequestId,
      destinationHospitalId,
      patientUhidPseudonym,
      patientAge,
      patientGender,
      triageLevel,
      provisionalDiagnosis,
      minimumClinicalPayload,
      ambulanceType,
      ambulanceCallSign,
      paramedicInCharge,
      paramedicContactPhone,
    } = req.body;

    const transferCase = FederatedCoordinationService.initiateEmergencyTransfer({
      coordinationRequestId,
      originHospitalId: hospitalId,
      destinationHospitalId,
      patientUhidPseudonym,
      patientAge: Number(patientAge),
      patientGender,
      triageLevel,
      provisionalDiagnosis,
      minimumClinicalPayload,
      ambulanceType: ambulanceType || 'ALS_ADVANCED_LIFE_SUPPORT',
      ambulanceCallSign,
      paramedicInCharge,
      paramedicContactPhone,
      actingUserId: req.user!.id,
      actingUserRole: req.user!.role,
    });

    res.status(201).json({
      success: true,
      message: 'Emergency patient transfer initiated. Destination hospital receiving team alerted.',
      data: transferCase,
    });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/federated-network/case-share/issue-token
 * Issue an ephemeral, time-limited token for a single diagnostic report or scan
 */
router.post('/case-share/issue-token', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const hospitalId = req.user?.hospital_id;
    if (!hospitalId) {
      res.status(403).json({ success: false, message: 'Missing tenant context.' });
      return;
    }

    const { coordinationRequestId, destinationHospitalId, resourceType, resourceId, resourceTitle, ttlHours } = req.body;

    const share = FederatedCoordinationService.createCaseBasedDataShare({
      coordinationRequestId,
      originHospitalId: hospitalId,
      destinationHospitalId,
      resourceType,
      resourceId,
      resourceTitle,
      ttlHours: Number(ttlHours) || 8,
      actingUserId: req.user!.id,
      actingUserRole: req.user!.role,
    });

    res.status(201).json({ success: true, message: 'Ephemeral case-share token issued.', data: share });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/federated-network/case-share/access/:token
 * Access an authorized diagnostic case report using bearer token
 */
router.get('/case-share/access/:token', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const hospitalId = req.user?.hospital_id;
    if (!hospitalId) {
      res.status(403).json({ success: false, message: 'Missing tenant context.' });
      return;
    }

    const { token } = req.params;
    const share = FederatedCoordinationService.accessSharedResource({
      token,
      requestingHospitalId: hospitalId,
      requestingUserId: req.user!.id,
      requestingUserRole: req.user!.role,
    });

    res.json({ success: true, message: 'Authorized case share retrieved.', data: share });
  } catch (err: any) {
    res.status(403).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/federated-network/audit-trail
 * Retrieve immutable coordination audit trail for the tenant
 */
router.get('/audit-trail', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const hospitalId = req.user?.hospital_id;
    if (!hospitalId) {
      res.status(403).json({ success: false, message: 'Missing tenant context.' });
      return;
    }

    const audit = FederatedCoordinationService.getAuditTrail(hospitalId);
    res.json({ success: true, count: audit.length, data: audit });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
