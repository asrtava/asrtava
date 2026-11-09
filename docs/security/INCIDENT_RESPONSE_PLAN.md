# ASRTAVA Security Incident Response Plan (IRP)

## 1. Incident Response Lifecycle

ASRTAVA adheres to the **NIST SP 800-61 Rev. 2** Computer Security Incident Handling Guide:

```
+---------------+      +----------------+      +---------------+
| 1. PREPARATION | ---> | 2. DETECTION & | ---> | 3. CONTAINMENT|
|                |      |    ANALYSIS    |      |   & ISOLATION |
+---------------+      +----------------+      +---------------+
                                                       |
+---------------+      +----------------+      +---------------+
| 6. POST-INCIDENT| <--- | 5. RECOVERY &  | <--- |4. ERADICATION |
|    ACTIVITY   |      |    POST-CHECK  |      |               |
+---------------+      +----------------+      +---------------+
```

---

## 2. Severity Classification & Response Timelines

| Severity Level | Definition | Response SLA | Target Containment | External Notification SLA |
| :--- | :--- | :--- | :--- | :--- |
| **Critical (SEV-1)** | Active data exfiltration, database tampering, platform-wide credential compromise. | < 15 minutes | < 1 hour | < 72 hours (DPDP / HIPAA Breach Notification) |
| **High (SEV-2)** | Cross-tenant isolation breach attempt, unhandled token replay, critical service outage. | < 30 minutes | < 4 hours | Within statutory window if PII affected |
| **Medium (SEV-3)** | Brute force threshold exceeded on single account, certificate renewal warning. | < 2 hours | < 24 hours | Internal review only |
| **Low (SEV-4)** | Minor policy violation, isolated client rate-limiting spike. | < 8 hours | Next sprint | None |

---

## 3. Containment Workflows by Incident Type

### A. Compromised User Credential / Session
1. Execute `POST /api/v1/security/sessions/revoke-all` with `reason: 'compromised_credential'`.
2. Terminate active JWT session tokens by incrementing user `token_version`.
3. Require mandatory password reset with high-entropy token and enforce TOTP re-binding.

### B. Cross-Tenant Attempt
1. Identify the origin IP and user account.
2. Immediately suspend offending user membership in `hospital_memberships`.
3. Review audit log chain for preceding 48 hours to confirm zero unauthorized data exposure.

