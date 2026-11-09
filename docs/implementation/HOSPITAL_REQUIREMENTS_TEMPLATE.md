# ASRTAVA Hospital Requirements Gathering Template

## 1. Document Overview

This structured catalog is utilized during Stage 5 (`requirements_gathering`) to baseline, prioritize, and approve hospital-specific workflows, clinical protocols, billing rules, and diagnostic interfaces.

Every requirement is assigned a category, unique key, priority (`must_have`, `should_have`, `nice_to_have`), owner, and approval audit status.

---

## 2. Structured Domain Requirement Specifications

### 1. Clinical Workflows & EMR
| Req ID | Domain | Requirement Description | Priority | Compliance Baseline | Status |
|---|---|---|---|---|---|
| `REQ-CLN-001` | OPD Consultation | Support structured SOAP encounters, ICD-10 diagnostic search, and favorite prescription sets | Must Have | MCI / NMC Guidelines | Approved |
| `REQ-CLN-002` | Emergency Triage | 4-tier triage severity classification (Resuscitation, Emergent, Urgent, Non-Urgent) with 1-click bed allocation | Must Have | AIIMS Emergency Protocol | Approved |
| `REQ-CLN-003` | CPOE Orders | Direct computerized physician order entry for pharmacy, lab, and radiology from doctor portal | Must Have | NABH 5th Edition | Approved |
| `REQ-CLN-004` | OT Scheduling | Operation theatre booking, surgeon roster, anesthesia assessment, and surgical safety checklist | Must Have | WHO Surgical Checklist | Approved |

### 2. Inpatient Nursing & Bed Management
| Req ID | Domain | Requirement Description | Priority | Compliance Baseline | Status |
|---|---|---|---|---|---|
| `REQ-NUR-001` | Nursing Census | Real-time ward bed census, admission/discharge/transfer (ADT) and nurse station handoff notes | Must Have | NABH Nursing Standards | Approved |
| `REQ-NUR-002` | Vital Signs Charting | Real-time vital sign tracking with automated Early Warning Score (EWS) triggers for clinical deterioration | Must Have | Clinical Governance | Approved |
| `REQ-NUR-003` | Medication Admin | Medication Administration Record (eMAR) with bedside barcode verification | Should Have | Patient Safety Goal 3 | Approved |

### 3. Pharmacy & Inventory Control
| Req ID | Domain | Requirement Description | Priority | Compliance Baseline | Status |
|---|---|---|---|---|---|
| `REQ-PHM-001` | FEFO Dispensing | First-Expiry-First-Out dispensing logic with row-level stock locks preventing negative inventory | Must Have | Drugs & Cosmetics Act | Approved |
| `REQ-PHM-002` | Narcotics Control | Schedule X / H1 dual verification and restricted dispensing ledger | Must Have | NDPS Act | Approved |
| `REQ-PHM-003` | Reorder Triggers | Automated purchase indent generation when batch stock drops below safety reorder threshold | Should Have | Inventory Operations | Approved |

### 4. Billing, Insurance & Tariff Packages
| Req ID | Domain | Requirement Description | Priority | Compliance Baseline | Status |
|---|---|---|---|---|---|
| `REQ-BIL-001` | Tariff Splitting | Split-billing engine dividing invoices between cash copay, CGHS/ECHS, and private TPAs | Must Have | IRDAI Guidelines | Approved |
| `REQ-BIL-002` | Idempotency | Dual-click payment prevention using unique transaction reference tokens (`X-Idempotency-Key`) | Must Have | Financial Audit | Approved |
| `REQ-BIL-003` | GST Compliance | Dynamic HSN/SAC code mapping and GST calculation for non-exempt healthcare consumables | Must Have | GST Act 2017 | Approved |

### 5. Diagnostics & PACS / LIS Interfacing
| Req ID | Domain | Requirement Description | Priority | Compliance Baseline | Status |
|---|---|---|---|---|---|
| `REQ-LIMS-001` | Lab Analyzers | HL7 / ASTM unidirectional and bidirectional interfacing for hematology and biochemistry analyzers | Must Have | NABL 112 | Approved |
| `REQ-PACS-001` | DICOM Imaging | PACS DICOM Web viewer integration with modality worklist (MWL) bridging CT, MRI, and X-Ray | Must Have | DICOM 3.0 Standard | Approved |

