# ASRTAVA Cryptographic Encryption & Key Management Specification

## 1. Cryptographic Standards Overview

| Domain | Algorithm | Key Size | Mode / Padding | Implementation |
| :--- | :--- | :--- | :--- | :--- |
| **Data in Transit** | TLS 1.3 | 256-bit | ECDHE-ECDSA-AES256-GCM | Node.js HTTPS / NGINX Reverse Proxy |
| **Credentials & Secrets** | AES | 256-bit | GCM (Authenticated) | Node `crypto.createCipheriv` with 96-bit IV |
| **Webhooks & Payloads** | HMAC | 256-bit | SHA-256 | Timing-safe verification (`crypto.timingSafeEqual`) |
| **Passwords** | Bcrypt | 128-bit Salt | Cost Factor 12 | `bcryptjs` / Argon2id compatible |
| **Audit Chaining** | SHA-2 | 256-bit | Merkle sequential hash | `crypto.createHash('sha256')` |

---

## 2. Envelope Encryption Architecture

For sensitive integration secrets (e.g. Razorpay Key Secret, WhatsApp Cloud Access Token, PACS DICOM passwords):
1. **Data Encryption Key (DEK)**: Unique 256-bit AES key generated per tenant integration.
2. **Key Encryption Key (KEK)**: Root master key maintained in cloud hardware security modules (HSM / AWS KMS).
3. **Payload Structure**:
```json
{
  "iv": "3a7b9f...",
  "authTag": "c8e210...",
  "encryptedData": "f781a0..."
}
```
All decryptions verify the authentication tag prior to returning the plaintext secret to prevent bit-flipping attacks.

---

## 3. Key Lifecycle & Rotation Policy

- **Master KEK Rotation**: Rotated automatically every 365 days in KMS with previous version retained for decryption of historical archives.
- **JWT Signing Keys**: Ephemeral 256-bit keys rotated every 90 days.
- **Incident Key Compromise**: In the event of an alleged secret leak, the incident team triggers immediate key revocation via `/api/v1/integrations/credentials/rotate`.

