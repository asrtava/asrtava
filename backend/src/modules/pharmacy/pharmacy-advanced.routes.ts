import { Router, Response } from 'express';
import { authMiddleware, AuthenticatedRequest } from '../../middleware/auth.middleware';
import { tenantMiddleware } from '../../middleware/tenant.middleware';
import { AdvancedPharmacyService } from './pharmacy-advanced.service';
import { logger } from '../../utils/logger';

export const advancedPharmacyRouter = Router();

advancedPharmacyRouter.use(authMiddleware);
advancedPharmacyRouter.use(tenantMiddleware);

// ============================================================
// 1. DRUG MASTER & FORMULARY MANAGEMENT
// ============================================================

advancedPharmacyRouter.get('/drugs', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const hospitalId = req.hospitalId || (req.query.hospitalId as string) || 'hosp-default';
    const search = req.query.search as string;
    const drugs = AdvancedPharmacyService.searchDrugs(hospitalId, search);
    res.status(200).json({ success: true, data: drugs });
  } catch (error: any) {
    logger.error('Failed to search drugs', { error: error.message });
    res.status(500).json({ error: error.message || 'Drug search error' });
  }
});

advancedPharmacyRouter.post('/drugs', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const hospitalId = req.hospitalId || req.body.hospitalId;
    if (!hospitalId) {
      res.status(400).json({ error: 'Hospital context required' });
      return;
    }
    const drug = AdvancedPharmacyService.registerDrug({ ...req.body, hospitalId });
    res.status(201).json({ success: true, data: drug, message: 'Drug registered in master formulary catalog' });
  } catch (error: any) {
    logger.error('Failed to register drug', { error: error.message });
    res.status(500).json({ error: error.message || 'Drug registration error' });
  }
});

// ============================================================
// 2. CLINICAL MEDICATION SAFETY CHECK
// ============================================================

advancedPharmacyRouter.post('/safety/check', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const hospitalId = req.hospitalId || req.body.hospitalId || 'hosp-default';
    const { drugsToPrescribe, patientAllergies, currentMedications } = req.body;

    if (!Array.isArray(drugsToPrescribe) || drugsToPrescribe.length === 0) {
      res.status(400).json({ error: 'drugsToPrescribe array required' });
      return;
    }

    const evaluation = AdvancedPharmacyService.evaluatePrescriptionSafety(
      hospitalId,
      drugsToPrescribe,
      patientAllergies || [],
      currentMedications || []
    );

    res.status(200).json({ success: true, data: evaluation });
  } catch (error: any) {
    logger.error('Medication safety check error', { error: error.message });
    res.status(500).json({ error: error.message || 'Safety check error' });
  }
});

// ============================================================
// 3. ELECTRONIC PRESCRIPTIONS (eRx) LIFECYCLE
// ============================================================

advancedPharmacyRouter.post('/prescriptions/sign', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const hospitalId = req.hospitalId || req.body.hospitalId;
    if (!hospitalId) {
      res.status(400).json({ error: 'Hospital context required' });
      return;
    }

    const { patientId, items, clinicalNotes, knownPatientAllergies, currentMedications, overrides } = req.body;

    if (!patientId || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: 'Missing required prescription parameters' });
      return;
    }

    const result = AdvancedPharmacyService.createAndSignPrescription({
      hospitalId,
      patientId,
      doctorId: req.user?.id || 'doc-prescriber',
      items,
      clinicalNotes,
      knownPatientAllergies,
      currentMedications,
      overrides,
    });

    if (result.status === 'BLOCKED_SAFETY_ALERT') {
      res.status(422).json({
        success: false,
        error: 'Prescription blocked by clinical safety engine. Documented clinical override required.',
        data: result,
      });
      return;
    }

    res.status(201).json({
      success: true,
      data: result,
      message: 'Prescription signed and forwarded to pharmacist verification queue',
    });
  } catch (error: any) {
    logger.error('Failed to create prescription', { error: error.message });
    res.status(500).json({ error: error.message || 'Prescription creation failure' });
  }
});

advancedPharmacyRouter.post('/prescriptions/amend', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const hospitalId = req.hospitalId || req.body.hospitalId;
    const { prescriptionId, amendmentReason, updatedItems } = req.body;

    if (!prescriptionId || !amendmentReason || !Array.isArray(updatedItems)) {
      res.status(400).json({ error: 'Missing prescription amendment parameters' });
      return;
    }

    const result = AdvancedPharmacyService.amendPrescription({
      hospitalId,
      prescriptionId,
      amendedByUserId: req.user?.id || 'doc-amender',
      amendmentReason,
      updatedItems,
    });

    res.status(200).json({
      success: true,
      data: result,
      message: 'Prescription amended successfully and new version recorded',
    });
  } catch (error: any) {
    logger.error('Failed to amend prescription', { error: error.message });
    res.status(400).json({ error: error.message || 'Prescription amendment failed' });
  }
});

// ============================================================
// 4. PHARMACIST VERIFICATION QUEUE
// ============================================================

advancedPharmacyRouter.get('/verification/queue', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const hospitalId = req.hospitalId || (req.query.hospitalId as string) || 'hosp-default';
    const queue = AdvancedPharmacyService.getVerificationQueue(hospitalId);
    res.status(200).json({ success: true, data: queue });
  } catch (error: any) {
    logger.error('Failed to get verification queue', { error: error.message });
    res.status(500).json({ error: error.message || 'Verification queue error' });
  }
});

advancedPharmacyRouter.post('/verification/review', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const hospitalId = req.hospitalId || req.body.hospitalId;
    const { prescriptionId, decision, clinicalNotes } = req.body;

    if (!prescriptionId || !decision) {
      res.status(400).json({ error: 'prescriptionId and decision required' });
      return;
    }

    const review = AdvancedPharmacyService.reviewPharmacistVerification({
      hospitalId,
      prescriptionId,
      pharmacistUserId: req.user?.id || 'pharmacist-1',
      decision,
      clinicalNotes,
    });

    res.status(200).json({
      success: true,
      data: review,
      message: 'Prescription verification recorded by clinical pharmacist',
    });
  } catch (error: any) {
    logger.error('Verification review error', { error: error.message });
    res.status(400).json({ error: error.message || 'Verification review failed' });
  }
});

// ============================================================
// 5. BATCH INVENTORY & STRICT FEFO DISPENSING
// ============================================================

advancedPharmacyRouter.post('/batches', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const hospitalId = req.hospitalId || req.body.hospitalId;
    const batch = AdvancedPharmacyService.receiveStockBatch({
      ...req.body,
      hospitalId,
      receivedByUserId: req.user?.id || 'storekeeper-1',
    });
    res.status(201).json({ success: true, data: batch, message: 'Stock batch received into pharmacy inventory' });
  } catch (error: any) {
    logger.error('Batch receipt error', { error: error.message });
    res.status(400).json({ error: error.message || 'Batch receipt failed' });
  }
});

advancedPharmacyRouter.post('/dispense/fefo', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const hospitalId = req.hospitalId || req.body.hospitalId;
    const { prescriptionId, patientId, items, customerPaymentMethod, idempotencyKey } = req.body;

    if (!patientId || !Array.isArray(items) || items.length === 0 || !idempotencyKey) {
      res.status(400).json({ error: 'Missing dispensing parameters or idempotencyKey' });
      return;
    }

    const result = AdvancedPharmacyService.dispensePrescriptionFEFO({
      hospitalId,
      prescriptionId,
      patientId,
      pharmacistUserId: req.user?.id || 'pharmacist-1',
      items,
      customerPaymentMethod,
      idempotencyKey,
    });

    res.status(201).json({
      success: true,
      data: result,
      message: 'Prescription dispensed via FEFO, decremented atomically, and posted to GL',
    });
  } catch (error: any) {
    logger.error('FEFO dispensing error', { error: error.message });
    res.status(400).json({ error: error.message || 'Dispensing failed' });
  }
});

// ============================================================
// 6. INPATIENT eMAR & NURSING INTEGRATION
// ============================================================

advancedPharmacyRouter.post('/inpatient/emar', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const hospitalId = req.hospitalId || req.body.hospitalId;
    const result = AdvancedPharmacyService.recordInpatientAdministration({
      ...req.body,
      hospitalId,
      administeringNurseId: req.user?.id || 'nurse-1',
    });
    res.status(201).json({ success: true, data: result, message: 'eMAR medication dose recorded' });
  } catch (error: any) {
    logger.warn('eMAR administration error', { error: error.message });
    res.status(400).json({ error: error.message || 'eMAR recording failure' });
  }
});

advancedPharmacyRouter.get('/inpatient/emar/:admissionId', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const hospitalId = req.hospitalId || (req.query.hospitalId as string) || 'hosp-default';
    const admissionId = Array.isArray(req.params.admissionId) ? req.params.admissionId[0] : req.params.admissionId;
    const records = AdvancedPharmacyService.getInpatientMAR(hospitalId, admissionId);
    res.status(200).json({ success: true, data: records });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'eMAR retrieval error' });
  }
});

// ============================================================
// 7. COLD CHAIN TEMPERATURE LOGGING
// ============================================================

advancedPharmacyRouter.post('/cold-chain/logs', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const hospitalId = req.hospitalId || req.body.hospitalId;
    const result = AdvancedPharmacyService.logColdChainTemperature({
      ...req.body,
      hospitalId,
      loggedByUserId: req.user?.id || 'sensor-agent',
    });
    res.status(201).json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Cold chain logging error' });
  }
});

// ============================================================
// 8. PRODUCT RECALLS
// ============================================================

advancedPharmacyRouter.post('/recalls', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const hospitalId = req.hospitalId || req.body.hospitalId;
    const result = AdvancedPharmacyService.issueProductRecall({
      ...req.body,
      hospitalId,
      authorizedByUserId: req.user?.id || 'quality-officer-1',
    });
    res.status(201).json({ success: true, data: result, message: 'Product recall registered and stock quarantined' });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Recall registration error' });
  }
});

// ============================================================
// 9. CONTROLLED SUBSTANCES & NARCOTIC VAULT
// ============================================================

advancedPharmacyRouter.post('/narcotics/transaction', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const hospitalId = req.hospitalId || req.body.hospitalId;
    const result = AdvancedPharmacyService.recordNarcoticTransaction({
      ...req.body,
      hospitalId,
      primaryCustodianUserId: req.user?.id || 'narcotic-custodian',
    });
    res.status(201).json({ success: true, data: result, message: 'Narcotic dual-custody transaction recorded' });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Narcotic transaction failed' });
  }
});

// ============================================================
// 10. PROCUREMENT & DASHBOARD TELEMETRY
// ============================================================

advancedPharmacyRouter.post('/procurement/requisitions', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const hospitalId = req.hospitalId || req.body.hospitalId;
    const result = AdvancedPharmacyService.createPurchaseRequisition({
      ...req.body,
      hospitalId,
      requestedByUserId: req.user?.id || 'storekeeper-1',
    });
    res.status(201).json({ success: true, data: result, message: 'Purchase requisition submitted' });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Requisition creation error' });
  }
});

advancedPharmacyRouter.post('/procurement/requisitions/approve', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const hospitalId = req.hospitalId || req.body.hospitalId;
    const result = AdvancedPharmacyService.approvePurchaseRequisition({
      ...req.body,
      hospitalId,
      approvedByUserId: req.user?.id || 'pharmacy-manager-1',
    });
    res.status(200).json({ success: true, data: result, message: 'Requisition approved & converted to PO' });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Requisition approval error' });
  }
});

advancedPharmacyRouter.get('/dashboard', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const hospitalId = req.hospitalId || (req.query.hospitalId as string) || 'hosp-default';
    const telemetry = AdvancedPharmacyService.getPharmacyDashboardTelemetry(hospitalId);
    res.status(200).json({ success: true, data: telemetry });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Dashboard telemetry error' });
  }
});
