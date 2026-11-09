import { describe, it } from 'node:test';
import assert from 'node:assert';
import { wardAdvancedService } from '../src/modules/inpatient/ward-advanced.service';

describe('ASRTAVA Advanced Ward & Bed Management Test Suite', () => {
  const tenantHospitalId = 'hosp-apex-001';
  let testBuildingId: string;
  let testFloorId: string;
  let testDeptId: string;
  let testWardId: string;
  let testRoomId: string;
  let testBedId1: string;
  let testBedId2: string;
  let testRequestId: string;
  let testAdmissionId: string;
  let testHousekeepingTaskId: string;

  // Scenario 1: Hospital Infrastructure Hierarchy
  it('1. Registers complete infrastructure hierarchy: Building -> Floor -> Department -> Ward -> Room -> Bed', async () => {
    const bldg = await wardAdvancedService.createBuilding({
      hospitalId: tenantHospitalId,
      buildingCode: 'BLDG-MAIN',
      name: 'Main Inpatient Tower',
      totalFloors: 6,
    });
    assert.ok(bldg.id);
    testBuildingId = bldg.id;

    const flr = await wardAdvancedService.createFloor({
      hospitalId: tenantHospitalId,
      buildingId: testBuildingId,
      floorNumber: 2,
      floorName: 'Floor 2 (Medical Specialties)',
    });
    assert.ok(flr.id);
    testFloorId = flr.id;

    const dept = await wardAdvancedService.createDepartment({
      hospitalId: tenantHospitalId,
      departmentCode: 'DEPT-MED',
      name: 'Department of Internal Medicine',
      specialty: 'INTERNAL_MEDICINE',
    });
    assert.ok(dept.id);
    testDeptId = dept.id;

    const ward = await wardAdvancedService.createWardUnit({
      hospitalId: tenantHospitalId,
      floorId: testFloorId,
      departmentId: testDeptId,
      wardCode: 'WARD-MED-MALE',
      name: 'Male Medical Ward',
      wardType: 'MEDICAL',
      capacity: 20,
    });
    assert.ok(ward.id);
    testWardId = ward.id;

    const room = await wardAdvancedService.createRoom({
      hospitalId: tenantHospitalId,
      wardId: testWardId,
      roomNumber: 'Room 201',
      dailyRate: 1800,
      isAc: true,
    });
    assert.ok(room.id);
    testRoomId = room.id;

    const bed1 = await wardAdvancedService.createBed({
      hospitalId: tenantHospitalId,
      roomId: testRoomId,
      wardId: testWardId,
      bedNumber: 'Bed 201-A',
      bedCategory: 'STANDARD_AC',
      genderRestriction: 'MALE_ONLY',
      hasOxygen: true,
    });
    assert.ok(bed1.id);
    assert.strictEqual(bed1.status, 'available');
    testBedId1 = bed1.id;

    const bed2 = await wardAdvancedService.createBed({
      hospitalId: tenantHospitalId,
      roomId: testRoomId,
      wardId: testWardId,
      bedNumber: 'Bed 201-B',
      bedCategory: 'STANDARD_AC',
      genderRestriction: 'MALE_ONLY',
      hasOxygen: true,
    });
    assert.ok(bed2.id);
    testBedId2 = bed2.id;
  });

  // Scenario 2: Dynamic Bed Availability Analytics
  it('2. Computes dynamic bed availability metrics from real bed state records', async () => {
    const grid = await wardAdvancedService.getBedAvailabilityGrid(tenantHospitalId);

    assert.ok(grid.totalBeds >= 2);
    assert.ok(grid.availableBeds >= 2);
    assert.strictEqual(grid.occupiedBeds, 0);
    assert.ok(grid.wardWiseOccupancy['Male Medical Ward']);
    assert.strictEqual(grid.wardWiseOccupancy['Male Medical Ward'].total, 2);
  });

  // Scenario 3: IPD Admission Request Submission
  it('3. Ingests doctor inpatient admission request with urgency and diagnosis', async () => {
    const req = await wardAdvancedService.createAdmissionRequest({
      hospitalId: tenantHospitalId,
      patientId: 'pat-101',
      requestingDoctorId: 'doc-sethi-01',
      source: 'OPD',
      priority: 'URGENT',
      requiredWardType: 'MEDICAL',
      diagnosis: 'Severe community-acquired pneumonia with dehydration',
      isolationRequired: false,
    });

    assert.ok(req.id);
    assert.strictEqual(req.priority, 'URGENT');
    assert.strictEqual(req.status, 'REQUESTED');
    testRequestId = req.id;
  });

  // Scenario 4: Admission Request Triage
  it('4. Approves admission request during bed coordinator triage', async () => {
    const approved = await wardAdvancedService.triageAdmissionRequest(
      testRequestId,
      'APPROVED',
      'user-bed-coordinator'
    );

    assert.strictEqual(approved.status, 'APPROVED');
    assert.strictEqual(approved.reviewedByUserId, 'user-bed-coordinator');
  });

  // Scenario 5: Concurrency-Safe Bed Reservation
  it('5. Reserves bed with automatic expiration window (holding reservation)', async () => {
    const resv = await wardAdvancedService.reserveBed({
      hospitalId: tenantHospitalId,
      bedId: testBedId1,
      patientId: 'pat-101',
      reservedByUserId: 'user-bed-coordinator',
      durationMinutes: 45,
    });

    assert.ok(resv.id);
    assert.strictEqual(resv.status, 'ACTIVE');

    const grid = await wardAdvancedService.getBedAvailabilityGrid(tenantHospitalId);
    assert.strictEqual(grid.reservedBeds, 1);
  });

  // Scenario 6: Prevent Reservation Collision
  it('6. Prevents simultaneous reservation on an already reserved bed', async () => {
    await assert.rejects(
      async () => {
        await wardAdvancedService.reserveBed({
          hospitalId: tenantHospitalId,
          bedId: testBedId1, // Already reserved!
          patientId: 'pat-102',
          reservedByUserId: 'user-bed-coordinator',
        });
      },
      (err: any) => {
        assert.ok(err.message.includes('BED_UNAVAILABLE'), 'Reservation collision prevented');
        return true;
      }
    );
  });

  // Scenario 7: Inpatient Admission Formalization
  it('7. Formalizes inpatient admission with unique IPD number and flips bed to occupied', async () => {
    const adm = await wardAdvancedService.formalizeAdmission({
      hospitalId: tenantHospitalId,
      patientId: 'pat-101',
      patientName: 'Vikram Joshi',
      requestId: testRequestId,
      admittingDoctorId: 'doc-sethi-01',
      assignedBedId: testBedId1,
      assignedWardId: testWardId,
      initialDiagnosis: 'Severe community-acquired pneumonia',
      expectedDischargeDate: '2026-11-14',
    });

    assert.ok(adm.id);
    assert.ok(adm.admissionNumber.startsWith('IPD-2026-'));
    assert.strictEqual(adm.admissionStatus, 'ADMITTED');
    testAdmissionId = adm.id;

    const grid = await wardAdvancedService.getBedAvailabilityGrid(tenantHospitalId);
    assert.strictEqual(grid.occupiedBeds, 1);
  });

  // Scenario 8: Prevent Concurrent Admission Allocation
  it('8. Throws conflict error if attempting to allocate an occupied bed to another patient', async () => {
    await assert.rejects(
      async () => {
        await wardAdvancedService.formalizeAdmission({
          hospitalId: tenantHospitalId,
          patientId: 'pat-102',
          admittingDoctorId: 'doc-suresh-01',
          assignedBedId: testBedId1, // Already occupied!
          assignedWardId: testWardId,
          initialDiagnosis: 'Acute gastroenteritis',
        });
      },
      (err: any) => {
        assert.ok(err.message.includes('CONCURRENT_ALLOCATION_CONFLICT'), 'Double allocation prevented');
        return true;
      }
    );
  });

  // Scenario 9: Inter-Bed Patient Transfer
  it('9. Executes inter-bed transfer: target bed becomes occupied; previous bed moves to cleaning_required', async () => {
    const transfer = await wardAdvancedService.transferPatientBed({
      hospitalId: tenantHospitalId,
      admissionId: testAdmissionId,
      patientId: 'pat-101',
      fromBedId: testBedId1,
      toBedId: testBedId2,
      fromWardId: testWardId,
      toWardId: testWardId,
      transferReason: 'Patient requested window-side bed Bed 201-B',
      requestedByDoctorId: 'doc-sethi-01',
      sendingNurseId: 'nurse-priya',
      receivingNurseId: 'nurse-deepa',
      handoverNotes: 'Patient clinically stable; IV fluids running at 75 mL/hr.',
    });

    assert.ok(transfer.id);
    assert.strictEqual(transfer.status, 'COMPLETED');

    const grid = await wardAdvancedService.getBedAvailabilityGrid(tenantHospitalId);
    assert.strictEqual(grid.occupiedBeds, 1); // Now in bed 2
    assert.strictEqual(grid.cleaningRequiredBeds, 1); // Bed 1 needs cleaning
  });

  // Scenario 10: Prevent Transfer Collision
  it('10. Blocks transfer if target bed is not available', async () => {
    await assert.rejects(
      async () => {
        await wardAdvancedService.transferPatientBed({
          hospitalId: tenantHospitalId,
          admissionId: testAdmissionId,
          patientId: 'pat-101',
          fromBedId: testBedId2,
          toBedId: testBedId1, // Bed 1 is currently cleaning_required!
          fromWardId: testWardId,
          toWardId: testWardId,
          transferReason: 'Attempt to transfer back to uncleaned bed',
          requestedByDoctorId: 'doc-sethi-01',
        });
      },
      (err: any) => {
        assert.ok(err.message.includes('TRANSFER_COLLISION'), 'Transfer to dirty bed blocked');
        return true;
      }
    );
  });

  // Scenario 11: Housekeeping Cleaning Task Progression
  it('11. Progresses housekeeping task from PENDING to IN_PROGRESS upon staff assignment', async () => {
    const task = await wardAdvancedService.createHousekeepingTask({
      hospitalId: tenantHospitalId,
      bedId: testBedId1,
      roomId: testRoomId,
      taskType: 'TERMINAL',
      assignedStaffId: 'staff-cleaner-prakash',
    });

    assert.ok(task.id);
    assert.strictEqual(task.status, 'PENDING');
    testHousekeepingTaskId = task.id;

    const started = await wardAdvancedService.startCleaningTask(testHousekeepingTaskId, 'staff-cleaner-prakash');
    assert.strictEqual(started.status, 'IN_PROGRESS');
    assert.ok(started.startedAt);
  });

  // Scenario 12: Housekeeping Cleaning Completion
  it('12. Completes terminal sanitization and queues task for supervisor inspection', async () => {
    const completed = await wardAdvancedService.completeCleaningTask(
      testHousekeepingTaskId,
      'Bed wiped with quaternary ammonium, linen changed, terminal UV disinfection done'
    );

    assert.strictEqual(completed.status, 'COMPLETED');
    assert.ok(completed.completedAt);
  });

  // Scenario 13: Supervisor Inspection & Bed Release
  it('13. Supervisor inspection approves sanitization and only then releases bed to available', async () => {
    const inspection = await wardAdvancedService.inspectAndReleaseBed({
      hospitalId: tenantHospitalId,
      taskId: testHousekeepingTaskId,
      bedId: testBedId1,
      inspectedBySupervisorId: 'supervisor-sunita',
      isApproved: true,
    });

    assert.ok(inspection.id);
    assert.strictEqual(inspection.isApproved, true);
    assert.strictEqual(inspection.bedReleasedToAvailable, true);

    const grid = await wardAdvancedService.getBedAvailabilityGrid(tenantHospitalId);
    assert.strictEqual(grid.cleaningRequiredBeds, 0);
    assert.strictEqual(grid.availableBeds, 1); // Bed 1 is now available again!
  });

  // Scenario 14: Quality Gate Inspection Rejection
  it('14. Retains bed in cleaning_required state if supervisor inspection fails quality check', async () => {
    // Bed 2 is occupied; let's trigger a maintenance task on a temporary bed
    const tempBed = await wardAdvancedService.createBed({
      hospitalId: tenantHospitalId,
      roomId: testRoomId,
      wardId: testWardId,
      bedNumber: 'Bed 201-C',
    });

    const task = await wardAdvancedService.createHousekeepingTask({
      hospitalId: tenantHospitalId,
      bedId: tempBed.id,
      roomId: testRoomId,
      taskType: 'ROUTINE',
    });

    const rejected = await wardAdvancedService.inspectAndReleaseBed({
      hospitalId: tenantHospitalId,
      taskId: task.id,
      bedId: tempBed.id,
      inspectedBySupervisorId: 'supervisor-sunita',
      isApproved: false,
      rejectionReason: 'Side-rail latch dusty; needs re-cleaning',
    });

    assert.strictEqual(rejected.isApproved, false);
    assert.strictEqual(rejected.bedReleasedToAvailable, false);
  });

  // Scenario 15: Proactive Discharge Planning
  it('15. Documents proactive discharge plan tracking barriers and medication reconciliation', async () => {
    const plan = await wardAdvancedService.upsertDischargePlan({
      hospitalId: tenantHospitalId,
      admissionId: testAdmissionId,
      estimatedDischargeDate: '2026-11-12',
      barriersIdentified: 'Requires oral antibiotic step-down and pulse oximeter home training',
      pendingConsultations: 'Pulmonology review planned for 2026-11-11',
      medsReconciled: true,
      transportArranged: true,
      homeCareRequired: false,
      readinessStatus: 'MEDICALLY_STABLE',
    });

    assert.ok(plan.id);
    assert.strictEqual(plan.medsReconciled, true);
    assert.strictEqual(plan.readinessStatus, 'MEDICALLY_STABLE');
  });

  // Scenario 16: Clinical Discharge Execution & Bed Sanitization Trigger
  it('16. Finalizes clinical discharge summary and automatically queues vacated bed for sanitization', async () => {
    const discharge = await wardAdvancedService.executeClinicalDischarge({
      hospitalId: tenantHospitalId,
      admissionId: testAdmissionId,
      dischargeType: 'ROUTINE',
      authorizingDoctorId: 'doc-sethi-01',
      dischargeSummaryNotes: 'Patient afebrile for 48 hours, chest X-ray clearing, discharged on oral Cefuroxime',
    });

    assert.strictEqual(discharge.admissionStatus, 'DISCHARGED');
    assert.strictEqual(discharge.dischargeType, 'ROUTINE');

    // Bed 201-B should now be cleaning_required (along with rejected tempBed 201-C)
    const grid = await wardAdvancedService.getBedAvailabilityGrid(tenantHospitalId);
    assert.strictEqual(grid.occupiedBeds, 0);
    assert.strictEqual(grid.cleaningRequiredBeds, 2);
  });
});
