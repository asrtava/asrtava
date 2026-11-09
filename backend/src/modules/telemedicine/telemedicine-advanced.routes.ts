import { Router, Response } from 'express';
import { telemedicineAdvancedService } from './telemedicine-advanced.service';
import { authMiddleware, AuthenticatedRequest } from '../../middleware/auth.middleware';
import { tenantMiddleware } from '../../middleware/tenant.middleware';

export const telemedicineAdvancedRouter = Router();

telemedicineAdvancedRouter.use(authMiddleware);
telemedicineAdvancedRouter.use(tenantMiddleware);

// 1. Telemedicine Service Catalog
telemedicineAdvancedRouter.post('/services', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const service = await telemedicineAdvancedService.createService({
      organizationId: (req as any).organizationId || 'org-apex-01',
      hospitalId: req.hospitalId || 'hosp-apex-01',
      ...req.body,
    });
    res.status(201).json({ success: true, data: service });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

telemedicineAdvancedRouter.get('/services', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const services = await telemedicineAdvancedService.getServices(req.hospitalId || 'hosp-apex-01');
    res.json({ success: true, data: services });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 2. Doctor Discovery & Profile
telemedicineAdvancedRouter.post('/doctors/profile', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const profile = await telemedicineAdvancedService.registerDoctorProfile({
      organizationId: (req as any).organizationId || 'org-apex-01',
      hospitalId: req.hospitalId || 'hosp-apex-01',
      ...req.body,
    });
    res.status(201).json({ success: true, data: profile });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

telemedicineAdvancedRouter.get('/doctors/discovery', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { specialty, language, consultationMode } = req.query;
    const doctors = await telemedicineAdvancedService.discoverAvailableDoctors({
      hospitalId: req.hospitalId || 'hosp-apex-01',
      specialty: specialty as string,
      language: language as string,
      consultationMode: consultationMode as string,
    });
    res.json({ success: true, data: doctors });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 3. Online Appointment Booking
telemedicineAdvancedRouter.post('/appointments/book', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const appointment = await telemedicineAdvancedService.bookTeleconsultation({
      organizationId: (req as any).organizationId || 'org-apex-01',
      hospitalId: req.hospitalId || 'hosp-apex-01',
      ...req.body,
    });
    res.status(201).json({ success: true, data: appointment });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

telemedicineAdvancedRouter.post('/appointments/:id/pay', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { paymentReference, verifiedAmount } = req.body;
    const appointment = await telemedicineAdvancedService.verifyAndConfirmPayment(
      req.params.id as string,
      paymentReference,
      Number(verifiedAmount)
    );
    res.json({ success: true, data: appointment });
  } catch (err: any) {
    const status = err.message.includes('Duplicate') ? 409 : 400;
    res.status(status).json({ success: false, message: err.message });
  }
});

// 4. Consent Recording
telemedicineAdvancedRouter.post('/consent', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const consent = await telemedicineAdvancedService.recordConsent({
      organizationId: (req as any).organizationId || 'org-apex-01',
      hospitalId: req.hospitalId || 'hosp-apex-01',
      ipAddress: req.ip,
      ...req.body,
    });
    res.status(201).json({ success: true, data: consent });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// 5. Virtual Waiting Room
telemedicineAdvancedRouter.post('/waiting-room/join', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { appointmentId, patientId, deviceCheckPassed } = req.body;
    const entry = await telemedicineAdvancedService.joinWaitingRoom(
      appointmentId,
      patientId,
      deviceCheckPassed !== false
    );
    res.json({ success: true, data: entry });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

telemedicineAdvancedRouter.get('/waiting-room/:appointmentId', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const status = await telemedicineAdvancedService.getWaitingRoomStatus(req.params.appointmentId as string);
    res.json({ success: true, data: status });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 6. WebRTC Video Consultation Sessions
telemedicineAdvancedRouter.post('/sessions/start', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { appointmentId, doctorId, provider } = req.body;
    const result = await telemedicineAdvancedService.startConsultation(
      appointmentId,
      doctorId,
      provider
    );
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

telemedicineAdvancedRouter.post('/sessions/end', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { appointmentId, durationSeconds, terminationReason } = req.body;
    const session = await telemedicineAdvancedService.endConsultation(
      appointmentId,
      Number(durationSeconds || 0),
      terminationReason
    );
    res.json({ success: true, data: session });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// 7. In-Session Secure Messaging
telemedicineAdvancedRouter.post('/messages', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const msg = await telemedicineAdvancedService.sendInSessionMessage(req.body);
    res.status(201).json({ success: true, data: msg });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

telemedicineAdvancedRouter.get('/messages/:appointmentId', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const messages = await telemedicineAdvancedService.getMessages(req.params.appointmentId as string);
    res.json({ success: true, data: messages });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 8. Clinical Encounter, EMR, eRx & Referral
telemedicineAdvancedRouter.post('/clinical/encounter', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const encounter = await telemedicineAdvancedService.documentClinicalEncounter({
      organizationId: (req as any).organizationId || 'org-apex-01',
      hospitalId: req.hospitalId || 'hosp-apex-01',
      ...req.body,
    });
    res.status(201).json({ success: true, data: encounter });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// 9. Remote Patient Monitoring (RPM)
telemedicineAdvancedRouter.post('/rpm/care-plans', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const plan = await telemedicineAdvancedService.enrollCarePlan({
      organizationId: (req as any).organizationId || 'org-apex-01',
      hospitalId: req.hospitalId || 'hosp-apex-01',
      ...req.body,
    });
    res.status(201).json({ success: true, data: plan });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

telemedicineAdvancedRouter.post('/rpm/measurements', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const result = await telemedicineAdvancedService.recordRpmMeasurement({
      organizationId: (req as any).organizationId || 'org-apex-01',
      hospitalId: req.hospitalId || 'hosp-apex-01',
      ...req.body,
    });
    res.status(201).json({ success: true, data: result });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

telemedicineAdvancedRouter.post('/rpm/alerts/:id/acknowledge', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { clinicianUserId, escalationAction } = req.body;
    const alert = await telemedicineAdvancedService.acknowledgeRpmAlert(
      req.params.id as string,
      clinicianUserId || (req as any).user?.id || 'usr-doc-01',
      escalationAction
    );
    res.json({ success: true, data: alert });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// 10. Patient Education
telemedicineAdvancedRouter.post('/education/articles', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const article = await telemedicineAdvancedService.publishEducationArticle({
      organizationId: (req as any).organizationId || 'org-apex-01',
      hospitalId: req.hospitalId || 'hosp-apex-01',
      ...req.body,
    });
    res.status(201).json({ success: true, data: article });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

telemedicineAdvancedRouter.get('/education/articles', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { category } = req.query;
    const articles = await telemedicineAdvancedService.getEducationArticles(
      req.hospitalId || 'hosp-apex-01',
      category as string
    );
    res.json({ success: true, data: articles });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});
