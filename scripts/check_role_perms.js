require('dotenv').config();
const { Client } = require('pg');

async function check() {
  const c = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  await c.connect();
  const res = await c.query(`
    SELECT r.code as role_code, COUNT(rp.permission_id) as perm_count
    FROM roles r
    LEFT JOIN role_permissions rp ON r.id = rp.role_id
    GROUP BY r.code;
  `);
  console.log('Role permissions counts:');
  console.table(res.rows);

  const adminPerms = await c.query(`
    SELECT p.action, p.resource, p.module
    FROM permissions p
    JOIN role_permissions rp ON p.id = rp.permission_id
    JOIN roles r ON rp.role_id = r.id
    WHERE r.code = 'hospital_admin';
  `);
  console.log('hospital_admin permissions:', adminPerms.rows);
  await c.end();
}

check().catch(console.error);

