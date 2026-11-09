import { Router, Request, Response } from 'express';
import { emergencyAdvancedService } from './emergency-advanced.service';

const router = Router();

// 1. Emergency Encounters
router.post('/encounters', async (req: Request, res: Response) => {
  try {
    const enc = await emergencyAdvancedService.registerEmergencyEncounter(req.body);
    res.status(201).json({ status: 'success', data: enc });
  } catch (err: any) {
    res.status(400).json({ status: 'error', message: err.message });
  }
});

// 2. ESI Triage
router.post('/triage', async (req: Request, res: Response) => {
  try {
    const triage = await emergencyAdvancedService.performTriage(req.body);
    res.status(201).json({ status: 'success', data: triage });
  } catch (err: any) {
    res.status(400).json({ status: 'error', message: err.message });
  }
});

// 3. Trauma & Code Activation
router.post('/trauma-activations', async (req: Request, res: Response) => {
  try {
    const activation = await emergencyAdvancedService.activateTraumaTeam(req.body);
    res.status(201).json({ status: 'success', data: activation });
  } catch (err: any) {
    res.status(400).json({ status: 'error', message: err.message });
  }
});

// 4. ATLS Resuscitation
router.post('/resuscitation-checklist', async (req: Request, res: Response) => {
  try {
    const checklist = await emergencyAdvancedService.recordResuscitationChecklist(req.body);
    res.status(201).json({ status: 'success', data: checklist });
  } catch (err: any) {
    res.status(400).json({ status: 'error', message: err.message });
  }
});

// 5. Emergency STAT Orders (Bypassing billing locks)
router.post('/stat-orders', async (req: Request, res: Response) => {
  try {
    const order = await emergencyAdvancedService.placeStatEmergencyOrder(req.body);
    res.status(201).json({ status: 'success', data: order });
  } catch (err: any) {
    res.status(400).json({ status: 'error', message: err.message });
  }
});

// 6. Medico-Legal Cases (MLC)
router.post('/medico-legal', async (req: Request, res: Response) => {
  try {
    const mlc = await emergencyAdvancedService.registerMedicoLegalCase(req.body);
    res.status(201).json({ status: 'success', data: mlc });
  } catch (err: any) {
    res.status(400).json({ status: 'error', message: err.message });
  }
});

// 7. Ambulance Fleet & Dispatch
router.post('/ambulances', async (req: Request, res: Response) => {
  try {
    const amb = await emergencyAdvancedService.registerAmbulance(req.body);
    res.status(201).json({ status: 'success', data: amb });
  } catch (err: any) {
    res.status(400).json({ status: 'error', message: err.message });
  }
});

router.post('/ambulances/dispatch', async (req: Request, res: Response) => {
  try {
    const dispatch = await emergencyAdvancedService.dispatchAmbulance(req.body);
    res.status(201).json({ status: 'success', data: dispatch });
  } catch (err: any) {
    res.status(400).json({ status: 'error', message: err.message });
  }
});

// 8. Mobile PCR
router.post('/ambulances/pcr', async (req: Request, res: Response) => {
  try {
    const pcr = await emergencyAdvancedService.transmitMobilePcr(req.body);
    res.status(201).json({ status: 'success', data: pcr });
  } catch (err: any) {
    res.status(400).json({ status: 'error', message: err.message });
  }
});

// 9. Observation Beds
router.post('/beds/assign', async (req: Request, res: Response) => {
  try {
    const bed = await emergencyAdvancedService.assignObservationBed(req.body);
    res.status(201).json({ status: 'success', data: bed });
  } catch (err: any) {
    res.status(400).json({ status: 'error', message: err.message });
  }
});

// 10. Dispositions
router.post('/dispositions', async (req: Request, res: Response) => {
  try {
    const disposition = await emergencyAdvancedService.recordDisposition(req.body);
    res.status(201).json({ status: 'success', data: disposition });
  } catch (err: any) {
    res.status(400).json({ status: 'error', message: err.message });
  }
});

export const emergencyAdvancedRouter = router;

