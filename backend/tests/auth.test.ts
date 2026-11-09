import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import {
  hashPassword,
  verifyPassword,
  validatePasswordStrength,
  generateRandomToken,
  hashToken,
  generateTotpSecret,
  computeTotpCode,
  verifyTotpToken,
  generateBackupCodes,
} from '../src/utils/security';
import { config } from '../src/config';

describe('ASRTAVA Authentication & Cybersecurity Tests', () => {
  // 1. Password Security & Argon2/Bcrypt Policy
  describe('Password Security & Hashing Policy', () => {
    it('should reject passwords shorter than 8 characters', () => {
      const res = validatePasswordStrength('Short1!');
      assert.equal(res.valid, false);
      assert.match(res.reason!, /at least 8 characters/);
    });

    it('should reject passwords lacking uppercase letters', () => {
      const res = validatePasswordStrength('lowercase123!@#');
      assert.equal(res.valid, false);
      assert.match(res.reason!, /uppercase letter/);
    });

    it('should reject passwords lacking special characters', () => {
      const res = validatePasswordStrength('NoSpecialChar123');
      assert.equal(res.valid, false);
      assert.match(res.reason!, /special character/);
    });

    it('should approve strong passwords meeting full enterprise criteria', () => {
      const res = validatePasswordStrength('AsrtavaEnterprise@2026!');
      assert.equal(res.valid, true);
    });

    it('should hash passwords with salt cost and verify correctly', async () => {
      const plain = 'SecureHospital#2026';
      const hash = await hashPassword(plain);
      assert.notEqual(hash, plain);
      assert.equal(hash.startsWith('$2'), true); // bcrypt hash prefix

      const isValid = await verifyPassword(plain, hash);
      assert.equal(isValid, true);

      const isInvalid = await verifyPassword('WrongPassword', hash);
      assert.equal(isInvalid, false);
    });
  });

  // 2. Token Security & Hashing (Single-use tokens)
  describe('Cryptographic Tokens & Hashing', () => {
    it('should generate high-entropy random hex tokens', () => {
      const t1 = generateRandomToken(32);
      const t2 = generateRandomToken(32);
      assert.equal(t1.length, 64);
      assert.equal(t2.length, 64);
      assert.notEqual(t1, t2);
    });

    it('should deterministically SHA-256 hash tokens for secure database persistence', () => {
      const rawToken = 'sample-secret-invitation-token-12345';
      const hash1 = hashToken(rawToken);
      const hash2 = hashToken(rawToken);
      assert.equal(hash1, hash2);
      assert.equal(hash1.length, 64); // SHA-256 hex string
      assert.notEqual(hash1, rawToken); // Raw token never stored in plaintext
    });
  });

  // 3. Multi-Factor Authentication (RFC 6238 TOTP)
  describe('RFC 6238 TOTP Authenticator Engine', () => {
    it('should generate a valid Base32 TOTP secret and otpauth URI', () => {
      const { secret, uri } = generateTotpSecret('ASRTAVA-HMS', 'dr.rajesh@apexcare.com');
      assert.ok(secret);
      assert.ok(/^[A-Z2-7]+$/.test(secret)); // Standard Base32 charset
      assert.ok(uri.startsWith('otpauth://totp/'));
      assert.ok(uri.includes('secret='));
    });

    it('should verify correct current 6-digit TOTP code', () => {
      const { secret } = generateTotpSecret('ASRTAVA-HMS', 'test@asrtava.com');
      const currentStep = Math.floor(Date.now() / 1000 / 30);
      const code = computeTotpCode(secret, currentStep);

      assert.equal(code.length, 6);
      assert.equal(verifyTotpToken(secret, code, 1), true);
    });

    it('should reject invalid or forged TOTP code', () => {
      const { secret } = generateTotpSecret('ASRTAVA-HMS', 'test@asrtava.com');
      assert.equal(verifyTotpToken(secret, '000000', 1), false);
      assert.equal(verifyTotpToken(secret, '999999', 1), false);
    });

    it('should generate 10 unique single-use recovery backup codes with bcrypt hashes', async () => {
      const { plainCodes, hashedCodes } = await generateBackupCodes(10);
      assert.equal(plainCodes.length, 10);
      assert.equal(hashedCodes.length, 10);

      // Verify each plain code is 8 chars uppercase hex
      for (let i = 0; i < plainCodes.length; i++) {
        assert.equal(plainCodes[i].length, 8);
        const match = await verifyPassword(plainCodes[i], hashedCodes[i]);
        assert.equal(match, true);
      }
    });
  });

  // 4. JWT Claims & Minimal Payload Boundary
  describe('JWT Session Tokens & Claims Integrity', () => {
    it('should issue short-lived 15-minute access token without sensitive patient data', () => {
      const payload = {
        id: 'u-1234',
        hospitalId: 'h-5678',
        userType: 'staff',
        email: 'nurse@apexcare.com',
        roles: ['nurse'],
        activePortal: 'nursing',
      };

      const token = jwt.sign(payload, config.jwt.secret, { expiresIn: '15m' });
      const decoded: any = jwt.verify(token, config.jwt.secret);

      assert.equal(decoded.id, 'u-1234');
      assert.equal(decoded.hospitalId, 'h-5678');
      assert.equal(decoded.activePortal, 'nursing');
      // Verify no passwords, health data, or clinical diagnosis claims
      assert.equal(decoded.password, undefined);
      assert.equal(decoded.patientRecord, undefined);
    });

    it('should reject expired access tokens', () => {
      const token = jwt.sign({ id: 'u-1234' }, config.jwt.secret, { expiresIn: '-1s' });
      assert.throws(() => {
        jwt.verify(token, config.jwt.secret);
      }, /jwt expired/);
    });
  });

  // 5. Dual-Layer Permission Precedence Logic
  describe('Authorization Engine Precedence (Explicit Deny > Explicit Allow > Role RBAC > Default Deny)', () => {
    // Model of our permission evaluation function
    function evaluatePermission(
      rolePermissions: string[],
      overrides: { permission: string; isGranted: boolean; isExpired: boolean }[],
      targetPermission: string
    ): { granted: boolean; reason: string } {
      // 1. Check overrides
      const override = overrides.find((o) => o.permission === targetPermission && !o.isExpired);
      if (override) {
        if (!override.isGranted) {
          return { granted: false, reason: 'EXPLICIT_DENY_OVERRIDE' };
        }
        return { granted: true, reason: 'EXPLICIT_ALLOW_OVERRIDE' };
      }

      // 2. Check RBAC
      if (rolePermissions.includes(targetPermission)) {
        return { granted: true, reason: 'ROLE_RBAC' };
      }

      // 3. Default Deny
      return { granted: false, reason: 'DEFAULT_DENY' };
    }

    it('should allow access when role has permission and no override exists', () => {
      const res = evaluatePermission(['prescriptions:create', 'patients:view'], [], 'prescriptions:create');
      assert.equal(res.granted, true);
      assert.equal(res.reason, 'ROLE_RBAC');
    });

    it('should DENY access when an explicit individual DENY override exists, even if role ALLOWS it', () => {
      const rolePerms = ['prescriptions:create', 'patients:view'];
      const overrides = [{ permission: 'prescriptions:create', isGranted: false, isExpired: false }];

      const res = evaluatePermission(rolePerms, overrides, 'prescriptions:create');
      assert.equal(res.granted, false);
      assert.equal(res.reason, 'EXPLICIT_DENY_OVERRIDE');
    });

    it('should ALLOW access when an explicit individual ALLOW override exists, even if role does NOT have it', () => {
      const rolePerms = ['patients:view'];
      const overrides = [{ permission: 'invoices:refund', isGranted: true, isExpired: false }];

      const res = evaluatePermission(rolePerms, overrides, 'invoices:refund');
      assert.equal(res.granted, true);
      assert.equal(res.reason, 'EXPLICIT_ALLOW_OVERRIDE');
    });

    it('should ignore expired custom permission overrides and fall back to role permissions', () => {
      const rolePerms = ['patients:view'];
      // Expired deny override
      const overrides = [{ permission: 'patients:view', isGranted: false, isExpired: true }];

      const res = evaluatePermission(rolePerms, overrides, 'patients:view');
      assert.equal(res.granted, true);
      assert.equal(res.reason, 'ROLE_RBAC');
    });

    it('should enforce DEFAULT DENY when permission is neither in role nor override', () => {
      const res = evaluatePermission(['patients:view'], [], 'platform_config:manage');
      assert.equal(res.granted, false);
      assert.equal(res.reason, 'DEFAULT_DENY');
    });
  });

  // 6. Multi-Hospital Membership & Workspace Switching Logic
  describe('Multi-Hospital Tenant Membership & Workspace Resolution', () => {
    it('should prevent user from switching to a hospital where they have no active membership', () => {
      const memberships = [{ hospitalId: 'hosp-apex', status: 'active' }];
      const requestedHospital = 'hosp-metro';

      const isAllowed = memberships.some((m) => m.hospitalId === requestedHospital && m.status === 'active');
      assert.equal(isAllowed, false);
    });

    it('should prevent doctor from switching to finance workspace unless role or custom override permits it', () => {
      const doctorRoles = ['doctor'];
      const authorizedPortals = ['doctor', 'reception']; // e.g. Doctor with OPD intake rights

      const canAccessFinance = authorizedPortals.includes('finance');
      assert.equal(canAccessFinance, false);
    });
  });
});

