# ASRTAVA Multi-Tenant Architecture & Hospital Data Isolation Specification

**Document Version:** 1.0.0  
**Classification:** Core System Architecture & Security Requirement  
**Target:** ASRTAVA Hospital Management System (SaaS, On-Premises & Hybrid)

---

## 1. Executive Architecture Vision

ASRTAVA is the central commercial software platform sold to and deployed across multiple independent hospital organizations. While all hospitals operate on the standardized ASRTAVA software codebase, **each purchasing hospital operates within an isolated, private environment**.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        ASRTAVA CENTRAL PLATFORM                        │
│   Platform Administration · Perpetual Licensing · Release Management   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
           ═════════════════════════╧═════════════════════════
           🔒 STRICT TENANT ISOLATION LAYER (RLS + BOLA GUARD)
           ═════════════════════════╤═════════════════════════
                                    │
    ┌───────────────────┬───────────┴───────┬───────────────────┐
    ▼                   ▼                   ▼                   ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│  Hospital A   │   │  Hospital B   │   │  Hospital C   │   │  Hospital D   │
│ (Tenant 1001) │   │ (Tenant 1002) │   │ (Tenant 1003) │   │ (Tenant 1004) │
├───────────────┤   ├───────────────┤   ├───────────────┤   ├───────────────┤
│ • Patients A  │   │ • Patients B  │   │ • Patients C  │   │ • Patients D  │
│ • Doctors A   │   │ • Doctors B   │   │ • Doctors C   │   │ • Doctors D   │
│ • Billing A   │   │ • Billing B   │   │ • Billing C   │   │ • Billing D   │
│ • Staff A     │   │ • Staff B     │   │ • Staff C     │   │ • Staff D     │
│ • Reports A   │   │ • Reports B   │   │ • Reports C   │   │ • Reports D   │
└───────────────┘   └───────────────┘   └───────────────┘   └───────────────┘
```

---

## 2. Technical Tenant Isolation Architecture

Isolation is enforced using a **Defense-in-Depth** strategy across four distinct layers:

```
[ Layer 1: Client & Portal Layer ] ──► Scoped JWT Tokens with Verified hospitalId
           │
[ Layer 2: API & Gateway Layer ]   ──► tenantMiddleware + BOLA / IDOR Tamper Guards
           │
[ Layer 3: Application Service ]   ──► withTenantContext & TenantIsolationGuard
           │
[ Layer 4: PostgreSQL Database ]   ──► Row-Level Security (RLS) + Foreign Key Constraints
```

### A. Unique Hospital Identifier (`tenant_id` / `hospital_id`)
- Every hospital record across all relational tables contains an immutable `hospital_id UUID NOT NULL REFERENCES hospitals(id)`.
- Unique constraints combine `hospital_id` with natural keys (e.g. `UNIQUE (hospital_id, patient_number)`, `UNIQUE (hospital_id, invoice_number)`).

### B. PostgreSQL Row-Level Security (RLS)
The database enforces tenant boundaries natively via PostgreSQL Row-Level Security policies. Even if an application query omits `WHERE hospital_id = ...`, PostgreSQL intercepts and filters rows at the database engine level.

#### Session Variables & RLS Functions:
```sql
CREATE SCHEMA IF NOT EXISTS app;

-- Retrieves active tenant ID from connection context
CREATE OR REPLACE FUNCTION app.get_current_tenant_id() RETURNS UUID AS $$
BEGIN
    RETURN NULLIF(current_setting('app.current_tenant_id', true), '')::UUID;
EXCEPTION WHEN OTHERS THEN RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Checks if session is authenticated as Platform Super Admin
CREATE OR REPLACE FUNCTION app.is_super_admin() RETURNS BOOLEAN AS $$
BEGIN
    RETURN COALESCE(current_setting('app.is_super_admin', true) = 'true', false);
EXCEPTION WHEN OTHERS THEN RETURN false;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Checks whether an audited JIT break-glass grant exists for clinical access
CREATE OR REPLACE FUNCTION app.has_clinical_jit_grant() RETURNS BOOLEAN AS $$
BEGIN
    RETURN COALESCE(current_setting('app.has_clinical_jit_grant', true) = 'true', false);
EXCEPTION WHEN OTHERS THEN RETURN false;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
```

#### Policy Enforcement Across Tenant Tables:
```sql
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients FORCE ROW LEVEL SECURITY;

CREATE POLICY patients_tenant_isolation ON public.patients
AS RESTRICTIVE
USING (
    app.is_super_admin() = true
    OR
    hospital_id = app.get_current_tenant_id()
)
WITH CHECK (
    app.is_super_admin() = true
    OR
    hospital_id = app.get_current_tenant_id()
);
```

---

## 3. Two-Tier Administration & Clinical Data Firewall

To maintain HIPAA, NABH, and DPDP regulatory compliance, ASRTAVA enforces a strict division of administrative authority:

| Attribute | ASRTAVA Super Admin (Platform Level) | Hospital Admin (Hospital Tenant Level) |
| :--- | :--- | :--- |
| **Scope** | Platform infrastructure, licensing, customer onboarding | Single Hospital Tenant (`hospital_id`) |
| **Capabilities** | Issue perpetual licenses, configure tenants, inspect system health | Manage hospital doctors, nurses, billing tariffs, bed allocations |
| **Clinical Records** | **BLOCKED BY DEFAULT** (Zero-Standing-Privilege) | Full clinical & operational access for own hospital |
| **Support Access** | Requires time-limited, audited JIT Break-Glass authorization | Grants or revokes emergency support authorization |

### The Super Admin Clinical Data Firewall (JIT Break-Glass Protocol)
Platform Super Admins are prohibited from browsing confidential patient records, consultations, diagnostic scans, and prescriptions.

When a customer hospital requests technical troubleshooting:
1. Hospital Admin issues a **JIT Support Grant** (`jit_support_grants`) specifying a maximum duration (e.g. 2 hours) and a support ticket reference.
2. Super Admin presents the grant ticket in request headers (`x-asrtava-jit-ticket`).
3. `tenantMiddleware` verifies the cryptographic signature and timestamp of the grant.
4. Every read, write, or export operation during the JIT session is written to `audit_logs` with tamper-resistant hashing.
5. Once expired, access terminates automatically.

---

## 4. Multi-Branch Hospital Groups & Hierarchies

ASRTAVA natively supports multi-branch hospital chains (e.g., *Sunrise Healthcare Group* with Hyderabad, Vijayawada, and Bengaluru branches):

```
┌────────────────────────────────────────────────────────┐
│            Enterprise Group: Sunrise Healthcare         │
│               (organization_id: ORG-9001)              │
└───────────────────────────┬────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│ Hyderabad Br. │   │Vijayawada Br. │   │ Bengaluru Br. │
│ (HOSP-HYD-01) │   │ (HOSP-VJA-02) │   │ (HOSP-BLR-03) │
└───────────────┘   └───────────────┘   └───────────────┘
```

1. **Intra-Group EMPI (Enterprise Master Patient Index)**: Patients can hold a unified group identity while individual encounter notes, bills, and prescriptions remain scoped to the treating branch.
2. **Cross-Branch Visiting Doctors**: Doctors can hold roster assignments across multiple branches within the same parent organization without leaking records to foreign hospital chains.
3. **Consolidated Financial Rollup**: Group executives can view consolidated operational dashboards across all authorized branches while branch administrators remain restricted to their local hospital facility.

---

## 5. Deployment Options & Isolation Models

ASRTAVA supports three commercial deployment configurations with identical perpetual licensing enforcement:

| Deployment Option | Database Architecture | Data Isolation Guarantee |
| :--- | :--- | :--- |
| **1. Multi-Tenant Cloud** | Shared PostgreSQL Cluster with Row-Level Security (RLS) | Database-enforced session RLS + application BOLA guard |
| **2. Dedicated Cloud / Gov** | Dedicated isolated PostgreSQL database instance per tenant | Physical database separation with independent connection strings |
| **3. On-Premises Air-Gapped** | Hospital-owned on-premises server & local database | Physical perimeter isolation within hospital intranet |
| **4. Hybrid Edge Sync** | Local hospital edge database with encrypted cloud replication | Tenant-scoped cryptographic replication queues |

---

## 6. The Non-Compromise Security Rules

The following 10 security invariants are verified on every code commit and production build:

1. **Patient Data Hermeticity**: Hospital A users cannot view, query, or search Hospital B patients under any circumstance.
2. **Doctor & Staff Isolation**: Employee rosters, compensation, and schedules are strictly invisible across hospital boundaries.
3. **Clinical Confidentiality**: Consultations, vitals, prescriptions, and medical history cannot be leaked or shared across unrelated hospitals.
4. **Bed & Inpatient Quarantine**: Bed allocation, ICU capacity, and ward occupancy cannot be viewed or altered across tenants.
5. **Pharmacy Inventory Separation**: Drug stock, batches, and FEFO dispensing queues belong strictly to the owning facility.
6. **Diagnostic Privacy**: Pathology test orders and Radiology PACS DICOM studies are partitioned by `hospital_id`.
7. **Financial Ledger Isolation**: Invoices, tax receipts, and payment transactions are isolated to prevent corporate financial espionage.
8. **Document Storage Protection**: S3 / local document storage keys are prefixed by tenant UUID (`/storage/{hospital_id}/...`) with pre-signed token validation.
9. **IDOR & BOLA Defense**: Tampering with query parameters (`?hospitalId=...`) or body payloads triggers an automated security incident (`security_incidents`) and immediate 403 rejection.
10. **Zero-Standing Super Admin Access**: Central platform super admins cannot view clinical data without a valid, audited JIT grant.

---

## 7. Automated Security Verification Test Suite

Cross-tenant isolation is validated via automated integration tests in `backend/tests/tenant_isolation_matrix.test.ts`:

```bash
npm --prefix backend test -- tests/tenant_isolation_matrix.test.ts
```

### Verified Test Matrix:
- ✔ Matrix 1: Patient Demographic & Medical Record Isolation
- ✔ Matrix 2: Appointment Schedule Isolation
- ✔ Matrix 3: Clinical Encounters & Prescriptions
- ✔ Matrix 4: IPD Bed Inventory Isolation
- ✔ Matrix 5: Pharmacy Stock & FEFO Inventory Isolation
- ✔ Matrix 6: Laboratory & Radiology Diagnostic Reports
- ✔ Matrix 7: Financial Ledgers & Patient Billing Isolation
- ✔ Matrix 8: Confidential Patient Documents & Imaging Scans
- ✔ Matrix 9: Staff & HR Roster Isolation
- ✔ Matrix 10: Zero-Standing-Privilege Support Access Guard (Super Admin Clinical Firewall)
