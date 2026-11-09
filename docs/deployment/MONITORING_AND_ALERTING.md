# ASRTAVA Monitoring, Observability & Alerting Architecture

## 1. Observability Pillars

ASRTAVA implements three pillars of observability:
1. **Metrics (Prometheus & CloudWatch)**: Application uptime, V8 heap usage, request counts, error rates, p95/p99 latencies exported via `/metrics`.
2. **Logs (Winston & CloudWatch Logs)**: Structured JSON logging with request IDs, IP addresses, and strict PHI redaction.
3. **Tracing & Error Tracking (OpenTelemetry & Sentry)**: Distributed transaction tracking across domain gateways and database calls.

---

## 2. Alert Escalation Matrix

| Alert Name | Condition | Channel | Escalation Target | Severity |
| :--- | :--- | :--- | :--- | :---: |
| **API High 5xx Error Rate** | $> 2.0\%$ of requests fail in a 5-min window | PagerDuty / Slack | On-Call Lead Engineer | **CRITICAL** |
| **Database Failover Triggered** | Aurora / RDS primary failover event detected | PagerDuty / SMS | Lead Database Administrator | **CRITICAL** |
| **Token Replay Attack Detected** | Stale refresh token presented | Slack `#security-alerts` | Security Operations Team | **CRITICAL** |
| **PostgreSQL Connection Spike** | Pool utilization $> 85\%$ for 10 minutes | Slack `#infra-alerts` | Platform Reliability Team | **HIGH** |
| **Outbox DLQ Message Spike** | $> 10$ messages pushed to DLQ in 1 hour | Slack `#integrations` | Integration Engineering | **MEDIUM** |
| **Disk Storage Threshold** | S3 bucket quota $> 80\%$ or RDS storage threshold | Email / Slack | DevOps Infrastructure | **MEDIUM** |

