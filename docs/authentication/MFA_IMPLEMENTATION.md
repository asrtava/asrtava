# ASRTAVA — Multi-Factor Authentication (MFA) Implementation

## 1. Overview
ASRTAVA supports **RFC 6238 Time-Based One-Time Passwords (TOTP)** compatible with Google Authenticator, Microsoft Authenticator, 1Password, and Apple Keychain.

- **Mandatory Policy**: Platform Super Admin accounts.
- **Configurable Policy**: Privileged hospital administrators, pharmacy inventory heads, and finance officers.

---

## 2. Enrollment & Verification Lifecycle

```
Client                              Backend                             Database (user_mfa)
  │                                    │                                         │
  ├─── 1. POST /mfa/enroll ───────────>│                                         │
  │                                    │── Generates Base32 Secret & URI ───────>│ (is_enabled = false)
  │<── Returns Secret & QR URI ────────│                                         │
  │                                    │                                         │
  ├─── 2. POST /mfa/verify (6 digits) ─>│                                         │
  │                                    │── RFC 6238 HMAC-SHA1 Verification       │
  │                                    │── Generates 10 Backup Codes             │
  │                                    │── Bcrypt Hashes Backup Codes ──────────>│ (is_enabled = true)
  │<── Returns 10 One-Time Codes ──────│                                         │
```

---

## 3. Algorithm Specifications

- **Algorithm**: HMAC-SHA1 (RFC 6238).
- **Secret Length**: 160 bits (20 bytes), Base32 encoded (32 characters).
- **Time Step**: 30 seconds.
- **Verification Window**: `±1` step (30 seconds backward, 30 seconds forward) to allow for clock drift between client and server.
- **Backup Codes**: 10 random 8-character uppercase hex strings. Plaintext codes are displayed to the user once upon enrollment; only bcrypt hashes are stored in the database.

