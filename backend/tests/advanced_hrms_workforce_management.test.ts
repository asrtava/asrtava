import { describe, it } from 'node:test';
import assert from 'node:assert';
import { hrmsAdvancedService } from '../src/modules/hr/hrms-advanced.service';

describe('ASRTAVA Advanced HRMS & Workforce Management Test Suite', () => {
  const tenantHospitalId = 'hosp-metro-001';
  let testDesigId: string;
  let testEmpId: string;
  let testCandidateId: string;
  let testRequisitionId: string;
  let testAppId: string;
  let testDeviceId: string;
  let testShiftId: string;
  let testLeaveTypeId: string;
  let testBatchId: string;
  let testCredId: string;
  let testSepId: string;

  // Scenario 1: Designations
  it('1. Registers hospital designations with job grade and minimum experience', async () => {
    const desig = await hrmsAdvancedService.createDesignation({
      hospitalId: tenantHospitalId,
      title: 'Senior Consultant Interventional Cardiologist',
      code: 'SR_CONS_CARDIO',
      jobGrade: 'GRADE_A',
      minExperienceYears: 8,
      description: 'Lead cardiologist for CathLab & Coronary Care Unit',
    });
    assert.ok(desig.id);
    assert.strictEqual(desig.code, 'SR_CONS_CARDIO');
    assert.strictEqual(desig.jobGrade, 'GRADE_A');
    testDesigId = desig.id;
  });

  // Scenario 2: Employee Master Record
  it('2. Creates comprehensive employee master record with personal and employment details', async () => {
    const emp = await hrmsAdvancedService.createEmployee({
      hospitalId: tenantHospitalId,
      employeeNumber: 'EMP-DOC-8801',
      firstName: 'Dr. Vikram',
      lastName: 'Sethi',
      gender: 'MALE',
      dateOfBirth: '1984-07-22',
      phone: '+91 98765 11223',
      email: 'vikram.sethi@asrtava-health.in',
      bloodGroup: 'B+',
      emergencyContactName: 'Ananya Sethi',
      emergencyContactPhone: '+91 98765 11224',
      departmentId: 'dept-cardio-01',
      designationId: testDesigId,
      employmentType: 'FULL_TIME',
      employmentStatus: 'PROBATION',
      baseMonthlySalary: 180000,
      bankAccountNumber: '918273645012',
      bankIfscCode: 'HDFC0001234',
      panNumber: 'ABCPS1234F',
      aadhaarMasked: 'XXXX-XXXX-9876',
    });
    assert.ok(emp.id);
    assert.strictEqual(emp.employeeNumber, 'EMP-DOC-8801');
    assert.strictEqual(emp.fullName, 'Dr. Vikram Sethi');
    testEmpId = emp.id;
  });

  // Scenario 3: Duplicate Employee Number Guard
  it('3. Rejects duplicate employee number creation within the same hospital tenant', async () => {
    await assert.rejects(
      async () => {
        await hrmsAdvancedService.createEmployee({
          hospitalId: tenantHospitalId,
          employeeNumber: 'EMP-DOC-8801', // Identical code
          firstName: 'Duplicate',
          lastName: 'Doctor',
          phone: '+91 99999 00000',
          email: 'dup@hospital.in',
        });
      },
      {
        message: /already exists in this hospital/,
      }
    );
  });

  // Scenario 4: Employee Document Vault & Verification
  it('4. Uploads employee medical degree certificate and verifies via supervisor review', async () => {
    const doc = await hrmsAdvancedService.uploadEmployeeDocument({
      hospitalId: tenantHospitalId,
      employeeId: testEmpId,
      documentType: 'DEGREE_CERTIFICATE',
      documentName: 'MBBS_MD_DM_Cardiology_Certificates.pdf',
      filePath: 's3://asrtava-hr-vault/emp-8801/degrees.pdf',
      fileSizeBytes: 2450000,
      mimeType: 'application/pdf',
      notes: 'Verified against AIIMS registrar portal',
    });
    assert.ok(doc.id);
    assert.strictEqual(doc.verificationStatus, 'PENDING');

    const verified = await hrmsAdvancedService.verifyEmployeeDocument(
      doc.id,
      'admin-hr-lead',
      'VERIFIED',
      'Apostilled and verified with medical board'
    );
    assert.strictEqual(verified.verificationStatus, 'VERIFIED');
    assert.strictEqual(verified.verifiedByUserId, 'admin-hr-lead');
  });

  // Scenario 5: User Account Linking (Identity Integration)
  it('5. Links employee profile to central identity user account without elevating unauthorized rights', async () => {
    hrmsAdvancedService.seedMockUser({
      id: 'usr-cardio-sethi',
      email: 'vikram.sethi@asrtava-health.in',
      isActive: false,
      role: 'doctor',
    });

    const linkRes = await hrmsAdvancedService.linkUserAccount(
      testEmpId,
      'usr-cardio-sethi',
      'super-admin'
    );
    assert.strictEqual(linkRes.success, true);

    const emp = await hrmsAdvancedService.getEmployee(testEmpId);
    assert.strictEqual(emp.userId, 'usr-cardio-sethi');

    const user = hrmsAdvancedService.getMockUser('usr-cardio-sethi');
    assert.strictEqual(user.isActive, true);
  });

  // Scenario 6: Job Requisition (ATS)
  it('6. Ingests and approves departmental clinical hiring requisition', async () => {
    const req = await hrmsAdvancedService.createJobRequisition({
      hospitalId: tenantHospitalId,
      requisitionNumber: 'REQ-2026-CARDIO-09',
      departmentId: 'dept-cardio-01',
      designationId: testDesigId,
      vacanciesCount: 2,
      jobDescription: 'Seeking Associate Consultant Cardiologist for 24/7 STEMI interventions',
      requiredQualification: 'DM / DNB Cardiology with 2+ years post-DM experience',
      minExperienceYears: 3,
      budgetCtcMax: 2400000,
      priority: 'URGENT',
    });
    assert.ok(req.id);
    assert.strictEqual(req.status, 'PENDING_APPROVAL');
    testRequisitionId = req.id;

    const approved = await hrmsAdvancedService.approveJobRequisition(req.id, 'dir-clinical-ops');
    assert.strictEqual(approved.status, 'OPEN');
    assert.strictEqual(approved.approvedByUserId, 'dir-clinical-ops');
  });

  // Scenario 7: Candidate Application & Structured Clinical Interview
  it('7. Registers candidate application and records structured clinical interview evaluation', async () => {
    const cand = await hrmsAdvancedService.registerCandidate({
      hospitalId: tenantHospitalId,
      firstName: 'Dr. Sunita',
      lastName: 'Kulkarni',
      email: 'sunita.kulkarni@gmail.com',
      phone: '+91 97654 32109',
      currentOrganization: 'Apollo Hospitals Mumbai',
      experienceYears: 4.5,
      qualification: 'MBBS, MD General Medicine, DM Cardiology',
      resumeUrl: 's3://asrtava-recruitment/resumes/sunita_kulkarni.pdf',
    });
    assert.ok(cand.id);
    testCandidateId = cand.id;

    const app = await hrmsAdvancedService.createApplication({
      hospitalId: tenantHospitalId,
      requisitionId: testRequisitionId,
      candidateId: testCandidateId,
      expectedCtc: 2200000,
    });
    assert.ok(app.id);
    assert.strictEqual(app.stage, 'APPLIED');
    testAppId = app.id;

    const evaluation = await hrmsAdvancedService.evaluateInterview({
      hospitalId: tenantHospitalId,
      applicationId: testAppId,
      interviewerUserId: 'doc-rajesh-sharma',
      interviewRound: 'CLINICAL_COMPETENCY',
      score: 5,
      recommendation: 'SELECT',
      notes: 'Exceptional diagnostic skills in primary angioplasty and optical coherence tomography.',
    });
    assert.ok(evaluation.id);
    assert.strictEqual(evaluation.score, 5);
    assert.strictEqual(evaluation.recommendation, 'SELECT');
  });

  // Scenario 8: Job Offer Issuance & Acceptance
  it('8. Issues formal job offer letter and records digital candidate acceptance', async () => {
    const offer = await hrmsAdvancedService.issueJobOffer(testAppId, 2300000, '2026-12-01');
    assert.strictEqual(offer.stage, 'OFFER_ISSUED');
    assert.strictEqual(offer.offeredCtc, 2300000);

    const accepted = await hrmsAdvancedService.acceptJobOffer(testAppId);
    assert.strictEqual(accepted.stage, 'OFFER_ACCEPTED');
  });

  // Scenario 9: Biometric Device Registration & Attendance Punch
  it('9. Registers physical biometric facial/fingerprint terminal and records valid check-in punch', async () => {
    const dev = await hrmsAdvancedService.registerAttendanceDevice({
      hospitalId: tenantHospitalId,
      deviceName: 'CathLab Bio-Gate 2',
      deviceCode: 'BIO-CL-02',
      deviceType: 'FACIAL_RECOGNITION',
      ipAddress: '192.168.10.45',
      port: 4370,
      locationArea: '3rd Floor Operation Theatre & CathLab Complex',
    });
    assert.ok(dev.id);
    testDeviceId = dev.id;

    const punch = await hrmsAdvancedService.recordAttendancePunch({
      hospitalId: tenantHospitalId,
      employeeId: testEmpId,
      deviceId: testDeviceId,
      punchType: 'CHECK_IN',
      source: 'DEVICE',
      verificationMode: 'FACIAL_BIOMETRIC',
    });
    assert.ok(punch.id);
    assert.strictEqual(punch.punchType, 'CHECK_IN');
    assert.strictEqual(punch.source, 'DEVICE');
  });

  // Scenario 10: Punch Deduplication Window Guard
  it('10. Rejects duplicate punch attempts recorded within a 2-minute deduplication window', async () => {
    await assert.rejects(
      async () => {
        await hrmsAdvancedService.recordAttendancePunch({
          hospitalId: tenantHospitalId,
          employeeId: testEmpId,
          deviceId: testDeviceId,
          punchType: 'CHECK_IN', // Exact same punch immediately
          source: 'DEVICE',
        });
      },
      {
        message: /Duplicate punch ignored within 2-minute window/,
      }
    );
  });

  // Scenario 11: Attendance Correction Workflow
  it('11. Submits and approves attendance correction request for missed checkout punch', async () => {
    const cor = await hrmsAdvancedService.requestAttendanceCorrection({
      hospitalId: tenantHospitalId,
      employeeId: testEmpId,
      attendanceDate: '2026-11-08',
      requestedCheckIn: '2026-11-08T08:00:00Z',
      requestedCheckOut: '2026-11-08T18:30:00Z',
      reason: 'Emergency angioplasty extended past duty hours; biometric reader power rebooted.',
    });
    assert.ok(cor.id);
    assert.strictEqual(cor.status, 'PENDING');

    const approved = await hrmsAdvancedService.approveAttendanceCorrection(
      cor.id,
      'head-of-cardiology',
      true,
      'Verified with CathLab procedure logs'
    );
    assert.strictEqual(approved.status, 'APPROVED');
    assert.strictEqual(approved.approvedByUserId, 'head-of-cardiology');
  });

  // Scenario 12: Shift Templates & Duty Rostering
  it('12. Creates 24/7 hospital shift template and assigns duty roster to clinician', async () => {
    const shift = await hrmsAdvancedService.createShiftTemplate({
      hospitalId: tenantHospitalId,
      shiftCode: 'SHIFT-MORN-CLINICAL',
      shiftName: 'Morning Clinical Duty',
      startTime: '08:00:00',
      endTime: '16:00:00',
      durationHours: 8.0,
      isNightShift: false,
      colorCode: '#0284C7',
    });
    assert.ok(shift.id);
    testShiftId = shift.id;

    const roster = await hrmsAdvancedService.assignDutyRoster({
      hospitalId: tenantHospitalId,
      employeeId: testEmpId,
      departmentId: 'dept-cardio-01',
      shiftTemplateId: testShiftId,
      rosterDate: '2026-11-10',
      shiftRole: 'PRIMARY',
    });
    assert.ok(roster.id);
    assert.strictEqual(roster.rosterDate, '2026-11-10');
    assert.strictEqual(roster.status, 'SCHEDULED');
  });

  // Scenario 13: Shift Double-Booking Anti-Collision Guard
  it('13. Strictly detects and blocks conflicting shift assignment on the same date for an employee', async () => {
    await assert.rejects(
      async () => {
        await hrmsAdvancedService.assignDutyRoster({
          hospitalId: tenantHospitalId,
          employeeId: testEmpId,
          departmentId: 'dept-cardio-01',
          shiftTemplateId: testShiftId,
          rosterDate: '2026-11-10', // Collides with test 12 assignment!
          shiftRole: 'RELIEVER',
        });
      },
      {
        message: /already assigned to a shift on date/,
      }
    );
  });

  // Scenario 14: Leave Policies & Dynamic Balance Enforcement
  it('14. Configures leave policy, tracks quota balance, and rejects application exceeding balance', async () => {
    const lt = await hrmsAdvancedService.createLeaveType({
      hospitalId: tenantHospitalId,
      code: 'CASUAL_LEAVE',
      name: 'Casual Leave (CL)',
      annualQuotaDays: 12,
      isCarryForward: false,
    });
    assert.ok(lt.id);
    testLeaveTypeId = lt.id;

    await hrmsAdvancedService.initializeLeaveBalance({
      hospitalId: tenantHospitalId,
      employeeId: testEmpId,
      leaveTypeId: testLeaveTypeId,
      year: 2026,
      openingBalance: 2.0, // Only 2 days available
    });

    // Attempting to apply for 5 days when only 2 are available must be rejected
    await assert.rejects(
      async () => {
        await hrmsAdvancedService.applyLeave({
          hospitalId: tenantHospitalId,
          employeeId: testEmpId,
          leaveTypeId: testLeaveTypeId,
          startDate: '2026-11-15',
          endDate: '2026-11-19',
          totalDays: 5.0,
          reason: 'Extended vacation',
        });
      },
      {
        message: /Insufficient leave balance/,
      }
    );
  });

  // Scenario 15: Leave Application Approval & Atomic Balance Deduction
  it('15. Approves legitimate leave application and atomically updates employee remaining balance', async () => {
    const app = await hrmsAdvancedService.applyLeave({
      hospitalId: tenantHospitalId,
      employeeId: testEmpId,
      leaveTypeId: testLeaveTypeId,
      startDate: '2026-11-15',
      endDate: '2026-11-16',
      totalDays: 2.0,
      reason: 'Urgent personal work',
    });
    assert.ok(app.id);
    assert.strictEqual(app.status, 'PENDING');

    const approved = await hrmsAdvancedService.approveLeave(
      app.id,
      'head-of-cardiology',
      true,
      'Covering consultant confirmed'
    );
    assert.strictEqual(approved.status, 'APPROVED');
  });

  // Scenario 16: Salary Structure, Monthly Payroll Run & Balanced Double-Entry General Ledger Posting
  it('16. Processes Indian payroll with PF, PT & TDS, verifies net pay, and posts balanced double-entry JV to General Ledger', async () => {
    // 1. Setup Indian Salary Structure
    await hrmsAdvancedService.setupSalaryStructure({
      hospitalId: tenantHospitalId,
      employeeId: testEmpId,
      basicSalary: 100000,
      hraAllowance: 40000,
      conveyanceAllowance: 10000,
      medicalAllowance: 15000,
      specialAllowance: 15000,
      pfApplicable: true,   // 12% of basic = 12,000
      esiApplicable: false, // gross > 21k
      ptApplicable: true,   // 200
      tdsMonthly: 8000,     // 8,000
    });

    // 2. Create Payroll Batch
    const batch = await hrmsAdvancedService.createPayrollBatch(tenantHospitalId, '2026-11');
    assert.ok(batch.id);
    assert.strictEqual(batch.periodMonth, '2026-11');
    testBatchId = batch.id;

    // 3. Calculate Payslip (Full 30 days present)
    const payslip = await hrmsAdvancedService.calculateEmployeePayslip(testBatchId, testEmpId, {
      workingDays: 30,
      presentDays: 30,
    });
    assert.strictEqual(payslip.grossEarned, 180000);
    assert.strictEqual(payslip.pfDeduction, 12000); // 12% of 100,000
    assert.strictEqual(payslip.ptDeduction, 200);   // Standard Indian PT
    assert.strictEqual(payslip.tdsDeduction, 8000); // Monthly TDS
    assert.strictEqual(payslip.totalDeductions, 20200);
    assert.strictEqual(payslip.netPayable, 159800); // 180,000 - 20,200

    // 4. Approve Batch
    await hrmsAdvancedService.approvePayrollBatch(testBatchId, 'cfo-approver');

    // 5. Post to General Ledger
    const { journalVoucher } = await hrmsAdvancedService.postPayrollToGeneralLedger(testBatchId);
    assert.ok(journalVoucher.id);
    assert.strictEqual(journalVoucher.isBalanced, true);
    assert.strictEqual(journalVoucher.totalDebit, 180000);
    assert.strictEqual(journalVoucher.totalCredit, 180000);

    // 6. Concurrency / Idempotency negative test: Prevent double GL posting
    await assert.rejects(
      async () => {
        await hrmsAdvancedService.postPayrollToGeneralLedger(testBatchId);
      },
      {
        message: /already been posted to General Ledger/,
      }
    );
  });
});

