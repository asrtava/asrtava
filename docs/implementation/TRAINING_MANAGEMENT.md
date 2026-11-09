# ASRTAVA Role-Specific Training & Certification Management

## 1. Overview

Effective hospital digital adoption requires verified role competence prior to cutover. The ASRTAVA Training Management System mandates that clinical and operational personnel complete structured role-specific training modules and pass an end-of-course evaluation with a score of &ge; 80% to earn certified status.

Passing the training gate is a mandatory prerequisite for Go-Live Checklist Gate #8 (`MANDATORY_TRAINING_CERTIFIED`).

---

## 2. Training Curriculum Matrix by Role

| Target Role | Module Curriculum Title | Core Topics Covered | Min Duration |
|---|---|---|---|
| **Doctor** | Clinical EMR, SOAP & CPOE Masterclass | Patient queue, SOAP documentation, ICD-10 coding, e-prescriptions, lab ordering, narcotics control | 8 Hours |
| **Nurse** | Inpatient Station & Medication Admin | Bed occupancy grid, vital signs recording, EWS alerts, MAR bedside administration, shift handoffs | 6 Hours |
| **Receptionist** | Front Office & Appointment Management | Patient registration, ABHA generation, OPD slot booking, token display, cash desk receipts | 4 Hours |
| **Pharmacist** | FEFO Pharmacy Dispensing & Inventory | Prescription validation, batch selection (FEFO), row locks, stock indents, supplier purchase orders | 4 Hours |
| **Lab Technologist** | Laboratory Diagnostics & LIMS | Specimen accessioning, barcode scanning, analyzer interfacing, reference ranges, critical alerts | 4 Hours |
| **Billing Executive** | Healthcare Billing, Invoicing & TPA | IPD discharge billing, CGHS/ECHS split tariff packages, TPA claim pre-auth, receipt idempotency | 6 Hours |
| **Hospital Admin** | Administrative Control Center | Department creation, bed configuration, staff RBAC, emergency failover, audit logs, backup monitoring | 8 Hours |

---

## 3. Assessment & Certification Protocol

1. **Practical Workflow Simulation**: Trainees execute end-to-end clinical cases in the ASRTAVA staging sandbox (e.g., admitting a simulated patient, placing orders, dispensing drugs, and discharging).
2. **Scoring Threshold**: A minimum score of **80%** is strictly enforced. Trainees scoring below 80% are scheduled for remedial coaching and re-assessment.
3. **Certification Audit Record**: When a user passes, the system issues an immutable training certificate record (`is_certified = true`, `assessment_score`, `certified_at`, `trainer_notes`).
4. **Go-Live Prerequisite Gate**: The go-live readiness evaluator checks that at least 90% of active clinical staff and 100% of administrators have achieved verified certification.

