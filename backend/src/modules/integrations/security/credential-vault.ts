import crypto from 'crypto';
import { EncryptedCredential } from '../types';

// Default master encryption key for development/sandbox, override via process.env.INTEGRATION_MASTER_KEY in production (32 bytes hex)
const MASTER_KEY_HEX = process.env.INTEGRATION_MASTER_KEY || '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
const MASTER_KEY = Buffer.from(MASTER_KEY_HEX, 'hex');

export class CredentialVault {
  /**
   * Encrypts arbitrary sensitive credential objects using AES-256-GCM
   */
  public static encrypt(plainData: Record<string, any> | string, keyVersion: number = 1): EncryptedCredential {
    const text = typeof plainData === 'string' ? plainData : JSON.stringify(plainData);
    const iv = crypto.randomBytes(12); // 96-bit IV recommended for GCM
    const cipher = crypto.createCipheriv('aes-256-gcm', MASTER_KEY, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag().toString('hex');

    // Create a safe masked hint (e.g., first 8 chars + ... + last 4 chars)
    let hint: string | undefined;
    if (typeof plainData === 'object' && plainData !== null) {
      const apiKey = plainData.apiKey || plainData.keyId || plainData.token || Object.values(plainData)[0];
      if (typeof apiKey === 'string' && apiKey.length > 8) {
        hint = `${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}`;
      }
    }

    return {
      encryptedPayload: encrypted,
      iv: iv.toString('hex'),
      authTag,
      keyVersion,
      maskedHint: hint,
    };
  }

  /**
   * Decrypts an AES-256-GCM encrypted credential payload
   */
  public static decrypt<T = any>(credential: EncryptedCredential): T {
    const iv = Buffer.from(credential.iv, 'hex');
    const authTag = Buffer.from(credential.authTag, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-gcm', MASTER_KEY, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(credential.encryptedPayload, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    try {
      return JSON.parse(decrypted) as T;
    } catch {
      return decrypted as unknown as T;
    }
  }

  /**
   * Generates HMAC-SHA256 signature for webhooks
   */
  public static generateHmacSignature(payload: string, secret: string): string {
    return crypto.createHmac('sha256', secret).update(payload).digest('hex');
  }

  /**
   * Timing-safe verification of webhook signatures to prevent timing attacks
   */
  public static verifyHmacSignature(payload: string, signature: string, secret: string): boolean {
    if (!signature || !secret) return false;
    const expected = this.generateHmacSignature(payload, secret);
    
    // Normalize lengths to avoid timingSafeEqual range errors
    const sigBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expected);
    if (sigBuffer.length !== expectedBuffer.length) {
      return false;
    }
    return crypto.timingSafeEqual(sigBuffer, expectedBuffer);
  }

  /**
   * Generates a deterministic SHA-256 idempotency hash for webhook payloads
   */
  public static hashPayload(payload: any): string {
    const str = typeof payload === 'string' ? payload : JSON.stringify(payload);
    return crypto.createHash('sha256').update(str).digest('hex');
  }

  /**
   * Masks sensitive credentials for UI previews
   */
  public static maskSecret(value?: string): string {
    if (!value) return '';
    if (value.length <= 6) return '******';
    return `${value.substring(0, 4)}...${value.substring(value.length - 4)}`;
  }
}

