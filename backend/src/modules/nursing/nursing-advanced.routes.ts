import { Router, Response } from 'express';
import { authMiddleware, AuthenticatedRequest } from '../../middleware/auth.middleware';
import { tenantMiddleware } from '../../middleware/tenant.middleware';
import { requirePermission } from '../../middleware/permission.middleware';
import { nursingAdvancedService } from './nursing-advanced.service';

export const nursingAdvancedRouter = Router();

nursingAdvancedRouter.use(authMiddleware);
nursingAdvancedRouter.use(tenantMiddleware);

// 1. Patient Nursing Assignment
nursingAdvancedRouter.post('/assignments', requirePermission('nursing.patient_assignment.manage', 'all'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const assignment = await nursingAdvancedService.assignNurseToPatient({
      hospitalId: req.hospitalId!,
      ...req.body,
      assignedByUserId: req.user!.id,
    });
    res.status(201).json({ success: true, data: assignment, message: 'Nurse assigned to patient successfully.' });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// 2. Reassign Patient
nursingAdvancedRouter.post('/assignments/:id/reassign', requirePermission('nursing.patient_assignment.manage', 'all'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const assignmentId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { newNurseId, reason } = req.body;
    const result = await nursingAdvancedService.reassignPatient(assignmentId, newNurseId, reason);
    res.status(200).json({ success: true, data: result, message: 'Patient reassigned successfully.' });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// 3. Nurse Workload Census
nursingAdvancedRouter.get('/workload/:nurseUserId', requirePermission('nursing.patient_assignment.view', 'all'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const nurseUserId = Array.isArray(req.params.nurseUserId) ? req.params.nurseUserId[0] : req.params.nurseUserId;
    const workload = await nursingAdvancedService.getAssignedWorkload(req.hospitalId!, nurseUserId);
    res.status(200).json({ success: true, data: workload });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 4. Record Vitals & Calculate NEWS2
nursingAdvancedRouter.post('/vitals', requirePermission('nursing.observations.record', 'all'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const result = await nursingAdvancedService.recordVitalSigns({
      hospitalId: req.hospitalId!,
      recordedByNurseId: req.user!.id,
      ...req.body,
    });
    res.status(201).json({ success: true, data: result, message: 'Vitals and NEWS2 score recorded.' });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// 5. Acknowledge Vitals Alert
nursingAdvancedRouter.post('/vitals/alerts/:alertId/acknowledge', requirePermission('nursing.observations.record', 'all'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const alertId = Array.isArray(req.params.alertId) ? req.params.alertId[0] : req.params.alertId;
    const { actionNotes } = req.body;
    const alert = await nursingAdvancedService.acknowledgeVitalAlert(alertId, req.user!.id, actionNotes);
    res.status(200).json({ success: true, data: alert, message: 'Vital observation alert acknowledged.' });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// 6. Record Structured Assessment (Braden, Morse, GCS)
nursingAdvancedRouter.post('/assessments', requirePermission('nursing.assessment.create', 'all'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const assessment = await nursingAdvancedService.recordStructuredAssessment({
      hospitalId: req.hospitalId!,
      assessedByNurseId: req.user!.id,
      ...req.body,
    });
    res.status(201).json({ success: true, data: assessment, message: 'Clinical assessment and risk classification recorded.' });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// 7. Bedside eMAR Medication Administration
nursingAdvancedRouter.post('/emar/administer', requirePermission('nursing.medication.administer', 'all'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const emar = await nursingAdvancedService.administerMedicationEMAR({
      hospitalId: req.hospitalId!,
      administeringNurseId: req.user!.id,
      ...req.body,
    });
    res.status(201).json({ success: true, data: emar, message: 'Medication administration signed in eMAR.' });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// 8. Acknowledge Doctor Order
nursingAdvancedRouter.post('/doctor-orders/:orderId/acknowledge', requirePermission('nursing.orders.acknowledge', 'all'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const orderId = Array.isArray(req.params.orderId) ? req.params.orderId[0] : req.params.orderId;
    const { notes } = req.body;
    const order = await nursingAdvancedService.acknowledgeDoctorOrder(orderId, req.user!.id, notes);
    res.status(200).json({ success: true, data: order, message: 'Doctor order acknowledged.' });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// 9. Complete Doctor Order
nursingAdvancedRouter.post('/doctor-orders/:orderId/complete', requirePermission('nursing.orders.acknowledge', 'all'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const orderId = Array.isArray(req.params.orderId) ? req.params.orderId[0] : req.params.orderId;
    const { completionNotes } = req.body;
    const order = await nursingAdvancedService.completeDoctorOrder(orderId, req.user!.id, completionNotes);
    res.status(200).json({ success: true, data: order, message: 'Doctor order completed.' });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// 10. Nursing Care Plans
nursingAdvancedRouter.post('/care-plans', requirePermission('nursing.care_plan.manage', 'all'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const plan = await nursingAdvancedService.createCarePlan({
      hospitalId: req.hospitalId!,
      createdByNurseId: req.user!.id,
      ...req.body,
    });
    res.status(201).json({ success: true, data: plan, message: 'Care plan created successfully.' });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// 11. Fluid Balance Intake/Output
nursingAdvancedRouter.post('/fluid-balance', requirePermission('nursing.fluid_balance.manage', 'all'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const fluid = await nursingAdvancedService.recordFluidBalance({
      hospitalId: req.hospitalId!,
      recordedByNurseId: req.user!.id,
      ...req.body,
    });
    res.status(201).json({ success: true, data: fluid, message: 'Fluid balance recorded successfully.' });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// 12. Wound Care & Dressing Management
nursingAdvancedRouter.post('/wound-care', requirePermission('nursing.wound_care.manage', 'all'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const wound = await nursingAdvancedService.recordWoundAssessment({
      hospitalId: req.hospitalId!,
      assessedByNurseId: req.user!.id,
      ...req.body,
    });
    res.status(201).json({ success: true, data: wound, message: 'Wound assessment documented successfully.' });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// 13. Bedside Tasks
nursingAdvancedRouter.post('/tasks', requirePermission('nursing.orders.view', 'all'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const task = await nursingAdvancedService.createBedsideTask({
      hospitalId: req.hospitalId!,
      ...req.body,
    });
    res.status(201).json({ success: true, data: task, message: 'Bedside task scheduled successfully.' });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

nursingAdvancedRouter.post('/tasks/:taskId/complete', requirePermission('nursing.orders.view', 'all'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const taskId = Array.isArray(req.params.taskId) ? req.params.taskId[0] : req.params.taskId;
    const { notes } = req.body;
    const task = await nursingAdvancedService.completeBedsideTask(taskId, req.user!.id, notes);
    res.status(200).json({ success: true, data: task, message: 'Bedside task completed.' });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// 14. SBAR Shift Handover Submission & Acknowledgement
nursingAdvancedRouter.post('/sbar-handover', requirePermission('nursing.shift_handover.manage', 'all'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const handover = await nursingAdvancedService.submitSBARHandover({
      hospitalId: req.hospitalId!,
      outgoingNurseId: req.user!.id,
      ...req.body,
    });
    res.status(201).json({ success: true, data: handover, message: 'SBAR shift handover submitted.' });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

nursingAdvancedRouter.post('/sbar-handover/:id/acknowledge', requirePermission('nursing.shift_handover.manage', 'all'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const handoverId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const handover = await nursingAdvancedService.acknowledgeSBARHandover(handoverId, req.user!.id);
    res.status(200).json({ success: true, data: handover, message: 'SBAR shift handover acknowledged and signed.' });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// 15. ICU Flowsheet Telemetry
nursingAdvancedRouter.post('/icu-flowsheet', requirePermission('nursing.observations.record', 'all'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const record = await nursingAdvancedService.recordICUFlowsheet({
      hospitalId: req.hospitalId!,
      recordedByNurseId: req.user!.id,
      ...req.body,
    });
    res.status(201).json({ success: true, data: record, message: 'ICU flowsheet telemetry recorded.' });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// 16. Patient Safety Incident Reporting
nursingAdvancedRouter.post('/incidents', requirePermission('nursing.incident.create', 'all'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const incident = await nursingAdvancedService.reportSafetyIncident({
      hospitalId: req.hospitalId!,
      reportedByUserId: req.user!.id,
      ...req.body,
    });
    res.status(201).json({ success: true, data: incident, message: 'Patient safety incident recorded securely.' });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// 17. Patient Discharge Education
nursingAdvancedRouter.post('/discharge-education', requirePermission('nursing.assessment.create', 'all'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const education = await nursingAdvancedService.recordDischargeEducation({
      hospitalId: req.hospitalId!,
      educatedByNurseId: req.user!.id,
      ...req.body,
    });
    res.status(201).json({ success: true, data: education, message: 'Patient discharge education documented.' });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

