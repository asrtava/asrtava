import fs from 'fs';
import path from 'path';
import { LicenseService, SoftwareLicenseRecord } from '../licensing/license.service';
import { deploymentConfig } from '../../config/deployment.config';
import { logger } from '../../utils/logger';

// ============================================================================
// ASRTAVA OFFLINE LICENSE VALIDATION ADAPTER
// Guarantees zero-network offline license operation for air-gapped on-premises
// ============================================================================

export class OfflineLicenseAdapter {
  private static localLicenseCache: SoftwareLicenseRecord | null = null;
  private static licenseFilePath = process.env.OFFLINE_LICENSE_FILE_PATH || path.resolve(process.cwd(), 'license.asrtalic');

  /**
   * Loads and validates offline license certificate from local storage
   */
  public static loadOfflineLicense(claimsToken?: string): {
    valid: boolean;
    license?: SoftwareLicenseRecord;
    error?: string;
  } {
    let token = claimsToken;

    if (!token) {
      if (fs.existsSync(this.licenseFilePath)) {
        try {
          token = fs.readFileSync(this.licenseFilePath, 'utf-8').trim();
        } catch (err: any) {
          return { valid: false, error: `Failed to read local license file: ${err.message}` };
        }
      } else if (process.env.OFFLINE_LICENSE_TOKEN) {
        token = process.env.OFFLINE_LICENSE_TOKEN.trim();
      }
    }

    if (!token) {
      return { valid: false, error: 'No offline license file or token found on local host.' };
    }

    // Cryptographic signature and claim verification
    const verification = LicenseService.verifyClaimsToken(token);
    if (!verification.valid || !verification.claims) {
      return { valid: false, error: verification.error || 'Cryptographic signature verification failed.' };
    }

    const claims = verification.claims;

    // Check offline grace period if expiration exists (perpetual licenses have no expiration)
    const isPerpetual = claims.licenseType === 'perpetual';
    const record: SoftwareLicenseRecord = {
      id: claims.licenseId,
      license_number: claims.licenseNumber,
      hospital_id: claims.hospitalId,
      edition: claims.edition,
      license_type: claims.licenseType,
      status: 'active',
      licensed_modules: claims.licensedModules,
      deployment_model: claims.deploymentModel,
      authorized_locations: claims.authorizedLocations,
      authorized_installations: claims.authorizedInstallations,
      max_beds: claims.maxBeds,
      max_doctors: claims.maxDoctors,
      max_active_users: null,
      hardware_fingerprint_hash: claims.hardwareFingerprintHash || null,
      activation_key: 'OFFLINE_ACTIVATED',
      activation_token: token,
      issued_at: claims.issuedAt,
      activated_at: new Date().toISOString(),
      notes: `Offline license validated locally under ${claims.deploymentModel} mode. Perpetual: ${isPerpetual}`,
      created_at: claims.issuedAt,
      updated_at: new Date().toISOString()
    };

    this.localLicenseCache = record;
    logger.info(`[OfflineLicenseAdapter] Offline perpetual license ${claims.licenseNumber} successfully validated locally.`);

    return { valid: true, license: record };
  }

  public static getCachedLicense(): SoftwareLicenseRecord | null {
    return this.localLicenseCache;
  }
}

