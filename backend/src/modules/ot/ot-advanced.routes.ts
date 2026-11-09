import { Router, Request, Response } from 'express';
import { otAdvancedService } from './ot-advanced.service';

const router = Router();

// 1. OT Theatres
router.post('/theatres', async (req: Request, res: Response) => {
  try {
    const theatre = await otAdvancedService.registerTheatre(req.body);
    res.status(201).json({ status: 'success', data: theatre });
  } catch (err: any) {
    res.status(400).json({ status: 'error', message: err.message });
  }
});

router.get('/theatres', async (req: Request, res: Response) => {
  try {
    const hospitalId = (req.query.hospitalId as string) || (req.headers['x-hospital-id'] as string) || 'hosp-apex-001';
    const theatres = await otAdvancedService.getTheatres(hospitalId);
    res.json({ status: 'success', data: theatres });
  } catch (err: any) {
    res.status(400).json({ status: 'error', message: err.message });
  }
});

// 2. Surgery Requests
router.post('/requests', async (req: Request, res: Response) => {
  try {
    const request = await otAdvancedService.createSurgeryRequest(req.body);
    res.status(201).json({ status: 'success', data: request });
  } catch (err: any) {
    res.status(400).json({ status: 'error', message: err.message });
  }
});

// 3. Multi-Resource Conflict Scheduling
router.post('/schedules', async (req: Request, res: Response) => {
  try {
    const schedule = await otAdvancedService.scheduleSurgery(req.body);
    res.status(201).json({ status: 'success', data: schedule });
  } catch (err: any) {
    res.status(409).json({ status: 'error', message: err.message });
  }
});

// 4. Preoperative Assessment & PAC
router.post('/preop-assessments', async (req: Request, res: Response) => {
  try {
    const assessment = await otAdvancedService.recordPreopAssessment(req.body);
    res.status(201).json({ status: 'success', data: assessment });
  } catch (err: any) {
    res.status(400).json({ status: 'error', message: err.message });
  }
});

// 5. Informed Consent
router.post('/consents', async (req: Request, res: Response) => {
  try {
    const consent = await otAdvancedService.recordSurgicalConsent(req.body);
    res.status(201).json({ status: 'success', data: consent });
  } catch (err: any) {
    res.status(400).json({ status: 'error', message: err.message });
  }
});

// 6. WHO Surgical Safety Checklist
router.post('/who-checklist', async (req: Request, res: Response) => {
  try {
    const checklist = await otAdvancedService.recordWhoChecklistPhase(req.body);
    res.json({ status: 'success', data: checklist });
  } catch (err: any) {
    res.status(400).json({ status: 'error', message: err.message });
  }
});

// 7. Anaesthesia Record & Intraoperative Vitals
router.post('/anaesthesia', async (req: Request, res: Response) => {
  try {
    const record = await otAdvancedService.recordAnaesthesia(req.body);
    res.status(201).json({ status: 'success', data: record });
  } catch (err: any) {
    res.status(400).json({ status: 'error', message: err.message });
  }
});

router.post('/intraop-vitals', async (req: Request, res: Response) => {
  try {
    const log = await otAdvancedService.logIntraopVitals(req.body);
    res.status(201).json({ status: 'success', data: log });
  } catch (err: any) {
    res.status(400).json({ status: 'error', message: err.message });
  }
});

// 8. Surgical Counts (Sponges, Sharps, Instruments)
router.post('/surgical-counts', async (req: Request, res: Response) => {
  try {
    const count = await otAdvancedService.reconcileSurgicalCount(req.body);
    res.status(201).json({ status: 'success', data: count });
  } catch (err: any) {
    res.status(400).json({ status: 'error', message: err.message });
  }
});

// 9. PACU & Aldrete Recovery Scoring
router.post('/pacu/admit', async (req: Request, res: Response) => {
  try {
    const pacu = await otAdvancedService.admitToPacu(req.body);
    res.status(201).json({ status: 'success', data: pacu });
  } catch (err: any) {
    res.status(400).json({ status: 'error', message: err.message });
  }
});

router.post('/pacu/aldrete-score', async (req: Request, res: Response) => {
  try {
    const score = await otAdvancedService.evaluateAldreteScore(req.body);
    res.status(201).json({ status: 'success', data: score });
  } catch (err: any) {
    res.status(400).json({ status: 'error', message: err.message });
  }
});

router.post('/pacu/discharge', async (req: Request, res: Response) => {
  try {
    const discharge = await otAdvancedService.dischargeFromPacu(req.body);
    res.json({ status: 'success', data: discharge });
  } catch (err: any) {
    res.status(400).json({ status: 'error', message: err.message });
  }
});

export const otAdvancedRouter = router;

