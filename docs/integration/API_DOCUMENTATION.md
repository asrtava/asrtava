# ASRTAVA System-Wide API Catalog & Master Integration Index

## 1. Gateway Routing Architecture
All REST APIs are versioned under `/api/v1` and protected by JWT authentication, tenant isolation headers (`x-tenant-id`), and rate-limiting middleware.

## 2. Master Route Table

| Subsystem | Base Path | Key Capabilities |
| :--- | :--- | :--- |
| **Authentication** | `/api/v1/auth` | Login, TOTP MFA, refresh token rotation, workspace selection |
| **Super Admin** | `/api/v1/super-admin` | Platform multi-tenancy, hospital provisioning, subscription tiers |
| **Hospital Tenancy** | `/api/v1/hospitals` | Hospital master records, branch management, department catalog |
| **Permissions** | `/api/v1/permissions` | Centralized RBAC, user overrides, deny precedence |
| **Patients** | `/api/v1/patients` | UHID generation, DPDP consent, demographic records |
| **Appointments** | `/api/v1/appointments` | Doctor schedule anti-collision booking, queue tokens, check-in |
| **Clinical EMR** | `/api/v1/clinical` | SOAP documentation, ICD-10 diagnosis, versioned electronic prescriptions |
| **Inpatient (IPD)** | `/api/v1/inpatient` | 8-state bed lifecycle, visual grid, sanitization inspection |
| **Inpatient Advanced** | `/api/v1/inpatient/ward/advanced` | Transfers, barrier tracking, proactive discharge planning |
| **Pharmacy** | `/api/v1/pharmacy` | Drug catalog, stock management, dispensing |
| **Pharmacy Advanced** | `/api/v1/pharmacy/advanced` | Tall Man LASA, DDI alerts, eMAR dual-cosign, cold chain |
| **Diagnostics LIS** | `/api/v1/diagnostics/lis/advanced` | Accessioning, Westgard IQC, analyzer ASTM/HL7 bridge |
| **Diagnostics RIS** | `/api/v1/diagnostics/ris/advanced` | Modality MWL, eGFR renal screening, DICOM PACS indexing |
| **Billing & RCM** | `/api/v1/billing` & `/api/v1/rcm` | Itemized tariffs, GST, double-entry GL, 4-bucket AR aging |
| **HRMS & Payroll** | `/api/v1/hr/advanced` | Biometric punch deduplication, shift collisions, Indian payroll |
| **Operation Theatre**| `/api/v1/ot/advanced` | Triple conflict check, WHO checklist, PAC Aldrete score |
| **Emergency** | `/api/v1/emergency/advanced` | ESI 5-level triage, Code Red trauma, STAT billing override, 108 PCR |
| **Procurement** | `/api/v1/procurement/advanced` | 3-way matching, dock quarantine inspection, biomedical PM |
| **Telemedicine** | `/api/v1/telemedicine` | WebRTC session tokens, waiting room, RPM vitals logging |
| **Quality** | `/api/v1/quality` | Anonymous whistleblowing, 5-Whys RCA, closed-loop CAPA, HAI rates |
| **Analytics & BI** | `/api/v1/analytics/advanced` | Star Schema data mart, ALOS, BOR, LACE+ readmission scoring |
| **Interoperability** | `/api/v1/interop` | HL7 v2.5.1, FHIR R4, DICOM, ABDM, NHCX, DLQ |
| **Licensing** | `/api/v1/licensing` | Perpetual license verification, offline token claims, AMC tracking |

