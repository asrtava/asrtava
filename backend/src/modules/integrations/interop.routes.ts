import { Router, Response } from 'express';
import { authMiddleware, AuthenticatedRequest } from '../../middleware/auth.middleware';
import { tenantMiddleware } from '../../middleware/tenant.middleware';
import { InteroperabilityEngineService } from './interop.service';
import { FHIRService } from './providers/adapters/fhir.service';
import { HL7Service } from './providers/adapters/hl7.service';

export const interopRouter = Router();

// ============================================================
// 1. PUBLIC HL7 & FHIR METADATA GATEWAYS (No Token for MLLP/Bridge)
// ============================================================

// FHIR R4 CapabilityStatement ($metadata)
interopRouter.get('/fhir/\\$metadata', (_req, res: Response): void => {
  const capability = InteroperabilityEngineService.getCapabilityStatement();
  res.setHeader('Content-Type', 'application/fhir+json');
  res.status(200).json(capability);
});

// Inbound HL7 v2 Message Ingest (Receives raw HL7 text, returns standard ACK)
interopRouter.post('/hl7/ingest', async (req, res: Response): Promise<void> => {
  try {
    const rawHL7 = typeof req.body === 'string' ? req.body : req.body.rawHL7 || req.body.message;
    const hospitalId = (req.headers['x-hospital-id'] as string) || req.body.hospitalId || 'hosp-default';

    if (!rawHL7) {
      res.status(400).send(InteroperabilityEngineService.generateACK('UNKNOWN', 'AR', 'Empty payload'));
      return;
    }

    const result = InteroperabilityEngineService.processInboundHL7(rawHL7, hospitalId);
    
    // Set response headers for HL7 MLLP over HTTP
    res.setHeader('Content-Type', 'text/plain');
    if (result.isDuplicate) {
      res.status(409).send(result.ack);
      return;
    }

    res.status(200).send(result.ack);
  } catch (err: any) {
    const errorAck = InteroperabilityEngineService.generateACK('ERROR', 'AE', err.message);
    res.setHeader('Content-Type', 'text/plain');
    res.status(400).send(errorAck);
  }
});

// Outbound HL7 ORU^R01 Builder
interopRouter.post('/hl7/generate', (req, res: Response): void => {
  try {
    const hl7Message = HL7Service.buildORUMessage(req.body);
    res.setHeader('Content-Type', 'text/plain');
    res.status(200).send(hl7Message);
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ============================================================
// 2. AUTHENTICATED & TENANT-AWARE INTEROPERABILITY API
// ============================================================
interopRouter.use(authMiddleware);
interopRouter.use(tenantMiddleware);

// --- FHIR R4 RESTFUL API GATEWAY ---

// FHIR Resource Search / Read
interopRouter.get('/fhir/:resourceType', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const resourceType = String(req.params.resourceType);

  try {
    if (resourceType === 'Patient') {
      const mockPatient = FHIRService.toFHIRPatient({
        id: 'pat-2026-001',
        uhid: 'UHID-2026-001',
        firstName: 'Rahul',
        lastName: 'Sharma',
        gender: 'male',
        dateOfBirth: '1988-04-12',
        phone: '+919876543210',
        abhaId: 'rahul.sharma@abdm',
      });
      const bundle = InteroperabilityEngineService.createBundle([mockPatient], 'searchset');
      res.setHeader('Content-Type', 'application/fhir+json');
      res.json(bundle);
      return;
    }

    if (resourceType === 'Observation') {
      const mockObs = FHIRService.toFHIRObservation({
        id: 'obs-2026-001',
        patientId: 'pat-2026-001',
        patientUhid: 'UHID-2026-001',
        code: '6690-2',
        display: 'Leukocytes [#/volume] in Blood',
        value: 7.4,
        unit: '10^3/uL',
        referenceRangeLow: 4.0,
        referenceRangeHigh: 11.0,
        effectiveDateTime: new Date().toISOString(),
      });
      const bundle = InteroperabilityEngineService.createBundle([mockObs], 'searchset');
      res.setHeader('Content-Type', 'application/fhir+json');
      res.json(bundle);
      return;
    }

    if (resourceType === 'Encounter') {
      const mockEnc = InteroperabilityEngineService.toFHIREncounter({
        id: 'enc-2026-001',
        patientId: 'pat-2026-001',
        doctorName: 'Dr. Priya Mehta',
        status: 'COMPLETED',
        visitType: 'OPD',
        chiefComplaint: 'Acute chest discomfort',
        admitDate: new Date().toISOString(),
      });
      const bundle = InteroperabilityEngineService.createBundle([mockEnc], 'searchset');
      res.setHeader('Content-Type', 'application/fhir+json');
      res.json(bundle);
      return;
    }

    // Default searchset bundle for other standard resources
    const emptyBundle = InteroperabilityEngineService.createBundle([], 'searchset', 0);
    res.setHeader('Content-Type', 'application/fhir+json');
    res.json(emptyBundle);
  } catch (err: any) {
    const outcome = InteroperabilityEngineService.createOperationOutcome('error', 'processing', err.message);
    res.status(500).setHeader('Content-Type', 'application/fhir+json').json(outcome);
  }
});

// FHIR Resource Read by ID
interopRouter.get('/fhir/:resourceType/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const resourceType = String(req.params.resourceType);
  const id = String(req.params.id);

  if (resourceType === 'Patient') {
    const patient = FHIRService.toFHIRPatient({
      id,
      uhid: `UHID-${id.slice(-6).toUpperCase()}`,
      firstName: 'Kavita',
      lastName: 'Nair',
      gender: 'female',
      dateOfBirth: '1992-08-24',
      phone: '+919812345678',
    });
    res.setHeader('Content-Type', 'application/fhir+json');
    res.json(patient);
    return;
  }

  const outcome = InteroperabilityEngineService.createOperationOutcome('error', 'not-found', `${resourceType}/${id} not found`);
  res.status(404).setHeader('Content-Type', 'application/fhir+json').json(outcome);
});

// --- DICOM & PACS / MODALITY WORKLIST ---

// Ingest & Parse DICOM Study Metadata
interopRouter.post('/dicom/metadata-ingest', (req: AuthenticatedRequest, res: Response): void => {
  try {
    const parsed = InteroperabilityEngineService.parseDICOMMetadata(req.body);
    res.json({ success: true, data: parsed });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Query Modality Worklist (MWL) for Scanners
interopRouter.get('/dicom/mwl', (req: AuthenticatedRequest, res: Response): void => {
  const stationAet = (req.query.stationAet as string) || 'CT_SCANNER_01';
  const modality = req.query.modality as string | undefined;
  const date = req.query.date as string | undefined;

  const worklist = InteroperabilityEngineService.queryModalityWorklist(stationAet, modality, date);
  res.json({ success: true, count: worklist.length, data: worklist });
});

// Reconcile Ambiguous Imaging Study
interopRouter.post('/dicom/reconciliation', (req: AuthenticatedRequest, res: Response): void => {
  try {
    const { studyInstanceUid, patientId, orderId, justificationNotes } = req.body;
    const reconciled = InteroperabilityEngineService.reconcileAmbiguousStudy(
      studyInstanceUid,
      patientId,
      orderId,
      req.user!.id,
      justificationNotes
    );
    res.json({ success: true, data: reconciled });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// --- MEDICAL DEVICES & LIS ANALYZERS ---

// List Registered Medical Devices
interopRouter.get('/devices', (req: AuthenticatedRequest, res: Response): void => {
  res.json({
    success: true,
    data: [
      {
        id: 'dev-001',
        deviceName: 'Sysmex XN-1000 Automated Hematology Analyzer',
        deviceModel: 'XN-1000',
        manufacturer: 'Sysmex Corporation',
        serialNumber: 'XN1000-IND-8821',
        category: 'hematology_analyzer',
        protocol: 'astm_1394',
        ipAddress: '192.168.10.45',
        port: 5000,
        status: 'active',
        lastCommunicationAt: new Date().toISOString(),
      },
      {
        id: 'dev-002',
        deviceName: 'Roche Cobas c311 Clinical Chemistry System',
        deviceModel: 'Cobas c311',
        manufacturer: 'Roche Diagnostics',
        serialNumber: 'COB311-IND-4412',
        category: 'biochemistry_analyzer',
        protocol: 'hl7_v2',
        ipAddress: '192.168.10.46',
        port: 5001,
        status: 'active',
        lastCommunicationAt: new Date().toISOString(),
      },
      {
        id: 'dev-003',
        deviceName: 'Mindray BeneVision N12 Patient Monitor',
        deviceModel: 'BeneVision N12',
        manufacturer: 'Mindray',
        serialNumber: 'MN-N12-2026-90',
        category: 'patient_vital_monitor',
        protocol: 'tcp_socket',
        ipAddress: '192.168.10.88',
        port: 8080,
        status: 'active',
        lastCommunicationAt: new Date().toISOString(),
      },
    ],
  });
});

// Ingest Medical Device Telemetry (ASTM 1394 or HL7)
interopRouter.post('/devices/telemetry', (req: AuthenticatedRequest, res: Response): void => {
  try {
    const { format, rawPacket, packetId } = req.body;
    let results: any[] = [];

    if (format === 'astm_1394') {
      results = InteroperabilityEngineService.parseASTM1394(rawPacket);
    } else {
      const parsedHL7 = InteroperabilityEngineService.parseHL7(rawPacket);
      results = (parsedHL7.obxs || []).map((o) => ({
        specimenBarcode: parsedHL7.obrs?.[0]?.placerOrderNumber || 'SPEC-001',
        testCode: o.observationIdentifier,
        analyteName: o.observationIdentifier,
        observedValue: o.observationValue,
        units: o.units,
        referenceRange: o.referenceRange,
        abnormalFlag: o.abnormalFlags === 'C' ? 'CRITICAL' : o.abnormalFlags === 'H' ? 'HIGH' : o.abnormalFlags === 'L' ? 'LOW' : 'NORMAL',
        status: o.resultStatus,
      }));
    }

    const verification = InteroperabilityEngineService.verifyDeviceResults(
      packetId || `pkt-${Date.now()}`,
      results
    );

    res.json({ success: true, count: results.length, data: verification });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Pathologist / Lab Technician Approval Gate
interopRouter.post('/devices/results/:packetId/approve', (req: AuthenticatedRequest, res: Response): void => {
  try {
    const packetId = String(req.params.packetId);
    const { results } = req.body;
    const approval = InteroperabilityEngineService.verifyDeviceResults(
      packetId,
      results || [],
      req.user!.id
    );

    res.json({ success: true, data: approval });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// --- CLINICAL TERMINOLOGY MAPPING ---

// Translate Clinical Code
interopRouter.post('/terminology/map', (req: AuthenticatedRequest, res: Response): void => {
  try {
    const { sourceSystem, sourceCode, targetSystem } = req.body;
    const mapped = InteroperabilityEngineService.mapTerminology(
      sourceSystem,
      sourceCode,
      targetSystem
    );
    res.json({ success: true, data: mapped });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// --- INSURANCE & CLAIMS (NHCX) ---

// Submit Pre-Authorization Request
interopRouter.post('/insurance/preauth', (req: AuthenticatedRequest, res: Response): void => {
  try {
    const preauth = InteroperabilityEngineService.submitPreauthorization(req.body);
    res.json({ success: true, data: preauth });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Submit Claim Filing
interopRouter.post('/insurance/claims', (req: AuthenticatedRequest, res: Response): void => {
  try {
    const claim = InteroperabilityEngineService.submitClaimFiling(req.body);
    res.json({ success: true, data: claim });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// --- ABDM SIMULATOR ---
interopRouter.post('/abdm/simulate', (req: AuthenticatedRequest, res: Response): void => {
  try {
    const { milestone, identifier } = req.body;
    const result = InteroperabilityEngineService.simulateABDMEvent(
      req.hospitalId!,
      milestone,
      identifier
    );
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// --- DEAD-LETTER QUEUE (DLQ) & RECOVERY ---

// List DLQ Records
interopRouter.get('/dlq', (req: AuthenticatedRequest, res: Response): void => {
  const jobs = InteroperabilityEngineService.getDLQJobs(req.hospitalId || undefined);
  res.json({ success: true, count: jobs.length, data: jobs });
});

// Replay DLQ Item
interopRouter.post('/dlq/:id/replay', (req: AuthenticatedRequest, res: Response): void => {
  try {
    const id = String(req.params.id);
    const result = InteroperabilityEngineService.replayDLQJob(id, req.user!.id);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// --- OPERATIONAL TELEMETRY ---
interopRouter.get('/telemetry', (req: AuthenticatedRequest, res: Response): void => {
  const telemetry = InteroperabilityEngineService.getOperationsTelemetry(req.hospitalId || undefined);
  res.json({ success: true, data: telemetry });
});
