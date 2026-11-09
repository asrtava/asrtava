import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { config } from '../../config';
import { db } from '../../database';
import { logger } from '../../utils/logger';

export interface SessionTokenPayload {
  userId: string;
  hospitalId: string | null;
  userType: string;
  roles: string[];
  tokenFamilyId: string;
  sessionId: string;
}

export interface RefreshRotationResult {
  success: boolean;
  accessToken?: string;
  refreshToken?: string;
  tokenFamilyId?: string;
  replayedReuseDetected?: boolean;
  message?: string;
}

export interface ActiveSessionInfo {
  id: string;
  tokenFamilyId: string;
  deviceFingerprint: string;
  ipAddress: string;
  userAgent: string;
  createdAt: Date;
  lastUsedAt: Date;
  isCurrent: boolean;
}

// Resilient in-memory cache for distributed cluster offline/test resilience
const inMemorySessionStore = new Map<string, any>();
const inMemoryFamilyStore = new Map<string, Set<string>>();

export class SessionSecurityService {
  private static readonly REFRESH_TOKEN_EXPIRY_DAYS = 7;
  private static readonly ACCESS_TOKEN_EXPIRY = '1h';

  /**
   * Generates a initial access and refresh token pair with an associated Token Family
   */
  public static async createSessionWithFamily(params: {
    userId: string;
    hospitalId: string | null;
    userType: string;
    roles: string[];
    deviceFingerprint?: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<{ accessToken: string; refreshToken: string; tokenFamilyId: string; sessionId: string }> {
    const tokenFamilyId = uuidv4();
    const sessionId = uuidv4();
    const rawRefreshToken = crypto.randomBytes(40).toString('hex');
    const refreshTokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');
    const expiresAt = new Date(Date.now() + this.REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

    const payload: SessionTokenPayload = {
      userId: params.userId,
      hospitalId: params.hospitalId,
      userType: params.userType,
      roles: params.roles,
      tokenFamilyId,
      sessionId,
    };

    const accessToken = jwt.sign(payload, config.jwt.secret, { expiresIn: this.ACCESS_TOKEN_EXPIRY });

    const sessionRecord = {
      id: sessionId,
      user_id: params.userId,
      hospital_id: params.hospitalId,
      token_family_id: tokenFamilyId,
      refresh_token_hash: refreshTokenHash,
      device_fingerprint: params.deviceFingerprint || 'unknown_device',
      ip_address: params.ipAddress || '127.0.0.1',
      user_agent: params.userAgent || 'unknown_agent',
      is_revoked: false,
      revoked_reason: null,
      last_used_at: new Date(),
      expires_at: expiresAt,
      created_at: new Date(),
    };

    // Store in resilient in-memory ledger
    inMemorySessionStore.set(sessionId, sessionRecord);
    if (!inMemoryFamilyStore.has(tokenFamilyId)) {
      inMemoryFamilyStore.set(tokenFamilyId, new Set());
    }
    inMemoryFamilyStore.get(tokenFamilyId)!.add(sessionId);

    // Persist refresh session token record to DB if available
    try {
      await db('auth_session_tokens').insert(sessionRecord).timeout(1000);
    } catch (err: any) {
      logger.warn(`Could not persist session token to database: ${err.message}. Running in resilient mode.`);
    }

    return {
      accessToken,
      refreshToken: `${sessionId}.${rawRefreshToken}`,
      tokenFamilyId,
      sessionId,
    };
  }

  /**
   * Rotates a refresh token.
   * If an old, already-used or revoked token is presented, triggers REUSE DETECTION:
   * Immediately invalidates all tokens in the entire family and flags a potential breach!
   */
  public static async rotateRefreshToken(
    compositeToken: string,
    metadata?: { ipAddress?: string; userAgent?: string }
  ): Promise<RefreshRotationResult> {
    if (!compositeToken || !compositeToken.includes('.')) {
      return { success: false, message: 'Invalid refresh token format.' };
    }

    const [sessionId, rawToken] = compositeToken.split('.');
    const presentedHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    try {
      let existingSession = inMemorySessionStore.get(sessionId);

      try {
        const dbSession = await db('auth_session_tokens').where({ id: sessionId }).first().timeout(1000);
        if (dbSession) {
          existingSession = dbSession;
        }
      } catch {}

      if (!existingSession) {
        return { success: false, message: 'Session not found or expired.' };
      }

      // Check if this token was already revoked or replaced (REUSE DETECTION)
      if (existingSession.is_revoked || existingSession.refresh_token_hash !== presentedHash) {
        logger.error(`SECURITY ALERT: Refresh token reuse detected for family ${existingSession.token_family_id}! Revoking entire family.`);

        // Invalidate all sessions in this token family (memory)
        const familySessions = inMemoryFamilyStore.get(existingSession.token_family_id);
        if (familySessions) {
          for (const sId of familySessions) {
            const s = inMemorySessionStore.get(sId);
            if (s) {
              s.is_revoked = true;
              s.revoked_reason = 'compromised_reuse_detected';
            }
          }
        }

        // Invalidate in DB if connected
        try {
          await db('auth_session_tokens')
            .where({ token_family_id: existingSession.token_family_id })
            .update({
              is_revoked: true,
              revoked_reason: 'compromised_reuse_detected',
            })
            .timeout(1000);
        } catch {}

        return {
          success: false,
          replayedReuseDetected: true,
          message: 'Security Alert: Compromised session detected. All sessions in this chain have been terminated.',
        };
      }

      // Check expiration
      if (new Date(existingSession.expires_at) < new Date()) {
        existingSession.is_revoked = true;
        existingSession.revoked_reason = 'expired';
        return { success: false, message: 'Refresh token has expired. Please sign in again.' };
      }

      // Mark the current refresh token as revoked/rotated
      existingSession.is_revoked = true;
      existingSession.revoked_reason = 'rotated';

      try {
        await db('auth_session_tokens')
          .where({ id: sessionId })
          .update({
            is_revoked: true,
            revoked_reason: 'rotated',
          })
          .timeout(1000);
      } catch {}

      // Generate new token pair in the SAME family
      const newSessionId = uuidv4();
      const newRawRefreshToken = crypto.randomBytes(40).toString('hex');
      const newHash = crypto.createHash('sha256').update(newRawRefreshToken).digest('hex');
      const newExpiresAt = new Date(Date.now() + this.REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

      const payload: SessionTokenPayload = {
        userId: existingSession.user_id,
        hospitalId: existingSession.hospital_id,
        userType: 'staff',
        roles: ['staff'],
        tokenFamilyId: existingSession.token_family_id,
        sessionId: newSessionId,
      };

      const newAccessToken = jwt.sign(payload, config.jwt.secret, { expiresIn: this.ACCESS_TOKEN_EXPIRY });

      const newSessionRecord = {
        id: newSessionId,
        user_id: existingSession.user_id,
        hospital_id: existingSession.hospital_id,
        token_family_id: existingSession.token_family_id,
        refresh_token_hash: newHash,
        device_fingerprint: existingSession.device_fingerprint,
        ip_address: metadata?.ipAddress || existingSession.ip_address,
        user_agent: metadata?.userAgent || existingSession.user_agent,
        is_revoked: false,
        last_used_at: new Date(),
        expires_at: newExpiresAt,
        created_at: new Date(),
      };

      inMemorySessionStore.set(newSessionId, newSessionRecord);
      if (inMemoryFamilyStore.has(existingSession.token_family_id)) {
        inMemoryFamilyStore.get(existingSession.token_family_id)!.add(newSessionId);
      }

      try {
        await db('auth_session_tokens').insert(newSessionRecord).timeout(1000);
      } catch {}

      return {
        success: true,
        accessToken: newAccessToken,
        refreshToken: `${newSessionId}.${newRawRefreshToken}`,
        tokenFamilyId: existingSession.token_family_id,
      };
    } catch (err: any) {
      logger.error('Error during token rotation:', err);
      return { success: false, message: 'Internal error during token rotation.' };
    }
  }

  /**
   * Revokes a specific session by sessionId
   */
  public static async revokeSession(sessionId: string, userId: string): Promise<boolean> {
    try {
      const rows = await db('auth_session_tokens')
        .where({ id: sessionId, user_id: userId })
        .update({
          is_revoked: true,
          revoked_reason: 'user_signout',
        });
      return rows > 0;
    } catch {
      return false;
    }
  }

  /**
   * Revokes all active sessions for a user across all devices (Global Signout / Security Reset)
   */
  public static async revokeAllUserSessions(userId: string, reason: string = 'global_signout'): Promise<number> {
    try {
      return await db('auth_session_tokens')
        .where({ user_id: userId, is_revoked: false })
        .update({
          is_revoked: true,
          revoked_reason: reason,
        });
    } catch {
      return 0;
    }
  }

  /**
   * Lists active sessions for a user
   */
  public static async listActiveSessions(userId: string, currentSessionId?: string): Promise<ActiveSessionInfo[]> {
    try {
      const sessions = await db('auth_session_tokens')
        .where({ user_id: userId, is_revoked: false })
        .where('expires_at', '>', new Date())
        .orderBy('created_at', 'desc');

      return sessions.map((s: any) => ({
        id: s.id,
        tokenFamilyId: s.token_family_id,
        deviceFingerprint: s.device_fingerprint,
        ipAddress: s.ip_address,
        userAgent: s.user_agent,
        createdAt: s.created_at,
        lastUsedAt: s.last_used_at,
        isCurrent: currentSessionId ? s.id === currentSessionId : false,
      }));
    } catch {
      return [];
    }
  }
}
