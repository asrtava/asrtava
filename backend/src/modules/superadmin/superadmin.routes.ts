import { Router, Response } from 'express';
import { db } from '../../database';
import { authMiddleware, AuthenticatedRequest } from '../../middleware/auth.middleware';

export const superAdminRouter = Router();

// Restrict to platform super admin
superAdminRouter.use(authMiddleware);
superAdminRouter.use((req: AuthenticatedRequest, res: Response, next) => {
  if (req.user?.userType !== 'super_admin') {
    res.status(403).json({ success: false, message: 'Platform Super Admin access required' });
    return;
  }
  next();
});

// Platform Statistics
superAdminRouter.get('/stats', async (_req, res) => {
  try {
    const totalHospitals = await db('hospitals').count('id as count').first();
    const activeHospitals = await db('hospitals').where({ is_active: true, subscription_status: 'active' }).count('id as count').first();
    const totalPatients = await db('patients').count('id as count').first();
    const totalUsers = await db('users').count('id as count').first();

    res.json({
      success: true,
      data: {
        totalHospitals: Number(totalHospitals?.count || 0),
        activeHospitals: Number(activeHospitals?.count || 0),
        totalPatients: Number(totalPatients?.count || 0),
        totalPlatformUsers: Number(totalUsers?.count || 0),
        mrr: Number(activeHospitals?.count || 0) * 15000, // INR benchmark estimate
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// List all hospitals (tenants)
superAdminRouter.get('/hospitals', async (_req, res) => {
  try {
    const hospitals = await db('hospitals').orderBy('created_at', 'desc');
    res.json({ success: true, data: hospitals });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Onboard new hospital tenant
superAdminRouter.post('/hospitals', async (req, res) => {
  const { name, code, city, state, email, phone, subscriptionPlan = 'basic' } = req.body;
  try {
    const [hospital] = await db('hospitals')
      .insert({
        name,
        code,
        city,
        state,
        email,
        phone,
        subscription_plan: subscriptionPlan,
        subscription_status: 'active',
      })
      .returning('*');

    // Create default settings
    await db('hospital_settings').insert({
      hospital_id: hospital.id,
    });

    res.status(201).json({ success: true, data: hospital, message: 'Hospital tenant provisioned successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

