# ASRTAVA User Acceptance Testing (UAT) Plan & Defect Management

## 1. Objective

User Acceptance Testing (UAT) validates that ASRTAVA fulfills all clinical, administrative, regulatory, and financial requirements in the hospital's staging environment prior to production cutover. Testing spans all 16 core hospital operational domains.

---

## 2. 16 Operational UAT Domains & Test Coverage

1. **Patient Registration & Front Office**: UHID allocation, demographics capture, duplicate check, ABHA integration.
2. **OPD Scheduling & Queue**: Slot booking, check-in, token display, doctor OPD queue.
3. **Doctor Consultation & EMR**: SOAP encounter documentation, ICD-10 diagnosis, e-prescription generation.
4. **Emergency Department & Triage**: 4-tier triage classification, zero-lockout emergency admission, resuscitation override.
5. **Inpatient Bed Management**: Ward census, bed allocation, intra-ward transfer, bed release for sanitization.
6. **Nursing Station Workflows**: Vital sign logging, Early Warning Score (EWS) alerts, MAR medication charting.
7. **Pharmacy & FEFO Dispensing**: Prescription receipt, First-Expiry-First-Out dispensing, row-level stock locks.
8. **Laboratory & Diagnostics**: Specimen collection, barcode label printing, analyzer test result validation.
9. **Radiology & DICOM Imaging**: Modality worklist, DICOM Web image viewing, radiologist report transcription.
10. **Operation Theatre & Surgery**: OT booking, surgeon allocation, surgical safety checklist, post-op notes.
11. **Billing & Invoicing**: Outpatient receipts, inpatient discharge invoice generation, itemized tariff rates.
12. **Insurance & TPA Claims**: CGHS/ECHS co-payment splitting, TPA pre-authorization, claim batch generation.
13. **Inventory & Procurement**: Safety stock alerts, purchase indents, vendor purchase orders, GRN verification.
14. **HR & Roster Management**: Doctor duty schedules, nursing shifts, attendance tracking, leave requests.
15. **Notifications & Communications**: In-app notifications, SMS appointment reminders, WhatsApp clinical alerts.
16. **Reporting, BI & Compliance Audit**: Daily census, bed occupancy rate, revenue breakdown, DPDP audit logs.

---

## 3. Defect Classification & Go-Live Blocking Policy

| Severity | Definition | Impact on Go-Live Gate |
|---|---|---|
| **Critical** | Prevents core clinical patient care, patient safety risk, financial loss, or security violation (e.g., incorrect drug dosage calculation, RLS tenant bleed, or tax miscalculation). | **STRICT BLOCKER**: Cannot advance to `go_live_readiness` or execute `production_go_live` until 0 open critical defects exist. |
| **Major** | Significant operational feature impaired, but manual or administrative workaround is documented (e.g., automated SMS delayed by 15 mins). | Requires documented workaround and Hospital Admin sign-off waiver. |
| **Minor / Cosmetic** | Minor UI alignment, label typo, or reporting aesthetic issue that does not affect data integrity or user operations. | Permitted into 30-day hypercare backlog. |

