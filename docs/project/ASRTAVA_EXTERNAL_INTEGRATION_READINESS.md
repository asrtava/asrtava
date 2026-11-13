# ASRTAVA External Integration & Regulatory Compliance Readiness Report

**Document Reference:** `docs/project/ASRTAVA_EXTERNAL_INTEGRATION_READINESS.md`  
**Audit Date:** 2026-11-13  
**Classification Standard:** Seven Explicit Production Readiness Categories

---

## 1. Classification Categories & Standards

To ensure complete engineering transparency and prevent unverified claims:
1. **Implemented and locally tested:** Fully functional code with automated unit and integration tests passing locally without external network dependencies.
2. **Implemented with simulator or mock:** Complete protocol handlers and data mappers tested against a realistic local simulator or test stub.
3. **Implemented but awaiting credentials:** Integration logic is complete and tested, but live execution is awaiting production API keys, tokens, or endpoints.
4. **Awaiting external authorization or empanelment:** Awaiting formal regulatory review, government agency sandbox sign-off, or empanelment (e.g. NHA, NOTTO).
5. **Production-connected and independently verified:** Active connection to live external third-party production systems independently verified in production.
6. **Not implemented:** Not present in repository code.
7. **Requires legal, regulatory or human review:** Technical implementation exists, but formal statutory compliance requires certified human legal or clinical sign-off.

---

## 2. Comprehensive Inventory of 14 External Integrations & Standards

| # | Integration / Standard | Current Repository Status | Classification Category | Technical Implementation Location | Outstanding Dependency / Action Required |
| :---: | :--- | :--- | :--- | :--- | :--- |
| **1** | **ABDM / ABHA (M1, M2, M3)** | Architecture, schemas & simulators complete | **2. Implemented with simulator or mock** & **4. Awaiting external authorization** | `backend/src/modules/integrations/abdm.service.ts` | National Health Authority (NHA) Sandbox gateway credentials & formal empanelment sign-off. |
| **2** | **NHCX (National Health Claims Exchange)** | FHIR Claim & Pre-Auth payloads mapped | **2. Implemented with simulator or mock** | `backend/src/modules/rcm/nhcx.service.ts` | Insurance Information Bureau (IIB) / NHA NHCX live portal endpoint & insurer test keys. |
| **3** | **NOTTO / ROTTO / SOTTO (Organ Sharing)** | THOA statutory apnea certification & affidavits | **1. Implemented and locally tested** & **4. Awaiting external authorization** | `backend/src/modules/federated/` | State organ sharing registry webhook integration and nodal hospital authority empanelment. |
| **4** | **Meta WhatsApp Cloud API** | Template messaging & webhook handlers | **3. Implemented but awaiting credentials** | `backend/src/modules/notifications/whatsapp.service.ts` | Live Meta Business Manager App ID, System User Token (`WHATSAPP_TOKEN`), and approved templates. |
| **5** | **MSG91 & Twilio (SMS)** | HTTP client adapters & fallback failover | **3. Implemented but awaiting credentials** | `backend/src/modules/notifications/sms.service.ts` | Production API keys (`MSG91_AUTH_KEY`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`). |
| **6** | **Indian SMS DLT (Telecom Reg.)** | Template ID headers & message sanitation | **3. Implemented but awaiting credentials** | `backend/src/modules/notifications/sms.service.ts` | Telecom operator DLT Principal Entity ID (`DLT_PE_ID`), Header ID, and Template IDs (`DLT_TE_ID`). |
| **7** | **Razorpay & Stripe (Payments)** | Webhook idempotency, signatures & checkout | **3. Implemented but awaiting credentials** | `backend/src/modules/finance/payment.service.ts` | Production merchant KYC activation, live Key ID, Key Secret, and Webhook Signing Secret. |
| **8** | **HL7 v2.5.1 (ADT, ORU, ACK)** | MLLP client, parser, ACK generator | **1. Implemented and locally tested** | `backend/src/modules/integrations/hl7.service.ts` | On-premises MLLP port configuration (e.g. port 2575) and modality connection at hospital site. |
| **9** | **FHIR R4 (Resources)** | Patient, Encounter, Observation, DiagnosticReport | **1. Implemented and locally tested** | `backend/src/modules/integrations/fhir.service.ts` | Interoperability endpoints exposed at `/api/v1/fhir/r4`; awaiting hospital client certs. |
| **10** | **ASTM 1394-97 (LIS Analyzers)** | Serial/TCP analyzer frame decoding | **1. Implemented and locally tested** | `backend/src/modules/laboratory/astm.service.ts` | Physical RS-232 / TCP-to-Serial converter hardware configuration in hospital pathology lab. |
| **11** | **DICOM / PACS (WADO-RS, MWL)** | C-FIND MWL queries & PACS study indexer | **1. Implemented and locally tested** | `backend/src/modules/radiology/pacs.service.ts` | Hospital modality AE Title, IP, and DICOM Storage SCP (dcm4chee or Orthanc PACS) connectivity. |
| **12** | **WebRTC & Video Telehealth** | Signaling server, token generation, media state | **3. Implemented but awaiting credentials** | `backend/src/modules/telemedicine/webrtc.service.ts` | Production coturn / TURN cluster credentials for traversing symmetric enterprise hospital NAT firewalls. |
| **13** | **Digital Personal Data Protection (DPDP) Act 2023** | DSR workflows, Merkle audit, pseudonymization | **7. Requires legal, regulatory or human review** | `backend/src/modules/security/dpdp.service.ts` | Technical capabilities verified; formal statutory compliance review by qualified Indian legal counsel required. |
| **14** | **NABH (5th Edition Standards)** | 10-chapter compliance KPI & incident RCA | **7. Requires legal, regulatory or human review** | `backend/src/modules/quality/quality-advanced.service.ts` | Technical KPI and SOP workflows implemented; formal accreditation audit by NABH assessors required. |

---

## 3. Statutory Compliance Distinctions

### 3.1 DPDP Act 2023 vs. NMC RMP Regulations 2023
- **Right to Erasure vs. Mandatory Retention:**
  - The DPDP Act 2023 provides data principals with the Right to Erasure.
  - However, the National Medical Commission (NMC) Registered Medical Practitioner (RMP) Regulations 2023 mandate that medical records must be preserved for a **minimum statutory period of 3 years** (general outpatient/inpatient) and **10 years** for Medico-Legal Cases (MLC) and surgical procedures.
  - **Technical Enforcement:** In `backend/src/modules/security/dpdp.service.ts`, when an erasure request is received for clinical records subject to active retention, the system places a **Statutory Legal Hold**, masking contact details while preserving immutable medical charts until the statutory expiration date.
  - **Status:** Requires final legal review by the hospital's legal counsel prior to production go-live.

### 3.2 Medical Device Software & Telemedicine Guidelines 2020
- Under the Board of Governors (in supersession of Medical Council of India) Telemedicine Practice Guidelines 2020:
  - Prescriptions issued over telemedicine are restricted to List O (over-the-counter), List A (first-line renewals), and List B (add-on medications). Schedule X narcotics and psychotropic drugs are strictly prohibited.
  - In `backend/src/modules/telemedicine/telemedicine-advanced.service.ts`, the eRx engine validates against the banned Schedule X formulary.
  - **Status:** Implemented in code; operational sign-off by hospital Medical Superintendent required.

