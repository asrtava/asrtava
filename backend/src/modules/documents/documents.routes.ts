import { Router, Response } from 'express';
import { db } from '../../database';
import { authMiddleware, AuthenticatedRequest } from '../../middleware/auth.middleware';
import { tenantMiddleware } from '../../middleware/tenant.middleware';
import { requirePermission } from '../../middleware/permission.middleware';

export const documentsRouter = Router();

documentsRouter.use(authMiddleware);

// 1. Upload Document Metadata (File uploaded to Secure Object Storage)
documentsRouter.post('/', tenantMiddleware, requirePermission('create', 'all'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { patientId, documentType, title, filePath, mimeType, fileSizeBytes, isConfidential } = req.body;

  try {
    const [doc] = await db('patient_documents')
      .insert({
        hospital_id: req.hospitalId,
        patient_id: patientId,
        document_type: documentType,
        title,
        file_path: filePath,
        mime_type: mimeType,
        file_size_bytes: fileSizeBytes,
        uploaded_by_user_id: req.user!.id,
        is_confidential: isConfidential || false,
      })
      .returning('*');

    res.status(201).json({ success: true, data: doc, message: 'Document registered in medical records' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 2. Patient Consent Registration (DPDP Compliance)
documentsRouter.post('/consents', tenantMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { patientId, consentCategory, isGranted, witnessName, witnessPhone } = req.body;

  try {
    const [consent] = await db('patient_consents')
      .insert({
        hospital_id: req.hospitalId,
        patient_id: patientId,
        consent_category: consentCategory,
        is_granted: isGranted,
        witness_name: witnessName,
        witness_phone: witnessPhone,
        captured_by_user_id: req.user!.id,
      })
      .returning('*');

    res.status(201).json({ success: true, data: consent, message: 'Patient consent recorded' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 3. Register Mobile Device & Push Notification Token
documentsRouter.post('/devices/register', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { deviceId, deviceType, fcmPushToken, appVersion, isBiometricEnabled } = req.body;

  try {
    const [device] = await db('user_devices')
      .insert({
        user_id: req.user!.id,
        device_id: deviceId,
        device_type: deviceType,
        fcm_push_token: fcmPushToken,
        app_version: appVersion,
        is_biometric_enabled: isBiometricEnabled || false,
        last_active_at: new Date(),
      })
      .onConflict(['user_id', 'device_id'])
      .merge({
        fcm_push_token: fcmPushToken,
        app_version: appVersion,
        is_biometric_enabled: isBiometricEnabled,
        last_active_at: new Date(),
      })
      .returning('*');

    res.json({ success: true, data: device, message: 'Mobile device registered for secure push sessions' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 4. In-App Notifications Feed
documentsRouter.get('/notifications', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const notifications = await db('notifications')
      .where({ recipient_user_id: req.user!.id })
      .orderBy('created_at', 'desc')
      .limit(30);

    res.json({ success: true, data: notifications });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});
