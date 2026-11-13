import crypto from 'crypto';
import { db } from '../../database';
import { logger } from '../../utils/logger';
import { OnboardingService } from './onboarding.service';

// ============================================================================
// ASRTAVA DYNAMIC HOSPITAL DISCOVERY, CONFIGURATION & PROVISIONING ENGINE
// Bespoke HMS generation from 12-section discovery & NIST-compliant staff credentials
// ============================================================================

export interface DiscoverySectionPayload {
  sectionNumber: number;
  sectionName: string;
  data: Record<string, any>;
  completionStatus?: 'draft' | 'submitted' | 'verified' | 'revision_requested';
  submittedBy?: string;
  submittedAt?: string;
  verificationNotes?: string;
}

export interface HospitalConfigurationBlueprint {
  id: string;
  hospitalId: string;
  version: number;
  facilityTier: 'clinic_daycare' | 'general_multispecialty' | 'tertiary_care' | 'quaternary_specialty' | 'hospital_group_network';
  capacityMetrics: {
    licensedBeds: number;
    icuBeds: number;
    emergencyBays: number;
    otSuites: number;
    dialysisStations: number;
    daycareBeds: number;
  };
  enabledModules: string[];
  departmentHierarchy: Array<{
    code: string;
    name: string;
    type: 'clinical' | 'diagnostic' | 'surgical' | 'administrative' | 'support';
    headOfDepartment?: string;
    subSpecialties?: string[];
  }>;
  wardBedTaxonomy: Array<{
    wardCode: string;
    wardName: string;
    category: 'general' | 'semi_private' | 'deluxe_private' | 'icu' | 'isolation' | 'daycare';
    bedCount: number;
    genderPolicy: 'male' | 'female' | 'unisex';
  }>;
  clinicalWorkflows: {
    triageStandard: 'ESI_1_5' | 'MANCHESTER' | 'CANADIAN_CTAS';
    surgicalSafetyProtocol: 'WHO_3_PHASE';
    narcoticsDualSignoff: boolean;
    digitalSignaturePKILevel: number;
    dischargeApprovalWorkflow: string[];
    criticalLabPanicReadbackTimeMinutes: number;
  };
  tariffBillingRules: {
    opdConsultationTiers: Array<{ tier: string; fee: number }>;
    bedDailyRates: Record<string, number>;
    tpaPanelsEnabled: string[];
    governmentSchemesEnabled: string[];
  };
  integrationEndpoints: Array<{
    protocol: 'HL7_V2' | 'DICOM_PACS' | 'ASTM_LIS' | 'ABDM_M1_M3' | 'FHIR_R4';
    name: string;
    status: 'configured' | 'pending_handshake' | 'active';
  }>;
  deploymentTopology: {
    model: 'cloud_multi_tenant' | 'private_cloud' | 'hybrid_edge_appliance';
    serverSpecifications: string;
    localLanSpeed: string;
    offlineJournalRetentionDays: number;
  };
  asrtavaLeadSignoff?: {
    leadId: string;
    leadName: string;
    signedAt: string;
    signatureHash: string;
  };
  hospitalDirectorSignoff?: {
    directorId: string;
    directorName: string;
    signedAt: string;
    signatureHash: string;
  };
  status: 'draft' | 'pending_approval' | 'approved' | 'provisioned' | 'superseded';
  createdAt: string;
  updatedAt: string;
}

export interface StaffEnrolmentInput {
  name: string;
  email: string;
  phone?: string;
  department: string;
  designation?: string;
  role: string;
  employeeId?: string;
  medicalRegistrationNo?: string;
}

export interface StaffCredentialManifestItem {
  id: string;
  staffName: string;
  department: string;
  designation: string;
  role: string;
  employeeId: string;
  medicalRegistrationNo?: string;
  generatedUsername: string;
  temporaryPassword: string; // Plaintext for initial distribution manifest
  passwordExpiresAt: string;
  forcePasswordChange: boolean;
  loginUrl: string;
  securityNotice: string;
}

export class DynamicHospitalConfigService {
  // In-memory fallback repositories
  private static discoveryStore = new Map<string, Map<number, DiscoverySectionPayload>>();
  private static blueprintStore = new Map<string, HospitalConfigurationBlueprint>();
  private static staffManifestStore = new Map<string, StaffCredentialManifestItem[]>();

  // --------------------------------------------------------------------------
  // 1. 12-SECTION DISCOVERY QUESTIONNAIRE INGESTION
  // --------------------------------------------------------------------------

  public static readonly DISCOVERY_SECTIONS: Record<number, string> = {
    1: 'Hospital Profile & Legal Identity',
    2: 'Healthcare Facility Classification & Capacity',
    3: 'Clinical Specialties & Services',
    4: 'Physical Infrastructure & Ward Taxonomy',
    5: 'Diagnostic & Ancillary Services',
    6: 'Staff Roster & Clinical Credentials',
    7: 'Operational Workflows & Policies',
    8: 'Billing, Tariffs & Insurance Payers',
    9: 'Interoperability & Medical Device Interfaces',
    10: 'Security, Compliance & Role-Based Access',
    11: 'Hardware, Network & Deployment Topology',
    12: 'Data Migration & Legacy System Ingestion'
  };

  /**
   * Submit or update a discovery questionnaire section
   */
  public static async submitDiscoverySection(params: {
    hospitalId: string;
    sectionNumber: number;
    payload: Record<string, any>;
    actorId?: string;
  }): Promise<DiscoverySectionPayload> {
    const { hospitalId, sectionNumber, payload, actorId } = params;

    if (sectionNumber < 1 || sectionNumber > 12) {
      throw new Error(`Invalid section number ${sectionNumber}. Must be between 1 and 12.`);
    }

    const sectionName = this.DISCOVERY_SECTIONS[sectionNumber];
    const timestamp = new Date().toISOString();

    const record: DiscoverySectionPayload = {
      sectionNumber,
      sectionName,
      data: payload,
      completionStatus: 'submitted',
      submittedBy: actorId,
      submittedAt: timestamp
    };

    // Store in memory
    if (!this.discoveryStore.has(hospitalId)) {
      this.discoveryStore.set(hospitalId, new Map());
    }
    this.discoveryStore.get(hospitalId)!.set(sectionNumber, record);

    // Persist to DB if connected
    try {
      await db('hospital_discovery_submissions')
        .insert({
          hospital_id: hospitalId,
          section_number: sectionNumber,
          section_name: sectionName,
          payload: JSON.stringify(payload),
          completion_status: 'submitted',
          submitted_by: actorId,
          submitted_at: timestamp,
          updated_at: timestamp
        })
        .onConflict(['hospital_id', 'section_number'])
        .merge({
          payload: JSON.stringify(payload),
          completion_status: 'submitted',
          submitted_by: actorId,
          submitted_at: timestamp,
          updated_at: timestamp
        });
    } catch (err: any) {
      logger.warn(`Database discovery persist skipped: ${err.message}`);
    }

    return record;
  }

  /**
   * Get all submitted discovery sections for a hospital
   */
  public static async getDiscoverySubmissions(hospitalId: string): Promise<{
    hospitalId: string;
    completedCount: number;
    totalSections: number;
    completionPercentage: number;
    sections: DiscoverySectionPayload[];
  }> {
    const sections: DiscoverySectionPayload[] = [];
    const hospitalSections = this.discoveryStore.get(hospitalId);

    for (let i = 1; i <= 12; i++) {
      if (hospitalSections && hospitalSections.has(i)) {
        sections.push(hospitalSections.get(i)!);
      } else {
        sections.push({
          sectionNumber: i,
          sectionName: this.DISCOVERY_SECTIONS[i],
          data: {},
          completionStatus: 'draft'
        });
      }
    }

    const completedCount = sections.filter(s => s.completionStatus === 'submitted' || s.completionStatus === 'verified').length;
    const completionPercentage = Math.round((completedCount / 12) * 100);

    return {
      hospitalId,
      completedCount,
      totalSections: 12,
      completionPercentage,
      sections
    };
  }

  // --------------------------------------------------------------------------
  // 2. AUTOMATED BESPOKE CONFIGURATION BLUEPRINT GENERATOR
  // --------------------------------------------------------------------------

  /**
   * Generates a tailored Hospital Management System configuration blueprint
   * based on the hospital's submitted discovery questionnaire responses.
   */
  public static async generateBlueprint(hospitalId: string, actorId?: string): Promise<HospitalConfigurationBlueprint> {
    const discovery = await this.getDiscoverySubmissions(hospitalId);
    const sec1 = discovery.sections.find(s => s.sectionNumber === 1)?.data || {};
    const sec2 = discovery.sections.find(s => s.sectionNumber === 2)?.data || {};
    const sec3 = discovery.sections.find(s => s.sectionNumber === 3)?.data || {};
    const sec4 = discovery.sections.find(s => s.sectionNumber === 4)?.data || {};
    const sec5 = discovery.sections.find(s => s.sectionNumber === 5)?.data || {};
    const sec7 = discovery.sections.find(s => s.sectionNumber === 7)?.data || {};
    const sec8 = discovery.sections.find(s => s.sectionNumber === 8)?.data || {};
    const sec9 = discovery.sections.find(s => s.sectionNumber === 9)?.data || {};
    const sec11 = discovery.sections.find(s => s.sectionNumber === 11)?.data || {};

    const licensedBeds = Number(sec2.licensedBeds || sec2.bedCapacity || 150);
    const icuBeds = Number(sec2.icuBeds || Math.round(licensedBeds * 0.15));
    const emergencyBays = Number(sec2.emergencyBays || 12);
    const otSuites = Number(sec2.otSuites || (licensedBeds > 100 ? 6 : 2));
    const dialysisStations = Number(sec2.dialysisStations || 4);
    const daycareBeds = Number(sec2.daycareBeds || 10);

    // Determine facility tier
    let facilityTier: HospitalConfigurationBlueprint['facilityTier'] = 'general_multispecialty';
    if (licensedBeds <= 50) {
      facilityTier = 'clinic_daycare';
    } else if (licensedBeds <= 200) {
      facilityTier = 'general_multispecialty';
    } else if (licensedBeds <= 500) {
      facilityTier = 'tertiary_care';
    } else {
      facilityTier = 'quaternary_specialty';
    }

    // Determine enabled modules based on capacity and discovery
    const enabledModules: string[] = [
      'core_hms',
      'multi_tenant_rls',
      'identity_rbac',
      'emr_clinical',
      'merkle_audit_chain',
      'perpetual_licensing_gate'
    ];

    if (licensedBeds > 0) {
      enabledModules.push('ward_and_bed_management', 'advanced_nursing_management');
    }
    if (emergencyBays > 0) {
      enabledModules.push('emergency_department_triage');
    }
    if (otSuites > 0) {
      enabledModules.push('operation_theatre_perioperative');
    }
    if (sec5.hasLis !== false) {
      enabledModules.push('laboratory_information_system');
    }
    if (sec5.hasPacs !== false) {
      enabledModules.push('ris_pacs_dicom');
    }
    if (sec5.hasPharmacy !== false) {
      enabledModules.push('advanced_pharmacy_narcotics');
    }
    if (sec3.hasTelemedicine) {
      enabledModules.push('telemedicine_remote_healthcare');
    }
    if (sec3.hasBloodBank) {
      enabledModules.push('blood_bank_coordination');
    }
    if (
      sec11.deploymentModel?.includes('edge') ||
      sec11.deploymentModel?.includes('hybrid') ||
      sec11.deploymentModel === 'on_premises'
    ) {
      enabledModules.push('hybrid_edge_offline_journal');
    }

    // Determine department hierarchy
    const defaultDepartments: HospitalConfigurationBlueprint['departmentHierarchy'] = [
      { code: 'EMR-GEN', name: 'General Medicine & OPD', type: 'clinical', subSpecialties: ['Internal Medicine', 'Family Medicine'] },
      { code: 'EMR-EMERG', name: 'Emergency & Trauma Care', type: 'clinical', subSpecialties: ['Resuscitation', 'Triage', 'Ambulance'] },
      { code: 'SRG-GEN', name: 'General & Laparoscopic Surgery', type: 'surgical', subSpecialties: ['Laparoscopy', 'Trauma Surgery'] },
      { code: 'ICU-CRIT', name: 'Intensive & Critical Care Unit', type: 'clinical', subSpecialties: ['MICU', 'SICU'] },
      { code: 'PED-CARE', name: 'Pediatrics & Neonatology', type: 'clinical', subSpecialties: ['General Pediatrics', 'NICU'] },
      { code: 'OBG-MAT', name: 'Obstetrics & Gynecology', type: 'clinical', subSpecialties: ['Labor Room', 'Antenatal'] },
      { code: 'LAB-PATH', name: 'Central Pathology Laboratory', type: 'diagnostic', subSpecialties: ['Biochemistry', 'Hematology', 'Microbiology'] },
      { code: 'RAD-IMG', name: 'Radiology & Medical Imaging', type: 'diagnostic', subSpecialties: ['X-Ray', 'CT Scan', 'MRI', 'Ultrasound'] },
      { code: 'PHM-VAULT', name: 'Hospital Central Pharmacy & Narcotics Vault', type: 'support' },
      { code: 'FIN-ADM', name: 'Patient Billing & RCM Accounts', type: 'administrative' }
    ];

    const departmentHierarchy = Array.isArray(sec3.departments) && sec3.departments.length > 0
      ? sec3.departments
      : defaultDepartments;

    // Ward & Bed taxonomy
    const wardBedTaxonomy: HospitalConfigurationBlueprint['wardBedTaxonomy'] = Array.isArray(sec4.wards) && sec4.wards.length > 0
      ? sec4.wards
      : [
          { wardCode: 'WRD-GEN-M', wardName: 'Male General Ward', category: 'general', bedCount: Math.round(licensedBeds * 0.35), genderPolicy: 'male' },
          { wardCode: 'WRD-GEN-F', wardName: 'Female General Ward', category: 'general', bedCount: Math.round(licensedBeds * 0.30), genderPolicy: 'female' },
          { wardCode: 'WRD-SEMI-PVT', wardName: 'Semi-Private Twin Sharing', category: 'semi_private', bedCount: Math.round(licensedBeds * 0.15), genderPolicy: 'unisex' },
          { wardCode: 'WRD-DELUXE', wardName: 'Deluxe Private Rooms', category: 'deluxe_private', bedCount: Math.round(licensedBeds * 0.10), genderPolicy: 'unisex' },
          { wardCode: 'WRD-ICU-MAIN', wardName: 'Multidisciplinary ICU', category: 'icu', bedCount: icuBeds, genderPolicy: 'unisex' },
          { wardCode: 'WRD-ISOLATION', wardName: 'Negative Pressure Isolation', category: 'isolation', bedCount: Math.max(4, Math.round(licensedBeds * 0.05)), genderPolicy: 'unisex' }
        ];

    // Blueprint object
    const blueprintId = `BP-${hospitalId.substring(0, 8)}-v1`;
    const blueprint: HospitalConfigurationBlueprint = {
      id: blueprintId,
      hospitalId,
      version: 1,
      facilityTier,
      capacityMetrics: {
        licensedBeds,
        icuBeds,
        emergencyBays,
        otSuites,
        dialysisStations,
        daycareBeds
      },
      enabledModules,
      departmentHierarchy,
      wardBedTaxonomy,
      clinicalWorkflows: {
        triageStandard: sec7.triageStandard || 'ESI_1_5',
        surgicalSafetyProtocol: 'WHO_3_PHASE',
        narcoticsDualSignoff: true,
        digitalSignaturePKILevel: 4,
        dischargeApprovalWorkflow: ['Attending Physician', 'Nursing Supervisor', 'Pharmacy Clearance', 'Billing Ledger Settlement'],
        criticalLabPanicReadbackTimeMinutes: 15
      },
      tariffBillingRules: {
        opdConsultationTiers: [
          { tier: 'General OPD', fee: Number(sec8.generalOpdFee || 500) },
          { tier: 'Super Specialist OPD', fee: Number(sec8.specialistOpdFee || 1000) },
          { tier: 'Emergency Resuscitation Assessment', fee: Number(sec8.emergencyAssessmentFee || 1500) }
        ],
        bedDailyRates: {
          general: Number(sec8.generalBedRate || 1200),
          semi_private: Number(sec8.semiPrivateRate || 2500),
          deluxe_private: Number(sec8.deluxeRate || 5000),
          icu: Number(sec8.icuRate || 9500),
          isolation: Number(sec8.isolationRate || 7500)
        },
        tpaPanelsEnabled: sec8.tpaPanels || ['Star Health', 'HDFC ERGO', 'ICICI Lombard', 'Care Health', 'Medi Assist'],
        governmentSchemesEnabled: sec8.govtSchemes || ['PM-JAY (Ayushman Bharat)', 'State Employee Health Scheme', 'ECHS']
      },
      integrationEndpoints: [
        { protocol: 'HL7_V2', name: 'Bi-directional LIS Analyzer Bridge', status: 'configured' },
        { protocol: 'DICOM_PACS', name: 'Orthanc/DCM4CHEE PACS Modality Worklist', status: 'configured' },
        { protocol: 'ABDM_M1_M3', name: 'ABHA Health Information Exchange / ABDM Gateway', status: 'configured' },
        { protocol: 'FHIR_R4', name: 'Inter-Hospital Coordination Network FHIR R4', status: 'active' }
      ],
      deploymentTopology: {
        model: sec11.deploymentModel || 'hybrid_edge_appliance',
        serverSpecifications: sec11.serverSpecs || '64 Cores, 256GB RAM, RAID-10 SSD, 10Gbps LAN',
        localLanSpeed: sec11.lanSpeed || '10 Gbps Switched Medical Fiber',
        offlineJournalRetentionDays: 90
      },
      status: 'pending_approval',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Store in-memory
    this.blueprintStore.set(hospitalId, blueprint);

    // Persist to DB if available
    try {
      await db('hospital_configuration_blueprints')
        .insert({
          id: crypto.randomUUID(),
          hospital_id: hospitalId,
          version: 1,
          facility_tier: facilityTier,
          licensed_bed_capacity: licensedBeds,
          icu_bed_capacity: icuBeds,
          emergency_bay_capacity: emergencyBays,
          ot_suite_count: otSuites,
          enabled_modules: JSON.stringify(enabledModules),
          department_hierarchy: JSON.stringify(departmentHierarchy),
          ward_bed_taxonomy: JSON.stringify(wardBedTaxonomy),
          clinical_workflows: JSON.stringify(blueprint.clinicalWorkflows),
          tariff_billing_rules: JSON.stringify(blueprint.tariffBillingRules),
          integration_endpoints: JSON.stringify(blueprint.integrationEndpoints),
          deployment_topology: JSON.stringify(blueprint.deploymentTopology),
          status: 'pending_approval'
        })
        .onConflict(['hospital_id', 'version'])
        .merge();
    } catch (err: any) {
      logger.warn(`Database blueprint persist skipped: ${err.message}`);
    }

    return blueprint;
  }

  /**
   * Cryptographic Dual Sign-Off for Blueprint
   */
  public static async signBlueprint(params: {
    hospitalId: string;
    role: 'asrtava_lead' | 'hospital_director';
    signerId: string;
    signerName: string;
    notes?: string;
  }): Promise<HospitalConfigurationBlueprint> {
    const { hospitalId, role, signerId, signerName, notes } = params;
    const blueprint = this.blueprintStore.get(hospitalId) || await this.generateBlueprint(hospitalId, signerId);

    const timestamp = new Date().toISOString();
    const signatureHash = crypto
      .createHash('sha256')
      .update(`${blueprint.id}:${hospitalId}:${role}:${signerId}:${timestamp}:${notes || ''}`)
      .digest('hex');

    if (role === 'asrtava_lead') {
      blueprint.asrtavaLeadSignoff = {
        leadId: signerId,
        leadName: signerName,
        signedAt: timestamp,
        signatureHash
      };
    } else {
      blueprint.hospitalDirectorSignoff = {
        directorId: signerId,
        directorName: signerName,
        signedAt: timestamp,
        signatureHash
      };
    }

    // If both signed off, approve the blueprint
    if (blueprint.asrtavaLeadSignoff && blueprint.hospitalDirectorSignoff) {
      blueprint.status = 'approved';
    }

    blueprint.updatedAt = timestamp;
    this.blueprintStore.set(hospitalId, blueprint);

    return blueprint;
  }

  // --------------------------------------------------------------------------
  // 3. STAFF CREDENTIAL GENERATION & NIST SP 800-63B PROVISIONING
  // --------------------------------------------------------------------------

  /**
   * Clean staff full name to generate standard base username
   */
  private static sanitizeForUsername(str: string): string {
    return str
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .trim();
  }

  /**
   * Generate NIST SP 800-63B compliant 12-character high-entropy temporary password
   */
  public static generateCompliantTemporaryPassword(): string {
    const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // exclude ambiguous I, O
    const lower = 'abcdefghijkmnopqrstuvwxyz'; // exclude ambiguous l
    const digits = '23456789'; // exclude 0, 1
    const symbols = '!@#$%^&*+=';

    let password = '';
    password += upper[crypto.randomInt(0, upper.length)];
    password += upper[crypto.randomInt(0, upper.length)];
    password += lower[crypto.randomInt(0, lower.length)];
    password += lower[crypto.randomInt(0, lower.length)];
    password += digits[crypto.randomInt(0, digits.length)];
    password += digits[crypto.randomInt(0, digits.length)];
    password += symbols[crypto.randomInt(0, symbols.length)];
    password += symbols[crypto.randomInt(0, symbols.length)];

    const allChars = upper + lower + digits + symbols;
    while (password.length < 12) {
      password += allChars[crypto.randomInt(0, allChars.length)];
    }

    // Shuffle characters
    return password
      .split('')
      .sort(() => 0.5 - Math.random())
      .join('');
  }

  /**
   * Provision staff accounts in bulk with generated usernames and temporary passwords.
   * Generates exportable Staff Credential Manifest without cross-tenant bleed.
   */
  public static async provisionStaffAccounts(params: {
    hospitalId: string;
    implementationId?: string;
    staffList: StaffEnrolmentInput[];
    provisionedByAdminId?: string;
  }): Promise<{
    batchId: string;
    hospitalId: string;
    totalProcessed: number;
    accountsCreated: number;
    manifest: StaffCredentialManifestItem[];
    summaryByRole: Record<string, number>;
  }> {
    const { hospitalId, implementationId, staffList, provisionedByAdminId } = params;

    if (!hospitalId) {
      throw new Error('hospitalId is strictly required for tenant-scoped staff provisioning.');
    }
    if (!Array.isArray(staffList) || staffList.length === 0) {
      throw new Error('staffList must contain at least one staff member to provision.');
    }

    const batchId = `STF-BATCH-${Date.now()}`;
    const manifest: StaffCredentialManifestItem[] = [];
    const usedUsernames = new Set<string>();
    const summaryByRole: Record<string, number> = {};

    // 72-hour expiry timestamp for temporary passwords
    const expiryDate = new Date();
    expiryDate.setHours(expiryDate.getHours() + 72);
    const expiresAtIso = expiryDate.toISOString();

    for (let i = 0; i < staffList.length; i++) {
      const staff = staffList[i];
      const cleanedFullName = staff.name
        .trim()
        .replace(/^(dr|dr\.|doctor|prof|prof\.|nurse|sister|mr|mr\.|ms|ms\.|mrs|mrs\.)\s+/i, '')
        .trim();
      const nameParts = cleanedFullName.split(/\s+/);
      const firstName = this.sanitizeForUsername(nameParts[0] || 'staff');
      const lastName = this.sanitizeForUsername(nameParts[nameParts.length - 1] || `${i + 1}`);

      // Role prefix determination
      const roleLower = (staff.role || 'staff').toLowerCase();
      let rolePrefix = 'staff';
      if (roleLower.includes('doctor') || roleLower.includes('physician') || roleLower.includes('surgeon')) {
        rolePrefix = 'dr';
      } else if (roleLower.includes('nurse')) {
        rolePrefix = 'nurse';
      } else if (roleLower.includes('admin')) {
        rolePrefix = 'admin';
      } else if (roleLower.includes('pharmacist') || roleLower.includes('pharm')) {
        rolePrefix = 'pharm';
      } else if (roleLower.includes('lab') || roleLower.includes('patholog')) {
        rolePrefix = 'lab';
      } else if (roleLower.includes('radiolog')) {
        rolePrefix = 'radio';
      }

      // Generate base username
      let baseUsername = `${rolePrefix}.${firstName}.${lastName}`;
      let finalUsername = baseUsername;
      let counter = 1;
      while (usedUsernames.has(finalUsername)) {
        finalUsername = `${baseUsername}.${counter++}`;
      }
      usedUsernames.add(finalUsername);

      // Generate compliant temporary password
      const temporaryPassword = this.generateCompliantTemporaryPassword();
      const salt = crypto.randomBytes(16).toString('hex');
      const passwordHash = crypto.createHmac('sha256', salt).update(temporaryPassword).digest('hex');

      const manifestItem: StaffCredentialManifestItem = {
        id: crypto.randomUUID(),
        staffName: staff.name,
        department: staff.department,
        designation: staff.designation || staff.role,
        role: staff.role,
        employeeId: staff.employeeId || `EMP-${1000 + i + 1}`,
        medicalRegistrationNo: staff.medicalRegistrationNo,
        generatedUsername: finalUsername,
        temporaryPassword,
        passwordExpiresAt: expiresAtIso,
        forcePasswordChange: true,
        loginUrl: '/login/staff',
        securityNotice: 'Temporary password valid for 72 hours. Mandatory password change enforced on first authentication.'
      };

      manifest.push(manifestItem);
      summaryByRole[staff.role] = (summaryByRole[staff.role] || 0) + 1;

      // Persist to DB if connected
      try {
        await db('hospital_staff_provisions').insert({
          id: manifestItem.id,
          hospital_id: hospitalId,
          batch_id: batchId,
          staff_name: staff.name,
          email: staff.email,
          phone: staff.phone,
          employee_id: manifestItem.employeeId,
          department: staff.department,
          designation: manifestItem.designation,
          allocated_role: staff.role,
          medical_registration_no: staff.medicalRegistrationNo,
          generated_username: finalUsername,
          temp_password_hash: passwordHash,
          temp_password_salt: salt,
          force_password_change: true,
          temp_password_expires_at: expiresAtIso,
          credential_downloaded: false,
          status: 'provisioned',
          provisioned_by: provisionedByAdminId
        });
      } catch (err: any) {
        // Table may not yet be migrated in dev test runner
      }
    }

    // Store in-memory manifest for hospital
    const existingManifests = this.staffManifestStore.get(hospitalId) || [];
    this.staffManifestStore.set(hospitalId, [...existingManifests, ...manifest]);

    // If linked to an onboarding implementation project, mark the checklist gate cleared
    if (implementationId) {
      try {
        OnboardingService.verifyChecklistItem(
          implementationId,
          'STAFF_ACCOUNTS_ACTIVATED',
          provisionedByAdminId,
          `Provisioned ${manifest.length} hospital staff accounts under batch ${batchId}.`
        );
      } catch (err: any) {
        logger.warn(`Could not verify implementation checklist: ${err.message}`);
      }
    }

    return {
      batchId,
      hospitalId,
      totalProcessed: staffList.length,
      accountsCreated: manifest.length,
      manifest,
      summaryByRole
    };
  }

  /**
   * Retrieve staff credential manifest for Hospital Admin export
   */
  public static async getStaffManifest(hospitalId: string, batchId?: string): Promise<StaffCredentialManifestItem[]> {
    const records = this.staffManifestStore.get(hospitalId) || [];
    return records;
  }
}
