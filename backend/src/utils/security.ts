import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { db } from '../database';
import { logger } from './logger';

const BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/**
 * Base32 encoding for TOTP secret keys
 */
export function base32Encode(buffer: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = '';

  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i];
    bits += 8;

    while (bits >= 5) {
      output += BASE32_CHARS[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += BASE32_CHARS[(value << (5 - bits)) & 31];
  }

  return output;
}

/**
 * Base32 decoding for TOTP secret keys
 */
export function base32Decode(base32: string): Buffer {
  const cleaned = base32.toUpperCase().replace(/=+$/, '');
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];

  for (let i = 0; i < cleaned.length; i++) {
    const idx = BASE32_CHARS.indexOf(cleaned[i]);
    if (idx === -1) continue;

    value = (value << 5) | idx;
    bits += 5;

    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return Buffer.from(bytes);
}

/**
 * Password validation policy: min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
 */
export function validatePasswordStrength(password: string): { valid: boolean; reason?: string } {
  if (!password || password.length < 8) {
    return { valid: false, reason: 'Password must be at least 8 characters long' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, reason: 'Password must contain at least one uppercase letter' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, reason: 'Password must contain at least one lowercase letter' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, reason: 'Password must contain at least one number' };
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return { valid: false, reason: 'Password must contain at least one special character' };
  }
  return { valid: true };
}

/**
 * Secure password hashing using bcrypt with cost factor 12
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * High-entropy random hex token generation
 */
export function generateRandomToken(byteLength = 32): string {
  return crypto.randomBytes(byteLength).toString('hex');
}

/**
 * SHA-256 token hashing for database storage (e.g. password reset & invite tokens)
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * RFC 6238 TOTP Generator & Verifier
 */
export function generateTotpSecret(label = 'ASRTAVA-HMS', account = 'user@asrtava.com'): { secret: string; uri: string } {
  const randomBytes = crypto.randomBytes(20);
  const secret = base32Encode(randomBytes);
  const uri = `otpauth://totp/${encodeURIComponent(label)}:${encodeURIComponent(account)}?secret=${secret}&issuer=${encodeURIComponent(label)}&algorithm=SHA1&digits=6&period=30`;
  return { secret, uri };
}

export function computeTotpCode(secretBase32: string, timeStep: number): string {
  const key = base32Decode(secretBase32);
  const timeBuffer = Buffer.alloc(8);
  timeBuffer.writeBigInt64BE(BigInt(timeStep), 0);

  const hmac = crypto.createHmac('sha1', key).update(timeBuffer).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  const otp = binary % 1000000;
  return otp.toString().padStart(6, '0');
}

export function verifyTotpToken(secretBase32: string, userToken: string, window = 1): boolean {
  if (!userToken || userToken.length !== 6) return false;
  const currentStep = Math.floor(Date.now() / 1000 / 30);

  for (let errorWindow = -window; errorWindow <= window; errorWindow++) {
    const calculated = computeTotpCode(secretBase32, currentStep + errorWindow);
    if (crypto.timingSafeEqual(Buffer.from(calculated), Buffer.from(userToken))) {
      return true;
    }
  }
  return false;
}

/**
 * Generate 10 random 8-character single-use recovery backup codes
 */
export async function generateBackupCodes(count = 10): Promise<{ plainCodes: string[]; hashedCodes: string[] }> {
  const plainCodes: string[] = [];
  const hashedCodes: string[] = [];

  for (let i = 0; i < count; i++) {
    const code = crypto.randomBytes(4).toString('hex').toUpperCase(); // 8 uppercase chars
    plainCodes.push(code);
    const hash = await bcrypt.hash(code, 10);
    hashedCodes.push(hash);
  }

  return { plainCodes, hashedCodes };
}

/**
 * Audit event recorder for all authentication & security events
 */
export async function logAuthEvent(options: {
  userId?: string | null;
  hospitalId?: string | null;
  eventType: string;
  status: 'success' | 'failure' | 'blocked';
  ip?: string;
  userAgent?: string;
  details?: Record<string, any>;
}): Promise<void> {
  try {
    await db('auth_audit_logs').insert({
      user_id: options.userId || null,
      hospital_id: options.hospitalId || null,
      event_type: options.eventType,
      status: options.status,
      ip_address: options.ip || null,
      user_agent: options.userAgent || null,
      details: JSON.stringify(options.details || {}),
      created_at: new Date(),
    });
  } catch (err: any) {
    logger.error('Failed to log auth audit event', { error: err.message, options });
  }
}

