import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export interface PasswordValidationResult {
  isValid: boolean;
  score: number; // 0 to 4
  reasons: string[];
}

export interface LoginAttemptRecord {
  attempts: number;
  lastAttemptAt: number;
  lockedUntil?: number;
}

// In-memory progressive throttling ledger (backed by Redis/Memcached in distributed clusters)
const loginThrottleMap = new Map<string, LoginAttemptRecord>();

// Common compromised/weak passwords forbidden in healthcare systems
const DISALLOWED_PASSWORDS = new Set([
  'password123',
  'hospital123',
  'admin12345',
  'doctor2026',
  'welcome123',
  'asrtava123',
  'secret1234',
  'changeme123',
  'qwerty12345',
  'medical2026',
]);

export class PasswordPolicyService {
  private static readonly BCRYPT_ROUNDS = 12;
  private static readonly MAX_FAILED_ATTEMPTS = 5;
  private static readonly LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes lockout

  /**
   * Evaluates password against NIST SP 800-63B & HIPAA healthcare complexity standards:
   * - Minimum 10 characters
   * - At least one uppercase letter
   * - At least one lowercase letter
   * - At least one numeric digit
   * - At least one special symbol
   * - Not in common dictionary / known credential leaks list
   */
  public static validatePasswordStrength(password: string): PasswordValidationResult {
    const reasons: string[] = [];
    let score = 0;

    if (!password || typeof password !== 'string') {
      return { isValid: false, score: 0, reasons: ['Password must be a non-empty string.'] };
    }

    if (password.length < 10) {
      reasons.push('Password must be at least 10 characters long.');
    } else {
      score += 1;
    }

    if (!/[A-Z]/.test(password)) {
      reasons.push('Password must contain at least one uppercase letter (A-Z).');
    } else {
      score += 1;
    }

    if (!/[a-z]/.test(password)) {
      reasons.push('Password must contain at least one lowercase letter (a-z).');
    } else {
      score += 0.5;
    }

    if (!/[0-9]/.test(password)) {
      reasons.push('Password must contain at least one numeric digit (0-9).');
    } else {
      score += 0.5;
    }

    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
      reasons.push('Password must contain at least one special character (!@#$%^&*...).');
    } else {
      score += 1;
    }

    const normalized = password.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (DISALLOWED_PASSWORDS.has(normalized)) {
      reasons.push('Password matches a commonly breached dictionary word. Please choose a more complex passphrase.');
      score = 0;
    }

    return {
      isValid: reasons.length === 0,
      score: Math.min(4, Math.floor(score)),
      reasons,
    };
  }

  /**
   * Hashes password using salted bcrypt with cost factor 12
   */
  public static async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(this.BCRYPT_ROUNDS);
    return bcrypt.hash(password, salt);
  }

  /**
   * Timing-safe password verification
   */
  public static async verifyPassword(candidate: string, hash: string): Promise<boolean> {
    try {
      return await bcrypt.compare(candidate, hash);
    } catch {
      return false;
    }
  }

  /**
   * Progressive Login Throttling & Account Lockout Engine
   * Returns remaining lockout milliseconds if locked, or delay duration in ms.
   */
  public static checkLoginThrottle(identifier: string): { isLocked: boolean; remainingLockoutSeconds?: number; delayMs: number } {
    const key = identifier.toLowerCase().trim();
    const now = Date.now();
    const record = loginThrottleMap.get(key);

    if (!record) {
      return { isLocked: false, delayMs: 0 };
    }

    // Check if account is currently locked out
    if (record.lockedUntil && record.lockedUntil > now) {
      const remainingSeconds = Math.ceil((record.lockedUntil - now) / 1000);
      return { isLocked: true, remainingLockoutSeconds: remainingSeconds, delayMs: 0 };
    }

    // If lockout duration has elapsed, reset counter
    if (record.lockedUntil && record.lockedUntil <= now) {
      loginThrottleMap.delete(key);
      return { isLocked: false, delayMs: 0 };
    }

    // Exponential progressive delay: 0ms, 500ms, 1000ms, 2000ms, 4000ms
    const delayMs = record.attempts > 1 ? Math.min(4000, Math.pow(2, record.attempts - 2) * 500) : 0;
    return { isLocked: false, delayMs };
  }

  /**
   * Records a failed login attempt; enforces lockout after 5 consecutive failures
   */
  public static recordFailedAttempt(identifier: string): { isNowLocked: boolean; attempts: number } {
    const key = identifier.toLowerCase().trim();
    const now = Date.now();
    const existing = loginThrottleMap.get(key) || { attempts: 0, lastAttemptAt: now };

    existing.attempts += 1;
    existing.lastAttemptAt = now;

    if (existing.attempts >= this.MAX_FAILED_ATTEMPTS) {
      existing.lockedUntil = now + this.LOCKOUT_DURATION_MS;
      loginThrottleMap.set(key, existing);
      return { isNowLocked: true, attempts: existing.attempts };
    }

    loginThrottleMap.set(key, existing);
    return { isNowLocked: false, attempts: existing.attempts };
  }

  /**
   * Clears login failure ledger on successful authentication
   */
  public static clearLoginThrottle(identifier: string): void {
    const key = identifier.toLowerCase().trim();
    loginThrottleMap.delete(key);
  }

  /**
   * Generates a cryptographically secure random token (e.g. for reset tokens, API keys)
   */
  public static generateSecureToken(bytes: number = 32): string {
    return crypto.randomBytes(bytes).toString('hex');
  }

  /**
   * SHA-256 hash helper for secure token storage
   */
  public static hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}

