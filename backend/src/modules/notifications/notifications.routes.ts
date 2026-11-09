import { Router, Response } from 'express';
import { db } from '../../database';
import { authMiddleware, AuthenticatedRequest } from '../../middleware/auth.middleware';
import { tenantMiddleware } from '../../middleware/tenant.middleware';
import { requirePermission } from '../../middleware/permission.middleware';
import { NotificationEngineService, Channel, NotificationPriority } from './notification-engine.service';

export const notificationsRouter = Router();

notificationsRouter.use(authMiddleware);
notificationsRouter.use(tenantMiddleware);

// 1. Get Logged-in User Notifications (In-App Notification Center)
notificationsRouter.get('/my-notifications', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const limit = Number(req.query.limit) || 30;
    const result = NotificationEngineService.getMyNotifications(req.hospitalId!, req.user!.id, limit);

    // Also attempt DB query if available
    try {
      const dbList = await db('notifications')
        .where({ hospital_id: req.hospitalId, recipient_user_id: req.user!.id })
        .orderBy('created_at', 'desc')
        .limit(limit);

      if (dbList && dbList.length > 0) {
        const unreadCount = await db('notifications')
          .where({ hospital_id: req.hospitalId, recipient_user_id: req.user!.id, is_read: false })
          .count('id as count')
          .first();

        res.json({
          success: true,
          unreadCount: Number(unreadCount?.count || 0),
          data: dbList,
        });
        return;
      }
    } catch {
      // Fallback gracefully to service cache
    }

    res.json({
      success: true,
      unreadCount: result.unreadCount,
      data: result.notifications,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 2. Mark Single Notification as Read
notificationsRouter.patch('/:id/read', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const notificationId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    NotificationEngineService.markAsRead(notificationId, req.user!.id);

    try {
      await db('notifications')
        .where({ id: notificationId, hospital_id: req.hospitalId, recipient_user_id: req.user!.id })
        .update({ is_read: true, updated_at: new Date() });
    } catch {
      // Memory fallback active
    }

    res.json({ success: true, message: 'Notification marked as read' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 3. Mark All Notifications as Read
notificationsRouter.post('/mark-all-read', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const count = NotificationEngineService.markAllAsRead(req.hospitalId!, req.user!.id);

    try {
      await db('notifications')
        .where({ hospital_id: req.hospitalId, recipient_user_id: req.user!.id, is_read: false })
        .update({ is_read: true, updated_at: new Date() });
    } catch {
      // Memory fallback active
    }

    res.json({ success: true, count, message: 'All notifications marked as read' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 4. Centralized Multi-Channel Notification Dispatch
notificationsRouter.post('/dispatch', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const {
    recipientUserId,
    recipientContact,
    eventCode,
    variables,
    priority,
    forcedChannel,
    idempotencyKey,
  } = req.body;

  try {
    const result = await NotificationEngineService.dispatchEvent({
      hospitalId: req.hospitalId!,
      eventCode: eventCode || 'appointment.confirmed',
      recipientUserId: recipientUserId || req.user!.id,
      recipientContact,
      variables: variables || {},
      priority: priority as NotificationPriority,
      forcedChannel: forcedChannel as Channel,
      idempotencyKey,
    });

    res.status(201).json({
      success: true,
      data: result,
      message: result.isDuplicate ? 'Duplicate notification ignored (idempotent replay)' : 'Notification dispatched successfully',
    });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// 5. Patient & Staff Communication Preferences
notificationsRouter.get('/preferences', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const pref = NotificationEngineService.getPreferences(req.hospitalId!, req.user!.id);
    res.json({ success: true, data: pref });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

notificationsRouter.put('/preferences', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { emailEnabled, smsEnabled, whatsappEnabled, pushEnabled, marketingOptIn, quietHoursStart, quietHoursEnd } = req.body;

    NotificationEngineService.setPreferences({
      userId: req.user!.id,
      hospitalId: req.hospitalId!,
      emailEnabled: emailEnabled ?? true,
      smsEnabled: smsEnabled ?? true,
      whatsappEnabled: whatsappEnabled ?? true,
      pushEnabled: pushEnabled ?? true,
      marketingOptIn: marketingOptIn ?? false,
      quietHoursStart,
      quietHoursEnd,
      timeZone: req.body.timeZone || 'Asia/Kolkata',
    });

    res.json({ success: true, message: 'Communication preferences updated successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 6. Critical Alert Acknowledgement (Doctors & Clinical Specialists)
notificationsRouter.post('/alerts/:id/acknowledge', requirePermission('create', 'all'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const alertId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = NotificationEngineService.acknowledgeCriticalAlert(alertId, req.user!.id);
    res.json({ success: true, data: result.alert, message: 'Critical clinical alert acknowledged by licensed physician.' });
  } catch (err: any) {
    res.status(404).json({ success: false, message: err.message });
  }
});

// 7. Mobile Device Token Registration (Push Notifications for Patient & Staff Apps)
notificationsRouter.post('/device-tokens', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { token, platform } = req.body;

  if (!token || !platform) {
    res.status(400).json({ success: false, message: 'Device token and platform (android|ios) are required' });
    return;
  }

  try {
    NotificationEngineService.registerDeviceToken(req.user!.id, token, platform);
    res.status(201).json({ success: true, message: 'Device push notification token registered and active' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});
