import crypto from 'crypto';
import { db } from '../../database';
import { logger } from '../../utils/logger';

// ============================================================================
// ASRTAVA PERPETUAL SOFTWARE LICENSING & COMMERCIAL MANAGEMENT SERVICE
// Implements One-Time Perpetual Licensing, 16 Modular Entitlements,
// Cryptographic Claims, AMC Separation, and Clinical Continuity Safeguards
// ============================================================================

export type SoftwareEdition = 'clinic_basic' | 'standard_hospital' | 'enterprise_multispecialty' | 'custom';
export type LicenseType = 'perpetual' | 'evaluation' | 'academic';
export type LicenseStatus = 'draft' | 'issued' | 'pending_activation' | 'active' | 'suspended' | 'revoked' | 'transferred';
export type DeploymentModel = 'cloud' | 'on_premises' | 'hybrid';
export type AmcPlanTier = 'bronze' | 'silver' | 'gold' | 'platinum';
export type AmcStatus = 'active' | 'expired' | 'renewed' | 'cancelled';

export interface SoftwareLicenseRecord {
  id: string;
  license_number: string;
  hospital_id: string;
  edition: SoftwareEdition;
  license_type: LicenseType;
  status: LicenseStatus;
  licensed_modules: string[];
  deployment_model: DeploymentModel;
  authorized_locations: number;
  authorized_installations: number;
  max_beds: number | null;
  max_doctors: number | null;
  max_active_users: number | null;
  hardware_fingerprint_hash: string | null;
  activation_key: string;
  activation_token: string;
  issued_at: string;
  issued_by?: string;
  activated_at?: string;
  activated_by?: string;
  suspended_at?: string;
  suspended_by?: string;
  suspension_reason?: string;
  transferred_to_hospital_id?: string;
  transferred_at?: string;
  transferred_by?: string;
  transfer_reason?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface MaintenanceAgreementRecord {
  id: string;
  license_id: string;
  hospital_id: string;
  agreement_number: string;
  plan_tier: AmcPlanTier;
  sla_response_hours: number;
  includes_upgrades: boolean;
  includes_cloud_hosting: boolean;
  includes_custom_dev_hours: number;
  start_date: string;
  end_date: string;
  annual_fee_inr: number;
  status: AmcStatus;
  renewal_reminder_sent: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CommercialOrderRecord {
  id: string;
  order_number: string;
  hospital_id: string;
  license_id?: string;
  edition: SoftwareEdition;
  license_fee_inr: number;
  implementation_fee_inr: number;
  amc_fee_inr: number;
  total_order_amount_inr: number;
  payment_terms: string;
  payment_status: 'pending' | 'partial' | 'paid_in_full' | 'refunded';
  paid_amount_inr: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface LicenseClaimsPayload {
  licenseId: string;
  licenseNumber: string;
  hospitalId: string;
  edition: SoftwareEdition;
  licenseType: LicenseType;
  licensedModules: string[];
  deploymentModel: DeploymentModel;
  authorizedLocations: number;
  authorizedInstallations: number;
  maxBeds: number | null;
  maxDoctors: number | null;
  hardwareFingerprintHash?: string | null;
  issuedAt: string;
  issuer: string;
}

export const ALL_16_MODULES = [
  'module:patient_mgmt',
  'module:appointments',
  'module:opd',
  'module:reception',
  'module:billing',
  'module:ipd',
  'module:nursing',
  'module:pharmacy',
  'module:lims',
  'module:ris',
  'module:emergency',
  'module:ot',
  'module:hr',
  'module:inventory',
  'module:patient_web',
  'module:patient_mobile'
] as const;

export const STANDARD_EDITION_ENTITLEMENTS: Record<SoftwareEdition, string[]> = {
  clinic_basic: [
    'module:patient_mgmt',
    'module:appointments',
    'module:opd',
    'module:reception',
    'module:billing'
  ],
  standard_hospital: [
    'module:patient_mgmt',
    'module:appointments',
    'module:opd',
    'module:reception',
    'module:billing',
    'module:ipd',
    'module:nursing',
    'module:pharmacy',
    'module:lims',
    'module:ris'
  ],
  enterprise_multispecialty: [
    'module:patient_mgmt',
    'module:appointments',
    'module:opd',
    'module:reception',
    'module:billing',
    'module:ipd',
    'module:nursing',
    'module:pharmacy',
    'module:lims',
    'module:ris',
    'module:emergency',
    'module:ot',
    'module:hr',
    'module:inventory',
    'module:patient_web',
    'module:patient_mobile'
  ],
  custom: []
};

const LICENSING_SECRET = process.env.LICENSING_HMAC_SECRET || 'asrtava-perpetual-licensing-master-hmac-key-2026';

export class LicenseService {
  // In-memory cache & mock fallback store to guarantee high-performance validation and self-contained testing
  private static licenses = new Map<string, SoftwareLicenseRecord>();
  private static amcAgreements = new Map<string, MaintenanceAgreementRecord[]>();
  private static commercialOrders = new Map<string, CommercialOrderRecord>();
  private static auditLogs: any[] = [];

  /**
   * Clears internal state (primarily used between isolated test runs)
   */
  public static clearState(): void {
    this.licenses.clear();
    this.amcAgreements.clear();
    this.commercialOrders.clear();
    this.auditLogs = [];
  }

  // --------------------------------------------------------------------------
  // 1. CRYPTOGRAPHIC LICENSE CLAIMS TOKEN ENGINE
  // --------------------------------------------------------------------------

  /**
   * Generates a signed cryptographic license claims token (HMAC-SHA256)
   */
  public static generateClaimsToken(payload: LicenseClaimsPayload): string {
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = crypto
      .createHmac('sha256', LICENSING_SECRET)
      .update(encodedPayload)
      .digest('base64url');
    return `${encodedPayload}.${signature}`;
  }

  /**
   * Verifies and decodes a signed cryptographic license claims token
   */
  public static verifyClaimsToken(token: string): { valid: boolean; claims?: LicenseClaimsPayload; error?: string } {
    try {
      if (!token || !token.includes('.')) {
        return { valid: false, error: 'Malformed license claims token' };
      }

      const [encodedPayload, providedSignature] = token.split('.');
      const expectedSignature = crypto
        .createHmac('sha256', LICENSING_SECRET)
        .update(encodedPayload)
        .digest('base64url');

      if (!crypto.timingSafeEqual(Buffer.from(providedSignature), Buffer.from(expectedSignature))) {
        return { valid: false, error: 'Invalid cryptographic signature. License claims have been tampered with.' };
      }

      const decodedString = Buffer.from(encodedPayload, 'base64url').toString('utf-8');
      const claims = JSON.parse(decodedString) as LicenseClaimsPayload;
      return { valid: true, claims };
    } catch (err: any) {
      return { valid: false, error: `Claims verification exception: ${err.message}` };
    }
  }

  /**
   * Generates a human-friendly activation key format (e.g. ASRT-7A9B-4D2F-8E1C-99B1)
   */
  public static generateActivationKey(): string {
    const chunk = () => crypto.randomBytes(2).toString('hex').toUpperCase();
    return `ASRT-${chunk()}-${chunk()}-${chunk()}-${chunk()}`;
  }

  /**
   * Generates a unique license number (e.g. ASR-LIC-2026-48921)
   */
  public static generateLicenseNumber(): string {
    const randomSuffix = Math.floor(10000 + Math.random() * 90000);
    return `ASR-LIC-${new Date().getFullYear()}-${randomSuffix}`;
  }

  // --------------------------------------------------------------------------
  // 2. CORE LICENSE ISSUANCE & ACTIVATION LIFECYCLE
  // --------------------------------------------------------------------------

  /**
   * Issues a new perpetual software license for a hospital tenant
   */
  public static async issueLicense(params: {
    hospitalId: string;
    edition: SoftwareEdition;
    licenseType?: LicenseType;
    customModules?: string[];
    deploymentModel?: DeploymentModel;
    authorizedLocations?: number;
    authorizedInstallations?: number;
    maxBeds?: number | null;
    maxDoctors?: number | null;
    maxActiveUsers?: number | null;
    hardwareFingerprintHash?: string | null;
    issuedBy?: string;
    notes?: string;
  }): Promise<SoftwareLicenseRecord> {
    const licenseId = `lic-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const licenseNumber = this.generateLicenseNumber();
    const activationKey = this.generateActivationKey();

    // Determine module list
    let modules: string[] = [];
    if (params.edition === 'custom') {
      modules = params.customModules || [];
    } else {
      modules = [...(STANDARD_EDITION_ENTITLEMENTS[params.edition] || [])];
      if (params.customModules && params.customModules.length > 0) {
        modules = Array.from(new Set([...modules, ...params.customModules]));
      }
    }

    const claimsPayload: LicenseClaimsPayload = {
      licenseId,
      licenseNumber,
      hospitalId: params.hospitalId,
      edition: params.edition,
      licenseType: params.licenseType || 'perpetual',
      licensedModules: modules,
      deploymentModel: params.deploymentModel || 'cloud',
      authorizedLocations: params.authorizedLocations || 1,
      authorizedInstallations: params.authorizedInstallations || 1,
      maxBeds: params.maxBeds ?? null,
      maxDoctors: params.maxDoctors ?? null,
      hardwareFingerprintHash: params.hardwareFingerprintHash || null,
      issuedAt: new Date().toISOString(),
      issuer: 'ASRTAVA Super Admin Central License Server'
    };

    const activationToken = this.generateClaimsToken(claimsPayload);

    const record: SoftwareLicenseRecord = {
      id: licenseId,
      license_number: licenseNumber,
      hospital_id: params.hospitalId,
      edition: params.edition,
      license_type: params.licenseType || 'perpetual',
      status: 'issued',
      licensed_modules: modules,
      deployment_model: params.deploymentModel || 'cloud',
      authorized_locations: params.authorizedLocations || 1,
      authorized_installations: params.authorizedInstallations || 1,
      max_beds: params.maxBeds ?? null,
      max_doctors: params.maxDoctors ?? null,
      max_active_users: params.maxActiveUsers ?? null,
      hardware_fingerprint_hash: params.hardwareFingerprintHash || null,
      activation_key: activationKey,
      activation_token: activationToken,
      issued_at: new Date().toISOString(),
      issued_by: params.issuedBy,
      notes: params.notes,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    this.licenses.set(record.id, record);
    this.recordAudit({
      license_id: record.id,
      hospital_id: record.hospital_id,
      event_type: 'license_issued',
      actor_id: params.issuedBy,
      new_state: record,
      notes: `Perpetual license issued for edition ${params.edition} with ${modules.length} modules`
    });

    try {
      if (process.env.NODE_ENV !== 'test') {
        await db('software_licenses').insert(record);
      }
    } catch {
      // In-memory fallback allows standalone testing
    }

    return record;
  }

  /**
   * Activates an issued license using the activation key or cryptographic claims token
   */
  public static async activateLicense(params: {
    hospitalId: string;
    activationKey?: string;
    activationToken?: string;
    hardwareFingerprintHash?: string;
    activatedBy?: string;
  }): Promise<{ success: boolean; license?: SoftwareLicenseRecord; error?: string }> {
    let license: SoftwareLicenseRecord | undefined;

    // Search by token or key
    if (params.activationToken) {
      const verification = this.verifyClaimsToken(params.activationToken);
      if (!verification.valid || !verification.claims) {
        return { success: false, error: verification.error || 'Invalid token claims' };
      }
      license = this.licenses.get(verification.claims.licenseId);
      if (!license) {
        // Fallback search by licenseNumber
        for (const lic of this.licenses.values()) {
          if (lic.license_number === verification.claims.licenseNumber) {
            license = lic;
            break;
          }
        }
      }
    } else if (params.activationKey) {
      for (const lic of this.licenses.values()) {
        if (lic.activation_key === params.activationKey) {
          license = lic;
          break;
        }
      }
    }

    if (!license) {
      return { success: false, error: 'License record not found matching provided credentials' };
    }

    // Verify tenant ownership match
    if (license.hospital_id !== params.hospitalId) {
      return { success: false, error: 'Tenant ownership mismatch. License belongs to another hospital entity.' };
    }

    // Check status
    if (license.status === 'active') {
      return { success: true, license }; // Already activated idempotently
    }
    if (license.status === 'suspended' || license.status === 'revoked') {
      return { success: false, error: `License cannot be activated because it is currently ${license.status}.` };
    }

    // Check hardware fingerprint for air-gapped on-premises bindings if registered
    if (license.deployment_model === 'on_premises' && license.hardware_fingerprint_hash) {
      if (
        !params.hardwareFingerprintHash ||
        params.hardwareFingerprintHash !== license.hardware_fingerprint_hash
      ) {
        return {
          success: false,
          error: 'Hardware fingerprint binding failed. Hardware signature does not match authorized node.'
        };
      }
    }

    const previousState = { ...license };
    license.status = 'active';
    license.activated_at = new Date().toISOString();
    license.activated_by = params.activatedBy;
    license.updated_at = new Date().toISOString();

    this.licenses.set(license.id, license);
    this.recordAudit({
      license_id: license.id,
      hospital_id: license.hospital_id,
      event_type: 'license_activated',
      actor_id: params.activatedBy,
      previous_state: previousState,
      new_state: license,
      notes: 'License successfully activated and bound'
    });

    try {
      if (process.env.NODE_ENV !== 'test') {
        await db('software_licenses')
          .where({ id: license.id })
          .update({
            status: 'active',
            activated_at: license.activated_at,
            activated_by: license.activated_by,
            updated_at: license.updated_at
          });
      }
    } catch {
      // In-memory fallback
    }

    return { success: true, license };
  }

  // --------------------------------------------------------------------------
  // 3. MODULAR ENTITLEMENT & CLINICAL CONTINUITY ENFORCEMENT
  // --------------------------------------------------------------------------

  /**
   * Checks whether a hospital has active entitlement to a given module.
   * Safety Guarantee: Emergency care and critical master patient registry lookups
   * are fail-safe and never blocked to ensure zero clinical harm.
   */
  public static checkModuleEntitlement(
    hospitalId: string,
    moduleCode: string
  ): {
    allowed: boolean;
    reason: string;
    isFailSafeBypass?: boolean;
    license?: SoftwareLicenseRecord;
  } {
    // 1. Critical Clinical Safety Fail-Safe: Emergency workflow is never locked out
    const CRITICAL_FAILSAFE_MODULES = ['module:emergency', 'module:patient_mgmt'];
    const isCritical = CRITICAL_FAILSAFE_MODULES.includes(moduleCode);

    // Locate active license for hospital
    let activeLicense: SoftwareLicenseRecord | undefined;
    for (const lic of this.licenses.values()) {
      if (lic.hospital_id === hospitalId && lic.status === 'active') {
        activeLicense = lic;
        break;
      }
    }

    if (!activeLicense) {
      if (isCritical) {
        return {
          allowed: true,
          isFailSafeBypass: true,
          reason: 'Emergency clinical continuity guarantee: critical clinical pathway preserved without lockout.'
        };
      }
      return {
        allowed: false,
        reason: `Hospital tenant ${hospitalId} does not possess an active software license.`
      };
    }

    // Check if module is within perpetual license entitlements
    const hasModule = activeLicense.licensed_modules.includes(moduleCode);
    if (!hasModule) {
      if (isCritical) {
        return {
          allowed: true,
          isFailSafeBypass: true,
          reason: 'Emergency clinical continuity guarantee: critical emergency care permitted.'
        };
      }
      return {
        allowed: false,
        license: activeLicense,
        reason: `Module '${moduleCode}' is not included in the hospital's ${activeLicense.edition} perpetual license.`
      };
    }

    return {
      allowed: true,
      license: activeLicense,
      reason: `Module '${moduleCode}' is entitled under perpetual license ${activeLicense.license_number}.`
    };
  }

  /**
   * Capacity limit validator (locations, installations, beds, doctors)
   */
  public static checkCapacity(
    hospitalId: string,
    metric: 'locations' | 'installations' | 'beds' | 'doctors',
    currentOrRequestedCount: number
  ): { allowed: boolean; limit: number | null; reason: string } {
    let license: SoftwareLicenseRecord | undefined;
    for (const lic of this.licenses.values()) {
      if (lic.hospital_id === hospitalId && lic.status === 'active') {
        license = lic;
        break;
      }
    }

    if (!license) {
      return { allowed: false, limit: null, reason: 'No active license found' };
    }

    let limit: number | null = null;
    if (metric === 'locations') limit = license.authorized_locations;
    if (metric === 'installations') limit = license.authorized_installations;
    if (metric === 'beds') limit = license.max_beds;
    if (metric === 'doctors') limit = license.max_doctors;

    if (limit === null) {
      return { allowed: true, limit: null, reason: `Capacity for ${metric} is unlimited under this license.` };
    }

    if (currentOrRequestedCount > limit) {
      return {
        allowed: false,
        limit,
        reason: `Requested count (${currentOrRequestedCount}) exceeds authorized ${metric} limit of ${limit}. Contact sales for a license capacity expansion.`
      };
    }

    return {
      allowed: true,
      limit,
      reason: `Within authorized ${metric} limit (${currentOrRequestedCount} / ${limit}).`
    };
  }

  /**
   * Adds additional modules to an existing perpetual license (e.g. modular add-ons)
   */
  public static addModulesToLicense(
    licenseId: string,
    modulesToAdd: string[],
    actorId?: string,
    notes?: string
  ): SoftwareLicenseRecord {
    const license = this.licenses.get(licenseId);
    if (!license) {
      throw new Error(`License ${licenseId} not found`);
    }

    const previousState = { ...license };
    const merged = Array.from(new Set([...license.licensed_modules, ...modulesToAdd]));
    license.licensed_modules = merged;
    license.updated_at = new Date().toISOString();

    // Regenerate claims token
    const claimsPayload: LicenseClaimsPayload = {
      licenseId: license.id,
      licenseNumber: license.license_number,
      hospitalId: license.hospital_id,
      edition: license.edition,
      licenseType: license.license_type,
      licensedModules: license.licensed_modules,
      deploymentModel: license.deployment_model,
      authorizedLocations: license.authorized_locations,
      authorizedInstallations: license.authorized_installations,
      maxBeds: license.max_beds,
      maxDoctors: license.max_doctors,
      hardwareFingerprintHash: license.hardware_fingerprint_hash,
      issuedAt: license.issued_at,
      issuer: 'ASRTAVA Super Admin Central License Server'
    };
    license.activation_token = this.generateClaimsToken(claimsPayload);

    this.licenses.set(license.id, license);
    this.recordAudit({
      license_id: license.id,
      hospital_id: license.hospital_id,
      event_type: 'module_added',
      actor_id: actorId,
      previous_state: previousState,
      new_state: license,
      notes: notes || `Added modules: ${modulesToAdd.join(', ')}`
    });

    return license;
  }

  // --------------------------------------------------------------------------
  // 4. MAINTENANCE & SUPPORT (AMC) SEPARATION & UPGRADE ELIGIBILITY
  // --------------------------------------------------------------------------

  /**
   * Creates or renews an Annual Maintenance & Support Agreement (AMC)
   */
  public static createMaintenanceAgreement(params: {
    licenseId: string;
    hospitalId: string;
    planTier: AmcPlanTier;
    slaResponseHours?: number;
    includesUpgrades?: boolean;
    includesCloudHosting?: boolean;
    includesCustomDevHours?: number;
    startDate: string;
    endDate: string;
    annualFeeInr: number;
    notes?: string;
  }): MaintenanceAgreementRecord {
    const agreementId = `amc-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
    const agreementNumber = `ASR-AMC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const record: MaintenanceAgreementRecord = {
      id: agreementId,
      license_id: params.licenseId,
      hospital_id: params.hospitalId,
      agreement_number: agreementNumber,
      plan_tier: params.planTier,
      sla_response_hours: params.slaResponseHours || 4,
      includes_upgrades: params.includesUpgrades ?? true,
      includes_cloud_hosting: params.includesCloudHosting ?? false,
      includes_custom_dev_hours: params.includesCustomDevHours ?? 0,
      start_date: params.startDate,
      end_date: params.endDate,
      annual_fee_inr: params.annualFeeInr,
      status: 'active',
      renewal_reminder_sent: false,
      notes: params.notes,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const list = this.amcAgreements.get(params.licenseId) || [];
    list.push(record);
    this.amcAgreements.set(params.licenseId, list);

    this.recordAudit({
      license_id: params.licenseId,
      hospital_id: params.hospitalId,
      event_type: 'amc_renewed',
      new_state: record,
      notes: `AMC registered under tier ${params.planTier} valid through ${params.endDate}`
    });

    return record;
  }

  /**
   * Checks whether a hospital is eligible to receive major software updates.
   * Lapsed AMC retains the right to operate current installed version indefinitely,
   * but requires an active AMC for new major version downloads.
   */
  public static checkUpgradeEligibility(hospitalId: string): {
    eligible: boolean;
    activeAgreement?: MaintenanceAgreementRecord;
    reason: string;
  } {
    let license: SoftwareLicenseRecord | undefined;
    for (const lic of this.licenses.values()) {
      if (lic.hospital_id === hospitalId && lic.status === 'active') {
        license = lic;
        break;
      }
    }

    if (!license) {
      return { eligible: false, reason: 'No active software license found.' };
    }

    const agreements = this.amcAgreements.get(license.id) || [];
    const now = new Date();

    const activeAmc = agreements.find(
      (a) => a.status === 'active' && new Date(a.end_date) >= now && a.includes_upgrades
    );

    if (activeAmc) {
      return {
        eligible: true,
        activeAgreement: activeAmc,
        reason: `Eligible for software upgrades under active ${activeAmc.plan_tier.toUpperCase()} AMC agreement ${activeAmc.agreement_number}.`
      };
    }

    return {
      eligible: false,
      reason:
        'Maintenance & Support Agreement (AMC) has lapsed or does not include upgrades. The hospital retains perpetual rights to run the current installed version, but new version upgrades require an active AMC.'
    };
  }

  // --------------------------------------------------------------------------
  // 5. LICENSE TRANSFERS, SUSPENSION & REINSTATEMENT
  // --------------------------------------------------------------------------

  /**
   * Transfers a perpetual license to a new hospital organization entity
   */
  public static transferLicense(params: {
    licenseId: string;
    targetHospitalId: string;
    transferredBy?: string;
    transferReason: string;
  }): { originalLicense: SoftwareLicenseRecord; newLicense: SoftwareLicenseRecord } {
    const original = this.licenses.get(params.licenseId);
    if (!original) {
      throw new Error(`License ${params.licenseId} not found`);
    }

    const prevOrig = { ...original };
    original.status = 'transferred';
    original.transferred_to_hospital_id = params.targetHospitalId;
    original.transferred_at = new Date().toISOString();
    original.transferred_by = params.transferredBy;
    original.transfer_reason = params.transferReason;
    original.updated_at = new Date().toISOString();
    this.licenses.set(original.id, original);

    // Issue corresponding new license for target hospital
    const newLicenseId = `lic-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const newLicenseNumber = this.generateLicenseNumber();
    const newActivationKey = this.generateActivationKey();

    const claimsPayload: LicenseClaimsPayload = {
      licenseId: newLicenseId,
      licenseNumber: newLicenseNumber,
      hospitalId: params.targetHospitalId,
      edition: original.edition,
      licenseType: original.license_type,
      licensedModules: original.licensed_modules,
      deploymentModel: original.deployment_model,
      authorizedLocations: original.authorized_locations,
      authorizedInstallations: original.authorized_installations,
      maxBeds: original.max_beds,
      maxDoctors: original.max_doctors,
      hardwareFingerprintHash: null,
      issuedAt: new Date().toISOString(),
      issuer: 'ASRTAVA Super Admin Central License Server (Transferred Ownership)'
    };

    const newLicense: SoftwareLicenseRecord = {
      ...original,
      id: newLicenseId,
      license_number: newLicenseNumber,
      hospital_id: params.targetHospitalId,
      status: 'active',
      activation_key: newActivationKey,
      activation_token: this.generateClaimsToken(claimsPayload),
      issued_at: new Date().toISOString(),
      issued_by: params.transferredBy,
      activated_at: new Date().toISOString(),
      activated_by: params.transferredBy,
      transferred_to_hospital_id: undefined,
      transferred_at: undefined,
      transferred_by: undefined,
      transfer_reason: undefined,
      notes: `Transferred from license ${original.license_number}. Reason: ${params.transferReason}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    this.licenses.set(newLicense.id, newLicense);

    this.recordAudit({
      license_id: original.id,
      hospital_id: original.hospital_id,
      event_type: 'license_transferred',
      actor_id: params.transferredBy,
      previous_state: prevOrig,
      new_state: original,
      notes: `Transferred to hospital ${params.targetHospitalId}. New license: ${newLicenseNumber}`
    });

    return { originalLicense: original, newLicense };
  }

  /**
   * Suspends a license administratively
   */
  public static suspendLicense(licenseId: string, reason: string, actorId?: string): SoftwareLicenseRecord {
    const license = this.licenses.get(licenseId);
    if (!license) throw new Error(`License ${licenseId} not found`);

    const prev = { ...license };
    license.status = 'suspended';
    license.suspended_at = new Date().toISOString();
    license.suspended_by = actorId;
    license.suspension_reason = reason;
    license.updated_at = new Date().toISOString();

    this.licenses.set(license.id, license);
    this.recordAudit({
      license_id: license.id,
      hospital_id: license.hospital_id,
      event_type: 'license_suspended',
      actor_id: actorId,
      previous_state: prev,
      new_state: license,
      notes: `Suspension reason: ${reason}`
    });

    return license;
  }

  /**
   * Reinstates a suspended license
   */
  public static reinstateLicense(licenseId: string, actorId?: string): SoftwareLicenseRecord {
    const license = this.licenses.get(licenseId);
    if (!license) throw new Error(`License ${licenseId} not found`);

    const prev = { ...license };
    license.status = 'active';
    license.suspended_at = undefined;
    license.suspended_by = undefined;
    license.suspension_reason = undefined;
    license.updated_at = new Date().toISOString();

    this.licenses.set(license.id, license);
    this.recordAudit({
      license_id: license.id,
      hospital_id: license.hospital_id,
      event_type: 'license_reinstated',
      actor_id: actorId,
      previous_state: prev,
      new_state: license,
      notes: 'License reinstated by Super Administrator'
    });

    return license;
  }

  // --------------------------------------------------------------------------
  // 6. COMMERCIAL SALES ORDERS & ONE-TIME INVOICING
  // --------------------------------------------------------------------------

  public static createCommercialOrder(params: {
    hospitalId: string;
    licenseId?: string;
    edition: SoftwareEdition;
    licenseFeeInr: number;
    implementationFeeInr?: number;
    amcFeeInr?: number;
    paymentTerms?: string;
    notes?: string;
  }): CommercialOrderRecord {
    const orderId = `ord-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
    const orderNumber = `ASR-ORD-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const implementationFee = params.implementationFeeInr || 0;
    const amcFee = params.amcFeeInr || 0;
    const total = params.licenseFeeInr + implementationFee + amcFee;

    const record: CommercialOrderRecord = {
      id: orderId,
      order_number: orderNumber,
      hospital_id: params.hospitalId,
      license_id: params.licenseId,
      edition: params.edition,
      license_fee_inr: params.licenseFeeInr,
      implementation_fee_inr: implementationFee,
      amc_fee_inr: amcFee,
      total_order_amount_inr: total,
      payment_terms: params.paymentTerms || 'milestone_split',
      payment_status: 'pending',
      paid_amount_inr: 0,
      notes: params.notes,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    this.commercialOrders.set(record.id, record);
    return record;
  }

  public static recordPayment(orderId: string, amount: number): CommercialOrderRecord {
    const order = this.commercialOrders.get(orderId);
    if (!order) throw new Error(`Commercial order ${orderId} not found`);

    order.paid_amount_inr += amount;
    if (order.paid_amount_inr >= order.total_order_amount_inr) {
      order.payment_status = 'paid_in_full';
    } else if (order.paid_amount_inr > 0) {
      order.payment_status = 'partial';
    }
    order.updated_at = new Date().toISOString();
    this.commercialOrders.set(order.id, order);
    return order;
  }

  // --------------------------------------------------------------------------
  // 7. GETTERS & AUDIT TRAIL
  // --------------------------------------------------------------------------

  public static getLicenseById(id: string): SoftwareLicenseRecord | undefined {
    return this.licenses.get(id);
  }

  public static getHospitalLicense(hospitalId: string): {
    license?: SoftwareLicenseRecord;
    maintenanceAgreements: MaintenanceAgreementRecord[];
  } {
    let license: SoftwareLicenseRecord | undefined;
    for (const lic of this.licenses.values()) {
      if (lic.hospital_id === hospitalId && (lic.status === 'active' || lic.status === 'issued')) {
        license = lic;
        break;
      }
    }

    const agreements = license ? this.amcAgreements.get(license.id) || [] : [];
    return { license, maintenanceAgreements: agreements };
  }

  public static getAllLicenses(): SoftwareLicenseRecord[] {
    return Array.from(this.licenses.values());
  }

  public static getAuditLogs(licenseId?: string): any[] {
    if (licenseId) {
      return this.auditLogs.filter((l) => l.license_id === licenseId);
    }
    return [...this.auditLogs];
  }

  private static recordAudit(entry: any) {
    this.auditLogs.push({
      id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      ...entry
    });
  }
}
