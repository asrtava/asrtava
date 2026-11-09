require('dotenv').config();
const { Client } = require('pg');
const bcrypt = require('bcryptjs');

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL is not set.');
  process.exit(1);
}

async function hash(pwd) {
  return bcrypt.hash(pwd, 10);
}

async function seed() {
  console.log('Connecting to Neon to seed demo accounts and portal access...');
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();

  try {
    await client.query('BEGIN;');

    // 1. Ensure Standard Roles exist
    const roles = [
      { id: 'd1000000-0000-0000-0000-000000000001', code: 'super_admin', name: 'Platform Super Administrator' },
      { id: 'd1000000-0000-0000-0000-000000000002', code: 'hospital_owner', name: 'Hospital Owner' },
      { id: 'd1000000-0000-0000-0000-000000000003', code: 'hospital_admin', name: 'Hospital Administrator' },
      { id: 'd1000000-0000-0000-0000-000000000004', code: 'doctor', name: 'Attending Physician / Doctor' },
      { id: 'd1000000-0000-0000-0000-000000000005', code: 'nurse', name: 'Staff Nurse' },
      { id: 'd1000000-0000-0000-0000-000000000006', code: 'receptionist', name: 'Receptionist' },
      { id: 'd1000000-0000-0000-0000-000000000007', code: 'pharmacist', name: 'Pharmacist' },
      { id: 'd1000000-0000-0000-0000-000000000008', code: 'billing_executive', name: 'Billing Executive' },
      { id: 'd1000000-0000-0000-0000-000000000009', code: 'accountant', name: 'Accountant' },
      { id: 'd1000000-0000-0000-0000-000000000010', code: 'lab_staff', name: 'Laboratory Staff' },
      { id: 'd1000000-0000-0000-0000-000000000011', code: 'radiology_staff', name: 'Radiology Staff' },
      { id: 'd1000000-0000-0000-0000-000000000012', code: 'hr_manager', name: 'HR Manager' },
      { id: 'd1000000-0000-0000-0000-000000000013', code: 'inventory_manager', name: 'Inventory Manager' },
      { id: 'd1000000-0000-0000-0000-000000000014', code: 'patient', name: 'Patient' },
    ];

    for (const r of roles) {
      await client.query(`
        INSERT INTO roles (id, name, code, description, is_system_role, is_active)
        VALUES ($1, $2, $3, $4, TRUE, TRUE)
        ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, is_active = TRUE;
      `, [r.id, r.name, r.code, r.name]);
    }
    console.log('✓ Roles confirmed.');

    // 2. Demonstration Hospitals (APEX-BLR and APEX01)
    const hospitalId1 = 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d';
    await client.query(`
      INSERT INTO hospitals (id, code, name, legal_name, city, state, country, subscription_plan, subscription_status, is_active)
      VALUES ($1, 'APEX-BLR', 'Apex Care Multi-Specialty Hospital', 'Apex Healthcare Private Limited', 'Bengaluru', 'Karnataka', 'India', 'enterprise', 'active', TRUE)
      ON CONFLICT (id) DO UPDATE SET code = 'APEX-BLR', name = EXCLUDED.name, is_active = TRUE;
    `, [hospitalId1]);

    await client.query(`
      INSERT INTO hospital_settings (hospital_id, currency, timezone, tax_enabled, default_tax_rate, appointment_slot_duration)
      VALUES ($1, 'INR', 'Asia/Kolkata', TRUE, 18.00, 15)
      ON CONFLICT (hospital_id) DO NOTHING;
    `, [hospitalId1]);

    const hospitalId2 = 'a2b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6e';
    await client.query(`
      INSERT INTO hospitals (id, code, name, legal_name, city, state, country, subscription_plan, subscription_status, is_active)
      VALUES ($1, 'APEX01', 'Apex City Center Hospital', 'Apex Healthcare Private Limited', 'Bengaluru', 'Karnataka', 'India', 'enterprise', 'active', TRUE)
      ON CONFLICT (code) DO NOTHING;
    `, [hospitalId2]);

    await client.query(`
      INSERT INTO hospital_memberships (user_id, hospital_id, status, is_default)
      VALUES ('e1000000-0000-0000-0000-000000000002', $1, 'active', FALSE)
      ON CONFLICT (user_id, hospital_id) DO UPDATE SET status = 'active';
    `, [hospitalId2]);

    console.log('✓ Hospitals APEX-BLR & APEX01 provisioned.');

    // 3. User Accounts with their portal roles
    const accounts = [
      // Super Admin accounts
      {
        id: 'e1000000-0000-0000-0000-000000000001',
        email: 'superadmin@asrtava.com',
        passwords: ['SuperAdmin@2026!', 'Admin@123456'],
        firstName: 'ASRTAVA',
        lastName: 'Super Admin',
        userType: 'super_admin',
        hospitalId: null,
        roleCode: 'super_admin'
      },
      {
        id: 'e1000000-0000-0000-0000-000000000010',
        email: 'admin@asrtava.com',
        passwords: ['Admin@123456', 'SuperAdmin@2026!'],
        firstName: 'ASRTAVA',
        lastName: 'Platform Admin',
        userType: 'super_admin',
        hospitalId: null,
        roleCode: 'super_admin'
      },
      // Hospital Admin
      {
        id: 'e1000000-0000-0000-0000-000000000002',
        email: 'director@apexcare.com',
        passwords: ['HospitalAdmin@2026!', 'Admin@2026!', 'Admin@123456'],
        firstName: 'Dr. Rajesh',
        lastName: 'Sharma',
        userType: 'hospital_admin',
        hospitalId: hospitalId1,
        roleCode: 'hospital_admin'
      },
      // Doctor accounts
      {
        id: 'e1000000-0000-0000-0000-000000000003',
        email: 'dr.ananya@apexcare.com',
        passwords: ['Doctor@2026!', 'Admin@123456'],
        firstName: 'Dr. Ananya',
        lastName: 'Iyer',
        userType: 'staff',
        hospitalId: hospitalId1,
        roleCode: 'doctor'
      },
      {
        id: 'e1000000-0000-0000-0000-000000000011',
        email: 'doctor.sharma@apexcare.com',
        passwords: ['Doctor@2026!', 'Admin@123456'],
        firstName: 'Dr. Vikram',
        lastName: 'Sharma',
        userType: 'staff',
        hospitalId: hospitalId1,
        roleCode: 'doctor'
      },
      // Nurse
      {
        id: 'e1000000-0000-0000-0000-000000000005',
        email: 'nurse.anjali@apexcare.com',
        passwords: ['Nurse@2026!', 'Admin@123456'],
        firstName: 'Anjali',
        lastName: 'Nair',
        userType: 'staff',
        hospitalId: hospitalId1,
        roleCode: 'nurse'
      },
      // Receptionist
      {
        id: 'e1000000-0000-0000-0000-000000000004',
        email: 'reception@apexcare.com',
        passwords: ['Reception@2026!', 'Admin@123456'],
        firstName: 'Sunita',
        lastName: 'Rao',
        userType: 'staff',
        hospitalId: hospitalId1,
        roleCode: 'receptionist'
      },
      {
        id: 'e1000000-0000-0000-0000-000000000012',
        email: 'reception.rohan@apexcare.com',
        passwords: ['Reception@2026!', 'Admin@123456'],
        firstName: 'Rohan',
        lastName: 'Mehta',
        userType: 'staff',
        hospitalId: hospitalId1,
        roleCode: 'receptionist'
      },
      // Pharmacist
      {
        id: 'e1000000-0000-0000-0000-000000000006',
        email: 'pharmacy.suresh@apexcare.com',
        passwords: ['Pharmacy@2026!', 'Admin@123456'],
        firstName: 'Suresh',
        lastName: 'Patel',
        userType: 'staff',
        hospitalId: hospitalId1,
        roleCode: 'pharmacist'
      },
      // Laboratory
      {
        id: 'e1000000-0000-0000-0000-000000000007',
        email: 'lab.tech@apexcare.com',
        passwords: ['Lab@2026!', 'Admin@123456'],
        firstName: 'Pooja',
        lastName: 'Verma',
        userType: 'staff',
        hospitalId: hospitalId1,
        roleCode: 'lab_staff'
      },
      // Radiology
      {
        id: 'e1000000-0000-0000-0000-000000000008',
        email: 'radiology.dr@apexcare.com',
        passwords: ['Radiology@2026!', 'Admin@123456'],
        firstName: 'Dr. Siddharth',
        lastName: 'Roy',
        userType: 'staff',
        hospitalId: hospitalId1,
        roleCode: 'radiology_staff'
      },
      // Finance
      {
        id: 'e1000000-0000-0000-0000-000000000009',
        email: 'finance.lead@apexcare.com',
        passwords: ['Finance@2026!', 'Admin@123456'],
        firstName: 'Amit',
        lastName: 'Saxena',
        userType: 'staff',
        hospitalId: hospitalId1,
        roleCode: 'billing_executive'
      },
      // HR
      {
        id: 'e1000000-0000-0000-0000-000000000013',
        email: 'hr.manager@apexcare.com',
        passwords: ['HR@2026!', 'Admin@123456'],
        firstName: 'Meenakshi',
        lastName: 'Sundaram',
        userType: 'staff',
        hospitalId: hospitalId1,
        roleCode: 'hr_manager'
      },
      // Inventory
      {
        id: 'e1000000-0000-0000-0000-000000000014',
        email: 'inventory.store@apexcare.com',
        passwords: ['Inventory@2026!', 'Admin@123456'],
        firstName: 'Karthik',
        lastName: 'Raman',
        userType: 'staff',
        hospitalId: hospitalId1,
        roleCode: 'inventory_manager'
      },
      // Patient
      {
        id: 'e1000000-0000-0000-0000-000000000015',
        email: 'patient.ramesh@apexcare.com',
        phone: '9876543210',
        passwords: ['Patient@2026!', 'Admin@123456'],
        firstName: 'Ramesh',
        lastName: 'Kumar',
        userType: 'patient',
        hospitalId: hospitalId1,
        roleCode: 'patient'
      }
    ];

    for (const acc of accounts) {
      const primaryPwd = acc.passwords[0];
      const pwdHash = await hash(primaryPwd);

      // Upsert User
      await client.query(`
        INSERT INTO users (id, hospital_id, email, phone, password_hash, first_name, last_name, user_type, is_active, is_email_verified)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, TRUE, TRUE)
        ON CONFLICT (email) DO UPDATE SET
          password_hash = EXCLUDED.password_hash,
          is_active = TRUE,
          user_type = EXCLUDED.user_type,
          hospital_id = EXCLUDED.hospital_id,
          phone = COALESCE(EXCLUDED.phone, users.phone);
      `, [
        acc.id,
        acc.hospitalId,
        acc.email.toLowerCase(),
        acc.phone || null,
        pwdHash,
        acc.firstName,
        acc.lastName,
        acc.userType
      ]);

      // Assign user role
      const roleRow = roles.find(r => r.code === acc.roleCode);
      if (roleRow) {
        await client.query(`
          INSERT INTO user_roles (user_id, role_id, hospital_id)
          VALUES ($1, $2, $3)
          ON CONFLICT (user_id, role_id) DO NOTHING;
        `, [acc.id, roleRow.id, acc.hospitalId]);
      }

      // Add Hospital Membership if staff
      if (acc.hospitalId) {
        await client.query(`
          INSERT INTO hospital_memberships (user_id, hospital_id, status, is_default)
          VALUES ($1, $2, 'active', TRUE)
          ON CONFLICT (user_id, hospital_id) DO UPDATE SET status = 'active';
        `, [acc.id, acc.hospitalId]);
      }

      console.log(`✓ Seeded user ${acc.email} (${acc.roleCode}) with password: ${primaryPwd}`);
    }

    // 4. Seed Patient Demographic Record
    await client.query(`
      INSERT INTO patients (id, hospital_id, patient_number, first_name, last_name, date_of_birth, gender, blood_group, phone, email, city)
      VALUES (
        '81000000-0000-0000-0000-000000000001',
        $1,
        'PAT-00001',
        'Ramesh',
        'Kumar',
        '1981-04-12',
        'male',
        'B+',
        '+919876543210',
        'patient.ramesh@apexcare.com',
        'Bengaluru'
      )
      ON CONFLICT (id) DO NOTHING;
    `, [hospitalId1]);

    // 5. Seed Doctor Profile Record
    await client.query(`
      INSERT INTO doctors (id, user_id, hospital_id, employee_number, specialization, qualification, experience_years, consultation_fee)
      VALUES (
        '71000000-0000-0000-0000-000000000001',
        'e1000000-0000-0000-0000-000000000003',
        $1,
        'DOC-001',
        'Internal Medicine & Critical Care',
        'MBBS, MD (General Medicine)',
        11,
        750.00
      )
      ON CONFLICT (id) DO NOTHING;
    `, [hospitalId1]);

    await client.query('COMMIT;');
    console.log('\n============================================================');
    console.log('✓ SEEDING COMPLETED SUCCESSFULLY!');
    console.log('============================================================');
  } catch (err) {
    await client.query('ROLLBACK;');
    console.error('Seeding failed:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

seed();
