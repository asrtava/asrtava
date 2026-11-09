import { Router, Request, Response } from 'express';
import { wardAdvancedService } from './ward-advanced.service';

const router = Router();

// 1. Hospital Infrastructure Hierarchy
router.post('/buildings', async (req: Request, res: Response) => {
  try {
    const bldg = await wardAdvancedService.createBuilding(req.body);
    res.status(201).json({ status: 'success', data: bldg });
  } catch (err: any) {
    res.status(400).json({ status: 'error', message: err.message });
  }
});

router.post('/floors', async (req: Request, res: Response) => {
  try {
    const flr = await wardAdvancedService.createFloor(req.body);
    res.status(201).json({ status: 'success', data: flr });
  } catch (err: any) {
    res.status(400).json({ status: 'error', message: err.message });
  }
});

router.post('/departments', async (req: Request, res: Response) => {
  try {
    const dept = await wardAdvancedService.createDepartment(req.body);
    res.status(201).json({ status: 'success', data: dept });
  } catch (err: any) {
    res.status(400).json({ status: 'error', message: err.message });
  }
});

router.post('/units', async (req: Request, res: Response) => {
  try {
    const unit = await wardAdvancedService.createWardUnit(req.body);
    res.status(201).json({ status: 'success', data: unit });
  } catch (err: any) {
    res.status(400).json({ status: 'error', message: err.message });
  }
});

router.post('/rooms', async (req: Request, res: Response) => {
  try {
    const room = await wardAdvancedService.createRoom(req.body);
    res.status(201).json({ status: 'success', data: room });
  } catch (err: any) {
    res.status(400).json({ status: 'error', message: err.message });
  }
});

router.post('/beds', async (req: Request, res: Response) => {
  try {
    const bed = await wardAdvancedService.createBed(req.body);
    res.status(201).json({ status: 'success', data: bed });
  } catch (err: any) {
    res.status(400).json({ status: 'error', message: err.message });
  }
});

// 2. Real-Time Bed Availability Dashboard
router.get('/beds/availability', async (req: Request, res: Response) => {
  try {
    const hospitalId = (req.query.hospitalId as string) || (req.headers['x-hospital-id'] as string) || 'hosp-apex-001';
    const grid = await wardAdvancedService.getBedAvailabilityGrid(hospitalId);
    res.json({ status: 'success', data: grid });
  } catch (err: any) {
    res.status(400).json({ status: 'error', message: err.message });
  }
});

// 3. Admission Requests
router.post('/admission-requests', async (req: Request, res: Response) => {
  try {
    const reqItem = await wardAdvancedService.createAdmissionRequest(req.body);
    res.status(201).json({ status: 'success', data: reqItem });
  } catch (err: any) {
    res.status(400).json({ status: 'error', message: err.message });
  }
});

router.post('/admission-requests/:id/triage', async (req: Request, res: Response) => {
  try {
    const { status, reviewerUserId } = req.body;
    const reqItem = await wardAdvancedService.triageAdmissionRequest(req.params.id as string, status, reviewerUserId);
    res.json({ status: 'success', data: reqItem });
  } catch (err: any) {
    res.status(400).json({ status: 'error', message: err.message });
  }
});

// 4. Bed Reservations
router.post('/beds/reserve', async (req: Request, res: Response) => {
  try {
    const resv = await wardAdvancedService.reserveBed(req.body);
    res.status(201).json({ status: 'success', data: resv });
  } catch (err: any) {
    res.status(409).json({ status: 'error', message: err.message });
  }
});

// 5. Patient IPD Admission
router.post('/admissions', async (req: Request, res: Response) => {
  try {
    const adm = await wardAdvancedService.formalizeAdmission(req.body);
    res.status(201).json({ status: 'success', data: adm });
  } catch (err: any) {
    res.status(409).json({ status: 'error', message: err.message });
  }
});

// 6. Patient Bed Transfers
router.post('/transfers', async (req: Request, res: Response) => {
  try {
    const tx = await wardAdvancedService.transferPatientBed(req.body);
    res.status(201).json({ status: 'success', data: tx });
  } catch (err: any) {
    res.status(409).json({ status: 'error', message: err.message });
  }
});

// 7. Housekeeping & Inspections
router.post('/housekeeping/tasks', async (req: Request, res: Response) => {
  try {
    const task = await wardAdvancedService.createHousekeepingTask(req.body);
    res.status(201).json({ status: 'success', data: task });
  } catch (err: any) {
    res.status(400).json({ status: 'error', message: err.message });
  }
});

router.post('/housekeeping/tasks/:id/start', async (req: Request, res: Response) => {
  try {
    const task = await wardAdvancedService.startCleaningTask(req.params.id as string, req.body.staffId);
    res.json({ status: 'success', data: task });
  } catch (err: any) {
    res.status(400).json({ status: 'error', message: err.message });
  }
});

router.post('/housekeeping/tasks/:id/complete', async (req: Request, res: Response) => {
  try {
    const task = await wardAdvancedService.completeCleaningTask(req.params.id as string, req.body.cleaningNotes);
    res.json({ status: 'success', data: task });
  } catch (err: any) {
    res.status(400).json({ status: 'error', message: err.message });
  }
});

router.post('/housekeeping/inspect', async (req: Request, res: Response) => {
  try {
    const inspection = await wardAdvancedService.inspectAndReleaseBed(req.body);
    res.json({ status: 'success', data: inspection });
  } catch (err: any) {
    res.status(400).json({ status: 'error', message: err.message });
  }
});

// 8. Discharge Planning & Clinical Discharge
router.post('/discharge-plan', async (req: Request, res: Response) => {
  try {
    const plan = await wardAdvancedService.upsertDischargePlan(req.body);
    res.json({ status: 'success', data: plan });
  } catch (err: any) {
    res.status(400).json({ status: 'error', message: err.message });
  }
});

router.post('/discharge/execute', async (req: Request, res: Response) => {
  try {
    const discharge = await wardAdvancedService.executeClinicalDischarge(req.body);
    res.json({ status: 'success', data: discharge });
  } catch (err: any) {
    res.status(400).json({ status: 'error', message: err.message });
  }
});

// 9. Visitor Passes
router.post('/visitors/passes', async (req: Request, res: Response) => {
  try {
    const pass = await wardAdvancedService.issueVisitorPass(req.body);
    res.status(201).json({ status: 'success', data: pass });
  } catch (err: any) {
    res.status(400).json({ status: 'error', message: err.message });
  }
});

export const wardAdvancedRouter = router;
