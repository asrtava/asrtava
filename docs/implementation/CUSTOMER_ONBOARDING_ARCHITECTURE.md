# ASRTAVA Customer Onboarding Architecture

## 1. Executive Summary

The ASRTAVA Customer Onboarding Architecture provides an enterprise framework for guiding healthcare institutions through the end-to-end transition onto the ASRTAVA Hospital Management Platform. Engineered specifically to support ASRTAVA's **One-Time Perpetual Software Licensing Model** across **Cloud, On-Premises, and Hybrid** deployments, the system ensures verifiable operational readiness, zero clinical data loss, and clinical continuity from day zero.

```
+-------------------------------------------------------------------------------------------------------+
|                                    CUSTOMER ONBOARDING WORKSTREAM                                      |
+-------------------------------------------------------------------------------------------------------+
|                                                                                                       |
|  [ Commercial & License Verification ]                                                                |
|                 │                                                                                     |
|                 ▼                                                                                     |
|  [ Deployment Assessment ] ──────► Cloud / On-Premises / Hybrid Topology Checklist                     |
|                 │                                                                                     |
|                 ▼                                                                                     |
|  [ Requirements Catalog ]  ──────► Clinical, Billing, Diagnostics & Formulary Alignment               |
|                 │                                                                                     |
|                 ▼                                                                                     |
|  [ Data Migration Engine ] ──────► Dry-Run Validation ──► Human Sign-Off ──► Production Reconciled    |
|                 │                                                                                     |
|                 ▼                                                                                     |
|  [ Role-Specific Training ] ─────► Doctors, Nurses, Admin, Pharmacy (>= 80% Certification Gate)       |
|                 │                                                                                     |
|                 ▼                                                                                     |
|  [ UAT Management ]        ──────► 16 Operational Domains (0 Critical Defects Gate)                   |
|                 │                                                                                     |
|                 ▼                                                                                     |
|  [ Go-Live Readiness ]     ──────► 14 Mandatory Readiness Gates                                        |
|                 │                                                                                     |
|                 ▼                                                                                     |
|  [ Dual Sign-Off Go-Live ] ──────► Hospital Admin + ASRTAVA Implementation Lead                        |
|                 │                                                                                     |
|                 ▼                                                                                     |
|  [ 30-Day Hypercare ]      ──────► SLA Ticket Management ──► Formal Handover to Standard Support       |
|                                                                                                       |
+-------------------------------------------------------------------------------------------------------+
```

---

## 2. Customer Organization Registry

Every onboarded customer organization is recorded with multi-tier contact profiles, legal credentials, and commercial scoping:

```sql
CREATE TABLE customer_organizations (
    id VARCHAR(64) PRIMARY KEY,
    customer_code VARCHAR(32) UNIQUE NOT NULL,
    legal_name VARCHAR(255) NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    registration_number VARCHAR(100),
    category VARCHAR(50) NOT NULL, -- single_specialty, multi_specialty, clinic_chain, tertiary_teaching, government
    authorized_branches_count INT DEFAULT 1,
    authorized_contact_name VARCHAR(150) NOT NULL,
    authorized_contact_email VARCHAR(150) NOT NULL,
    authorized_contact_phone VARCHAR(30) NOT NULL,
    technical_contact_name VARCHAR(150),
    technical_contact_email VARCHAR(150),
    commercial_contact_name VARCHAR(150),
    commercial_contact_email VARCHAR(150),
    country VARCHAR(100) DEFAULT 'India',
    state VARCHAR(100),
    city VARCHAR(100),
    pincode VARCHAR(20),
    implementation_priority VARCHAR(20) DEFAULT 'medium', -- low, medium, high, critical
    target_go_live_date DATE,
    license_id VARCHAR(64),
    implementation_owner_user_id VARCHAR(64),
    status VARCHAR(50) DEFAULT 'onboarding_initiated',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Multi-Contact Roles
1. **Authorized Signatory / Executive Sponsor**: Medical Director, CEO, or Managing Trustee holding legal authority to execute commercial contracts and sign the final production go-live authorization.
2. **Technical Implementation Lead (CTO / IT Director)**: Hospital technical authority responsible for network topology, server provisioning, PACS/LIS interfacing, and data migration sign-off.
3. **Commercial & Financial Lead (CFO / Finance Controller)**: Responsible for perpetual license contract compliance, CGHS/ECHS/TPA tariff verification, and billing reconciliation.
4. **ASRTAVA Implementation Lead**: Antigravity technical account manager assigned to manage the 18-stage lifecycle and co-sign the go-live certificate.

---

## 3. Commercial Verification & Perpetual License Binding

Unlike subscription-based SaaS applications where features terminate on billing renewal lapse, ASRTAVA enforces perpetual software rights:
- **Offline License Token**: The license token contains signed RSA/Ed25519 cryptographic claims detailing licensed modules, bed tier, and AMC expiration dates.
- **Air-Gapped Validation**: Local on-premises nodes validate license parameters offline via `OfflineLicenseAdapter` without requiring internet egress.
- **Uncapped Operation**: Core clinical capabilities, OPD consultations, IPD bed management, and emergency care continue without operational interruption even if optional AMC support lapses.

---

## 4. Multi-Tenant Isolation & Least-Privilege Implementation Access

Implementation engineers and data migration specialists require access to configure tariffs, department rosters, and bed matrices. However, patient clinical privacy must never be compromised:
- **No Direct Clinical Snooping**: Implementation personnel cannot view raw clinical consultation SOAP notes, diagnoses, or lab results.
- **Time-Bound Just-In-Time (JIT) Audit Tokens**: Any temporary troubleshooting access required by engineering requires explicit Hospital Admin approval with strict duration limits (e.g., 30 to 120 minutes) and automated session termination.
- **DPDP Act 2023 Masking**: Patient Aadhaar numbers, phone numbers, and identifying demographic fields are automatically masked during dry-run data migration previewing and synchronization telemetry.

