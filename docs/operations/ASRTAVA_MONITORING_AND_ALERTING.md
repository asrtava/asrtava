# ASRTAVA Monitoring, Observability & Alerting Runbook

**Document Reference:** `docs/operations/ASRTAVA_MONITORING_AND_ALERTING.md`  
**Observability Standard:** Prometheus Metrics, OpenTelemetry-compatible Traces, Structured Winston JSON Logs  
**Status:** **READY WITH DOCUMENTED PREREQUISITES**

---

## 1. Observability Architecture Overview

The ASRTAVA platform provides continuous real-time telemetry across infrastructure, application, and clinical operational layers:
- **Application Endpoints:**
  - `GET /health` — High-level liveness probe returning uptime, supported portals, and service state.
  - `GET /ready` — Deep readiness probe evaluating PostgreSQL database connection latency and circuit breakers.
  - `GET /metrics` — Prometheus exposition format exporting process memory (heap, RSS), active gateways, request counters, and error rates.
- **Probe Script:** `scripts/health_check.sh` automated multi-component verification probing backend API and frontend Nginx.
- **Structured Logging:** Winston JSON logger formatting timestamps, service identifiers, request IDs (`x-request-id`), HTTP status codes, and error traces.

---

## 2. Sensitive Data Redaction & Logging Safeguards

To prevent HIPAA and DPDP Act compliance violations:
1. **Zero Secret Logging:** Passwords, password hashes, JWT tokens, MFA TOTP secrets, session tokens, and database credentials are **strictly excluded** from logs.
2. **PII Masking:** Patient names, full telephone numbers, and Aadhaar numbers are masked in all operational logs (e.g. `Patient ID: UHID-2026-****`, Phone: `+91-98****1234`).
3. **Structured Request Context:** Incoming requests are assigned a unique, high-entropy `x-request-id` header allowing end-to-end request tracing across micro-workspaces without exposing clinical payload content.

---

## 3. Operational Alert Matrix & Delivery Channels

The table below clearly distinguishes alerts that are currently exposed via metrics/logs from those connected to live push notification channels:

| Alert Identifier | Subsystem | Trigger Condition | Severity | Notification Channel Status | Recommended Destination Channel |
| :--- | :--- | :--- | :---: | :---: | :--- |
| `DB_CONNECTION_FAILURE` | Database | PostgreSQL connection pool timeout > 5s | **P0 (Critical)** | **Exposed in `/ready`** | PagerDuty / OpsGenie Urgent Escalation |
| `BACKUP_FAILED` | Disaster Recovery | `backup_database.sh` exit code != 0 | **P0 (Critical)** | **Local Logged in Shell** | Hospital IT Slack / Email Alert |
| `PANIC_LAB_VALUE_STALLED` | Clinical Safety | Critical lab panic value unacknowledged > 15m | **P0 (Critical)** | **Implemented in Code** | SMS / Voice Call to Treating Doctor |
| `DLQ_BACKLOG_SPIKE` | Message Queue | Outbox Dead-Letter Queue contains > 10 items | **P1 (High)** | **Exposed in Redis / DB** | DevOps Slack / Email Digest |
| `BRUTE_FORCE_LOGIN_ATTACK` | Security | > 5 failed logins within 10 minutes from single IP | **P1 (High)** | **Rate-Limiter Active** | Security Operations Center (SOC) Alert |
| `DISK_CAPACITY_CRITICAL` | Server OS | Host storage utilization exceeds 90% | **P1 (High)** | **OS Telemetry Required** | Hospital Server Infrastructure Team |
| `DISK_CAPACITY_WARNING` | Server OS | Host storage utilization exceeds 75% | **P2 (Medium)** | **OS Telemetry Required** | Hospital Server Infrastructure Team |
| `API_LATENCY_DEGRADED` | API Gateway | P95 API response time exceeds 1,500ms over 5m | **P2 (Medium)** | **Prometheus Metric Exposed** | Datadog / Grafana Dashboard Warning |
| `HYBRID_SYNC_OUTAGE` | Hybrid Node | Local edge unable to flush outbox to cloud > 30m | **P2 (Medium)** | **Local Outbox Buffered** | Network Operations Center (NOC) |
| `EXTERNAL_GATEWAY_DOWN` | Integrations | ABDM, WhatsApp or SMS provider returns 5xx | **P2 (Medium)** | **Exposed in Outbox Retry** | Third-Party Provider Status Channel |

---

## 4. Configuring Production Alert Receivers

To connect exposed Prometheus metrics and Winston logs to operational paging channels in production:
1. **Prometheus Alertmanager Configuration (`alertmanager.yml`):**
   ```yaml
   route:
     receiver: 'slack-and-pagerduty'
     group_wait: 30s
     group_interval: 5m
     repeat_interval: 4h
   receivers:
     - name: 'slack-and-pagerduty'
       pagerduty_configs:
         - service_key: '${PAGERDUTY_INTEGRATION_KEY}'
           severity: 'critical'
       slack_configs:
         - channel: '#asrtava-prod-alerts'
           api_url: '${SLACK_WEBHOOK_URL}'
   ```
2. **Prometheus Alert Rules (`asrtava_rules.yml`):**
   ```yaml
   groups:
     - name: asrtava.rules
       rules:
         - alert: DatabaseUnavailable
           expr: probe_success{instance="http://backend:5000/ready"} == 0
           for: 1m
           labels:
             severity: critical
           annotations:
             summary: "ASRTAVA Database is unreachable"
             description: "Backend /ready probe failed for over 1 minute."
   ```
