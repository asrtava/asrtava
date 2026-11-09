import { Router, Response } from 'express';
import { db } from '../../database';
import { authMiddleware, AuthenticatedRequest } from '../../middleware/auth.middleware';
import { tenantMiddleware } from '../../middleware/tenant.middleware';
import { requirePermission } from '../../middleware/permission.middleware';

export const permissionsRouter = Router();

permissionsRouter.use(authMiddleware);
permissionsRouter.use(tenantMiddleware);

// 1. List Available System Permissions
permissionsRouter.get('/catalog', async (_req, res: Response): Promise<void> => {
  try {
    const permissions = await db('permissions').where({ is_active: true }).orderBy('module', 'asc');
    res.json({ success: true, data: permissions });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 2. List Roles (System + Custom for Hospital)
permissionsRouter.get('/roles', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const roles = await db('roles')
      .where({ hospital_id: req.hospitalId })
      .orWhere({ is_system_role: true })
      .andWhere({ is_active: true });
    res.json({ success: true, data: roles });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 2b. Create Custom Hospital Role
permissionsRouter.post('/roles', requirePermission('manage', 'all'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { name, code, description, permissionIds } = req.body;

  try {
    const normalizedCode = (code || name.replace(/\s+/g, '_')).toLowerCase();

    // Security Guard: Prevent Hospital Admin from creating super_admin role
    if (normalizedCode.includes('super_admin') || normalizedCode.includes('super-admin')) {
      res.status(403).json({
        success: false,
        message: 'Hospital Admin cannot create or elevate permissions to platform Super Admin.'
      });
      return;
    }

    const [newRole] = await db('roles')
      .insert({
        hospital_id: req.hospitalId,
        name,
        code: normalizedCode,
        description,
        is_system_role: false,
        is_active: true,
      })
      .returning('*');

    if (Array.isArray(permissionIds) && permissionIds.length > 0) {
      const rolePerms = permissionIds.map((pId: string) => ({
        role_id: newRole.id,
        permission_id: pId,
      }));
      await db('role_permissions').insert(rolePerms).onConflict(['role_id', 'permission_id']).ignore();
    }

    await db('audit_logs').insert({
      hospital_id: req.hospitalId,
      actor_user_id: req.user!.id,
      action: 'role.created',
      entity_type: 'roles',
      entity_id: newRole.id,
      new_values: { name, code: normalizedCode, permissionCount: permissionIds?.length || 0 }
    });

    res.status(201).json({
      success: true,
      message: `Custom role [${name}] created successfully`,
      data: newRole
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 3. Assign Custom Permission Override (Explicit Allow or Explicit Deny)
permissionsRouter.post('/user-overrides', requirePermission('manage', 'all'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { userId, permissionId, isGranted, justification, expiresAt } = req.body;

  try {
    // Target user must belong to same hospital
    const targetUser = await db('users').where({ id: userId, hospital_id: req.hospitalId }).first();
    if (!targetUser) {
      res.status(404).json({ success: false, message: 'Target user not found within your hospital tenant' });
      return;
    }

    const [override] = await db('user_permissions')
      .insert({
        user_id: userId,
        hospital_id: req.hospitalId,
        permission_id: permissionId,
        is_granted: isGranted, // TRUE = Allow override, FALSE = Explicit Deny (Deny wins)
        granted_by: req.user!.id,
        approved_by: req.user!.id,
        approved_at: new Date(),
        justification,
        expires_at: expiresAt ? new Date(expiresAt) : null,
      })
      .onConflict(['user_id', 'permission_id'])
      .merge({
        is_granted: isGranted,
        granted_by: req.user!.id,
        approved_by: req.user!.id,
        approved_at: new Date(),
        justification,
        expires_at: expiresAt ? new Date(expiresAt) : null,
        updated_at: new Date(),
      })
      .returning('*');

    // Record audit log
    await db('audit_logs').insert({
      hospital_id: req.hospitalId,
      actor_user_id: req.user!.id,
      action: isGranted ? 'permission.override.allow' : 'permission.override.deny',
      entity_type: 'user_permissions',
      entity_id: override.id,
      new_values: { userId, permissionId, isGranted, justification },
    });

    res.json({
      success: true,
      message: `Individual permission ${isGranted ? 'Explicit Allow' : 'Explicit Deny'} override saved successfully`,
      data: override,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 4. Permission Approval Workflow Requests
permissionsRouter.get('/approval-requests', requirePermission('manage', 'all'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const requests = await db('permission_approval_logs as pal')
      .join('users as u', 'pal.user_id', 'u.id')
      .join('permissions as p', 'pal.permission_id', 'p.id')
      .where({ 'pal.hospital_id': req.hospitalId, 'pal.status': 'pending' })
      .select(
        'pal.id',
        'pal.request_type',
        'pal.status',
        'u.first_name',
        'u.last_name',
        'u.email',
        'p.module',
        'p.action',
        'p.resource',
        'pal.created_at'
      );

    res.json({ success: true, data: requests });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});
