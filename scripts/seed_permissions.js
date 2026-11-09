require('dotenv').config();
const { Client } = require('pg');

const connectionString = process.env.DATABASE_URL;

async function seedPerms() {
  console.log('Seeding standard permissions and role_permissions in Neon...');
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();

  try {
    await client.query('BEGIN;');

    // 1. Insert permissions catalog
    const permissions = [
      // View all, create all, edit all, delete all, manage all
      { module: 'hospital', sub_module: 'settings', action: 'view', resource: 'all', description: 'View hospital settings' },
      { module: 'hospital', sub_module: 'settings', action: 'manage', resource: 'all', description: 'Manage hospital settings' },
      { module: 'hospital', sub_module: 'profile', action: 'view', resource: 'all', description: 'View hospital profile' },
      { module: 'hospital', sub_module: 'profile', action: 'edit', resource: 'all', description: 'Edit hospital profile' },
      { module: 'hospital', sub_module: 'departments', action: 'manage', resource: 'all', description: 'Manage departments' },
      { module: 'hospital', sub_module: 'departments', action: 'view', resource: 'all', description: 'View departments' },
      { module: 'hospital', sub_module: 'admin-metrics', action: 'view', resource: 'all', description: 'View hospital administration metrics' },

      { module: 'users', sub_module: 'management', action: 'manage', resource: 'all', description: 'Manage hospital users' },
      { module: 'users', sub_module: 'management', action: 'view', resource: 'all', description: 'View hospital users' },
      { module: 'users', sub_module: 'staff', action: 'manage', resource: 'all', description: 'Manage staff profiles' },
      { module: 'users', sub_module: 'staff', action: 'view', resource: 'all', description: 'View staff profiles' },

      { module: 'roles', sub_module: 'permissions', action: 'manage', resource: 'all', description: 'Manage roles and permissions' },
      { module: 'roles', sub_module: 'permissions', action: 'view', resource: 'all', description: 'View roles and permissions' },

      { module: 'patients', sub_module: 'records', action: 'view', resource: 'all', description: 'View patient records' },
      { module: 'patients', sub_module: 'records', action: 'create', resource: 'all', description: 'Register new patients' },
      { module: 'patients', sub_module: 'records', action: 'edit', resource: 'all', description: 'Update patient information' },
      { module: 'patients', sub_module: 'records', action: 'manage', resource: 'all', description: 'Manage patient records' },

      { module: 'appointments', sub_module: 'booking', action: 'view', resource: 'all', description: 'View appointments' },
      { module: 'appointments', sub_module: 'booking', action: 'create', resource: 'all', description: 'Schedule appointments' },
      { module: 'appointments', sub_module: 'booking', action: 'edit', resource: 'all', description: 'Reschedule or edit appointments' },
      { module: 'appointments', sub_module: 'queue', action: 'manage', resource: 'all', description: 'Manage appointment queue' },

      { module: 'clinical', sub_module: 'consultation', action: 'view', resource: 'all', description: 'View clinical consultations' },
      { module: 'clinical', sub_module: 'consultation', action: 'create', resource: 'all', description: 'Create clinical consultations' },
      { module: 'clinical', sub_module: 'consultation', action: 'edit', resource: 'all', description: 'Amend clinical consultations' },
      { module: 'clinical', sub_module: 'vitals', action: 'view', resource: 'all', description: 'View patient vitals' },
      { module: 'clinical', sub_module: 'vitals', action: 'create', resource: 'all', description: 'Record patient vitals' },
      { module: 'clinical', sub_module: 'prescription', action: 'create', resource: 'all', description: 'Create electronic prescriptions' },
      { module: 'clinical', sub_module: 'prescription', action: 'view', resource: 'all', description: 'View prescriptions' },

      { module: 'inpatient', sub_module: 'admissions', action: 'manage', resource: 'all', description: 'Manage admissions, transfers, discharge' },
      { module: 'inpatient', sub_module: 'admissions', action: 'view', resource: 'all', description: 'View admissions' },
      { module: 'inpatient', sub_module: 'beds', action: 'view', resource: 'all', description: 'View inpatient bed matrix' },
      { module: 'inpatient', sub_module: 'beds', action: 'manage', resource: 'all', description: 'Manage beds and rooms' },
      { module: 'inpatient', sub_module: 'nursing', action: 'create', resource: 'all', description: 'Create nursing notes and vitals' },
      { module: 'inpatient', sub_module: 'nursing', action: 'view', resource: 'all', description: 'View nursing assessments' },
      { module: 'inpatient', sub_module: 'mar', action: 'edit', resource: 'all', description: 'Administer medication record doses' },

      { module: 'pharmacy', sub_module: 'dispensing', action: 'create', resource: 'all', description: 'Dispense pharmacy medicines' },
      { module: 'pharmacy', sub_module: 'dispensing', action: 'view', resource: 'all', description: 'View dispensing logs' },
      { module: 'pharmacy', sub_module: 'inventory', action: 'manage', resource: 'all', description: 'Manage pharmacy inventory batches' },
      { module: 'pharmacy', sub_module: 'inventory', action: 'view', resource: 'all', description: 'View pharmacy stock' },

      { module: 'laboratory', sub_module: 'orders', action: 'view', resource: 'all', description: 'View lab orders' },
      { module: 'laboratory', sub_module: 'orders', action: 'create', resource: 'all', description: 'Place lab orders' },
      { module: 'laboratory', sub_module: 'results', action: 'create', resource: 'all', description: 'Enter lab results' },
      { module: 'laboratory', sub_module: 'results', action: 'approve', resource: 'all', description: 'Sign off lab results' },

      { module: 'radiology', sub_module: 'imaging', action: 'view', resource: 'all', description: 'View radiology scans and orders' },
      { module: 'radiology', sub_module: 'imaging', action: 'create', resource: 'all', description: 'Create radiology reports' },

      { module: 'billing', sub_module: 'invoices', action: 'create', resource: 'all', description: 'Create invoices' },
      { module: 'billing', sub_module: 'invoices', action: 'view', resource: 'all', description: 'View invoices' },
      { module: 'billing', sub_module: 'payments', action: 'create', resource: 'all', description: 'Collect and record payments' },
      { module: 'billing', sub_module: 'payments', action: 'view', resource: 'all', description: 'View payments' },
      { module: 'billing', sub_module: 'refunds', action: 'approve', resource: 'all', description: 'Approve refunds' },

      { module: 'finance', sub_module: 'reports', action: 'export', resource: 'all', description: 'Export financial reports' },
      { module: 'finance', sub_module: 'reports', action: 'view', resource: 'all', description: 'View financial reports' },

      { module: 'hr', sub_module: 'roster', action: 'manage', resource: 'all', description: 'Manage duty rosters and shifts' },
      { module: 'hr', sub_module: 'roster', action: 'view', resource: 'all', description: 'View rosters' },
      { module: 'hr', sub_module: 'employees', action: 'manage', resource: 'all', description: 'Manage employee records' },

      { module: 'inventory', sub_module: 'procurement', action: 'manage', resource: 'all', description: 'Manage procurement and POs' },
      { module: 'inventory', sub_module: 'procurement', action: 'view', resource: 'all', description: 'View procurement' },
      { module: 'inventory', sub_module: 'stock', action: 'view', resource: 'all', description: 'View inventory balances' },

      // Generic view:all and create:all for high-level endpoints
      { module: 'reports', sub_module: 'analytics', action: 'view', resource: 'all', description: 'View analytics and reports' },
      { module: 'reports', sub_module: 'analytics', action: 'create', resource: 'all', description: 'Create reports' },
    ];

    for (const p of permissions) {
      await client.query(`
        INSERT INTO permissions (module, sub_module, action, resource, description)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (module, sub_module, action, resource) DO NOTHING;
      `, [p.module, p.sub_module, p.action, p.resource, p.description]);
    }
    console.log(`✓ Inserted ${permissions.length} catalog permissions.`);

    // 2. Fetch all permission IDs
    const permRes = await client.query('SELECT id, module, action, resource FROM permissions;');
    const allPerms = permRes.rows;

    // 3. Fetch all role IDs
    const roleRes = await client.query('SELECT id, code FROM roles;');
    const roleMap = new Map(roleRes.rows.map(r => [r.code, r.id]));

    // 4. Map hospital_admin / hospital_owner to ALL permissions
    const adminRoleId = roleMap.get('hospital_admin');
    const ownerRoleId = roleMap.get('hospital_owner');

    for (const p of allPerms) {
      if (adminRoleId) {
        await client.query(`
          INSERT INTO role_permissions (role_id, permission_id)
          VALUES ($1, $2)
          ON CONFLICT (role_id, permission_id) DO NOTHING;
        `, [adminRoleId, p.id]);
      }
      if (ownerRoleId) {
        await client.query(`
          INSERT INTO role_permissions (role_id, permission_id)
          VALUES ($1, $2)
          ON CONFLICT (role_id, permission_id) DO NOTHING;
        `, [ownerRoleId, p.id]);
      }
    }

    // 5. Map Doctor permissions
    const doctorRoleId = roleMap.get('doctor');
    if (doctorRoleId) {
      const docPerms = allPerms.filter(p => ['clinical', 'patients', 'appointments', 'inpatient', 'laboratory', 'radiology'].includes(p.module));
      for (const p of docPerms) {
        await client.query('INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2) ON CONFLICT DO NOTHING;', [doctorRoleId, p.id]);
      }
    }

    // 6. Map Nurse permissions
    const nurseRoleId = roleMap.get('nurse');
    if (nurseRoleId) {
      const nursePerms = allPerms.filter(p => ['inpatient', 'clinical', 'patients', 'pharmacy'].includes(p.module));
      for (const p of nursePerms) {
        await client.query('INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2) ON CONFLICT DO NOTHING;', [nurseRoleId, p.id]);
      }
    }

    // 7. Map Receptionist permissions
    const recepRoleId = roleMap.get('receptionist');
    if (recepRoleId) {
      const recepPerms = allPerms.filter(p => ['patients', 'appointments', 'billing'].includes(p.module));
      for (const p of recepPerms) {
        await client.query('INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2) ON CONFLICT DO NOTHING;', [recepRoleId, p.id]);
      }
    }

    // 8. Map Pharmacy permissions
    const pharmRoleId = roleMap.get('pharmacist');
    if (pharmRoleId) {
      const pharmPerms = allPerms.filter(p => ['pharmacy', 'inventory', 'patients'].includes(p.module));
      for (const p of pharmPerms) {
        await client.query('INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2) ON CONFLICT DO NOTHING;', [pharmRoleId, p.id]);
      }
    }

    // 9. Map Billing permissions
    const billRoleId = roleMap.get('billing_executive');
    if (billRoleId) {
      const billPerms = allPerms.filter(p => ['billing', 'finance', 'patients'].includes(p.module));
      for (const p of billPerms) {
        await client.query('INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2) ON CONFLICT DO NOTHING;', [billRoleId, p.id]);
      }
    }

    await client.query('COMMIT;');
    console.log('✓ Successfully mapped permissions to roles!');
  } catch (err) {
    await client.query('ROLLBACK;');
    console.error('Error seeding permissions:', err);
  } finally {
    await client.end();
  }
}

seedPerms();

