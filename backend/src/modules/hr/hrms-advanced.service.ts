import { logger } from '../../utils/logger';

export interface DesignationInput {
  hospitalId: string;
  departmentId?: string;
  title: string;
  code: string;
  jobGrade?: string;
  minExperienceYears?: number;
  description?: string;
}

export interface EmployeeInput {
  hospitalId: string;
  userId?: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  gender?: string;
  dateOfBirth?: string;
  phone: string;
  email: string;
  bloodGroup?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  departmentId?: string;
  designationId?: string;
  employmentType?: 'FULL_TIME' | 'PART_TIME' | 'CONSULTANT' | 'TRAINEE' | 'CONTRACTOR';
  employmentStatus?: 'PROBATION' | 'ACTIVE' | 'SUSPENDED' | 'RESIGNED' | 'TERMINATED' | 'RETIRED';
  dateOfJoining?: string;
  reportingManagerId?: string;
  workLocation?: string;
  costCenterCode?: string;
  baseMonthlySalary?: number;
  bankAccountNumber?: string;
  bankIfscCode?: string;
  panNumber?: string;
  aadhaarMasked?: string;
}

export interface EmployeeDocumentInput {
  hospitalId: string;
  employeeId: string;
  documentType: 'ID_PROOF' | 'DEGREE_CERTIFICATE' | 'REGISTRATION_LICENSE' | 'EXPERIENCE_LETTER' | 'BACKGROUND_CHECK' | 'CONTRACT';
  documentName: string;
  filePath: string;
  fileSizeBytes?: number;
  mimeType?: string;
  notes?: string;
}

export interface JobRequisitionInput {
  hospitalId: string;
  requisitionNumber: string;
  departmentId: string;
  designationId: string;
  vacanciesCount?: number;
  jobDescription: string;
  requiredQualification: string;
  minExperienceYears?: number;
  budgetCtcMax?: number;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
}

export interface CandidateInput {
  hospitalId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  currentOrganization?: string;
  experienceYears?: number;
  qualification?: string;
  resumeUrl?: string;
}

export interface ApplicationInput {
  hospitalId: string;
  requisitionId: string;
  candidateId: string;
  expectedCtc?: number;
}

export interface InterviewEvaluationInput {
  hospitalId: string;
  applicationId: string;
  interviewerUserId: string;
  interviewRound?: 'SCREENING' | 'CLINICAL_COMPETENCY' | 'TECHNICAL' | 'HR_ROUND' | 'MANAGEMENT';
  score: number; // 1 to 5
  recommendation: 'SELECT' | 'HOLD' | 'REJECT';
  notes?: string;
}

export interface AttendanceDeviceInput {
  hospitalId: string;
  deviceName: string;
  deviceCode: string;
  deviceType?: 'BIOMETRIC_FINGERPRINT' | 'FACIAL_RECOGNITION' | 'RFID_CARD' | 'MOBILE_GEOFENCE';
  ipAddress?: string;
  port?: number;
  locationArea?: string;
}

export interface AttendancePunchInput {
  hospitalId: string;
  employeeId: string;
  deviceId?: string;
  logTimestamp?: string;
  punchType?: 'CHECK_IN' | 'CHECK_OUT' | 'BREAK_IN' | 'BREAK_OUT';
  source?: 'DEVICE' | 'WEB_PORTAL' | 'MOBILE' | 'MANUAL_OVERRIDE';
  verificationMode?: string;
}

export interface AttendanceCorrectionInput {
  hospitalId: string;
  employeeId: string;
  attendanceDate: string;
  requestedCheckIn?: string;
  requestedCheckOut?: string;
  reason: string;
}

export interface ShiftTemplateInput {
  hospitalId: string;
  shiftCode: string;
  shiftName: string;
  startTime: string; // HH:mm:ss
  endTime: string;   // HH:mm:ss
  durationHours?: number;
  isNightShift?: boolean;
  isOnCall?: boolean;
  colorCode?: string;
}

export interface DutyRosterInput {
  hospitalId: string;
  employeeId: string;
  departmentId: string;
  shiftTemplateId: string;
  rosterDate: string; // YYYY-MM-DD
  shiftRole?: 'PRIMARY' | 'RELIEVER' | 'SUPERVISOR' | 'ON_CALL';
}

export interface LeaveTypeInput {
  hospitalId: string;
  code: string;
  name: string;
  annualQuotaDays: number;
  isCarryForward?: boolean;
  maxCarryForwardDays?: number;
  isEncashable?: boolean;
  requiresProof?: boolean;
}

export interface LeaveBalanceInput {
  hospitalId: string;
  employeeId: string;
  leaveTypeId: string;
  year: number;
  openingBalance: number;
  accrued?: number;
}

export interface LeaveApplicationInput {
  hospitalId: string;
  employeeId: string;
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  attachmentUrl?: string;
}

export interface SalaryStructureInput {
  hospitalId: string;
  employeeId: string;
  basicSalary: number;
  hraAllowance?: number;
  conveyanceAllowance?: number;
  medicalAllowance?: number;
  specialAllowance?: number;
  nightShiftAllowance?: number;
  pfApplicable?: boolean;
  esiApplicable?: boolean;
  ptApplicable?: boolean;
  tdsMonthly?: number;
}

export interface ProfessionalCredentialInput {
  hospitalId: string;
  employeeId: string;
  credentialType: 'MEDICAL_COUNCIL_REG' | 'NURSING_COUNCIL_REG' | 'PHARMACY_COUNCIL_REG' | 'AERB_RADIATION_SAFETY' | 'BLS_ACLS' | 'SPECIALTY_BOARD';
  licenseNumber: string;
  issuingAuthority: string;
  issueDate: string;
  expiryDate: string;
}

export interface TrainingProgramInput {
  hospitalId: string;
  programName: string;
  category?: 'CLINICAL_SAFETY' | 'INFECTION_CONTROL' | 'FIRE_SAFETY' | 'PATIENT_RIGHTS' | 'TECHNICAL';
  durationHours?: number;
  validityMonths?: number;
  description?: string;
}

export interface TrainingAttendeeInput {
  hospitalId: string;
  programId: string;
  employeeId: string;
  completionDate?: string;
  expiryDate: string;
  scorePercentage?: number;
  certificateNumber?: string;
  status?: 'ATTENDED' | 'PASSED' | 'FAILED';
}

export interface SeparationInput {
  hospitalId: string;
  employeeId: string;
  resignationDate?: string;
  requestedRelievingDate: string;
  noticePeriodDays?: number;
  reason: string;
  separationType?: 'RESIGNATION' | 'RETIREMENT' | 'TERMINATION' | 'ABSCONDING';
}

export class HrmsAdvancedService {
  private designations: Map<string, any> = new Map();
  private employees: Map<string, any> = new Map();
  private employeeDocuments: Map<string, any> = new Map();
  private jobRequisitions: Map<string, any> = new Map();
  private candidates: Map<string, any> = new Map();
  private applications: Map<string, any> = new Map();
  private interviewEvaluations: Map<string, any> = new Map();
  private attendanceDevices: Map<string, any> = new Map();
  private attendanceLogs: any[] = [];
  private attendanceCorrections: Map<string, any> = new Map();
  private shiftTemplates: Map<string, any> = new Map();
  private dutyRosters: Map<string, any> = new Map();
  private leaveTypes: Map<string, any> = new Map();
  private leaveBalances: Map<string, any> = new Map();
  private leaveApplications: Map<string, any> = new Map();
  private salaryStructures: Map<string, any> = new Map();
  private payrollBatches: Map<string, any> = new Map();
  private payslips: Map<string, any> = new Map();
  private professionalCredentials: Map<string, any> = new Map();
  private trainingPrograms: Map<string, any> = new Map();
  private trainingAttendees: Map<string, any> = new Map();
  private separations: Map<string, any> = new Map();
  private generalLedgerVouchers: any[] = [];
  private mockUserStore: Map<string, any> = new Map();

  // Helper method for unit tests to seed mock user accounts
  public seedMockUser(user: { id: string; email: string; isActive: boolean; role: string }) {
    this.mockUserStore.set(user.id, { ...user });
  }

  public getMockUser(id: string) {
    return this.mockUserStore.get(id);
  }

  // 1. Designation Management
  public async createDesignation(input: DesignationInput): Promise<any> {
    const id = `desig-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const designation = {
      id,
      hospitalId: input.hospitalId,
      departmentId: input.departmentId || null,
      title: input.title,
      code: input.code.toUpperCase(),
      jobGrade: input.jobGrade || 'GRADE_B',
      minExperienceYears: input.minExperienceYears || 0,
      description: input.description || '',
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    this.designations.set(id, designation);
    return designation;
  }

  public async listDesignations(hospitalId: string): Promise<any[]> {
    return Array.from(this.designations.values()).filter(d => d.hospitalId === hospitalId);
  }

  // 2. Employee Master Record
  public async createEmployee(input: EmployeeInput): Promise<any> {
    const id = `emp-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    // Check for duplicate employee number in the same hospital
    const exists = Array.from(this.employees.values()).some(
      e => e.hospitalId === input.hospitalId && e.employeeNumber === input.employeeNumber
    );
    if (exists) {
      throw new Error(`Conflict: Employee number ${input.employeeNumber} already exists in this hospital`);
    }

    const employee = {
      id,
      hospitalId: input.hospitalId,
      userId: input.userId || null,
      employeeNumber: input.employeeNumber,
      firstName: input.firstName,
      lastName: input.lastName,
      fullName: `${input.firstName} ${input.lastName}`,
      gender: input.gender || 'OTHER',
      dateOfBirth: input.dateOfBirth || '1990-01-01',
      phone: input.phone,
      email: input.email,
      bloodGroup: input.bloodGroup || 'O+',
      emergencyContactName: input.emergencyContactName || '',
      emergencyContactPhone: input.emergencyContactPhone || '',
      departmentId: input.departmentId || null,
      designationId: input.designationId || null,
      employmentType: input.employmentType || 'FULL_TIME',
      employmentStatus: input.employmentStatus || 'PROBATION',
      dateOfJoining: input.dateOfJoining || new Date().toISOString().split('T')[0],
      confirmationDate: null,
      reportingManagerId: input.reportingManagerId || null,
      workLocation: input.workLocation || 'Main Campus',
      costCenterCode: input.costCenterCode || 'CC-GEN',
      baseMonthlySalary: input.baseMonthlySalary || 0,
      bankAccountNumber: input.bankAccountNumber || '',
      bankIfscCode: input.bankIfscCode || '',
      panNumber: input.panNumber || '',
      aadhaarMasked: input.aadhaarMasked || 'XXXX-XXXX-1234',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.employees.set(id, employee);
    logger.info('Employee master record created', { employeeNumber: employee.employeeNumber, id });
    return employee;
  }

  public async getEmployee(id: string): Promise<any | null> {
    return this.employees.get(id) || null;
  }

  public async updateEmployee(id: string, updates: Partial<EmployeeInput>): Promise<any> {
    const emp = this.employees.get(id);
    if (!emp) throw new Error('Employee not found');

    const updated = {
      ...emp,
      ...updates,
      fullName: updates.firstName || updates.lastName 
        ? `${updates.firstName || emp.firstName} ${updates.lastName || emp.lastName}`
        : emp.fullName,
      updatedAt: new Date().toISOString(),
    };
    this.employees.set(id, updated);
    return updated;
  }

  public async listEmployees(hospitalId: string, filter?: { departmentId?: string; status?: string }): Promise<any[]> {
    return Array.from(this.employees.values()).filter(e => {
      if (e.hospitalId !== hospitalId) return false;
      if (filter?.departmentId && e.departmentId !== filter.departmentId) return false;
      if (filter?.status && e.employmentStatus !== filter.status) return false;
      return true;
    });
  }

  // 3. Employee Document Vault
  public async uploadEmployeeDocument(input: EmployeeDocumentInput): Promise<any> {
    const employee = this.employees.get(input.employeeId);
    if (!employee) throw new Error('Employee not found');

    const id = `doc-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const doc = {
      id,
      hospitalId: input.hospitalId,
      employeeId: input.employeeId,
      documentType: input.documentType,
      documentName: input.documentName,
      filePath: input.filePath,
      fileSizeBytes: input.fileSizeBytes || 102400,
      mimeType: input.mimeType || 'application/pdf',
      verificationStatus: 'PENDING',
      verifiedByUserId: null,
      verifiedAt: null,
      notes: input.notes || '',
      createdAt: new Date().toISOString(),
    };
    this.employeeDocuments.set(id, doc);
    return doc;
  }

  public async verifyEmployeeDocument(id: string, verifierUserId: string, status: 'VERIFIED' | 'REJECTED', notes?: string): Promise<any> {
    const doc = this.employeeDocuments.get(id);
    if (!doc) throw new Error('Document not found');

    doc.verificationStatus = status;
    doc.verifiedByUserId = verifierUserId;
    doc.verifiedAt = new Date().toISOString();
    if (notes) doc.notes = notes;
    this.employeeDocuments.set(id, doc);
    return doc;
  }

  // 4. Identity & User Account Linking (Two-Phase Approval)
  public async linkUserAccount(employeeId: string, userId: string, approvedByUserId: string): Promise<any> {
    const emp = this.employees.get(employeeId);
    if (!emp) throw new Error('Employee not found');

    emp.userId = userId;
    emp.updatedAt = new Date().toISOString();
    this.employees.set(employeeId, emp);

    // If mock user store exists, ensure it is active
    const user = this.mockUserStore.get(userId);
    if (user) {
      user.isActive = true;
      this.mockUserStore.set(userId, user);
    }

    logger.info('User account linked to employee profile', { employeeId, userId, approvedBy: approvedByUserId });
    return { success: true, employeeId, userId, linkedAt: new Date().toISOString() };
  }

  // 5. Recruitment & Applicant Tracking System (ATS)
  public async createJobRequisition(input: JobRequisitionInput): Promise<any> {
    const id = `req-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const requisition = {
      id,
      hospitalId: input.hospitalId,
      requisitionNumber: input.requisitionNumber,
      departmentId: input.departmentId,
      designationId: input.designationId,
      vacanciesCount: input.vacanciesCount || 1,
      jobDescription: input.jobDescription,
      requiredQualification: input.requiredQualification,
      minExperienceYears: input.minExperienceYears || 0,
      budgetCtcMax: input.budgetCtcMax || 0,
      priority: input.priority || 'MEDIUM',
      status: 'PENDING_APPROVAL',
      approvedByUserId: null,
      createdAt: new Date().toISOString(),
    };
    this.jobRequisitions.set(id, requisition);
    return requisition;
  }

  public async approveJobRequisition(id: string, approverUserId: string): Promise<any> {
    const req = this.jobRequisitions.get(id);
    if (!req) throw new Error('Job requisition not found');

    req.status = 'OPEN';
    req.approvedByUserId = approverUserId;
    this.jobRequisitions.set(id, req);
    logger.info('Job requisition approved and opened', { requisitionId: id, approver: approverUserId });
    return req;
  }

  public async registerCandidate(input: CandidateInput): Promise<any> {
    const id = `cand-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const candidate = {
      id,
      hospitalId: input.hospitalId,
      firstName: input.firstName,
      lastName: input.lastName,
      fullName: `${input.firstName} ${input.lastName}`,
      email: input.email,
      phone: input.phone,
      currentOrganization: input.currentOrganization || '',
      experienceYears: input.experienceYears || 0,
      qualification: input.qualification || '',
      resumeUrl: input.resumeUrl || '',
      createdAt: new Date().toISOString(),
    };
    this.candidates.set(id, candidate);
    return candidate;
  }

  public async createApplication(input: ApplicationInput): Promise<any> {
    const req = this.jobRequisitions.get(input.requisitionId);
    if (!req) throw new Error('Requisition not found');
    const cand = this.candidates.get(input.candidateId);
    if (!cand) throw new Error('Candidate not found');

    const id = `app-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const application = {
      id,
      hospitalId: input.hospitalId,
      requisitionId: input.requisitionId,
      candidateId: input.candidateId,
      stage: 'APPLIED',
      expectedCtc: input.expectedCtc || 0,
      offeredCtc: 0,
      joiningDate: null,
      statusNotes: 'Application submitted',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.applications.set(id, application);
    return application;
  }

  public async evaluateInterview(input: InterviewEvaluationInput): Promise<any> {
    const app = this.applications.get(input.applicationId);
    if (!app) throw new Error('Application not found');

    const id = `eval-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const evaluation = {
      id,
      hospitalId: input.hospitalId,
      applicationId: input.applicationId,
      interviewerUserId: input.interviewerUserId,
      interviewRound: input.interviewRound || 'CLINICAL_COMPETENCY',
      score: input.score,
      recommendation: input.recommendation,
      notes: input.notes || '',
      completedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    this.interviewEvaluations.set(id, evaluation);

    // Update application stage based on recommendation
    if (input.recommendation === 'SELECT') {
      app.stage = 'SELECTED';
    } else if (input.recommendation === 'REJECT') {
      app.stage = 'REJECTED';
    } else {
      app.stage = 'INTERVIEW_COMPLETED';
    }
    app.updatedAt = new Date().toISOString();
    this.applications.set(input.applicationId, app);

    return evaluation;
  }

  public async issueJobOffer(applicationId: string, offeredCtc: number, expectedJoiningDate: string): Promise<any> {
    const app = this.applications.get(applicationId);
    if (!app) throw new Error('Application not found');

    app.stage = 'OFFER_ISSUED';
    app.offeredCtc = offeredCtc;
    app.joiningDate = expectedJoiningDate;
    app.statusNotes = `Offer issued with CTC ₹${offeredCtc}`;
    app.updatedAt = new Date().toISOString();
    this.applications.set(applicationId, app);

    logger.info('Job offer issued', { applicationId, offeredCtc, expectedJoiningDate });
    return app;
  }

  public async acceptJobOffer(applicationId: string): Promise<any> {
    const app = this.applications.get(applicationId);
    if (!app) throw new Error('Application not found');

    app.stage = 'OFFER_ACCEPTED';
    app.statusNotes = 'Candidate accepted offer letter';
    app.updatedAt = new Date().toISOString();
    this.applications.set(applicationId, app);
    return app;
  }

  // 6. Biometric Attendance & Time Tracking
  public async registerAttendanceDevice(input: AttendanceDeviceInput): Promise<any> {
    const id = `dev-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const device = {
      id,
      hospitalId: input.hospitalId,
      deviceName: input.deviceName,
      deviceCode: input.deviceCode.toUpperCase(),
      deviceType: input.deviceType || 'BIOMETRIC_FINGERPRINT',
      ipAddress: input.ipAddress || '192.168.1.100',
      port: input.port || 4370,
      locationArea: input.locationArea || 'Main Entrance',
      lastSyncAt: new Date().toISOString(),
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    this.attendanceDevices.set(id, device);
    return device;
  }

  public async recordAttendancePunch(input: AttendancePunchInput): Promise<any> {
    const emp = this.employees.get(input.employeeId);
    if (!emp) throw new Error('Employee not found');

    const punchTimestamp = input.logTimestamp ? new Date(input.logTimestamp) : new Date();

    // Deduplication check: Disallow identical punches within 2 minutes (120,000 ms)
    const duplicate = this.attendanceLogs.find(log => 
      log.employeeId === input.employeeId &&
      log.punchType === (input.punchType || 'CHECK_IN') &&
      Math.abs(new Date(log.logTimestamp).getTime() - punchTimestamp.getTime()) < 120000
    );

    if (duplicate) {
      throw new Error(`Conflict: Duplicate punch ignored within 2-minute window for employee ${emp.employeeNumber}`);
    }

    const id = `punch-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const punch = {
      id,
      hospitalId: input.hospitalId,
      employeeId: input.employeeId,
      deviceId: input.deviceId || null,
      logTimestamp: punchTimestamp.toISOString(),
      punchType: input.punchType || 'CHECK_IN',
      source: input.source || 'DEVICE',
      verificationMode: input.verificationMode || 'FINGERPRINT',
      isAnomaly: false,
      anomalyReason: null,
      createdAt: new Date().toISOString(),
    };

    this.attendanceLogs.push(punch);
    return punch;
  }

  public async requestAttendanceCorrection(input: AttendanceCorrectionInput): Promise<any> {
    const emp = this.employees.get(input.employeeId);
    if (!emp) throw new Error('Employee not found');

    const id = `cor-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const correction = {
      id,
      hospitalId: input.hospitalId,
      employeeId: input.employeeId,
      attendanceDate: input.attendanceDate,
      requestedCheckIn: input.requestedCheckIn || `${input.attendanceDate}T09:00:00Z`,
      requestedCheckOut: input.requestedCheckOut || `${input.attendanceDate}T17:00:00Z`,
      reason: input.reason,
      status: 'PENDING',
      approvedByUserId: null,
      approvalNotes: null,
      createdAt: new Date().toISOString(),
    };
    this.attendanceCorrections.set(id, correction);
    return correction;
  }

  public async approveAttendanceCorrection(id: string, approverUserId: string, approved: boolean, notes?: string): Promise<any> {
    const correction = this.attendanceCorrections.get(id);
    if (!correction) throw new Error('Attendance correction request not found');

    correction.status = approved ? 'APPROVED' : 'REJECTED';
    correction.approvedByUserId = approverUserId;
    correction.approvalNotes = notes || '';
    correction.updatedAt = new Date().toISOString();
    this.attendanceCorrections.set(id, correction);

    if (approved) {
      // Inject corrected punches
      if (correction.requestedCheckIn) {
        this.attendanceLogs.push({
          id: `punch-cor-in-${Date.now()}`,
          hospitalId: correction.hospitalId,
          employeeId: correction.employeeId,
          deviceId: null,
          logTimestamp: correction.requestedCheckIn,
          punchType: 'CHECK_IN',
          source: 'MANUAL_OVERRIDE',
          verificationMode: 'SUPERVISOR_CORRECTION',
          isAnomaly: false,
          anomalyReason: 'Approved Attendance Correction',
          createdAt: new Date().toISOString(),
        });
      }
      if (correction.requestedCheckOut) {
        this.attendanceLogs.push({
          id: `punch-cor-out-${Date.now()}`,
          hospitalId: correction.hospitalId,
          employeeId: correction.employeeId,
          deviceId: null,
          logTimestamp: correction.requestedCheckOut,
          punchType: 'CHECK_OUT',
          source: 'MANUAL_OVERRIDE',
          verificationMode: 'SUPERVISOR_CORRECTION',
          isAnomaly: false,
          anomalyReason: 'Approved Attendance Correction',
          createdAt: new Date().toISOString(),
        });
      }
    }

    return correction;
  }

  // 7. Shift Templates & Duty Rostering with Conflict Prevention
  public async createShiftTemplate(input: ShiftTemplateInput): Promise<any> {
    const id = `shift-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const template = {
      id,
      hospitalId: input.hospitalId,
      shiftCode: input.shiftCode.toUpperCase(),
      shiftName: input.shiftName,
      startTime: input.startTime,
      endTime: input.endTime,
      durationHours: input.durationHours || 8.0,
      isNightShift: input.isNightShift || false,
      isOnCall: input.isOnCall || false,
      colorCode: input.colorCode || '#3B82F6',
      createdAt: new Date().toISOString(),
    };
    this.shiftTemplates.set(id, template);
    return template;
  }

  public async assignDutyRoster(input: DutyRosterInput): Promise<any> {
    const emp = this.employees.get(input.employeeId);
    if (!emp) throw new Error('Employee not found');
    const template = this.shiftTemplates.get(input.shiftTemplateId);
    if (!template) throw new Error('Shift template not found');

    // Anti-collision: Check if employee is already rostered on the same date
    const existingRoster = Array.from(this.dutyRosters.values()).find(
      r => r.hospitalId === input.hospitalId &&
           r.employeeId === input.employeeId &&
           r.rosterDate === input.rosterDate &&
           r.status !== 'CANCELLED'
    );

    if (existingRoster) {
      throw new Error(`Conflict: Employee ${emp.fullName} is already assigned to a shift on date ${input.rosterDate}`);
    }

    const id = `roster-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const roster = {
      id,
      hospitalId: input.hospitalId,
      employeeId: input.employeeId,
      employeeName: emp.fullName,
      departmentId: input.departmentId,
      shiftTemplateId: input.shiftTemplateId,
      shiftCode: template.shiftCode,
      shiftName: template.shiftName,
      rosterDate: input.rosterDate,
      shiftRole: input.shiftRole || 'PRIMARY',
      isSwap: false,
      originalEmployeeId: null,
      status: 'SCHEDULED',
      createdAt: new Date().toISOString(),
    };
    this.dutyRosters.set(id, roster);
    return roster;
  }

  public async listDutyRosters(hospitalId: string, filter?: { date?: string; departmentId?: string }): Promise<any[]> {
    return Array.from(this.dutyRosters.values()).filter(r => {
      if (r.hospitalId !== hospitalId) return false;
      if (filter?.date && r.rosterDate !== filter.date) return false;
      if (filter?.departmentId && r.departmentId !== filter.departmentId) return false;
      return true;
    });
  }

  // 8. Leave Management & Dynamic Balances
  public async createLeaveType(input: LeaveTypeInput): Promise<any> {
    const id = `lt-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const lt = {
      id,
      hospitalId: input.hospitalId,
      code: input.code.toUpperCase(),
      name: input.name,
      annualQuotaDays: input.annualQuotaDays,
      isCarryForward: input.isCarryForward || false,
      maxCarryForwardDays: input.maxCarryForwardDays || 0,
      isEncashable: input.isEncashable || false,
      requiresProof: input.requiresProof || false,
      createdAt: new Date().toISOString(),
    };
    this.leaveTypes.set(id, lt);
    return lt;
  }

  public async initializeLeaveBalance(input: LeaveBalanceInput): Promise<any> {
    const id = `bal-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const bal = {
      id,
      hospitalId: input.hospitalId,
      employeeId: input.employeeId,
      leaveTypeId: input.leaveTypeId,
      year: input.year,
      openingBalance: input.openingBalance,
      accrued: input.accrued || 0,
      used: 0,
      closingBalance: input.openingBalance + (input.accrued || 0),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.leaveBalances.set(id, bal);
    return bal;
  }

  public async applyLeave(input: LeaveApplicationInput): Promise<any> {
    const emp = this.employees.get(input.employeeId);
    if (!emp) throw new Error('Employee not found');

    // Balance verification
    const currentYear = new Date(input.startDate).getFullYear();
    const balanceRecord = Array.from(this.leaveBalances.values()).find(
      b => b.employeeId === input.employeeId &&
           b.leaveTypeId === input.leaveTypeId &&
           b.year === currentYear
    );

    if (balanceRecord && balanceRecord.closingBalance < input.totalDays) {
      throw new Error(`Conflict: Insufficient leave balance. Requested ${input.totalDays} days, available ${balanceRecord.closingBalance} days.`);
    }

    const id = `la-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const application = {
      id,
      hospitalId: input.hospitalId,
      employeeId: input.employeeId,
      leaveTypeId: input.leaveTypeId,
      startDate: input.startDate,
      endDate: input.endDate,
      totalDays: input.totalDays,
      reason: input.reason,
      attachmentUrl: input.attachmentUrl || null,
      status: 'PENDING',
      approvedByUserId: null,
      approvalNotes: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.leaveApplications.set(id, application);
    return application;
  }

  public async approveLeave(id: string, approverUserId: string, approved: boolean, notes?: string): Promise<any> {
    const app = this.leaveApplications.get(id);
    if (!app) throw new Error('Leave application not found');

    if (approved) {
      app.status = 'APPROVED';
      app.approvedByUserId = approverUserId;
      app.approvalNotes = notes || '';

      // Deduct from balance
      const currentYear = new Date(app.startDate).getFullYear();
      const balanceRecord = Array.from(this.leaveBalances.values()).find(
        b => b.employeeId === app.employeeId &&
             b.leaveTypeId === app.leaveTypeId &&
             b.year === currentYear
      );

      if (balanceRecord) {
        balanceRecord.used += app.totalDays;
        balanceRecord.closingBalance = Math.max(0, balanceRecord.closingBalance - app.totalDays);
        balanceRecord.updatedAt = new Date().toISOString();
        this.leaveBalances.set(balanceRecord.id, balanceRecord);
      }
    } else {
      app.status = 'REJECTED';
      app.approvedByUserId = approverUserId;
      app.approvalNotes = notes || '';
    }

    app.updatedAt = new Date().toISOString();
    this.leaveApplications.set(id, app);
    return app;
  }

  // 9. Comprehensive Payroll & Statutory Calculations
  public async setupSalaryStructure(input: SalaryStructureInput): Promise<any> {
    const emp = this.employees.get(input.employeeId);
    if (!emp) throw new Error('Employee not found');

    const basic = Number(input.basicSalary);
    const hra = Number(input.hraAllowance || 0);
    const conveyance = Number(input.conveyanceAllowance || 0);
    const medical = Number(input.medicalAllowance || 0);
    const special = Number(input.specialAllowance || 0);
    const nightShift = Number(input.nightShiftAllowance || 0);
    const gross = basic + hra + conveyance + medical + special + nightShift;

    const id = `sal-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const structure = {
      id,
      hospitalId: input.hospitalId,
      employeeId: input.employeeId,
      basicSalary: basic,
      hraAllowance: hra,
      conveyanceAllowance: conveyance,
      medicalAllowance: medical,
      specialAllowance: special,
      nightShiftAllowance: nightShift,
      grossSalary: gross,
      pfApplicable: input.pfApplicable !== undefined ? input.pfApplicable : true,
      esiApplicable: input.esiApplicable !== undefined ? input.esiApplicable : false,
      ptApplicable: input.ptApplicable !== undefined ? input.ptApplicable : true,
      tdsMonthly: Number(input.tdsMonthly || 0),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.salaryStructures.set(input.employeeId, structure);
    return structure;
  }

  public async createPayrollBatch(hospitalId: string, periodMonth: string): Promise<any> {
    // Check if duplicate batch exists
    const existing = Array.from(this.payrollBatches.values()).find(
      b => b.hospitalId === hospitalId && b.periodMonth === periodMonth
    );
    if (existing) {
      throw new Error(`Conflict: Payroll batch for period ${periodMonth} already exists.`);
    }

    const id = `batch-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const batch = {
      id,
      hospitalId,
      batchCode: `PAY-${periodMonth}-${Math.floor(Math.random() * 10000)}`,
      periodMonth,
      totalEmployees: 0,
      totalGross: 0,
      totalDeductions: 0,
      totalNetPayable: 0,
      status: 'DRAFT',
      approvedByUserId: null,
      glJournalVoucherId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.payrollBatches.set(id, batch);
    return batch;
  }

  public async calculateEmployeePayslip(batchId: string, employeeId: string, daysWorked: { workingDays?: number; presentDays?: number; paidLeaveDays?: number; unpaidLeaveDays?: number }): Promise<any> {
    const batch = this.payrollBatches.get(batchId);
    if (!batch) throw new Error('Payroll batch not found');
    const emp = this.employees.get(employeeId);
    if (!emp) throw new Error('Employee not found');
    const structure = this.salaryStructures.get(employeeId);
    if (!structure) throw new Error(`Salary structure not configured for employee ${emp.fullName}`);

    const workingDays = daysWorked.workingDays || 30;
    const presentDays = daysWorked.presentDays !== undefined ? daysWorked.presentDays : 30;
    const paidLeaveDays = daysWorked.paidLeaveDays || 0;
    const unpaidLeaveDays = daysWorked.unpaidLeaveDays || 0;

    const payableDays = Math.min(workingDays, presentDays + paidLeaveDays);
    const prorationRatio = payableDays / workingDays;

    // Prorated Earnings
    const basicEarned = Math.round(structure.basicSalary * prorationRatio * 100) / 100;
    const hraEarned = Math.round(structure.hraAllowance * prorationRatio * 100) / 100;
    const allowancesEarned = Math.round((structure.conveyanceAllowance + structure.medicalAllowance + structure.specialAllowance + structure.nightShiftAllowance) * prorationRatio * 100) / 100;
    const grossEarned = basicEarned + hraEarned + allowancesEarned;

    // Indian Statutory Deductions
    // PF: 12% of basic earned (capped or actual)
    let pfDeduction = 0;
    if (structure.pfApplicable) {
      pfDeduction = Math.round(basicEarned * 0.12 * 100) / 100;
    }

    // ESI: 0.75% of gross if gross <= 21,000
    let esiDeduction = 0;
    if (structure.esiApplicable && grossEarned <= 21000) {
      esiDeduction = Math.round(grossEarned * 0.0075 * 100) / 100;
    }

    // Professional Tax (PT): standard ₹200
    let ptDeduction = 0;
    if (structure.ptApplicable && grossEarned > 15000) {
      ptDeduction = 200;
    }

    // TDS Deduction
    const tdsDeduction = Number(structure.tdsMonthly || 0);

    const totalDeductions = Math.round((pfDeduction + esiDeduction + ptDeduction + tdsDeduction) * 100) / 100;
    const netPayable = Math.round((grossEarned - totalDeductions) * 100) / 100;

    const id = `slip-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const payslip = {
      id,
      hospitalId: batch.hospitalId,
      batchId,
      employeeId,
      employeeNumber: emp.employeeNumber,
      employeeName: emp.fullName,
      periodMonth: batch.periodMonth,
      workingDays,
      presentDays,
      paidLeaveDays,
      unpaidLeaveDays,
      basicEarned,
      hraEarned,
      allowancesEarned,
      grossEarned,
      pfDeduction,
      esiDeduction,
      ptDeduction,
      tdsDeduction,
      totalDeductions,
      netPayable,
      status: 'GENERATED',
      paymentRef: null,
      createdAt: new Date().toISOString(),
    };

    this.payslips.set(id, payslip);

    // Update batch totals
    batch.totalEmployees += 1;
    batch.totalGross = Math.round((batch.totalGross + grossEarned) * 100) / 100;
    batch.totalDeductions = Math.round((batch.totalDeductions + totalDeductions) * 100) / 100;
    batch.totalNetPayable = Math.round((batch.totalNetPayable + netPayable) * 100) / 100;
    batch.status = 'CALCULATED';
    this.payrollBatches.set(batchId, batch);

    return payslip;
  }

  public async approvePayrollBatch(batchId: string, approverUserId: string): Promise<any> {
    const batch = this.payrollBatches.get(batchId);
    if (!batch) throw new Error('Payroll batch not found');

    batch.status = 'APPROVED';
    batch.approvedByUserId = approverUserId;
    batch.updatedAt = new Date().toISOString();
    this.payrollBatches.set(batchId, batch);

    logger.info('Payroll batch approved', { batchId, totalNetPayable: batch.totalNetPayable, approverUserId });
    return batch;
  }

  // 10. General Ledger Financial Integration (Balanced Double-Entry Journal Voucher)
  public async postPayrollToGeneralLedger(batchId: string): Promise<any> {
    const batch = this.payrollBatches.get(batchId);
    if (!batch) throw new Error('Payroll batch not found');

    if (batch.status === 'POSTED_TO_GL') {
      throw new Error(`Conflict: Payroll batch ${batch.batchCode} has already been posted to General Ledger.`);
    }

    const slips = Array.from(this.payslips.values()).filter(p => p.batchId === batchId);
    if (slips.length === 0) throw new Error('Cannot post empty payroll batch to GL');

    let totalGross = 0;
    let totalPf = 0;
    let totalEsi = 0;
    let totalPt = 0;
    let totalTds = 0;
    let totalNet = 0;

    for (const s of slips) {
      totalGross += s.grossEarned;
      totalPf += s.pfDeduction;
      totalEsi += s.esiDeduction;
      totalPt += s.ptDeduction;
      totalTds += s.tdsDeduction;
      totalNet += s.netPayable;
    }

    totalGross = Math.round(totalGross * 100) / 100;
    totalPf = Math.round(totalPf * 100) / 100;
    totalEsi = Math.round(totalEsi * 100) / 100;
    totalPt = Math.round(totalPt * 100) / 100;
    totalTds = Math.round(totalTds * 100) / 100;
    totalNet = Math.round(totalNet * 100) / 100;

    // Double-Entry Balancing Check:
    // Debit: Salary & Wages Expense = totalGross
    // Credit: PF Payable = totalPf, ESI Payable = totalEsi, PT Payable = totalPt, TDS Payable = totalTds, Salaries Payable = totalNet
    const totalCredits = Math.round((totalPf + totalEsi + totalPt + totalTds + totalNet) * 100) / 100;
    const isBalanced = Math.abs(totalGross - totalCredits) < 0.05;

    if (!isBalanced) {
      throw new Error(`Invariance Breach: Payroll journal entry unbalanced. Debits: ${totalGross}, Credits: ${totalCredits}`);
    }

    const jvId = `jv-pay-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const journalVoucher = {
      id: jvId,
      hospitalId: batch.hospitalId,
      voucherNumber: `JV-${batch.periodMonth}-PAY`,
      description: `Monthly Payroll Expense & Statutory Liabilities for ${batch.periodMonth}`,
      entries: [
        { account: 'SALARY_AND_WAGES_EXPENSE', debit: totalGross, credit: 0 },
        { account: 'PROVIDENT_FUND_PAYABLE', debit: 0, credit: totalPf },
        { account: 'ESI_PAYABLE', debit: 0, credit: totalEsi },
        { account: 'PROFESSIONAL_TAX_PAYABLE', debit: 0, credit: totalPt },
        { account: 'TDS_PAYABLE', debit: 0, credit: totalTds },
        { account: 'NET_SALARIES_PAYABLE', debit: 0, credit: totalNet },
      ],
      totalDebit: totalGross,
      totalCredit: totalCredits,
      isBalanced: true,
      postedAt: new Date().toISOString(),
    };

    this.generalLedgerVouchers.push(journalVoucher);

    batch.status = 'POSTED_TO_GL';
    batch.glJournalVoucherId = jvId;
    batch.updatedAt = new Date().toISOString();
    this.payrollBatches.set(batchId, batch);

    logger.info('Payroll successfully posted to General Ledger', { batchId, jvId, totalDebit: totalGross });
    return { batch, journalVoucher };
  }

  // 11. Professional Credentials & Expiration Tracking
  public async recordCredential(input: ProfessionalCredentialInput): Promise<any> {
    const emp = this.employees.get(input.employeeId);
    if (!emp) throw new Error('Employee not found');

    const id = `cred-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const cred = {
      id,
      hospitalId: input.hospitalId,
      employeeId: input.employeeId,
      employeeName: emp.fullName,
      credentialType: input.credentialType,
      licenseNumber: input.licenseNumber,
      issuingAuthority: input.issuingAuthority,
      issueDate: input.issueDate,
      expiryDate: input.expiryDate,
      verificationStatus: 'UNVERIFIED',
      verifiedByUserId: null,
      createdAt: new Date().toISOString(),
    };
    this.professionalCredentials.set(id, cred);
    return cred;
  }

  public async verifyCredential(id: string, verifierUserId: string, approved: boolean): Promise<any> {
    const cred = this.professionalCredentials.get(id);
    if (!cred) throw new Error('Credential not found');

    cred.verificationStatus = approved ? 'VERIFIED' : 'REJECTED';
    cred.verifiedByUserId = verifierUserId;
    this.professionalCredentials.set(id, cred);
    return cred;
  }

  public async getExpiringCredentials(hospitalId: string, daysAhead: number = 30): Promise<any[]> {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + daysAhead);

    return Array.from(this.professionalCredentials.values()).filter(c => {
      if (c.hospitalId !== hospitalId) return false;
      const exp = new Date(c.expiryDate);
      return exp <= targetDate;
    });
  }

  // 12. Training Programs & Mandatory Certifications
  public async createTrainingProgram(input: TrainingProgramInput): Promise<any> {
    const id = `train-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const prog = {
      id,
      hospitalId: input.hospitalId,
      programName: input.programName,
      category: input.category || 'CLINICAL_SAFETY',
      durationHours: input.durationHours || 4.0,
      validityMonths: input.validityMonths || 12,
      description: input.description || '',
      createdAt: new Date().toISOString(),
    };
    this.trainingPrograms.set(id, prog);
    return prog;
  }

  public async recordTrainingCompletion(input: TrainingAttendeeInput): Promise<any> {
    const emp = this.employees.get(input.employeeId);
    if (!emp) throw new Error('Employee not found');
    const prog = this.trainingPrograms.get(input.programId);
    if (!prog) throw new Error('Training program not found');

    const id = `att-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const completion = {
      id,
      hospitalId: input.hospitalId,
      programId: input.programId,
      programName: prog.programName,
      employeeId: input.employeeId,
      employeeName: emp.fullName,
      completionDate: input.completionDate || new Date().toISOString().split('T')[0],
      expiryDate: input.expiryDate,
      scorePercentage: input.scorePercentage !== undefined ? input.scorePercentage : 100.0,
      certificateNumber: input.certificateNumber || `CERT-${Date.now()}`,
      status: input.status || 'PASSED',
      createdAt: new Date().toISOString(),
    };
    this.trainingAttendees.set(id, completion);
    return completion;
  }

  // 13. Employee Separation & Immediate Access Revocation
  public async initiateSeparation(input: SeparationInput): Promise<any> {
    const emp = this.employees.get(input.employeeId);
    if (!emp) throw new Error('Employee not found');

    const id = `sep-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const sep = {
      id,
      hospitalId: input.hospitalId,
      employeeId: input.employeeId,
      employeeName: emp.fullName,
      resignationDate: input.resignationDate || new Date().toISOString().split('T')[0],
      requestedRelievingDate: input.requestedRelievingDate,
      noticePeriodDays: input.noticePeriodDays || 30,
      reason: input.reason,
      separationType: input.separationType || 'RESIGNATION',
      clinicalHandoverCleared: false,
      assetsReturned: false,
      departmentClearance: false,
      financeSettled: false,
      finalSettlementAmount: 0,
      accessRevoked: false,
      accessRevokedAt: null,
      status: 'SUBMITTED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.separations.set(id, sep);
    return sep;
  }

  public async updateSeparationClearance(separationId: string, clearances: { clinicalHandover?: boolean; assetsReturned?: boolean; departmentClearance?: boolean; financeSettled?: boolean; settlementAmount?: number }): Promise<any> {
    const sep = this.separations.get(separationId);
    if (!sep) throw new Error('Separation record not found');

    if (clearances.clinicalHandover !== undefined) sep.clinicalHandoverCleared = clearances.clinicalHandover;
    if (clearances.assetsReturned !== undefined) sep.assetsReturned = clearances.assetsReturned;
    if (clearances.departmentClearance !== undefined) sep.departmentClearance = clearances.departmentClearance;
    if (clearances.financeSettled !== undefined) sep.financeSettled = clearances.financeSettled;
    if (clearances.settlementAmount !== undefined) sep.finalSettlementAmount = clearances.settlementAmount;

    sep.status = 'IN_CLEARANCE';
    sep.updatedAt = new Date().toISOString();
    this.separations.set(separationId, sep);
    return sep;
  }

  public async finalizeSeparationAndRevokeAccess(separationId: string): Promise<any> {
    const sep = this.separations.get(separationId);
    if (!sep) throw new Error('Separation record not found');

    const emp = this.employees.get(sep.employeeId);
    if (!emp) throw new Error('Employee not found');

    // Revoke system access
    sep.accessRevoked = true;
    sep.accessRevokedAt = new Date().toISOString();
    sep.status = 'CLOSED';
    sep.updatedAt = new Date().toISOString();
    this.separations.set(separationId, sep);

    // Deactivate employee profile
    emp.employmentStatus = sep.separationType === 'TERMINATION' ? 'TERMINATED' : 'RESIGNED';
    emp.isActive = false;
    this.employees.set(emp.id, emp);

    // Deactivate linked central user account if one exists
    if (emp.userId) {
      const user = this.mockUserStore.get(emp.userId);
      if (user) {
        user.isActive = false;
        this.mockUserStore.set(emp.userId, user);
      }
    }

    logger.info('Employee separation closed and system access instantaneously revoked', {
      separationId,
      employeeId: emp.id,
      employeeNumber: emp.employeeNumber,
      userId: emp.userId,
    });

    return { sep, employee: emp };
  }

  // 14. HR Analytics & Workforce Metrics
  public async getWorkforceMetrics(hospitalId: string): Promise<any> {
    const emps = Array.from(this.employees.values()).filter(e => e.hospitalId === hospitalId);
    const totalEmployees = emps.length;
    const activeEmployees = emps.filter(e => e.isActive && e.employmentStatus === 'ACTIVE').length;
    const probationEmployees = emps.filter(e => e.isActive && e.employmentStatus === 'PROBATION').length;
    const resignedEmployees = emps.filter(e => !e.isActive && (e.employmentStatus === 'RESIGNED' || e.employmentStatus === 'TERMINATED')).length;

    // Open requisitions count
    const openRequisitions = Array.from(this.jobRequisitions.values()).filter(
      r => r.hospitalId === hospitalId && r.status === 'OPEN'
    ).length;

    // Leave counts
    const activeLeaves = Array.from(this.leaveApplications.values()).filter(
      l => l.hospitalId === hospitalId && l.status === 'APPROVED'
    ).length;

    return {
      totalEmployees,
      activeEmployees,
      probationEmployees,
      resignedEmployees,
      openRequisitions,
      activeLeaves,
    };
  }
}

export const hrmsAdvancedService = new HrmsAdvancedService();

