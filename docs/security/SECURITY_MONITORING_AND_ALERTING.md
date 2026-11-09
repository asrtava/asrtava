# ASRTAVA Security Monitoring, Threat Detection & Alerting

## 1. Security Telemetry Architecture

ASRTAVA collects security events in real-time across four telemetry layers:
1. **Network & Ingress**: Express rate limiter violations, anomalous CORS origins, malformed headers.
2. **Identity & Authentication**: Failed logins, progressive throttling triggers, account lockouts, TOTP failures.
3. **Session & Tokens**: Token replay attempts, expired refresh token presentations, suspicious IP switches.
4. **Data Access & Authorization**: Cross-tenant injection attempts (IDOR), explicit individual DENY blocks, unauthorized clinical export requests.

---

## 2. Automated Threat Triggers & Alert Thresholds

| Threat Event | Trigger Criteria | Action Taken by System | Alert Severity |
| :--- | :--- | :--- | :--- |
| **Token Replay Attack** | Presentation of an already-used or revoked refresh token. | Invalidate entire token family immediately; terminate all user sessions; write to `security_incidents`. | **Critical** |
| **Brute Force / Credential Stuffing** | 5 consecutive failed logins on a single account. | Apply 15-minute account lockout; record IP and user agent in `auth_audit_logs`. | **High** |
| **Cross-Tenant Access Attempt (BOLA/IDOR)** | Request containing an entity ID belonging to a different tenant. | Reject with 403 Forbidden; log to `security_incidents` with category `cross_tenant_attempt`. | **High** |
| **Audit Ledger Tamper** | Hash mismatch during scheduled audit integrity scan. | Flag database corruption incident; notify Chief Security Officer. | **Critical** |
| **Support Privilege Escalation** | Super Admin querying clinical routes without an active JIT session. | Block request with `SUPPORT_SESSION_REQUIRED`; notify Hospital Administrator. | **High** |

---

## 3. SIEM Integration & Webhook Ingestion

Security incident events format structured JSON payloads dispatched to external Security Information and Event Management (SIEM) systems (e.g. Splunk, Datadog, AWS CloudWatch):
```json
{
  "timestamp": "2026-11-09T03:52:00.000Z",
  "incidentId": "INC-20261109-1049",
  "category": "token_replay_attack",
  "severity": "critical",
  "affectedUserId": "usr-8a91-4c21",
  "hospitalId": "hosp-alpha-blr",
  "sourceIp": "198.51.100.42",
  "containmentAction": "All family sessions invalidated."
}
```

