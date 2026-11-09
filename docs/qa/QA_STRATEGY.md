# ASRTAVA Quality Assurance & Verification Strategy

## 1. Executive Quality Mission

ASRTAVA is an enterprise multi-tenant SaaS Hospital Management System (HMS) operating across 10 specialized healthcare staff workspaces, patient web & mobile applications, and platform administration. Because ASRTAVA directly impacts clinical patient safety, pharmaceutical delivery, emergency room triage, and financial accounting, quality assurance is treated as a safety-critical discipline.

Our QA Strategy establishes:
- **Zero-Tolerance for Cross-Tenant Data Bleed**: Automated negative test matrices running under restricted database roles.
- **Fail-Safe Business Workflows**: Complete end-to-end simulation of real clinical encounters, pharmacy FEFO dispensing, and double-entry billing.
- **High Availability & Scalable Performance**: Measured throughput, p99 latency verification, and memory stability.
- **Continuous Quality Gates**: Multi-tier CI/CD pipelines enforcing type checks, unit tests, integration contracts, and security regression before release.

---

## 2. Multi-Tier Testing Pyramid

```
                       / \
                      /   \
                     / E2E \       10 End-to-End Workflow Journeys
                    / Work- \      (Registration -> OPD -> IPD -> Rx -> Billing)
                   /  flows  \
                  /-----------\
                 / Integration \    65 Multi-Tenant & API Domain Tests
                / & Contracts   \   (Auth, Security, Reporting, Integrations, Mobile)
               /-----------------\
              /    Unit Tests     \  43 Isolated Calculation & Logic Tests
             / & Schema Validators \ (Bcrypt, JWT, FEFO, Taxes, Duplicate UHID)
            /-----------------------\
```

---

## 3. Scope of Testing

| Subsystem | Target Coverage & Verification Scope | Primary Verification Tooling |
| :--- | :--- | :--- |
| **Identity & Access** | Password policy (NIST SP 800-63B), progressive delay, lockout, TOTP MFA, refresh token rotation, replay reuse detection. | `ts-node tests/security_hardening.test.ts`, `tests/auth.test.ts` |
| **Tenant Isolation** | Negative authorization tests across all 10 domain entities (Patients, Invoices, Beds, Prescriptions, Staff). | `ts-node tests/tenant_isolation_matrix.test.ts` |
| **API Contracts** | Standard envelope validation, schema boundaries, zero stack trace exposure, 409 conflict states. | `ts-node tests/api_contracts.test.ts` |
| **Clinical Operations** | SOAP encounter notes, ICD-10 diagnosis, nursing station census, bed concurrency locking. | `ts-node tests/hospital_workflows.test.ts`, `tests/e2e_workflows.test.ts` |
| **Pharmacy & Inventory**| First-Expiry-First-Out (FEFO) allocation, negative stock blocking, batch recall. | `tests/hospital_workflows.test.ts`, `tests/performance_benchmarks.test.ts` |
| **Billing & Finance** | Room tariffs, specialist fees, GST taxation (5%, 12%, 18%), payment idempotency. | `tests/hospital_workflows.test.ts`, `tests/api_contracts.test.ts` |
| **Patient Mobile** | E.164 phone validation, QR check-in pass entropy, bio-reference ranges, deep link whitelisting. | `apps/patient-mobile/tests/patient_mobile.test.ts` |
| **Performance & Load** | JWT throughput, Merkle audit block latency, batch sort duration, heap delta memory stability. | `tests/performance_benchmarks.test.ts` |

---

## 4. Release-Blocking Criteria (Quality Gates)

A build is strictly prohibited from production release if any of the following occur:
1. Any test failure in the unified test suite (`npm test`).
2. Any cross-tenant access test failure in `tenant_isolation_matrix.test.ts`.
3. Stack trace or database connection string leakage in error envelopes.
4. p99 latency exceeding 100ms for core analytical query building or 1.0ms for cryptographic audit chaining.
5. High or Critical severity vulnerability identified in dependencies (`npm audit`).
6. Web portal production bundle chunks exceeding 500 kB after minification.

