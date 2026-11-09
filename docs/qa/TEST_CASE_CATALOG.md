# ASRTAVA Test Case Catalog & Traceability Matrix

## 1. Catalog Summary

The ASRTAVA automated test suite comprises **118 verified test cases** organized across 12 distinct functional and architectural domains.

---

## 2. Comprehensive Test Traceability Matrix

| ID Range | Functional Domain | File Location | Test Count | Key Invariants Asserted |
| :--- | :--- | :--- | :---: | :--- |
| **TC-E2E-01..10** | End-to-End Workflows | `tests/e2e_workflows.test.ts` | 10 | Continuous 10-step patient journey from registration, OPD, admission, ICU bed allocation, FEFO pharmacy dispense, lab critical alerts, GST invoice, and discharge. |
| **TC-TEN-01..10** | Tenant Isolation Matrix | `tests/tenant_isolation_matrix.test.ts` | 10 | Negative access attempts from Hospital Alpha into Hospital Beta across all 10 clinical, financial, and operational entities; zero standing super-admin clinical access. |
| **TC-CON-01..05** | API Contracts & Boundaries | `tests/api_contracts.test.ts` | 5 | Envelope structure, suppression of database stack traces, 400 validation issues, 409 state conflict errors, and idempotency key deduplication. |
| **TC-PRF-01..05** | Performance Benchmarks | `tests/performance_benchmarks.test.ts` | 5 | JWT throughput ($> 5,000 \text{ ops/s}$), Merkle audit block latency ($< 1 \text{ ms}$), data masking throughput ($> 50,000 \text{ ops/s}$), 5,000-batch FEFO sort, heap memory stability. |
| **TC-SEC-01..16** | Security Hardening | `tests/security_hardening.test.ts` | 16 | NIST SP 800-63B password rules, progressive login throttling, refresh token family rotation, replay reuse detection, PII masking, DPDP 2023 DSR statutory retention legal hold. |
| **TC-REP-01..09** | Reporting & Analytics | `tests/reporting_analytics.test.ts` | 9 | Metric definitions (ALOS 4.2d, Bed Occ 88.0%, MRR ₹19.5L, ARR ₹2.34Cr, Churn 1.0%), SQL injection defense AST query builder, 24h expiring export tokens, RFC-4180 CSV formatting. |
| **TC-INT-01..15** | Advanced Integrations | `tests/integrations.test.ts` | 15 | Timing-safe HMAC webhooks, Meta WhatsApp payloads, DLT SMS headers, payment idempotency, HL7 v2.5.1 MLLP parser, FHIR R4 resources, PACS DICOM tokens, Outbox DLQ. |
| **TC-SAS-01..09** | SaaS Administration | `tests/saas_platform.test.ts` | 9 | Tenant isolation, plan feature gating, tiered pricing calculations, subscription lifecycle, usage quotas, financial subsystem separation, JIT support sessions. |
| **TC-WRK-01..08** | Hospital Business Rules | `tests/hospital_workflows.test.ts` | 8 | Patient duplicate scoring, double-booking prevention, clinical EMR append-only immutability, bed occupancy lock, FEFO earliest expiry, decimal GST calculation, DENY precedence. |
| **TC-AUT-01..20** | Authentication & Authz | `tests/auth.test.ts` | 20 | Bcrypt salted passwords, high-entropy tokens, RFC 6238 TOTP authenticator, 10 backup recovery codes, JWT short expiration, 4-tier authorization precedence, tenant switching. |
| **TC-API-01..04** | Core API Gateway | `tests/api.test.ts` | 4 | Token signature tampering rejection, dynamic portal resolution, financial payment idempotency. |
| **TC-MOB-01..07** | Patient Mobile App | `../apps/patient-mobile/tests/patient_mobile.test.ts` | 7 | Indian mobile phone validation, high-entropy check-in QR passes, abnormal lab bio-reference indicators, deep link whitelist sanitization. |
| **TOTAL** | **All 12 Test Suites** | — | **118** | **100% Passed (118/118 Tests)** |

