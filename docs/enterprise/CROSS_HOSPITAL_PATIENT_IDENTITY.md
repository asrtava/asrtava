# ASRTAVA Enterprise Master Patient Index (EMPI) & Identity Matching

## 1. Executive Summary

When a patient visits multiple hospitals or satellite clinics within a healthcare group, creating disconnected local records risks duplicate test ordering, contradictory prescription regimens, and fragmented clinical history.

ASRTAVA implements a privacy-preserving **Enterprise Master Patient Index (EMPI)** that matches and links patient identities across group facilities while strictly preserving local patient numbers and medical data ownership.

---

## 2. Master Patient Index (EMPI) Data Architecture

```
[ Group Master Patient Index (EMPI) ] 
       │ (e.g., EMPI-2026-9021 · Ramesh Gupta · Hashed Aadhaar)
       ├─────────────────────────────────┬─────────────────────────────────┐
       ▼                                 ▼                                 ▼
[ Local Record @ Hospital Delhi ] [ Local Record @ Hospital Bengaluru ] [ Local Record @ Clinic Whitefield ]
  (UHID: UHID-DEL-000101)           (UHID: UHID-BLR-000502)               (UHID: UHID-WF-00984)
```

### Table Definitions
1. `enterprise_patient_identities`: Contains the group-wide master index, SHA-256 hashed national identification (Aadhaar / National ID), primary phone number, and verified demographics.
2. `patient_identity_links`: Records the 1-to-many relationship linking local hospital patient records (`patients.id`) to the master index with match confidence scores (`exact_match`, `verified_by_staff`, `probabilistic`) and patient consent timestamps.

---

## 3. Multi-Factor Identity Matching Algorithm

When a patient presents at any facility, the system computes match scoring:
- **Rule 1 (Cryptographic Match)**: Exact match on `national_id_hash` (Aadhaar or Passport SHA-256 hash). If matched, automatically links with `link_confidence = 'exact_match'`.
- **Rule 2 (Demographic Composite Match)**: Exact match on `primary_phone` AND normalized `firstName` AND `lastName`. Links with `exact_match`.
- **Rule 3 (Probabilistic Match)**: Matches phone and date of birth, but minor name discrepancy (e.g., "Ramesh Gupta" vs "Ramesh K. Gupta"). Flags for authorized front-desk staff manual review (`verified_by_staff`).
- **Rule 4 (No Match)**: Automatically provisions a new Master Patient Index (`EMPI-YYYY-XXXXX`) and creates the initial link.

---

## 4. DPDP Act 2023 Compliance & Consent Architecture

- **No Plaintext National IDs**: Aadhaar and national IDs are never stored in plaintext within cross-hospital lookup indexes; only one-way cryptographic SHA-256 hashes are queried.
- **Explicit Patient Consent**: Cross-hospital clinical lookup requires active patient consent (`consent_granted = true`). If a patient opts out, their historical clinical records remain isolated to the originating facility.

