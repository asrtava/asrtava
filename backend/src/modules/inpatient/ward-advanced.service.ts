import { logger } from '../../utils/logger';

export interface BuildingInput {
  hospitalId: string;
  buildingCode: string;
  name: string;
  totalFloors?: number;
  branchId?: string;
}

export interface FloorInput {
  hospitalId: string;
  buildingId: string;
  floorNumber: number;
  floorName: string;
}

export interface DepartmentInput {
  hospitalId: string;
  departmentCode: string;
  name: string;
  specialty?: string;
}

export interface WardUnitInput {
  hospitalId: string;
  floorId: string;
  departmentId: string;
  wardCode: string;
  name: string;
  wardType: 'GENERAL' | 'PRIVATE' | 'SEMI_PRIVATE' | 'ICU' | 'HDU' | 'PEDIATRIC' | 'MATERNITY' | 'ISOLATION' | 'SURGICAL' | 'MEDICAL' | 'DAY_CARE';
  capacity?: number;
}

export interface RoomInput {
  hospitalId: string;
  wardId: string;
  roomNumber: string;
  roomType?: string;
  dailyRate: number;
  isAc?: boolean;
}

export interface BedInput {
  hospitalId: string;
  roomId: string;
  wardId: string;
  bedNumber: string;
  bedCategory?: string;
  genderRestriction?: 'ANY' | 'MALE_ONLY' | 'FEMALE_ONLY';
  hasOxygen?: boolean;
  hasVentilator?: boolean;
  hasCardiacMonitor?: boolean;
  isIsolation?: boolean;
}

export interface AdmissionRequestInput {
  hospitalId: string;
  patientId: string;
  requestingDoctorId: string;
  source?: 'OPD' | 'EMERGENCY' | 'DIRECT' | 'TRANSFER' | 'EXTERNAL_REFERRAL';
  priority?: 'ROUTINE' | 'URGENT' | 'STAT_EMERGENCY';
  requiredWardType: string;
  requiredBedType?: string;
  diagnosis: string;
  isolationRequired?: boolean;
  specialEquipmentNotes?: string;
}

export interface BedReservationInput {
  hospitalId: string;
  bedId: string;
  patientId: string;
  reservedByUserId: string;
  durationMinutes?: number;
}

export interface PatientAdmissionInput {
  hospitalId: string;
  patientId: string;
  patientName?: string;
  requestId?: string;
  admittingDoctorId: string;
  assignedBedId: string;
  assignedWardId: string;
  initialDiagnosis: string;
  expectedDischargeDate?: string;
  isMedicoLegal?: boolean;
}

export interface PatientTransferInput {
  hospitalId: string;
  admissionId: string;
  patientId: string;
  fromBedId: string;
  toBedId: string;
  fromWardId: string;
  toWardId: string;
  transferReason: string;
  requestedByDoctorId: string;
  sendingNurseId?: string;
  receivingNurseId?: string;
  handoverNotes?: string;
}

export interface HousekeepingTaskInput {
  hospitalId: string;
  bedId: string;
  roomId: string;
  taskType?: 'ROUTINE' | 'TERMINAL' | 'ISOLATION' | 'DEEP_CLEANING' | 'MAINTENANCE_RELATED';
  assignedStaffId?: string;
  cleaningNotes?: string;
}

export interface CleaningInspectionInput {
  hospitalId: string;
  taskId: string;
  bedId: string;
  inspectedBySupervisorId: string;
  isApproved: boolean;
  rejectionReason?: string;
}

export interface DischargePlanInput {
  hospitalId: string;
  admissionId: string;
  estimatedDischargeDate: string;
  barriersIdentified?: string;
  pendingConsultations?: string;
  medsReconciled?: boolean;
  transportArranged?: boolean;
  homeCareRequired?: boolean;
  readinessStatus?: 'IN_PLANNING' | 'MEDICALLY_STABLE' | 'PENDING_CLEARANCE' | 'CLEARED_FOR_DISCHARGE';
}

export interface DischargeExecutionInput {
  hospitalId: string;
  admissionId: string;
  dischargeType: 'ROUTINE' | 'LAMA' | 'TRANSFER_ANOTHER_HOSPITAL' | 'DEATH';
  authorizingDoctorId: string;
  dischargeSummaryNotes: string;
}

export interface VisitorPassInput {
  hospitalId: string;
  admissionId: string;
  patientId: string;
  visitorName: string;
  relationship: string;
  idProofNumber?: string;
  validHours?: number;
  issuedByUserId: string;
}

export class WardAdvancedService {
  private buildings: Map<string, any> = new Map();
  private floors: Map<string, any> = new Map();
  private departments: Map<string, any> = new Map();
  private wardUnits: Map<string, any> = new Map();
  private rooms: Map<string, any> = new Map();
  private beds: Map<string, any> = new Map();
  private reservations: Map<string, any> = new Map();
  private admissionRequests: Map<string, any> = new Map();
  private admissions: Map<string, any> = new Map();
  private transfers: Map<string, any[]> = new Map();
  private housekeepingTasks: Map<string, any> = new Map();
  private inspections: Map<string, any> = new Map();
  private dischargePlans: Map<string, any> = new Map();
  private visitorPasses: Map<string, any> = new Map();

  // 1. Hospital Infrastructure Hierarchy Configuration
  public async createBuilding(input: BuildingInput): Promise<any> {
    const id = `bldg-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const bldg = {
      id,
      ...input,
      totalFloors: input.totalFloors || 1,
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    this.buildings.set(id, bldg);
    return bldg;
  }

  public async createFloor(input: FloorInput): Promise<any> {
    const id = `flr-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const flr = {
      id,
      ...input,
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    this.floors.set(id, flr);
    return flr;
  }

  public async createDepartment(input: DepartmentInput): Promise<any> {
    const id = `dept-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const dept = {
      id,
      ...input,
      specialty: input.specialty || 'GENERAL',
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    this.departments.set(id, dept);
    return dept;
  }

  public async createWardUnit(input: WardUnitInput): Promise<any> {
    const id = `ward-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const ward = {
      id,
      ...input,
      capacity: input.capacity || 10,
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    this.wardUnits.set(id, ward);
    return ward;
  }

  public async createRoom(input: RoomInput): Promise<any> {
    const id = `room-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const room = {
      id,
      ...input,
      roomType: input.roomType || 'STANDARD',
      isAc: input.isAc || false,
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    this.rooms.set(id, room);
    return room;
  }

  public async createBed(input: BedInput): Promise<any> {
    const id = `bed-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const bed = {
      id,
      ...input,
      bedCategory: input.bedCategory || 'STANDARD',
      status: 'available', // available, reserved, occupied, cleaning_required, cleaning_in_progress, maintenance, blocked
      genderRestriction: input.genderRestriction || 'ANY',
      hasOxygen: input.hasOxygen !== undefined ? input.hasOxygen : true,
      hasVentilator: !!input.hasVentilator,
      hasCardiacMonitor: !!input.hasCardiacMonitor,
      isIsolation: !!input.isIsolation,
      isActive: true,
      updatedAt: new Date().toISOString(),
    };
    this.beds.set(id, bed);
    return bed;
  }

  // 2. Real-Time Bed Availability Dashboard (Computed Metrics)
  public async getBedAvailabilityGrid(hospitalId: string): Promise<any> {
    const hospitalBeds = Array.from(this.beds.values()).filter((b) => b.hospitalId === hospitalId && b.isActive);

    let total = hospitalBeds.length;
    let available = 0;
    let occupied = 0;
    let reserved = 0;
    let cleaningRequired = 0;
    let cleaningInProgress = 0;
    let maintenance = 0;
    let blocked = 0;
    let icuAvailable = 0;
    let icuTotal = 0;

    const wardWise: Record<string, { total: number; occupied: number; available: number }> = {};

    for (const b of hospitalBeds) {
      if (b.status === 'available') available++;
      else if (b.status === 'occupied') occupied++;
      else if (b.status === 'reserved') reserved++;
      else if (b.status === 'cleaning_required') cleaningRequired++;
      else if (b.status === 'cleaning_in_progress') cleaningInProgress++;
      else if (b.status === 'maintenance') maintenance++;
      else if (b.status === 'blocked') blocked++;

      const ward = this.wardUnits.get(b.wardId);
      if (ward) {
        if (ward.wardType === 'ICU') {
          icuTotal++;
          if (b.status === 'available') icuAvailable++;
        }
        if (!wardWise[ward.name]) wardWise[ward.name] = { total: 0, occupied: 0, available: 0 };
        wardWise[ward.name].total++;
        if (b.status === 'occupied') wardWise[ward.name].occupied++;
        if (b.status === 'available') wardWise[ward.name].available++;
      }
    }

    return {
      totalBeds: total,
      availableBeds: available,
      occupiedBeds: occupied,
      reservedBeds: reserved,
      cleaningRequiredBeds: cleaningRequired,
      cleaningInProgressBeds: cleaningInProgress,
      maintenanceBeds: maintenance,
      blockedBeds: blocked,
      icuTotal,
      icuAvailable,
      overallOccupancyPercent: total > 0 ? Math.round((occupied / total) * 100) : 0,
      wardWiseOccupancy: wardWise,
      beds: hospitalBeds,
    };
  }

  // 3. IPD Admission Requests & Review
  public async createAdmissionRequest(input: AdmissionRequestInput): Promise<any> {
    const id = `req-adm-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const request = {
      id,
      ...input,
      source: input.source || 'OPD',
      priority: input.priority || 'ROUTINE',
      requiredBedType: input.requiredBedType || 'STANDARD',
      isolationRequired: !!input.isolationRequired,
      status: 'REQUESTED',
      requestedAt: new Date().toISOString(),
    };
    this.admissionRequests.set(id, request);
    logger.info('Inpatient admission request submitted', { requestId: id, priority: request.priority });
    return request;
  }

  public async triageAdmissionRequest(requestId: string, status: 'APPROVED' | 'WAITLISTED' | 'CANCELLED', reviewerUserId: string): Promise<any> {
    const req = this.admissionRequests.get(requestId);
    if (!req) throw new Error('Admission request not found');
    req.status = status;
    req.reviewedByUserId = reviewerUserId;
    req.reviewedAt = new Date().toISOString();
    return req;
  }

  // 4. Concurrency-Safe Bed Reservation & Allocation
  public async reserveBed(input: BedReservationInput): Promise<any> {
    const bed = this.beds.get(input.bedId);
    if (!bed) throw new Error('Bed not found');
    if (bed.status !== 'available') {
      throw new Error(`BED_UNAVAILABLE: Bed ${bed.bedNumber} is currently in '${bed.status}' status and cannot be reserved.`);
    }

    const durationMins = input.durationMinutes || 60;
    const expiresAt = new Date(Date.now() + durationMins * 60 * 1000).toISOString();

    const id = `res-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const reservation = {
      id,
      ...input,
      expiresAt,
      status: 'ACTIVE',
      reservedAt: new Date().toISOString(),
    };

    bed.status = 'reserved';
    bed.updatedAt = new Date().toISOString();
    this.reservations.set(id, reservation);
    logger.info('Bed temporarily reserved with expiry window', { bedId: input.bedId, expiresAt });
    return reservation;
  }

  // 5. Patient Admission Formalization
  public async formalizeAdmission(input: PatientAdmissionInput): Promise<any> {
    const bed = this.beds.get(input.assignedBedId);
    if (!bed) throw new Error('Assigned bed not found');

    // Bed must be either 'available' or 'reserved' for this specific patient
    if (bed.status !== 'available' && bed.status !== 'reserved') {
      throw new Error(`CONCURRENT_ALLOCATION_CONFLICT: Bed ${bed.bedNumber} is currently '${bed.status}'. Cannot allocate occupied or uncleaned bed.`);
    }

    const admissionNumber = `IPD-2026-${Math.floor(10000 + Math.random() * 90000)}`;
    const id = `adm-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const admission = {
      id,
      admissionNumber,
      hospitalId: input.hospitalId,
      patientId: input.patientId,
      patientName: input.patientName || 'Inpatient',
      requestId: input.requestId,
      admittingDoctorId: input.admittingDoctorId,
      assignedBedId: input.assignedBedId,
      assignedWardId: input.assignedWardId,
      admissionTimestamp: new Date().toISOString(),
      expectedDischargeDate: input.expectedDischargeDate,
      initialDiagnosis: input.initialDiagnosis,
      admissionStatus: 'ADMITTED',
      isMedicoLegal: !!input.isMedicoLegal,
    };

    // Atomically transition bed to occupied
    bed.status = 'occupied';
    bed.currentPatientId = input.patientId;
    bed.currentAdmissionId = id;
    bed.updatedAt = new Date().toISOString();

    this.admissions.set(id, admission);

    if (input.requestId) {
      const req = this.admissionRequests.get(input.requestId);
      if (req) req.status = 'ADMITTED';
    }

    logger.info('Inpatient admission formalized', { admissionNumber, bedNumber: bed.bedNumber });
    return admission;
  }

  // 6. Bed & Ward Transfers (Concurrency Safe)
  public async transferPatientBed(input: PatientTransferInput): Promise<any> {
    const targetBed = this.beds.get(input.toBedId);
    if (!targetBed) throw new Error('Target bed not found');
    if (targetBed.status !== 'available') {
      throw new Error(`TRANSFER_COLLISION: Target bed ${targetBed.bedNumber} is in '${targetBed.status}' state and not ready for transfer.`);
    }

    const fromBed = this.beds.get(input.fromBedId);
    if (fromBed) {
      // Old bed must transition to cleaning_required before it can ever be available again
      fromBed.status = 'cleaning_required';
      fromBed.currentPatientId = undefined;
      fromBed.currentAdmissionId = undefined;
      fromBed.updatedAt = new Date().toISOString();

      // Automatically queue housekeeping task
      const housekeepingTaskId = `cln-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      this.housekeepingTasks.set(housekeepingTaskId, {
        id: housekeepingTaskId,
        hospitalId: input.hospitalId,
        bedId: fromBed.id,
        roomId: fromBed.roomId,
        taskType: 'TERMINAL',
        status: 'PENDING',
        requestedAt: new Date().toISOString(),
        cleaningNotes: `Automated terminal turnover triggered by patient transfer to bed ${targetBed.bedNumber}`,
      });
    }

    // Allocate target bed
    targetBed.status = 'occupied';
    targetBed.currentPatientId = input.patientId;
    targetBed.currentAdmissionId = input.admissionId;
    targetBed.updatedAt = new Date().toISOString();

    const admission = this.admissions.get(input.admissionId);
    if (admission) {
      admission.assignedBedId = input.toBedId;
      admission.assignedWardId = input.toWardId;
    }

    const id = `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const transferRecord = {
      id,
      ...input,
      transferTimestamp: new Date().toISOString(),
      status: 'COMPLETED',
    };

    const list = this.transfers.get(input.admissionId) || [];
    list.push(transferRecord);
    this.transfers.set(input.admissionId, list);

    logger.info('Patient bed transfer executed with old bed queued for sanitization', {
      admissionId: input.admissionId,
      fromBed: fromBed?.bedNumber,
      toBed: targetBed.bedNumber,
    });
    return transferRecord;
  }

  // 7. Housekeeping, Cleaning Turnover & Supervisor Inspection
  public async createHousekeepingTask(input: HousekeepingTaskInput): Promise<any> {
    const id = `cln-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const task = {
      id,
      ...input,
      taskType: input.taskType || 'ROUTINE',
      status: 'PENDING',
      requestedAt: new Date().toISOString(),
    };
    this.housekeepingTasks.set(id, task);

    const bed = this.beds.get(input.bedId);
    if (bed && bed.status !== 'occupied') {
      bed.status = 'cleaning_required';
    }

    return task;
  }

  public async startCleaningTask(taskId: string, staffId: string): Promise<any> {
    const task = this.housekeepingTasks.get(taskId);
    if (!task) throw new Error('Housekeeping task not found');
    task.assignedStaffId = staffId;
    task.status = 'IN_PROGRESS';
    task.startedAt = new Date().toISOString();

    const bed = this.beds.get(task.bedId);
    if (bed) bed.status = 'cleaning_in_progress';

    return task;
  }

  public async completeCleaningTask(taskId: string, cleaningNotes?: string): Promise<any> {
    const task = this.housekeepingTasks.get(taskId);
    if (!task) throw new Error('Housekeeping task not found');
    task.status = 'COMPLETED';
    task.completedAt = new Date().toISOString();
    if (cleaningNotes) task.cleaningNotes = cleaningNotes;
    return task;
  }

  public async inspectAndReleaseBed(input: CleaningInspectionInput): Promise<any> {
    const task = this.housekeepingTasks.get(input.taskId);
    if (!task) throw new Error('Housekeeping task not found');
    const bed = this.beds.get(input.bedId);
    if (!bed) throw new Error('Bed not found');

    const id = `insp-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const inspection = {
      id,
      ...input,
      inspectionTimestamp: new Date().toISOString(),
      bedReleasedToAvailable: input.isApproved,
    };
    this.inspections.set(id, inspection);

    if (input.isApproved) {
      // Only upon approved supervisor inspection does the bed flip to available!
      bed.status = 'available';
      bed.updatedAt = new Date().toISOString();
      logger.info('Bed sanitized and approved for patient intake', { bedNumber: bed.bedNumber, inspectedBy: input.inspectedBySupervisorId });
    } else {
      bed.status = 'cleaning_required';
      task.status = 'REJECTED';
      logger.warn('Bed cleaning inspection failed; re-queued for terminal rework', { bedNumber: bed.bedNumber, reason: input.rejectionReason });
    }

    return inspection;
  }

  // 8. Discharge Planning & Clinical Discharge Execution
  public async upsertDischargePlan(input: DischargePlanInput): Promise<any> {
    const id = `dp-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const plan = {
      id,
      ...input,
      medsReconciled: !!input.medsReconciled,
      transportArranged: !!input.transportArranged,
      homeCareRequired: !!input.homeCareRequired,
      readinessStatus: input.readinessStatus || 'IN_PLANNING',
      updatedAt: new Date().toISOString(),
    };
    this.dischargePlans.set(input.admissionId, plan);
    return plan;
  }

  public async executeClinicalDischarge(input: DischargeExecutionInput): Promise<any> {
    const admission = this.admissions.get(input.admissionId);
    if (!admission) throw new Error('Inpatient admission record not found');
    if (admission.admissionStatus === 'DISCHARGED') {
      throw new Error('Patient is already clinically discharged.');
    }

    admission.admissionStatus = 'DISCHARGED';
    admission.actualDischargeDate = new Date().toISOString();
    admission.dischargeType = input.dischargeType;
    admission.dischargeSummaryNotes = input.dischargeSummaryNotes;
    admission.authorizingDoctorId = input.authorizingDoctorId;

    // Release bed to cleaning_required (must NOT become available immediately)
    const bed = this.beds.get(admission.assignedBedId);
    if (bed) {
      bed.status = 'cleaning_required';
      bed.currentPatientId = undefined;
      bed.currentAdmissionId = undefined;
      bed.updatedAt = new Date().toISOString();

      // Trigger automatic terminal turnover
      const taskId = `cln-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      this.housekeepingTasks.set(taskId, {
        id: taskId,
        hospitalId: input.hospitalId,
        bedId: bed.id,
        roomId: bed.roomId,
        taskType: 'TERMINAL',
        status: 'PENDING',
        requestedAt: new Date().toISOString(),
        cleaningNotes: `Automated post-discharge terminal disinfection for bed ${bed.bedNumber}`,
      });
    }

    logger.info('Clinical discharge finalized and bed scheduled for sanitization', {
      admissionNumber: admission.admissionNumber,
      dischargeType: input.dischargeType,
    });
    return admission;
  }

  // 9. Visitor & Attendant Management
  public async issueVisitorPass(input: VisitorPassInput): Promise<any> {
    const id = `pass-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const passNumber = `VP-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const validHours = input.validHours || 4;
    const now = Date.now();
    const validFrom = new Date(now).toISOString();
    const validUntil = new Date(now + validHours * 60 * 60 * 1000).toISOString();

    const pass = {
      id,
      passNumber,
      ...input,
      validFrom,
      validUntil,
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    this.visitorPasses.set(id, pass);
    logger.info('Ward visitor pass issued', { passNumber, visitor: input.visitorName, validUntil });
    return pass;
  }
}

export const wardAdvancedService = new WardAdvancedService();

