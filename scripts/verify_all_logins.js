const http = require('http');

const testCases = [
  {
    name: 'Super Admin',
    url: 'http://127.0.0.1:5000/api/v1/auth/super-admin/login',
    body: { email: 'superadmin@asrtava.com', password: 'SuperAdmin@2026!' }
  },
  {
    name: 'Hospital Admin',
    url: 'http://127.0.0.1:5000/api/v1/auth/hospital/login',
    body: { email: 'director@apexcare.com', password: 'HospitalAdmin@2026!', hospitalCode: 'APEX-BLR' }
  },
  {
    name: 'Doctor',
    url: 'http://127.0.0.1:5000/api/v1/auth/staff/login',
    body: { email: 'doctor.sharma@apexcare.com', password: 'Doctor@2026!' }
  },
  {
    name: 'Nurse',
    url: 'http://127.0.0.1:5000/api/v1/auth/staff/login',
    body: { email: 'nurse.anjali@apexcare.com', password: 'Nurse@2026!' }
  },
  {
    name: 'Receptionist',
    url: 'http://127.0.0.1:5000/api/v1/auth/staff/login',
    body: { email: 'reception.rohan@apexcare.com', password: 'Reception@2026!' }
  },
  {
    name: 'Pharmacist',
    url: 'http://127.0.0.1:5000/api/v1/auth/staff/login',
    body: { email: 'pharmacy.suresh@apexcare.com', password: 'Pharmacy@2026!' }
  },
  {
    name: 'Laboratory',
    url: 'http://127.0.0.1:5000/api/v1/auth/staff/login',
    body: { email: 'lab.tech@apexcare.com', password: 'Lab@2026!' }
  },
  {
    name: 'Radiology',
    url: 'http://127.0.0.1:5000/api/v1/auth/staff/login',
    body: { email: 'radiology.dr@apexcare.com', password: 'Radiology@2026!' }
  },
  {
    name: 'Finance',
    url: 'http://127.0.0.1:5000/api/v1/auth/staff/login',
    body: { email: 'finance.lead@apexcare.com', password: 'Finance@2026!' }
  },
  {
    name: 'HR',
    url: 'http://127.0.0.1:5000/api/v1/auth/staff/login',
    body: { email: 'hr.manager@apexcare.com', password: 'HR@2026!' }
  },
  {
    name: 'Inventory',
    url: 'http://127.0.0.1:5000/api/v1/auth/staff/login',
    body: { email: 'inventory.store@apexcare.com', password: 'Inventory@2026!' }
  },
  {
    name: 'Patient',
    url: 'http://127.0.0.1:5000/api/v1/auth/patient/login',
    body: { phone: '9876543210', password: 'Patient@2026!' }
  }
];

function post(url, body) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const payload = JSON.stringify(body);
    const req = http.request({
      hostname: u.hostname,
      port: u.port,
      path: u.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(data) }));
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function run() {
  console.log('Testing all 12 portal logins against live backend & Neon Postgres...\n');
  let successCount = 0;
  for (const tc of testCases) {
    try {
      const res = await post(tc.url, tc.body);
      if (res.status === 200 && res.data.success) {
        console.log(`✓ [200 OK] ${tc.name.padEnd(16)} -> Authenticated as ${res.data.data.user.email || res.data.data.user.phone} (${res.data.data.user.activePortal || res.data.data.user.userType})`);
        successCount++;
      } else {
        console.error(`✕ [${res.status}] ${tc.name.padEnd(16)} -> ${res.data.message || 'Error'}`);
      }
    } catch (err) {
      console.error(`✕ [ERROR] ${tc.name.padEnd(16)} -> ${err.message}`);
    }
  }
  console.log(`\n============================================================`);
  console.log(`Result: ${successCount} / ${testCases.length} portal logins succeeded.`);
  console.log(`============================================================`);
}

run();

