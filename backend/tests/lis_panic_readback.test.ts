import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { LisPanicReadbackService } from '../src/modules/diagnostics/lis-panic-readback.service';

describe('ASRTAVA P1-02: Laboratory Panic-Value Alert & Telephone Read-Back Protocol Suite', () => {
  const hospitalId = 'hosp-pilot-main-01';

  beforeEach(() => {
    LisPanicReadbackService.clearState();
  });

  it('1. Generates CRITICAL_PANIC alert bypassing quiet-hours for severely high potassium', () => {
    const alert = LisPanicReadbackService.evaluateResultAndCreateAlert({
      hospitalId,
      specimenId: 'spec-serum-9901',
      orderId: 'ord-lis-4412',
      patientId: 'pat-icu-8812',
      uhid: 'UHID-2026-ICU-8812',
      patientName: 'Ramesh Sharma',
      wardId: 'WARD-ICU-A',
      bedNumber: 'ICU-BED-04',
      parameterCode: 'POTASSIUM',
      observedValue: 6.8, // Critical high (> 6.2)
      treatingClinicianId: 'usr-doc-cardio-01',
      treatingClinicianName: 'Dr. Anita Desai',
      clinicianMobile: '+919876543210',
      wardIntercom: 'EXT-402',
    });

    assert.ok(alert, 'Panic alert must be generated');
    assert.strictEqual(alert.severity, 'CRITICAL_PANIC');
    assert.strictEqual(alert.status, 'PENDING_READBACK');
    assert.strictEqual(alert.quietHoursBypassed, true);
    assert.ok(alert.criticalLimitBreached.includes('ABOVE CRITICAL HIGH'));
    assert.strictEqual(alert.wardIntercom, 'EXT-402');
    assert.ok(alert.auditChecksum.length === 64, 'Must have SHA-256 audit checksum');
  });

  it('2. Does not generate panic alert for normal laboratory parameter values', () => {
    const alert = LisPanicReadbackService.evaluateResultAndCreateAlert({
      hospitalId,
      specimenId: 'spec-serum-9902',
      orderId: 'ord-lis-4413',
      patientId: 'pat-opd-1102',
      uhid: 'UHID-2026-OPD-1102',
      patientName: 'Suresh Patel',
      wardId: 'WARD-OPD-GEN',
      parameterCode: 'POTASSIUM',
      observedValue: 4.2, // Normal
      treatingClinicianId: 'usr-doc-gen-01',
      treatingClinicianName: 'Dr. Vivek Roy',
    });

    assert.strictEqual(alert, null, 'Normal result must not generate panic alert');
  });

  it('3. Rejects verbal telephone read-back when transcript does not match lab result', () => {
    const alert = LisPanicReadbackService.evaluateResultAndCreateAlert({
      hospitalId,
      specimenId: 'spec-serum-9903',
      orderId: 'ord-lis-4414',
      patientId: 'pat-cardio-09',
      uhid: 'UHID-2026-CARD-09',
      patientName: 'Kavita Reddy',
      wardId: 'WARD-CCU',
      parameterCode: 'TROPONIN_I',
      observedValue: 0.18, // Critical (> 0.04)
      treatingClinicianId: 'usr-doc-cardio-02',
      treatingClinicianName: 'Dr. Rajesh Rao',
      wardIntercom: 'EXT-305',
    })!;

    assert.throws(
      () => {
        LisPanicReadbackService.recordVerbalReadBack({
          alertId: alert.alertId,
          callerStaffId: 'usr-lab-tech-01',
          callerStaffName: 'Pooja Verma (Sr. Technologist)',
          receivingClinicianId: 'usr-doc-cardio-02',
          receivingClinicianName: 'Dr. Rajesh Rao',
          receivingClinicianDesignation: 'Consultant Cardiologist',
          verbalReadBackTranscript: 'Read back: Platelets are 150000', // Completely wrong parameter and value!
          phoneOrIntercomUsed: 'EXT-305',
        });
      },
      /VERBAL_READBACK_MISMATCH/,
      'Must reject mismatched verbal read-back'
    );
  });

  it('4. Successfully closes alert upon verified telephone read-back with complete audit details', () => {
    const alert = LisPanicReadbackService.evaluateResultAndCreateAlert({
      hospitalId,
      specimenId: 'spec-serum-9904',
      orderId: 'ord-lis-4415',
      patientId: 'pat-cardio-10',
      uhid: 'UHID-2026-CARD-10',
      patientName: 'Kavita Reddy',
      wardId: 'WARD-CCU',
      parameterCode: 'TROPONIN_I',
      observedValue: 0.18,
      treatingClinicianId: 'usr-doc-cardio-02',
      treatingClinicianName: 'Dr. Rajesh Rao',
      wardIntercom: 'EXT-305',
    })!;

    const initialChecksum = alert.auditChecksum;

    const closed = LisPanicReadbackService.recordVerbalReadBack({
      alertId: alert.alertId,
      callerStaffId: 'usr-lab-tech-01',
      callerStaffName: 'Pooja Verma (Sr. Technologist)',
      receivingClinicianId: 'usr-doc-cardio-02',
      receivingClinicianName: 'Dr. Rajesh Rao',
      receivingClinicianDesignation: 'Consultant Cardiologist',
      verbalReadBackTranscript: 'Confirmed repeat read-back for Kavita Reddy UHID-2026-CARD-10: Troponin I is 0.18 ng/mL. Initiating ACS protocol immediately.',
      phoneOrIntercomUsed: 'EXT-305',
      notes: 'Bedside echocardiogram and heparin bolus ordered.',
    });

    assert.strictEqual(closed.status, 'VERBAL_READBACK_COMPLETED');
    assert.ok(closed.readBackRecord, 'Read-back record must be attached');
    assert.strictEqual(closed.readBackRecord.readBackMatchesResult, true);
    assert.strictEqual(closed.readBackRecord.callerStaffName, 'Pooja Verma (Sr. Technologist)');
    assert.strictEqual(closed.readBackRecord.receivingClinicianName, 'Dr. Rajesh Rao');
    assert.notStrictEqual(closed.auditChecksum, initialChecksum, 'Audit checksum must be chained with read-back hash');
  });

  it('5. Enforces automated escalation to Department Head when 15-minute SLA expires without read-back', () => {
    const alert = LisPanicReadbackService.evaluateResultAndCreateAlert({
      hospitalId,
      specimenId: 'spec-serum-9905',
      orderId: 'ord-lis-4416',
      patientId: 'pat-icu-99',
      uhid: 'UHID-2026-ICU-99',
      patientName: 'Sunil Gupta',
      wardId: 'WARD-ICU-B',
      parameterCode: 'GLUCOSE',
      observedValue: 32, // Severe hypoglycemia (< 45)
      treatingClinicianId: 'usr-doc-icu-03',
      treatingClinicianName: 'Dr. Vikram Nair',
      wardIntercom: 'EXT-410',
    })!;

    // Simulate 16 minutes later
    const futureTime = new Date(new Date(alert.alertCreatedAt).getTime() + 16 * 60 * 1000);
    const escalated = LisPanicReadbackService.checkAndEscalatePendingAlerts(futureTime, 'usr-cmo-hod-01');

    assert.strictEqual(escalated.length, 1);
    assert.strictEqual(escalated[0].alertId, alert.alertId);
    assert.strictEqual(escalated[0].status, 'ESCALATED');
    assert.strictEqual(escalated[0].escalatedToUserId, 'usr-cmo-hod-01');
    assert.ok(escalated[0].escalationReason?.includes('15-minute critical alert SLA breached'));
  });
});
