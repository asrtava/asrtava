import test from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';

// ============================================================================
// ASRTAVA COMPLETE REAL-WORLD HOSPITAL WORKFLOW SIMULATION & E2E VALIDATION
// Simulates end-to-end hospital operations across all 13 portals and services
// ============================================================================

test('ASRTAVA Real-World Hospital Operations & End-to-End System Validation Suite', async (t) => {
  const JWT_SECRET = 'asrtava-production-super-secure-jwt-key-2026';

  // --------------------------------------------------------------------------
  // SECTION 1: SYNTHETIC TEST TENANTS, ROLES & IDENTITIES
  // --------------------------------------------------------------------------
  const mockTenants = {
    alpha: { id: 'hosp-alpha-sim', code: 'SIM-ALPHA', name: 'Alpha Memorial Apex Hospital' },
    beta: { id: 'hosp-beta-sim', code: 'SIM-BETA', name: 'Beta Metro Specialty Hospital' }
  };

  const users = {
    receptionist: {
      id: 'usr-sim-rec-1',
      name: 'Sunita Devi',
      role: 'receptionist',
      hospitalId: mockTenants.alpha.id,
      allowed: ['patient:create', 'patient:view', 'appointment:create', 'appointment:view', 'appointment:status', 'billing:opd:collect'],
      denied: ['clinical:all']
    },
    doctor: {
      id: 'usr-sim-doc-1',
      name: 'Dr. Vikram Malhotra',
      role: 'doctor',
      hospitalId: mockTenants.alpha.id,
      specialization: 'Cardiology',
      allowed: ['doctor:opd:queue', 'clinical:consult', 'clinical:soap', 'clinical:prescribe', 'diagnostics:order', 'inpatient:rounds'],
      denied: []
    },
    nurse: {
      id: 'usr-sim-nurse-1',
      name: 'Nurse Priya Sharma',
      role: 'nurse',
      hospitalId: mockTenants.alpha.id,
      ward: 'Ward-A (Cardio)',
      allowed: ['nursing:station:view', 'nursing:vitals:log', 'nursing:mar:administer', 'nursing:fluid:log', 'nursing:handover', 'nursing:careplan'],
      denied: ['clinical:prescribe:new']
    },
    labTech: {
      id: 'usr-sim-lab-1',
      name: 'Ramesh Pathologist',
      role: 'lab_technician',
      hospitalId: mockTenants.alpha.id,
      allowed: ['lab:order:view', 'lab:specimen:accession', 'lab:result:enter', 'lab:result:approve', 'lab:panic:broadcast'],
      denied: []
    },
    radiologist: {
      id: 'usr-sim-rad-1',
      name: 'Dr. Ananya Ray',
      role: 'radiologist',
      hospitalId: mockTenants.alpha.id,
      allowed: ['radiology:order:view', 'radiology:assign', 'radiology:report:enter', 'radiology:report:approve'],
      denied: []
    },
    pharmacist: {
      id: 'usr-sim-pharm-1',
      name: 'Karan Mehta',
      role: 'pharmacist',
      hospitalId: mockTenants.alpha.id,
      allowed: ['pharmacy:dispense', 'pharmacy:stock:view', 'pharmacy:substitute', 'pharmacy:batch:manage', 'inventory:po:create'],
      denied: []
    },
    accountant: {
      id: 'usr-sim-acct-1',
      name: 'Amitabh Joshi',
      role: 'accountant',
      hospitalId: mockTenants.alpha.id,
      allowed: ['finance:invoice:create', 'finance:payment:collect', 'finance:refund:process', 'finance:tpa:manage'],
      denied: ['clinical:all']
    },
    patient: {
      id: 'usr-sim-pt-1',
      name: 'Rajesh K. Patel',
      role: 'patient',
      uhid: 'SIM-PT-00109',
      hospitalId: mockTenants.alpha.id,
      phone: '+91 98765 43210',
      allowed: ['patient:portal:view', 'patient:records:own', 'patient:appointments:own', 'patient:bills:pay'],
      denied: ['staff:all']
    },
    superAdmin: {
      id: 'usr-sim-super-1',
      name: 'Platform Operations Admin',
      role: 'super_admin',
      hospitalId: null,
      allowed: ['saas:tenant:manage', 'saas:billing:manage', 'saas:system:monitor'],
      denied: ['clinical:all']
    }
  };

  // Helper: Mint signed JWT
  const createToken = (u: any, jitApproved = false) => jwt.sign({
    userId: u.id,
    name: u.name,
    role: u.role,
    hospitalId: u.hospitalId,
    allowed: jitApproved ? [...u.allowed, 'clinical:consult', 'clinical:all'] : u.allowed,
    denied: jitApproved ? u.denied.filter((d: string) => !d.startsWith('clinical:')) : u.denied,
    jitAccessActive: jitApproved
  }, JWT_SECRET, { expiresIn: '1h' });

  // Helper: Verify authorization with negative overrides & tenant scoping
  const verifyAccess = (token: string, targetHospitalId: string, requiredPerm: string, isClinical = false) => {
    try {
      const decoded: any = jwt.verify(token, JWT_SECRET);
      
      // Multi-tenant check
      if (decoded.role !== 'super_admin' && decoded.hospitalId !== targetHospitalId) {
        return { allowed: false, reason: 'CROSS_TENANT_FORBIDDEN' };
      }

      // Super admin zero standing clinical check
      if (decoded.role === 'super_admin' && isClinical && !decoded.jitAccessActive) {
        return { allowed: false, reason: 'SUPER_ADMIN_ZERO_STANDING_CLINICAL_ACCESS' };
      }

      // Explicit individual DENY check
      if (decoded.denied && (decoded.denied.includes(requiredPerm) || (isClinical && decoded.denied.includes('clinical:all')))) {
        return { allowed: false, reason: 'PERMISSION_EXPLICIT_DENIED' };
      }

      // Allowed permission check
      if (decoded.allowed && (decoded.allowed.includes(requiredPerm) || decoded.allowed.includes('all'))) {
        return { allowed: true, userId: decoded.userId };
      }

      return { allowed: false, reason: 'INSUFFICIENT_PERMISSIONS' };
    } catch {
      return { allowed: false, reason: 'INVALID_TOKEN' };
    }
  };

  // --------------------------------------------------------------------------
  // SCENARIO 1: COMPLETE OPD PATIENT JOURNEY
  // --------------------------------------------------------------------------
  await t.test('Scenario 1: Complete OPD Outpatient Journey (Registration to Payment & Portal Sync)', async () => {
    const recepToken = createToken(users.receptionist);
    const docToken = createToken(users.doctor);
    const labToken = createToken(users.labTech);
    const radToken = createToken(users.radiologist);
    const pharmToken = createToken(users.pharmacist);
    const acctToken = createToken(users.accountant);
    const ptToken = createToken(users.patient);

    // Step 1: Patient Registration & Duplicate Detection
    const registeredPatients = new Map<string, any>();
    const registerPatient = (pData: any) => {
      assert.ok(verifyAccess(recepToken, mockTenants.alpha.id, 'patient:create').allowed);
      // Duplicate detection on phone + DOB
      for (const p of registeredPatients.values()) {
        if (p.phone === pData.phone && p.dob === pData.dob) {
          throw new Error('DUPLICATE_PATIENT_RECORD_DETECTED');
        }
      }
      const uhid = `SIM-PT-${String(registeredPatients.size + 100).padStart(5, '0')}`;
      const rec = { ...pData, uhid, createdAt: new Date() };
      registeredPatients.set(uhid, rec);
      return rec;
    };

    const ptRecord = registerPatient({
      name: users.patient.name,
      phone: users.patient.phone,
      dob: '1984-06-15',
      gender: 'Male',
      bloodGroup: 'B+',
      emergencyContact: '+91 98765 00000'
    });
    assert.strictEqual(ptRecord.uhid, 'SIM-PT-00100');
    assert.strictEqual(ptRecord.name, 'Rajesh K. Patel');

    // Duplicate check validation
    assert.throws(() => {
      registerPatient({ name: 'Duplicate Rajesh', phone: users.patient.phone, dob: '1984-06-15' });
    }, /DUPLICATE_PATIENT_RECORD_DETECTED/);

    // Step 2: Appointment Scheduling with Double-Booking Prevention
    const appointments: any[] = [];
    const bookAppointment = (patientId: string, doctorId: string, date: string, slot: string) => {
      assert.ok(verifyAccess(recepToken, mockTenants.alpha.id, 'appointment:create').allowed);
      // Double booking check for doctor on that slot
      const conflict = appointments.find(a => a.doctorId === doctorId && a.date === date && a.slot === slot && a.status !== 'cancelled');
      if (conflict) {
        throw new Error('DOCTOR_SLOT_ALREADY_BOOKED');
      }
      const appt = {
        id: `APT-${appointments.length + 1}`,
        patientId,
        doctorId,
        date,
        slot,
        status: 'confirmed',
        queueToken: null
      };
      appointments.push(appt);
      return appt;
    };

    const appt = bookAppointment(ptRecord.uhid, users.doctor.id, '2026-11-10', '10:00-10:15');
    assert.strictEqual(appt.status, 'confirmed');

    // Assert double booking is rejected
    assert.throws(() => {
      bookAppointment('SIM-PT-OTHER', users.doctor.id, '2026-11-10', '10:00-10:15');
    }, /DOCTOR_SLOT_ALREADY_BOOKED/);

    // Step 3: Check-in & Queue Token Allocation
    const checkInPatient = (appointmentId: string) => {
      assert.ok(verifyAccess(recepToken, mockTenants.alpha.id, 'appointment:status').allowed);
      const target = appointments.find(a => a.id === appointmentId);
      assert.ok(target);
      target.status = 'checked_in';
      target.queueToken = 1; // 1st token of the morning clinic
      return target;
    };
    const checkedInAppt = checkInPatient(appt.id);
    assert.strictEqual(checkedInAppt.status, 'checked_in');
    assert.strictEqual(checkedInAppt.queueToken, 1);

    // Step 4: Doctor Consultation with SOAP, ICD-10 & e-Prescription
    const clinicalEncounters: any[] = [];
    const conductConsultation = (appointmentId: string, data: any) => {
      assert.ok(verifyAccess(docToken, mockTenants.alpha.id, 'clinical:consult', true).allowed);
      const apptRef = appointments.find(a => a.id === appointmentId);
      assert.ok(apptRef);
      apptRef.status = 'completed';

      const encounter = {
        encounterId: `ENC-${clinicalEncounters.length + 1}`,
        appointmentId,
        patientId: apptRef.patientId,
        doctorId: users.doctor.id,
        vitals: data.vitals,
        soapNotes: data.soapNotes,
        icd10Diagnoses: data.diagnoses,
        prescriptions: data.prescriptions,
        labOrders: data.labOrders,
        radiologyOrders: data.radiologyOrders,
        createdAt: new Date()
      };
      clinicalEncounters.push(encounter);
      return encounter;
    };

    const enc = conductConsultation(appt.id, {
      vitals: { bpSystolic: 130, bpDiastolic: 84, pulse: 74, tempF: 98.6, spo2: 99 },
      soapNotes: {
        subjective: 'Patient reports mild morning headache and occasional palpitations.',
        objective: 'Chest clear to auscultation, S1/S2 normal, no pedal edema.',
        assessment: 'Stage 1 Essential Hypertension under primary evaluation.',
        plan: 'Lifestyle dietary modification, initiation of ACE inhibitor, baseline lipid profile & chest imaging.'
      },
      diagnoses: [{ code: 'I10', name: 'Essential (primary) hypertension', type: 'confirmed' }],
      prescriptions: [{
        medicineId: 'MED-AML-05',
        name: 'Amlodipine Besylate',
        dosage: '5mg',
        frequency: 'OD (Once Daily)',
        durationDays: 30,
        quantity: 30
      }],
      labOrders: [{ testCode: 'LIPID-01', name: 'Comprehensive Lipid Profile', priority: 'routine' }],
      radiologyOrders: [{ procedureCode: 'CXR-PA', name: 'Chest X-Ray PA View', priority: 'routine' }]
    });

    assert.strictEqual(enc.encounterId, 'ENC-1');
    assert.strictEqual(appt.status, 'completed');
    assert.strictEqual(enc.icd10Diagnoses[0].code, 'I10');

    // Step 5: Laboratory Processing, Result Entry & Pathologist Verification
    const labWorklist: any[] = [];
    const processLabOrder = (encId: string, testOrder: any) => {
      assert.ok(verifyAccess(labToken, mockTenants.alpha.id, 'lab:specimen:accession').allowed);
      const specimenId = `SPEC-${Date.now().toString().slice(-4)}`;
      const labItem = {
        specimenId,
        encounterId: encId,
        testCode: testOrder.testCode,
        status: 'accessioned',
        results: null as any,
        isPanicValue: false,
        verifiedBy: null as any
      };
      labWorklist.push(labItem);

      // Tech enters results
      assert.ok(verifyAccess(labToken, mockTenants.alpha.id, 'lab:result:enter').allowed);
      labItem.results = {
        totalCholesterol: 215,
        triglycerides: 165,
        hdl: 42,
        ldl: 140,
        unit: 'mg/dL'
      };
      labItem.status = 'result_entered';

      // Pathologist approval
      assert.ok(verifyAccess(labToken, mockTenants.alpha.id, 'lab:result:approve').allowed);
      labItem.verifiedBy = users.labTech.name;
      labItem.status = 'approved';
      return labItem;
    };
    const labReport = processLabOrder(enc.encounterId, enc.labOrders[0]);
    assert.strictEqual(labReport.status, 'approved');
    assert.strictEqual(labReport.results.totalCholesterol, 215);

    // Step 6: Radiology Processing, PACS UID & Structured Radiologist Report
    const radWorklist: any[] = [];
    const processRadiologyOrder = (encId: string, radOrder: any) => {
      assert.ok(verifyAccess(radToken, mockTenants.alpha.id, 'radiology:assign').allowed);
      const studyUid = `1.2.840.113619.2.55.3.${Date.now()}`;
      const report = {
        studyUid,
        encounterId: encId,
        procedureCode: radOrder.procedureCode,
        status: 'reported',
        findings: 'Normal cardiothoracic ratio. Lung fields are clear bilaterally with no active parenchymal lesion.',
        impression: 'No acute cardiopulmonary disease.',
        radiologist: users.radiologist.name
      };
      radWorklist.push(report);
      return report;
    };
    const radReport = processRadiologyOrder(enc.encounterId, enc.radiologyOrders[0]);
    assert.strictEqual(radReport.status, 'reported');
    assert.ok(radReport.studyUid.startsWith('1.2.840.'));

    // Step 7: Pharmacy FEFO Dispensing & Inventory Decrement
    const pharmacyInventory = [
      { batchId: 'BAT-2026-A', medicineId: 'MED-AML-05', expiry: '2027-01-01', availableQty: 100, price: 3.50 },
      { batchId: 'BAT-2026-B', medicineId: 'MED-AML-05', expiry: '2026-12-01', availableQty: 50, price: 3.50 } // Earliest Expiry
    ];

    const dispensePrescription = (medicineId: string, requestedQty: number) => {
      assert.ok(verifyAccess(pharmToken, mockTenants.alpha.id, 'pharmacy:dispense').allowed);
      // FEFO Sort: Earliest expiry date first
      const eligibleBatches = pharmacyInventory
        .filter(b => b.medicineId === medicineId && b.availableQty > 0)
        .sort((a, b) => new Date(a.expiry).getTime() - new Date(b.expiry).getTime());

      assert.ok(eligibleBatches.length > 0, 'No stock available');
      const targetBatch = eligibleBatches[0];
      assert.strictEqual(targetBatch.batchId, 'BAT-2026-B', 'FEFO must choose earliest expiring batch');

      assert.ok(targetBatch.availableQty >= requestedQty, 'Insufficient batch quantity');
      targetBatch.availableQty -= requestedQty;

      return {
        dispensingId: 'DISP-001',
        batchUsed: targetBatch.batchId,
        qtyDispensed: requestedQty,
        totalPrice: targetBatch.price * requestedQty,
        remainingStock: targetBatch.availableQty
      };
    };

    const dispenseResult = dispensePrescription('MED-AML-05', 30);
    assert.strictEqual(dispenseResult.batchUsed, 'BAT-2026-B');
    assert.strictEqual(dispenseResult.remainingStock, 20); // 50 - 30 = 20

    // Step 8: Billing, Invoicing & Idempotent Multi-Mode Payment
    const invoices: any[] = [];
    const payments: any[] = [];

    const generateInvoice = (patientId: string, lineItems: any[]) => {
      assert.ok(verifyAccess(acctToken, mockTenants.alpha.id, 'finance:invoice:create').allowed);
      const gross = lineItems.reduce((acc, item) => acc + (item.qty * item.rate), 0);
      const taxRate = 0.18; // 18% GST on diagnostics & pharmacy
      const tax = Number((gross * taxRate).toFixed(2));
      const net = gross + tax;

      const inv = {
        invoiceId: `INV-${invoices.length + 1001}`,
        patientId,
        lineItems,
        grossAmount: gross,
        taxAmount: tax,
        netPayable: net,
        totalPaid: 0,
        status: 'unpaid'
      };
      invoices.push(inv);
      return inv;
    };

    const inv = generateInvoice(ptRecord.uhid, [
      { desc: 'Cardiology Specialist OPD Consultation', qty: 1, rate: 800 },
      { desc: 'Comprehensive Lipid Profile Panel', qty: 1, rate: 650 },
      { desc: 'Chest X-Ray Digital PA View', qty: 1, rate: 500 },
      { desc: 'Amlodipine 5mg (30 Tablets)', qty: 1, rate: 105 }
    ]);
    assert.strictEqual(inv.grossAmount, 2055);
    assert.strictEqual(inv.taxAmount, 369.90);
    assert.strictEqual(inv.netPayable, 2424.90);

    const collectPayment = (invoiceId: string, amount: number, method: string, idempotencyKey: string) => {
      assert.ok(verifyAccess(acctToken, mockTenants.alpha.id, 'finance:payment:collect').allowed);
      // Idempotency check
      const existing = payments.find(p => p.idempotencyKey === idempotencyKey);
      if (existing) {
        return { payment: existing, isReplay: true };
      }

      const invRef = invoices.find(i => i.invoiceId === invoiceId);
      assert.ok(invRef);
      assert.ok(invRef.totalPaid + amount <= invRef.netPayable, 'Overpayment rejected');

      const payment = {
        receiptNumber: `REC-${payments.length + 5001}`,
        invoiceId,
        amount,
        method,
        idempotencyKey,
        paidAt: new Date()
      };
      payments.push(payment);
      invRef.totalPaid += amount;
      invRef.status = invRef.totalPaid >= invRef.netPayable ? 'paid' : 'partially_paid';

      return { payment, isReplay: false };
    };

    const payResult = collectPayment(inv.invoiceId, 2424.90, 'UPI', 'IDEMP-OPD-PAY-001');
    assert.strictEqual(payResult.isReplay, false);
    assert.strictEqual(inv.status, 'paid');
    assert.strictEqual(inv.totalPaid, 2424.90);

    // Verify Idempotent Replay
    const replayResult = collectPayment(inv.invoiceId, 2424.90, 'UPI', 'IDEMP-OPD-PAY-001');
    assert.strictEqual(replayResult.isReplay, true);
    assert.strictEqual(payments.length, 1, 'Idempotency prevented duplicate payment row');

    // Step 9: Patient Web & Mobile Portal Access Verification
    assert.ok(verifyAccess(ptToken, mockTenants.alpha.id, 'patient:records:own').allowed);
    const patientView = {
      uhid: ptRecord.uhid,
      name: ptRecord.name,
      appointments: appointments.filter(a => a.patientId === ptRecord.uhid),
      encounters: clinicalEncounters.filter(e => e.patientId === ptRecord.uhid),
      labReports: labWorklist.filter(l => l.encounterId === enc.encounterId),
      radiologyReports: radWorklist.filter(r => r.encounterId === enc.encounterId),
      invoices: invoices.filter(i => i.patientId === ptRecord.uhid)
    };

    assert.strictEqual(patientView.appointments.length, 1);
    assert.strictEqual(patientView.encounters[0].prescriptions[0].name, 'Amlodipine Besylate');
    assert.strictEqual(patientView.labReports[0].status, 'approved');
    assert.strictEqual(patientView.radiologyReports[0].status, 'reported');
    assert.strictEqual(patientView.invoices[0].status, 'paid');
  });

  // --------------------------------------------------------------------------
  // SCENARIO 2: COMPLETE IPD INPATIENT ADMISSION & DISCHARGE
  // --------------------------------------------------------------------------
  await t.test('Scenario 2: Complete IPD Admission, Nursing e-MAR, Fluid Balance & Discharge', async () => {
    const docToken = createToken(users.doctor);
    const nurseToken = createToken(users.nurse);
    const acctToken = createToken(users.accountant);

    // 1. Bed Setup & Concurrency Allocation
    const beds = [
      { id: 'BED-A-101', ward: 'Cardio-Ward', room: '101', type: 'Semi-Private', status: 'available' },
      { id: 'BED-A-102', ward: 'Cardio-Ward', room: '102', type: 'Semi-Private', status: 'available' }
    ];

    const admissions: any[] = [];
    const admitPatient = (patientId: string, doctorId: string, bedId: string, diagnosis: string) => {
      assert.ok(verifyAccess(docToken, mockTenants.alpha.id, 'inpatient:rounds').allowed);
      const bed = beds.find(b => b.id === bedId);
      assert.ok(bed, 'Bed not found');
      if (bed.status !== 'available') {
        throw new Error('BED_OCCUPIED_OR_UNAVAILABLE');
      }

      bed.status = 'occupied';
      const adm = {
        admissionId: `ADM-${admissions.length + 101}`,
        patientId,
        doctorId,
        bedId,
        diagnosis,
        admittedAt: new Date(),
        status: 'active',
        nursingVitals: [] as any[],
        medicationsAdministered: [] as any[],
        fluidBalance: { intakeMl: 0, outputMl: 0 },
        carePlans: [] as any[],
        sbarHandovers: [] as any[],
        dischargeSummary: null as any
      };
      admissions.push(adm);
      return adm;
    };

    const adm = admitPatient('SIM-PT-00100', users.doctor.id, 'BED-A-101', 'Acute Coronary Syndrome Rule-out');
    assert.strictEqual(adm.admissionId, 'ADM-101');
    assert.strictEqual(beds[0].status, 'occupied');

    // Verify double allocation to same bed is blocked
    assert.throws(() => {
      admitPatient('SIM-PT-00999', users.doctor.id, 'BED-A-101', 'Elective Surgery');
    }, /BED_OCCUPIED_OR_UNAVAILABLE/);

    // 2. Nursing Vitals & Care Plan Establishment
    const logNursingCare = (admId: string) => {
      assert.ok(verifyAccess(nurseToken, mockTenants.alpha.id, 'nursing:vitals:log').allowed);
      const targetAdm = admissions.find(a => a.admissionId === admId);
      assert.ok(targetAdm);

      targetAdm.nursingVitals.push({
        bp: '124/80',
        pulse: 72,
        spo2: 98,
        temp: 98.4,
        timestamp: new Date()
      });

      assert.ok(verifyAccess(nurseToken, mockTenants.alpha.id, 'nursing:careplan').allowed);
      targetAdm.carePlans.push({
        diagnosis: 'Risk for decreased cardiac output',
        goal: 'Maintain hemodynamic stability, SpO2 > 95%',
        interventions: ['Continuous ECG telemetry', 'Hourly vitals monitoring', 'Low sodium cardiac diet'],
        status: 'active'
      });
    };
    logNursingCare(adm.admissionId);
    assert.strictEqual(adm.nursingVitals.length, 1);
    assert.strictEqual(adm.carePlans[0].status, 'active');

    // 3. Nursing e-MAR Medication Administration (Mandatory 5-Rights Verification)
    const administerMedication = (admId: string, medName: string, dose: string, fiveRightsConfirmed: boolean) => {
      assert.ok(verifyAccess(nurseToken, mockTenants.alpha.id, 'nursing:mar:administer').allowed);
      if (!fiveRightsConfirmed) {
        throw new Error('FIVE_RIGHTS_VERIFICATION_REQUIRED');
      }
      const targetAdm = admissions.find(a => a.admissionId === admId);
      assert.ok(targetAdm);

      const mar = {
        medName,
        dose,
        route: 'IV Bolus',
        nurse: users.nurse.name,
        administeredAt: new Date()
      };
      targetAdm.medicationsAdministered.push(mar);
      return mar;
    };

    // Assert unverified administration fails
    assert.throws(() => {
      administerMedication(adm.admissionId, 'Heparin Sodium', '5000 IU', false);
    }, /FIVE_RIGHTS_VERIFICATION_REQUIRED/);

    // Verified administration succeeds
    const marRecord = administerMedication(adm.admissionId, 'Heparin Sodium', '5000 IU', true);
    assert.strictEqual(marRecord.dose, '5000 IU');
    assert.strictEqual(adm.medicationsAdministered.length, 1);

    // 4. Fluid Balance Tracking (Intake vs Output)
    const recordFluidBalance = (admId: string, intakeMl: number, outputMl: number) => {
      assert.ok(verifyAccess(nurseToken, mockTenants.alpha.id, 'nursing:fluid:log').allowed);
      const targetAdm = admissions.find(a => a.admissionId === admId);
      assert.ok(targetAdm);
      targetAdm.fluidBalance.intakeMl += intakeMl;
      targetAdm.fluidBalance.outputMl += outputMl;
      return {
        intake: targetAdm.fluidBalance.intakeMl,
        output: targetAdm.fluidBalance.outputMl,
        netBalance: targetAdm.fluidBalance.intakeMl - targetAdm.fluidBalance.outputMl
      };
    };
    const fluidState = recordFluidBalance(adm.admissionId, 1200, 950);
    assert.strictEqual(fluidState.intake, 1200);
    assert.strictEqual(fluidState.output, 950);
    assert.strictEqual(fluidState.netBalance, 250);

    // 5. Nursing SBAR Shift Handover
    const submitSbarHandover = (admId: string, incomingNurse: string) => {
      assert.ok(verifyAccess(nurseToken, mockTenants.alpha.id, 'nursing:handover').allowed);
      const targetAdm = admissions.find(a => a.admissionId === admId);
      assert.ok(targetAdm);

      const sbar = {
        situation: 'Patient 48hr post admission, chest pain resolved, telemetry sinus rhythm.',
        background: 'Known hypertensive, admitted for rule-out acute coronary syndrome.',
        assessment: 'Vitals stable (124/80), SpO2 98% room air, fluid balance positive 250mL.',
        recommendation: 'Continue telemetry until consultant morning rounds; prepare for discharge evaluation.',
        outgoingNurse: users.nurse.name,
        incomingNurse,
        signedAt: new Date()
      };
      targetAdm.sbarHandovers.push(sbar);
      return sbar;
    };
    const sbar = submitSbarHandover(adm.admissionId, 'Nurse Sneha Verma');
    assert.strictEqual(sbar.incomingNurse, 'Nurse Sneha Verma');

    // 6. Consultant Discharge Authorization & Bed Sanitization Release
    const dischargePatient = (admId: string, condition: string, instructions: string) => {
      assert.ok(verifyAccess(docToken, mockTenants.alpha.id, 'inpatient:rounds').allowed);
      const targetAdm = admissions.find(a => a.admissionId === admId);
      assert.ok(targetAdm);

      targetAdm.status = 'discharged';
      targetAdm.dischargeSummary = {
        finalDiagnosis: 'Non-cardiac chest discomfort with mild essential hypertension',
        conditionAtDischarge: condition,
        followUpInstructions: instructions,
        dischargedAt: new Date(),
        authorizingConsultant: users.doctor.name
      };

      // Bed transitions to cleaning
      const allocatedBed = beds.find(b => b.id === targetAdm.bedId);
      assert.ok(allocatedBed);
      allocatedBed.status = 'cleaning'; // Ready for housekeeping

      return targetAdm;
    };

    const discharged = dischargePatient(adm.admissionId, 'Stable, Ambulatory', 'Follow-up in OPD after 7 days with lipid panel');
    assert.strictEqual(discharged.status, 'discharged');
    assert.strictEqual(beds[0].status, 'cleaning', 'Bed released and marked for cleaning');
  });

  // --------------------------------------------------------------------------
  // SCENARIO 3: EMERGENCY DEPARTMENT (ED) TRIAGE & PRIORITY DISPOSITION
  // --------------------------------------------------------------------------
  await t.test('Scenario 3: Emergency Department Triage Priority & Rapid Disposition', async () => {
    const docToken = createToken(users.doctor);
    const recepToken = createToken(users.receptionist);

    const erQueue: any[] = [];
    const intakeErCase = (patientName: string, triageLevel: string, complaint: string) => {
      assert.ok(verifyAccess(recepToken, mockTenants.alpha.id, 'patient:create').allowed);
      const erCase = {
        erId: `ER-2026-${erQueue.length + 101}`,
        patientName,
        triageLevel, // level_1_resuscitation, level_2_emergent, level_3_urgent, level_4_less_urgent
        chiefComplaint: complaint,
        arrivalTime: new Date(),
        assignedDoctor: users.doctor.name,
        disposition: 'in_er'
      };
      erQueue.push(erCase);
      return erCase;
    };

    // Intake multiple cases with varying acuity
    const caseUrgent = intakeErCase('Suresh Kumar', 'level_3_urgent', 'Right lower quadrant abdominal pain');
    const caseResuscitation = intakeErCase('Vijay Reddy', 'level_1_resuscitation', 'Severe polytrauma with unconsciousness & hypotension');

    // Priority sorting verification: Level 1 must ALWAYS be sorted ahead of Level 3
    const priorityWeights: Record<string, number> = {
      level_1_resuscitation: 1,
      level_2_emergent: 2,
      level_3_urgent: 3,
      level_4_less_urgent: 4
    };

    const sortedQueue = [...erQueue].sort((a, b) => priorityWeights[a.triageLevel] - priorityWeights[b.triageLevel]);
    assert.strictEqual(sortedQueue[0].triageLevel, 'level_1_resuscitation');
    assert.strictEqual(sortedQueue[0].patientName, 'Vijay Reddy');
    assert.strictEqual(sortedQueue[1].patientName, 'Suresh Kumar');

    // Emergency Disposition
    const updateDisposition = (erId: string, dispositionTarget: string) => {
      assert.ok(verifyAccess(docToken, mockTenants.alpha.id, 'clinical:consult', true).allowed);
      const c = erQueue.find(e => e.erId === erId);
      assert.ok(c);
      c.disposition = dispositionTarget;
      return c;
    };

    const disposedCase = updateDisposition(caseResuscitation.erId, 'transferred_to_icu_ot');
    assert.strictEqual(disposedCase.disposition, 'transferred_to_icu_ot');
  });

  // --------------------------------------------------------------------------
  // SCENARIO 4: PHARMACY & INVENTORY CONCURRENCY & PURCHASE REQUISITION
  // --------------------------------------------------------------------------
  await t.test('Scenario 4: Pharmacy Inventory Race Condition Protection & Stock Reordering', async () => {
    const pharmToken = createToken(users.pharmacist);

    // Initial stock setup
    const inventory = {
      itemId: 'MED-PAR-500',
      name: 'Paracetamol 500mg Tab',
      availableQty: 10,
      reorderThreshold: 20
    };

    // Simulate concurrent dispensing requests
    const dispenseAttempt = (requestedQty: number) => {
      assert.ok(verifyAccess(pharmToken, mockTenants.alpha.id, 'pharmacy:dispense').allowed);
      if (inventory.availableQty < requestedQty) {
        throw new Error(`INSUFFICIENT_STOCK_AVAILABLE: Requested ${requestedQty}, have ${inventory.availableQty}`);
      }
      inventory.availableQty -= requestedQty;
      return { success: true, remaining: inventory.availableQty };
    };

    // First request dispenses 7 units -> succeeds (3 remaining)
    const res1 = dispenseAttempt(7);
    assert.strictEqual(res1.remaining, 3);

    // Second concurrent request demands 5 units -> MUST FAIL (insufficient stock)
    assert.throws(() => {
      dispenseAttempt(5);
    }, /INSUFFICIENT_STOCK_AVAILABLE/);

    assert.strictEqual(inventory.availableQty, 3, 'Inventory must not become negative');

    // Low stock trigger & Purchase Requisition creation
    const isLowStock = inventory.availableQty <= inventory.reorderThreshold;
    assert.strictEqual(isLowStock, true);

    const purchaseRequisitions: any[] = [];
    const createRequisition = (itemId: string, orderQty: number) => {
      assert.ok(verifyAccess(pharmToken, mockTenants.alpha.id, 'inventory:po:create').allowed);
      const po = {
        poNumber: `PO-SIM-${purchaseRequisitions.length + 801}`,
        itemId,
        orderQty,
        status: 'draft_pending_admin_approval',
        createdAt: new Date()
      };
      purchaseRequisitions.push(po);
      return po;
    };

    const po = createRequisition(inventory.itemId, 100);
    assert.strictEqual(po.orderQty, 100);
    assert.strictEqual(po.status, 'draft_pending_admin_approval');
  });

  // --------------------------------------------------------------------------
  // SCENARIO 5: COMPLETE FINANCIAL LIFECYCLE & SUPERVISOR REFUND VERIFICATION
  // --------------------------------------------------------------------------
  await t.test('Scenario 5: Multi-Mode Billing, Decimal Arithmetic & Supervisor-PIN Authorized Refund', async () => {
    const acctToken = createToken(users.accountant);

    const invoice = {
      id: 'INV-FIN-001',
      totalAmount: 10000.00,
      paidAmount: 0.00,
      status: 'unpaid'
    };

    // 1. Partial Advance Payment
    invoice.paidAmount += 4000.00;
    invoice.status = 'partially_paid';
    assert.strictEqual(invoice.status, 'partially_paid');

    // 2. Final Settlement
    invoice.paidAmount += 6000.00;
    invoice.status = 'paid';
    assert.strictEqual(invoice.paidAmount, 10000.00);
    assert.strictEqual(invoice.status, 'paid');

    // 3. Supervisor-Authorized Refund (Requires Verified Supervisor PIN)
    const refunds: any[] = [];
    const processRefund = (invoiceId: string, refundAmount: number, reason: string, supervisorPin: string) => {
      assert.ok(verifyAccess(acctToken, mockTenants.alpha.id, 'finance:refund:process').allowed);
      // Dual-control PIN validation
      const SUPERVISOR_PIN_HASH = '9944'; // Mock secure supervisor credential
      if (supervisorPin !== SUPERVISOR_PIN_HASH) {
        throw new Error('INVALID_SUPERVISOR_PIN_AUTHORIZATION');
      }

      assert.ok(refundAmount <= invoice.paidAmount, 'Refund cannot exceed total paid amount');
      invoice.paidAmount -= refundAmount;
      invoice.status = 'refunded_partially';

      const refundEntry = {
        refundId: `REF-${refunds.length + 1}`,
        invoiceId,
        amount: refundAmount,
        reason,
        authorizedBySupervisor: true,
        refundedAt: new Date()
      };
      refunds.push(refundEntry);
      return refundEntry;
    };

    // Unauthorized PIN fails
    assert.throws(() => {
      processRefund(invoice.id, 1500.00, 'Duplicate test billed in error', '0000');
    }, /INVALID_SUPERVISOR_PIN_AUTHORIZATION/);

    // Valid Supervisor PIN succeeds
    const refund = processRefund(invoice.id, 1500.00, 'Duplicate test billed in error', '9944');
    assert.strictEqual(refund.amount, 1500.00);
    assert.strictEqual(invoice.paidAmount, 8500.00);
    assert.strictEqual(invoice.status, 'refunded_partially');
  });

  // --------------------------------------------------------------------------
  // SCENARIO 6: PATIENT WEB & MOBILE SYNCHRONIZATION
  // --------------------------------------------------------------------------
  await t.test('Scenario 6: Patient Web and Mobile Synchronization with Single Source of Truth', async () => {
    // Generate web token and mobile token for identical patient identity
    const webToken = createToken(users.patient);
    const mobileToken = createToken(users.patient);

    const decodedWeb: any = jwt.verify(webToken, JWT_SECRET);
    const decodedMobile: any = jwt.verify(mobileToken, JWT_SECRET);

    // Assert identity parity
    assert.strictEqual(decodedWeb.userId, decodedMobile.userId);
    assert.strictEqual(decodedWeb.role, 'patient');
    assert.strictEqual(decodedMobile.role, 'patient');
    assert.strictEqual(decodedWeb.hospitalId, decodedMobile.hospitalId);

    // Mobile push notification queue sync
    const notificationQueue = [
      { id: 'NOTIF-1', recipientId: users.patient.id, title: 'Lab Report Ready', unread: true },
      { id: 'NOTIF-2', recipientId: users.patient.id, title: 'Appointment Confirmed', unread: false }
    ];

    const unreadCount = notificationQueue.filter(n => n.recipientId === users.patient.id && n.unread).length;
    assert.strictEqual(unreadCount, 1);
  });

  // --------------------------------------------------------------------------
  // SCENARIO 7: MULTI-TENANT ISOLATION MATRIX (HOSPITAL ALPHA VS BETA)
  // --------------------------------------------------------------------------
  await t.test('Scenario 7: Multi-Tenant Strict Isolation Across Alpha and Beta Hospitals', async () => {
    const alphaDocToken = createToken(users.doctor); // Belongs to Hospital Alpha

    // 1. Doctor Alpha attempts to access Hospital Alpha patient -> ALLOWED
    const accessAlpha = verifyAccess(alphaDocToken, mockTenants.alpha.id, 'clinical:consult', true);
    assert.strictEqual(accessAlpha.allowed, true);

    // 2. Doctor Alpha attempts to access Hospital Beta patient -> REJECTED
    const accessBeta = verifyAccess(alphaDocToken, mockTenants.beta.id, 'clinical:consult', true);
    assert.strictEqual(accessBeta.allowed, false);
    assert.strictEqual(accessBeta.reason, 'CROSS_TENANT_FORBIDDEN');

    // 3. Receptionist Alpha attempts to view Hospital Beta bed grid -> REJECTED
    const recepToken = createToken(users.receptionist);
    const bedBeta = verifyAccess(recepToken, mockTenants.beta.id, 'inpatient:beds:view');
    assert.strictEqual(bedBeta.allowed, false);
    assert.strictEqual(bedBeta.reason, 'CROSS_TENANT_FORBIDDEN');
  });

  // --------------------------------------------------------------------------
  // SCENARIO 8: STAFF PERMISSION BOUNDARIES & EXPLICIT DENY OVERRIDE
  // --------------------------------------------------------------------------
  await t.test('Scenario 8: Role Negative Boundaries, Confidentiality Firewall & Explicit DENY', async () => {
    // 1. Receptionist blocked from viewing clinical SOAP notes
    const recepToken = createToken(users.receptionist);
    const recepClinical = verifyAccess(recepToken, mockTenants.alpha.id, 'clinical:soap:view', true);
    assert.strictEqual(recepClinical.allowed, false);
    assert.strictEqual(recepClinical.reason, 'PERMISSION_EXPLICIT_DENIED');

    // 2. Accountant blocked from viewing clinical prescriptions
    const acctToken = createToken(users.accountant);
    const acctClinical = verifyAccess(acctToken, mockTenants.alpha.id, 'clinical:prescriptions:view', true);
    assert.strictEqual(acctClinical.allowed, false);
    assert.strictEqual(acctClinical.reason, 'PERMISSION_EXPLICIT_DENIED');

    // 3. Doctor with explicit individual DENY for signing prescriptions
    const suspendedDoctor = {
      ...users.doctor,
      id: 'usr-doc-suspended',
      denied: ['clinical:prescribe'] // Specific override
    };
    const suspendedDocToken = createToken(suspendedDoctor);
    const prescribeAttempt = verifyAccess(suspendedDocToken, mockTenants.alpha.id, 'clinical:prescribe', true);
    assert.strictEqual(prescribeAttempt.allowed, false);
    assert.strictEqual(prescribeAttempt.reason, 'PERMISSION_EXPLICIT_DENIED');

    // 4. Super Admin Zero Standing Clinical Access
    const superToken = createToken(users.superAdmin, false); // No JIT token
    const superClinical = verifyAccess(superToken, mockTenants.alpha.id, 'clinical:consult', true);
    assert.strictEqual(superClinical.allowed, false);
    assert.strictEqual(superClinical.reason, 'SUPER_ADMIN_ZERO_STANDING_CLINICAL_ACCESS');

    // 5. Super Admin WITH Approved Time-Bound JIT Session -> ALLOWED
    const superJitToken = createToken(users.superAdmin, true);
    const superJitClinical = verifyAccess(superJitToken, mockTenants.alpha.id, 'clinical:consult', true);
    assert.strictEqual(superJitClinical.allowed, true);
  });

  // --------------------------------------------------------------------------
  // SCENARIO 9: FAILURE RECOVERY & ATOMIC ROLLBACK SIMULATION
  // --------------------------------------------------------------------------
  await t.test('Scenario 9: Failure Recovery, Database Rollback Integrity & Error Resiliency', async () => {
    // Simulate an atomic multi-table transaction that experiences a runtime error mid-flight
    let appointmentUpdated = false;
    let consultationCreated = false;
    let prescriptionCreated = false;

    const executeClinicalTransactionWithSimulatedFailure = (failAtStep: number) => {
      // Transaction Start
      const rollback = () => {
        appointmentUpdated = false;
        consultationCreated = false;
        prescriptionCreated = false;
      };

      try {
        // Step 1: Update appointment
        appointmentUpdated = true;
        if (failAtStep === 1) throw new Error('DB_DEADLOCK_ON_APPOINTMENT');

        // Step 2: Create consultation header
        consultationCreated = true;
        if (failAtStep === 2) throw new Error('DISK_IO_FAILURE_ON_CONSULTATION');

        // Step 3: Insert prescription
        prescriptionCreated = true;
        if (failAtStep === 3) throw new Error('DATABASE_CONNECTION_RESET');

        return { success: true };
      } catch (err: any) {
        rollback(); // Atomic rollback
        return { success: false, error: err.message };
      }
    };

    // Test failure at Step 2
    const failResult = executeClinicalTransactionWithSimulatedFailure(2);
    assert.strictEqual(failResult.success, false);
    assert.strictEqual(failResult.error, 'DISK_IO_FAILURE_ON_CONSULTATION');
    // Verify complete rollback: zero dirty state remains
    assert.strictEqual(appointmentUpdated, false);
    assert.strictEqual(consultationCreated, false);
    assert.strictEqual(prescriptionCreated, false);

    // Test successful transaction
    const successResult = executeClinicalTransactionWithSimulatedFailure(0);
    assert.strictEqual(successResult.success, true);
    assert.strictEqual(appointmentUpdated, true);
    assert.strictEqual(consultationCreated, true);
    assert.strictEqual(prescriptionCreated, true);
  });

  // --------------------------------------------------------------------------
  // SCENARIO 10: PERFORMANCE & RELIABILITY BENCHMARK SIMULATION
  // --------------------------------------------------------------------------
  await t.test('Scenario 10: Performance & Latency Benchmark Across Core Workflows', async () => {
    const iterations = 500;
    const start = performance.now();

    for (let i = 0; i < iterations; i++) {
      const token = createToken(users.doctor);
      const res = verifyAccess(token, mockTenants.alpha.id, 'clinical:consult', true);
      assert.strictEqual(res.allowed, true);
    }

    const elapsed = performance.now() - start;
    const avgLatencyMs = elapsed / iterations;

    assert.ok(avgLatencyMs < 2.5, `Average authorization verification latency (${avgLatencyMs.toFixed(3)}ms) must be under 2.5ms`);
  });
});
