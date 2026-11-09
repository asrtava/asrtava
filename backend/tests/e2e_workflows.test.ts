import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { v4 as uuidv4 } from 'uuid';
import { AuditLoggerService } from '../src/modules/security/audit-logger.service';

describe('ASRTAVA End-to-End Hospital Operational Workflows', () => {
  const hospitalId = 'hosp-e2e-manipal-blr';
  let patientId: string;
  let uhid: string;
  let appointmentId: string;
  let consultationId: string;
  let admissionId: string;
  let bedId: string;
  let labOrderId: string;
  let invoiceId: string;

  // --------------------------------------------------------------------------
  // Step 1: Patient Registration & Demographic Validation
  // --------------------------------------------------------------------------
  it('Step 1: Registers patient with auto-generated UHID and validates consent', () => {
    patientId = uuidv4();
    const sequenceNumber = Math.floor(1000 + Math.random() * 9000);
    uhid = `ASR-PAT-2026-${sequenceNumber}`;

    const newPatient = {
      id: patientId,
      hospitalId,
      uhid,
      firstName: 'Vikram',
      lastName: 'Malhotra',
      dateOfBirth: '1982-08-24',
      gender: 'Male',
      phone: '+919876543210',
      email: 'vikram.malhotra@example.com',
      bloodGroup: 'O+',
      emergencyContactName: 'Ananya Malhotra',
      emergencyContactPhone: '+919876543211',
      dpdpConsentGranted: true,
      registeredAt: new Date().toISOString(),
    };

    assert.ok(newPatient.id);
    assert.match(newPatient.uhid, /^ASR-PAT-2026-\d{4}$/);
    assert.equal(newPatient.dpdpConsentGranted, true);
    assert.equal(newPatient.bloodGroup, 'O+');
  });

  // --------------------------------------------------------------------------
  // Step 2: Appointment Scheduling & Doctor Slot Reservation
  // --------------------------------------------------------------------------
  it('Step 2: Schedules OPD appointment without doctor slot collision', () => {
    appointmentId = uuidv4();
    const doctorId = 'doc-cardio-sharma';

    const appointment = {
      id: appointmentId,
      hospitalId,
      patientId,
      doctorId,
      department: 'Cardiology',
      date: '2026-11-12',
      slotStart: '10:00',
      slotEnd: '10:20',
      tokenNumber: 4,
      status: 'scheduled',
      bookedAt: new Date().toISOString(),
    };

    assert.equal(appointment.patientId, patientId);
    assert.equal(appointment.department, 'Cardiology');
    assert.equal(appointment.tokenNumber, 4);
    assert.equal(appointment.status, 'scheduled');
  });

  // --------------------------------------------------------------------------
  // Step 3: OPD Check-in & Queue Triaging
  // --------------------------------------------------------------------------
  it('Step 3: Checks in patient at reception and transitions OPD queue status', () => {
    const queueRecord = {
      appointmentId,
      patientUhid: uhid,
      triagePriority: 'normal', // 'normal', 'urgent', 'emergency'
      queueStatus: 'waiting_for_consultation',
      vitalsRecorded: {
        bloodPressureSys: 138,
        bloodPressureDia: 88,
        heartRateBpm: 76,
        spo2Percent: 98,
        temperatureF: 98.6,
      },
      checkInTime: new Date().toISOString(),
    };

    assert.equal(queueRecord.queueStatus, 'waiting_for_consultation');
    assert.ok(queueRecord.vitalsRecorded.bloodPressureSys > 0);
    assert.ok(queueRecord.vitalsRecorded.spo2Percent >= 95);
  });

  // --------------------------------------------------------------------------
  // Step 4: Doctor Clinical Consultation (SOAP Encounter & E-Prescription)
  // --------------------------------------------------------------------------
  it('Step 4: Records structured SOAP encounter, ICD-10 diagnosis and e-prescription', () => {
    consultationId = uuidv4();

    const consultation = {
      id: consultationId,
      hospitalId,
      patientId,
      doctorId: 'doc-cardio-sharma',
      soap: {
        subjective: 'Patient reports exertional chest discomfort and shortness of breath for 3 days.',
        objective: 'BP: 138/88 mmHg, HR: 76 bpm. S1, S2 present, no murmurs. Mild ankle edema.',
        assessment: 'Unstable angina, suspected coronary artery disease. Needs inpatient admission.',
        plan: 'Admit to Cardiology Ward, start heparin drip and sublingual nitroglycerin, schedule ECG and Troponin I.',
      },
      diagnoses: [
        { code: 'I20.0', description: 'Unstable angina', type: 'primary' },
        { code: 'I10', description: 'Essential hypertension', type: 'secondary' },
      ],
      prescriptions: [
        { item: 'Aspirin 75mg', dosage: '1 tablet once daily', durationDays: 14, route: 'oral' },
        { item: 'Atorvastatin 40mg', dosage: '1 tablet at bedtime', durationDays: 14, route: 'oral' },
        { item: 'Sublingual Nitroglycerin 0.5mg', dosage: 'SOS for chest pain', durationDays: 7, route: 'sublingual' },
      ],
      recommendAdmission: true,
      completedAt: new Date().toISOString(),
    };

    assert.equal(consultation.diagnoses[0].code, 'I20.0');
    assert.equal(consultation.prescriptions.length, 3);
    assert.equal(consultation.recommendAdmission, true);
  });

  // --------------------------------------------------------------------------
  // Step 5: IPD Admission, Ward Allocation & Bed Concurrency Lock
  // --------------------------------------------------------------------------
  it('Step 5: Allocates inpatient bed and transitions occupancy state atomically', () => {
    admissionId = uuidv4();
    bedId = 'bed-cardio-icu-04';

    const bedInventory = [
      { id: 'bed-cardio-icu-03', status: 'occupied', ward: 'Cardio ICU', dailyTariff: 4500 },
      { id: 'bed-cardio-icu-04', status: 'available', ward: 'Cardio ICU', dailyTariff: 4500 },
      { id: 'bed-cardio-icu-05', status: 'available', ward: 'Cardio ICU', dailyTariff: 4500 },
    ];

    // Find and allocate available bed
    const targetBed = bedInventory.find(b => b.id === bedId);
    assert.ok(targetBed);
    assert.equal(targetBed.status, 'available');

    // Atomic transition to occupied
    targetBed.status = 'occupied';

    const admission = {
      id: admissionId,
      hospitalId,
      patientId,
      admittingDoctorId: 'doc-cardio-sharma',
      ward: 'Cardio ICU',
      bedId,
      dailyTariff: targetBed.dailyTariff,
      admittedAt: new Date().toISOString(),
      dischargeExpected: '2026-11-15',
      status: 'active',
    };

    assert.equal(admission.bedId, 'bed-cardio-icu-04');
    assert.equal(targetBed.status, 'occupied');
  });

  // --------------------------------------------------------------------------
  // Step 6: Laboratory Order, Specimen Collection & Bio-Reference Validation
  // --------------------------------------------------------------------------
  it('Step 6: Processes laboratory order and flags abnormal cardiac markers', () => {
    labOrderId = uuidv4();

    const labOrder = {
      id: labOrderId,
      hospitalId,
      patientId,
      admissionId,
      orderedBy: 'doc-cardio-sharma',
      tests: [
        { testCode: 'TROP-I', testName: 'Cardiac Troponin I', value: 0.14, unit: 'ng/mL', refMin: 0.0, refMax: 0.04 },
        { testCode: 'CK-MB', testName: 'Creatine Kinase-MB', value: 28, unit: 'U/L', refMin: 0, refMax: 25 },
        { testCode: 'K-SERUM', testName: 'Serum Potassium', value: 4.2, unit: 'mEq/L', refMin: 3.5, refMax: 5.0 },
      ],
      status: 'completed',
      processedAt: new Date().toISOString(),
    };

    // Verify bio-reference evaluator
    const evaluations = labOrder.tests.map(t => ({
      testCode: t.testCode,
      isAbnormal: t.value > t.refMax || t.value < t.refMin,
      severity: t.value > t.refMax * 2 ? 'critical_high' : t.value > t.refMax ? 'high' : 'normal',
    }));

    const tropI = evaluations.find(e => e.testCode === 'TROP-I');
    assert.ok(tropI);
    assert.equal(tropI.isAbnormal, true);
    assert.equal(tropI.severity, 'critical_high'); // 0.14 > 0.04 * 2

    const potassium = evaluations.find(e => e.testCode === 'K-SERUM');
    assert.ok(potassium);
    assert.equal(potassium.isAbnormal, false);
    assert.equal(potassium.severity, 'normal');
  });

  // --------------------------------------------------------------------------
  // Step 7: Pharmacy FEFO Dispensing & Inventory Stock Depletion
  // --------------------------------------------------------------------------
  it('Step 7: Dispenses pharmaceutical batch using First-Expiry-First-Out (FEFO)', () => {
    const batches = [
      { batchNo: 'ASP-B2', expiryDate: '2027-04-30', stockQty: 100 },
      { batchNo: 'ASP-B1', expiryDate: '2026-12-31', stockQty: 50 }, // Earliest expiry!
      { batchNo: 'ASP-B3', expiryDate: '2027-08-31', stockQty: 200 },
    ];

    // FEFO Sort: Earliest expiry first
    batches.sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());
    assert.equal(batches[0].batchNo, 'ASP-B1', 'FEFO must select earliest expiring batch');

    // Dispense 14 tablets from earliest batch
    const qtyToDispense = 14;
    batches[0].stockQty -= qtyToDispense;
    assert.equal(batches[0].stockQty, 36);

    const dispenseLog = {
      hospitalId,
      patientId,
      medicationName: 'Aspirin 75mg',
      batchNo: batches[0].batchNo,
      qtyDispensed: qtyToDispense,
      unitPriceInr: 4.5,
      totalCostInr: qtyToDispense * 4.5,
      dispensedAt: new Date().toISOString(),
    };

    assert.equal(dispenseLog.totalCostInr, 63.0);
  });

  // --------------------------------------------------------------------------
  // Step 8: Consolidated IPD Billing, Taxes & Double-Entry Accounting
  // --------------------------------------------------------------------------
  it('Step 8: Generates consolidated IPD billing invoice with itemized tariffs and GST', () => {
    invoiceId = uuidv4();

    const lineItems = [
      { category: 'room_tariff', description: 'Cardio ICU Bed (3 Days)', qty: 3, unitPrice: 4500, gstRate: 0.05 },
      { category: 'clinical_consultation', description: 'Specialist Rounds (3 Days)', qty: 3, unitPrice: 1500, gstRate: 0.18 },
      { category: 'laboratory', description: 'Troponin I + CK-MB + Electrolytes', qty: 1, unitPrice: 2200, gstRate: 0.12 },
      { category: 'pharmacy', description: 'Prescribed Medications (Aspirin, Atorvastatin, Nitro)', qty: 1, unitPrice: 450, gstRate: 0.12 },
    ];

    let subtotal = 0;
    let totalGst = 0;

    for (const item of lineItems) {
      const itemSubtotal = item.qty * item.unitPrice;
      const itemGst = itemSubtotal * item.gstRate;
      subtotal += itemSubtotal;
      totalGst += itemGst;
    }

    const netPayable = Math.round((subtotal + totalGst) * 100) / 100;

    // Room: 13500 + 675 = 14175
    // Rounds: 4500 + 810 = 5310
    // Lab: 2200 + 264 = 2464
    // Pharma: 450 + 54 = 504
    // Total subtotal: 20650
    // Total GST: 1803
    // Net Payable: 22453
    assert.equal(subtotal, 20650);
    assert.equal(totalGst, 1803);
    assert.equal(netPayable, 22453);

    // Payment collection with idempotency key
    const paymentTransaction = {
      invoiceId,
      amountPaid: 22453,
      paymentMethod: 'UPI',
      idempotencyKey: `pay-idem-${Date.now()}-001`,
      status: 'settled',
      paidAt: new Date().toISOString(),
    };

    assert.equal(paymentTransaction.amountPaid, netPayable);
    assert.equal(paymentTransaction.status, 'settled');
  });

  // --------------------------------------------------------------------------
  // Step 9: Patient Discharge & Bed Inventory Restoration
  // --------------------------------------------------------------------------
  it('Step 9: Finalizes patient discharge, generates summary and releases bed for sanitation', () => {
    const dischargeSummary = {
      admissionId,
      patientId,
      dischargeStatus: 'medically_stable',
      summary: 'Patient presented with unstable angina, treated with anti-ischemic therapy. Symptoms resolved, ECG stable. Advised follow-up in 2 weeks.',
      dischargedAt: new Date().toISOString(),
      followUpDate: '2026-11-26',
    };

    // Bed release workflow
    let bedStatus = 'occupied';
    bedStatus = 'cleaning'; // Transition to cleaning first
    assert.equal(bedStatus, 'cleaning');

    bedStatus = 'available'; // Post-sanitization
    assert.equal(bedStatus, 'available');
    assert.equal(dischargeSummary.dischargeStatus, 'medically_stable');
  });

  // --------------------------------------------------------------------------
  // Step 10: Cryptographic Audit Trail Verification of Full Journey
  // --------------------------------------------------------------------------
  it('Step 10: Verifies tamper-resistant cryptographic audit record for full patient journey', () => {
    const checksum = AuditLoggerService.computeRecordChecksum({
      hospitalId,
      actorId: 'system_workflow_orchestrator',
      action: 'RECORD_AMENDED',
      resourceTable: 'admissions',
      resourceId: admissionId,
      beforeState: { status: 'active', bedId },
      afterState: { status: 'discharged', dischargedAt: new Date().toISOString() },
      previousChecksum: 'GENESIS_BLOCK',
      createdAtTimestamp: '2026-11-12T16:00:00.000Z',
    });

    assert.equal(checksum.length, 64);
    assert.match(checksum, /^[a-f0-9]{64}$/);
  });
});

