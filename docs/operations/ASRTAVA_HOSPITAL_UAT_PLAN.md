# ASRTAVA Hospital User Acceptance Testing (UAT) Plan & Execution Protocol

**Document Reference:** `docs/operations/ASRTAVA_HOSPITAL_UAT_PLAN.md`  
**Target Audience:** Hospital Clinical Leads, Department Heads, Hospital IT Director, Quality Committee  
**Data Policy:** Strictly Synthetic Data / Designated Sandbox Hospital Tenant (`HOSP-UAT-SANDBOX-01`)  
**Status:** **UAT PROTOCOL PREPARED — AWAITING HOSPITAL CLINICAL PARTICIPATION & SIGN-OFF**

---

## 1. Executive Summary & UAT Governance

User Acceptance Testing (UAT) represents the decisive bridge between engineering verification and clinical deployment. While ASRTAVA's automated test suite has proven algorithmic compliance across 505 assertions, **formal clinical and operational acceptance requires hands-on execution by actual hospital personnel**.

### UAT Rules of Engagement
1. **Zero Real Patient Data:** All test cases must use synthetic patient demographics, synthetic phone numbers, and mock clinical records.
2. **Multi-Cadre Participation:** Testing must be conducted by actual practicing doctors, nurses, pharmacists, lab technicians, and accountants, not simulated solely by IT analysts.
3. **Formal Sign-Off Gate:** Every domain test script requires a dual signature from the Department Head and the Hospital IT Director before production go-live authorization.

---

## 2. Departmental UAT Test Scripts (20 Domains)

### Domain 01: Reception & Registration
- **Actor:** Front Desk Receptionist
- **Preconditions:** Terminal authenticated with receptionist credentials.
- **Test Scenario:** Register a walk-in patient with name, age, phone number, and gender. Validate OTP consent.
- **Expected Result:** System generates a permanent, unique 12-digit UHID (`UHID-2026-XXXXXX`) and issues an OPD token.
- **Automated Verification:** Verified in `tests/e2e_workflows.test.ts` (Step 1).
- **Hospital Acceptance Criteria:** Barcoded patient wristband prints with readable UHID and emergency contact.
- **Failure Severity:** P0 (Operational Blocker).
- **Sign-Off Required:** Head of Front Desk Operations.

### Domain 02: OPD Appointments & Anti-Collision Scheduling
- **Actor:** Receptionist / Patient
- **Preconditions:** Doctor OPD schedule configured for Monday 09:00 - 13:00 with 15-minute slots.
- **Test Scenario:** Book appointment for Patient A at 09:15. Attempt concurrent booking for Patient B for the exact same slot.
- **Expected Result:** Patient A booking succeeds. Patient B booking is blocked with `409 Conflict: Slot already occupied`.
- **Automated Verification:** Verified in `tests/e2e_workflows.test.ts` (Step 2).
- **Hospital Acceptance Criteria:** Queue board updates dynamically without slot duplication.
- **Failure Severity:** P1 (High Friction).
- **Sign-Off Required:** Outpatient Operations Manager.

### Domain 03: Doctor Consultation & Structured SOAP Documentation
- **Actor:** Consultant Physician
- **Preconditions:** Patient checked in and waiting in OPD queue.
- **Test Scenario:** Open patient consultation, enter Chief Complaints, Vitals, ICD-10 diagnosis (`I10 Essential Hypertension`), and e-prescribe medication.
- **Expected Result:** Structured SOAP encounter is committed. eRx is digitally signed and routed to pharmacy queue.
- **Automated Verification:** Verified in `tests/e2e_workflows.test.ts` (Step 4).
- **Hospital Acceptance Criteria:** Signed clinical note is locked against editing; amendments append versioned audit record.
- **Failure Severity:** P0 (Clinical Documentation Mandate).
- **Sign-Off Required:** Chief of Medicine.

### Domain 04: Clinical Decision Support (CDS) & Medication Safety
- **Actor:** Doctor
- **Preconditions:** Patient chart notes documented allergy to Penicillin.
- **Test Scenario:** Doctor attempts to prescribe Amoxicillin 500mg.
- **Expected Result:** High-severity clinical warning popup fires: `ALLERGY CONTRAINDICATION: Patient allergic to Penicillin group`. Requires mandatory written override reason to proceed.
- **Automated Verification:** Verified in `tests/advanced_pharmacy_management.test.ts` (Scenario 1).
- **Hospital Acceptance Criteria:** Unjustified contraindicated prescription blocked; override reason permanently audited.
- **Failure Severity:** P0 (Patient Safety Critical).
- **Sign-Off Required:** Clinical Pharmacology Lead.

### Domain 05: Inpatient (IPD) Admission & Bed Allocation
- **Actor:** IPD Admission Clerk / Ward Sister
- **Preconditions:** Doctor marks OPD encounter "Admit to IPD".
- **Test Scenario:** Select Female Medical Ward, allocate Bed 102.
- **Expected Result:** Bed 102 transitions from `available` to `occupied`. IPD number generated (`IPD-2026-XXXXX`).
- **Automated Verification:** Verified in `tests/e2e_workflows.test.ts` (Step 5).
- **Hospital Acceptance Criteria:** Bed census matrix updates across all nursing terminals in real time.
- **Failure Severity:** P0 (Inpatient Flow Blocker).
- **Sign-Off Required:** Nursing Superintendent.

### Domain 06: Nursing Vitals & NEWS2 Deterioration Score
- **Actor:** Staff Nurse
- **Preconditions:** Patient admitted in ward.
- **Test Scenario:** Record vitals: Heart Rate 115, Systolic BP 85, SpO2 91%, Temp 38.5°C.
- **Expected Result:** System computes National Early Warning Score (NEWS2) = 8 (High Risk) and triggers rapid escalation alert to Medical Registrar.
- **Automated Verification:** Verified in `tests/advanced_nursing_management.test.ts` (Scenario 2).
- **Hospital Acceptance Criteria:** Visual red banner appears on Ward Dashboard and alert notifications dispatch.
- **Failure Severity:** P0 (Life-Safety Early Warning).
- **Sign-Off Required:** Inpatient Nursing Supervisor.

### Domain 07: Five-Rights eMAR & Dual-Nurse Narcotic Cosign
- **Actor:** Staff Nurse A & Staff Nurse B
- **Preconditions:** Active doctor order for IV Morphine 5mg.
- **Test Scenario:** Nurse A attempts to chart administration alone. Then Nurse A and Nurse B provide dual authentication.
- **Expected Result:** Single-nurse administration is rejected (`DUAL_COSIGN_REQUIRED`). Dual authentication succeeds and updates eMAR ledger.
- **Automated Verification:** Verified in `tests/advanced_nursing_management.test.ts` (Scenario 9, 10).
- **Hospital Acceptance Criteria:** Self-cosign is strictly blocked (`administeringNurseId !== cosigningNurseId`).
- **Failure Severity:** P0 (Statutory Narcotic Regulations).
- **Sign-Off Required:** Nursing Superintendent & Chief Pharmacist.

### Domain 08: Pharmacy FEFO Dispensing & Batch Tracking
- **Actor:** Hospital Pharmacist
- **Preconditions:** Drug Paracetamol has Batch A (expiring 30 days) and Batch B (expiring 180 days).
- **Test Scenario:** Dispense 10 strips of Paracetamol.
- **Expected Result:** Allocation engine automatically deducts stock from Batch A (First-Expiry-First-Out).
- **Automated Verification:** Verified in `tests/hospital_workflows.test.ts` (Scenario 4).
- **Hospital Acceptance Criteria:** Batch number and expiry date print accurately on patient drug label.
- **Failure Severity:** P1 (Stock Safety & Quality).
- **Sign-Off Required:** Chief Pharmacist.

### Domain 09: Laboratory LIS Barcoding & Westgard QC
- **Actor:** Lab Technician / Pathologist
- **Preconditions:** Blood specimen collected in EDTA tube.
- **Test Scenario:** Scan barcode, run automated complete blood count (CBC), enter values with abnormal Hemoglobin (6.2 g/dL), trigger Westgard QC check.
- **Expected Result:** System flags critical panic value (`Hb < 7.0 g/dL`) and dispatches immediate broadcast to ward doctor.
- **Automated Verification:** Verified in `tests/advanced_lis_management.test.ts` (Scenario 4, 14).
- **Hospital Acceptance Criteria:** Pathologist electronic signature stamps the finalized report.
- **Failure Severity:** P0 (Critical Diagnostic Alert).
- **Sign-Off Required:** Laboratory Director.

### Domain 10: Radiology RIS & Web PACS Viewing
- **Actor:** Radiologist
- **Preconditions:** Chest X-ray study acquired from CR/DR modality.
- **Test Scenario:** Open DICOM viewer, apply Lung Window preset, measure cardiothoracic ratio, draft and sign RadLex report.
- **Expected Result:** Viewer renders full-fidelity DICOM series. Signed report is locked and released to doctor EMR.
- **Automated Verification:** Verified in `tests/advanced_ris_pacs_management.test.ts` (Scenario 9-12).
- **Hospital Acceptance Criteria:** Image windowing and zoom operate smoothly in web browser without client plugin.
- **Failure Severity:** P1 (Diagnostic Imaging Quality).
- **Sign-Off Required:** Head of Radiology.

### Domain 11: Operation Theatre Anti-Collision & WHO Checklist
- **Actor:** Surgeon / OT Scrub Nurse
- **Preconditions:** Elective cholecystectomy scheduled.
- **Test Scenario:** Complete Sign-In (before anaesthesia), Time-Out (before incision), and Sign-Out (before closure). Count surgical sponges.
- **Expected Result:** Sequence enforces completion of Sign-In before Time-Out is unlocked. Discrepancy in closing sponge count raises high alert.
- **Automated Verification:** Verified in `tests/advanced_ot_management.test.ts` (Scenario 9-15).
- **Hospital Acceptance Criteria:** Surgical team dual-signs checklist before transferring patient to PACU.
- **Failure Severity:** P0 (Surgical Safety Standard).
- **Sign-Off Required:** Head of Surgery & Lead Anaesthesiologist.

### Domain 12: Emergency Triage & Code Red Trauma Rapid Intake
- **Actor:** ED Triage Officer
- **Preconditions:** Unconscious polytrauma arrival via 108 Ambulance.
- **Test Scenario:** Generate Temporary Emergency UHID (`TEMP-UHID-ED-*`), classify as ESI Level 1 (Resuscitation), activate Code Red broadcast, bypass cashier for STAT blood products.
- **Expected Result:** Emergency record created in < 15 seconds; trauma team alerted; blood bank prepares O-negative blood without payment hold.
- **Automated Verification:** Verified in `tests/advanced_emergency_management.test.ts` (Scenario 1-4).
- **Hospital Acceptance Criteria:** Medico-Legal Case (MLC) police intimation report generated.
- **Failure Severity:** P0 (Trauma Survival Critical).
- **Sign-Off Required:** Emergency Department In-Charge.

### Domain 13: Ward Bed Turnover & Terminal Sanitization Inspection
- **Actor:** Housekeeper & Housekeeping Supervisor
- **Preconditions:** Patient discharged; bed status moves to `cleaning_required`.
- **Test Scenario:** Housekeeper completes chemical sanitization. Attempt bed allocation prior to supervisor inspection.
- **Expected Result:** System blocks admission allocation until Housekeeping Supervisor submits approved inspection check.
- **Automated Verification:** Verified in `tests/advanced_ward_bed_management.test.ts` (Scenario 9-14).
- **Hospital Acceptance Criteria:** Bed transitions to `available` only after supervisor quality sign-off.
- **Failure Severity:** P1 (Infection Control Standard).
- **Sign-Off Required:** Hospital Infection Control Officer (HICO).

### Domain 14: Billing, Insurance Pre-Auth & Double-Entry Accounting
- **Actor:** Inpatient Billing Executive / Finance Head
- **Preconditions:** Admitted patient ready for discharge with doctor summary finalized.
- **Test Scenario:** Generate itemized IPD bill, calculate healthcare-exempt SAC 999312 GST, record payment (Cash + UPI), and post double-entry Journal Voucher to General Ledger.
- **Expected Result:** Invoice generated with zero arithmetic rounding drift. General Ledger balances: $\sum \text{Debit} == \sum \text{Credit}$.
- **Automated Verification:** Verified in `tests/enterprise_rcm_financial_accounting.test.ts` (Scenario 7, 12).
- **Hospital Acceptance Criteria:** Detailed billing receipt prints with GSTIN, tariff codes, and refund approval PIN control.
- **Failure Severity:** P0 (Financial Audit Compliance).
- **Sign-Off Required:** Chief Financial Officer (CFO).

### Domain 15: HRMS Biometric Attendance & Payroll
- **Actor:** HR Manager
- **Preconditions:** Clinical staff punch in via biometric terminal.
- **Test Scenario:** Ingest biometric punches, detect double punches within 2-minute deduplication window, process monthly payroll with PF, PT, and TDS deductions.
- **Expected Result:** Deduplication ignores rapid double punch. Net pay computed accurately and posted to General Ledger.
- **Automated Verification:** Verified in `tests/advanced_hrms_workforce_management.test.ts` (Scenario 9, 16).
- **Hospital Acceptance Criteria:** Employee payslip generated with statutory Indian tax breakdown.
- **Failure Severity:** P2 (Administrative Workflow).
- **Sign-Off Required:** Head of Human Resources.

### Domain 16: Procurement, 3-Way Matching & Biomedical Assets
- **Actor:** Materials Manager / Biomedical Engineer
- **Preconditions:** Purchase Order issued to vendor.
- **Test Scenario:** Receive shipment at dock (GRN), quarantine pending inspection, verify 3-way match ($\text{PO} == \text{GRN} == \text{Invoice}$), and log breakdown ticket for ICU ventilator.
- **Expected Result:** Uninspected goods quarantined from active stock; 3-way match within ₹0.05 tolerance posts Accounts Payable JV; ventilator marked `UNDER_REPAIR`.
- **Automated Verification:** Verified in `tests/advanced_procurement_inventory_management.test.ts` (Scenario 10, 15, 16).
- **Hospital Acceptance Criteria:** Repaired ventilator returns to active service only after biomedical safety certification.
- **Failure Severity:** P1 (Supply Chain & Equipment Safety).
- **Sign-Off Required:** Materials Manager & Lead Biomedical Engineer.

### Domain 17: Patient Portal (Web)
- **Actor:** Patient
- **Preconditions:** Patient registered with active phone number.
- **Test Scenario:** Log into Patient Portal (`/login/patient`), review past doctor prescriptions, view lab reports, download tax invoice.
- **Expected Result:** Patient sees only their personal records; attempts to access staff workspaces or other patient records are blocked.
- **Automated Verification:** Verified in `tests/tenant_isolation_matrix.test.ts` (Scenario 17).
- **Hospital Acceptance Criteria:** Diagnostic reports download in PDF format with doctor digital signature stamp.
- **Failure Severity:** P1 (Patient Experience & Privacy).
- **Sign-Off Required:** Patient Experience Director.

### Domain 18: Patient Mobile Application
- **Actor:** Patient on Android / iOS device
- **Preconditions:** App installed on mobile device.
- **Test Scenario:** Authenticate via Indian phone OTP, schedule OPD appointment, generate QR pass for reception check-in.
- **Expected Result:** App authenticates, displays appointment pass with QR code, and sends push confirmation.
- **Automated Verification:** Verified in `tests/patient_mobile.test.ts` (Scenario 1, 3).
- **Hospital Acceptance Criteria:** Reception scanner reads mobile QR pass and updates queue in < 2 seconds.
- **Failure Severity:** P2 (Mobile Channel Quality).
- **Sign-Off Required:** Digital Health Lead.

### Domain 19: Hospital Admin Control Center
- **Actor:** Hospital Administrator
- **Preconditions:** Authenticated as Hospital Admin.
- **Test Scenario:** Onboard new staff nurse, assign `nursing` role, configure explicit DENY override on financial billing, deactivate resigned employee.
- **Expected Result:** Staff nurse cannot access billing workspace (`HTTP 403`). Resigned employee account locked out instantly.
- **Automated Verification:** Verified in `tests/hospital_admin_control.test.ts` (Scenario 1-19).
- **Hospital Acceptance Criteria:** All access changes recorded in tamper-evident administrative audit log.
- **Failure Severity:** P0 (Security & Access Governance).
- **Sign-Off Required:** Medical Superintendent & Hospital Director.

### Domain 20: Healthcare Coordination Network
- **Actor:** Transplant Coordinator / Emergency Officer
- **Preconditions:** Hospital participating in regional coordination network.
- **Test Scenario:** Initiate emergency inter-hospital transfer with minimum clinical payload and temporary transit identifier (`UHID-TRANSIT-*`).
- **Expected Result:** Receiving hospital receives transit payload without gaining access to donor hospital's master patient directory.
- **Automated Verification:** Verified in `tests/federated_hospital_coordination.test.ts` (Scenario 1, 5).
- **Hospital Acceptance Criteria:** Immutable SHA-256 audit record written for cross-hospital transaction.
- **Failure Severity:** P1 (Interoperability Governance).
- **Sign-Off Required:** Hospital Chief Medical Officer.

---

## 3. Hospital UAT Sign-Off Certificate Template

```
================================================================================
                    ASRTAVA HOSPITAL UAT SIGN-OFF CERTIFICATE
================================================================================
Hospital Name:       _____________________________________________________________
Hospital Tenant ID:  _____________________________________________________________
Testing Window:      From: _______________  To: _______________
Sandbox Environment: HOSP-UAT-SANDBOX-01 (Isolated Test Instance)

I, the undersigned Hospital IT Director and Chief Medical Officer, hereby certify:
1. All 20 clinical and operational test scripts were executed using synthetic data.
2. Hospital staff from all representative cadres participated in hands-on testing.
3. No critical P0 patient-safety or security defects remain unresolved.
4. The system is formally accepted for Phase 3 Production Pilot Deployment.

Signed by:

_________________________________________          _________________________________________
Hospital IT Director / Date                        Medical Director / CMO / Date

_________________________________________          _________________________________________
Chief Financial Officer / Date                     Nursing Superintendent / Date
================================================================================
```
