# ASRTAVA Redis & Background Worker Infrastructure Guide

## 1. Redis Cluster Architecture

- **Engine**: Amazon ElastiCache Redis 7.x
- **Topology**: Multi-AZ with Automatic Failover (1 Primary + 1 Read-Replica)
- **Encryption**: In-Transit TLS (`transit_encryption_enabled = true`) and At-Rest Encryption via KMS.
- **Access Control**: Password AUTH token required; accessible only from private ECS security group on port 6379.

---

## 2. Workload Distribution

Redis supports four essential operational workloads:
1. **Progressive Login Throttling**: In-memory rate limiting and account lockout ledgers (`PasswordPolicyService`).
2. **Session Security & Refresh Token Rotation**: Fast cache lookup of active token family hashes.
3. **Outbox Message Queue**: BullMQ / Outbox queue buffering outbound WhatsApp, SMS, and email dispatches.
4. **Dead-Letter Queue (DLQ)**: Failed integration webhooks routed to DLQ after 5 failed exponential backoff retries.

---

## 3. Worker Reliability & Idempotency

Background workers running in ECS:
1. **Tenant Isolation**: Every background job payload contains verified `tenant_id` and executes within an explicit `withTenantContext` transaction.
2. **Job Idempotency**: Jobs check duplicate delivery IDs before modifying state.
3. **Zero Sensitive Payload Storage**: Queue payloads contain entity UUIDs, never plaintext patient diagnoses or unmasked credentials.

