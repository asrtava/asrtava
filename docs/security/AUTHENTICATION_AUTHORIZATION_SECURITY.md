# ASRTAVA Authentication & Authorization Security Specification

## 1. Password Policy & NIST SP 800-63B Alignment

ASRTAVA adheres strictly to NIST SP 800-63B Digital Identity Guidelines for Authenticator Assurance Level 2 (AAL2):
- **Minimum Length**: 10 characters (encourages passphrases).
- **Complexity**: Requires uppercase, lowercase, numeric digits, and special characters.
- **Dictionary & Breach Blacklist**: Rejects common passwords, seasonal hospital phrases (e.g., `Hospital@123`, `Admin12345`), and known compromised credential lists.
- **Hashing**: Salted bcrypt with Cost Factor 12.

---

## 2. Progressive Login Throttling & Account Lockout

To defeat credential stuffing and brute-force attacks:
- **Attempts 1-2**: 0ms delay.
- **Attempt 3**: 500ms progressive delay.
- **Attempt 4**: 1000ms progressive delay.
- **Attempt 5**: 2000ms progressive delay.
- **5 Consecutive Failures**: Triggers an automated 15-minute account lockout (`PasswordPolicyService.recordFailedAttempt`).
- **Telemetry**: Failed attempts log source IP, user agent, and timestamp.

---

## 3. Multi-Factor Authentication (MFA)

- **Standard**: RFC 6238 Time-Based One-Time Password (TOTP) algorithm.
- **Secret Generation**: High-entropy 160-bit Base32 secrets.
- **Secret Persistence**: AES-256-GCM encrypted in `user_mfa` table.
- **Backup Codes**: 10 single-use emergency recovery codes generated per user, hashed individually with bcrypt prior to storage.
- **Drift Tolerance**: Authenticator accepts $\pm 1$ time step (30-second window) to accommodate client clock skew while rejecting replayed codes.

---

## 4. Refresh Token Rotation & Replay Reuse Detection

- Every login creates a `token_family_id` and a single-use refresh token hash stored in `auth_session_tokens`.
- Upon token refresh, the presented token is invalidated and a new token pair is issued in the same family.
- **Adversary Replay Detection**: If an already-rotated or revoked token is presented:
  - The engine immediately identifies token compromise.
  - The entire token family is revoked across all active devices.
  - An emergency `security_incidents` alert is dispatched.

---

## 5. Authorization Engine Precedence Rules

ASRTAVA implements a strict 4-tier evaluation algorithm:
1. **Tier 1: Explicit Individual DENY** (`is_granted = false` in `user_permissions`) -> **Immediate 403 Forbidden**. Overrides all roles.
2. **Tier 2: Explicit Individual ALLOW** (`is_granted = true`, unexpired) -> **Access Granted**.
3. **Tier 3: Role-Based Access Control (RBAC)** -> Checks canonical role permissions.
4. **Tier 4: Default Deny** -> **403 Forbidden**.

