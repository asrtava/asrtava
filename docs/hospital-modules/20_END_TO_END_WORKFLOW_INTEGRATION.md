# Module 20: End-to-End Business Workflow Integration Specification

## 1. Overview
ASRTAVA operates as a unified, cohesive healthcare ecosystem where clinical, diagnostic, inventory, and financial events flow seamlessly across departments without requiring manual data re-entry.

---

## 2. Integrated Clinical & Financial Workflows

### Workflow 1: Outpatient Journey (Appointment to Billing)
```
1. Reception Desk
   └─► Schedules consultation: `POST /api/v1/appointments`
         └─► Patient checks in: `PATCH /api/v1/appointments/:id/status` (checked_in)
               └─► Token assigned: Queue #14 generated

2. Triage Nursing
   └─► Logs vitals (BP, HR, SpO2, Temp, Sugar)

3. Doctor Consultation Workbench
   └─► Doctor reviews EMR & vitals: `GET /api/v1/patients/:id/360-profile`
         └─► Records SOAP notes & ICD-10 diagnosis
               ├─► Issues E-Prescription: `POST /api/v1/clinical/consultations`
               └─► Dispatches Lab Orders: `POST /api/v1/diagnostics/lab/orders`

4. Central Pharmacy
   └─► Rx appears on queue: `GET /api/v1/pharmacy/medicines`
         └─► Dispenses via FEFO deduction: `POST /api/v1/pharmacy/dispense`
               └─► Decrements inventory batch stock transactionally

5. Pathology Laboratory
   └─► Lab receives blood specimen: Barcode accessioned
         └─► Enters results & Pathologist signs off: `POST /api/v1/diagnostics/lab/order-items/:id/result`
               └─► Published to Patient Mobile Portal & EMR

6. Cashier & Finance
   └─► Consolidated invoice generated: `POST /api/v1/billing/invoices`
         └─► Payment collected (UPI / Card): `POST /api/v1/billing/payments`
               └─► Outstanding balance cleared; computerized receipt issued
```

---

### Workflow 2: Inpatient Journey (Admission to Discharge)
```
1. Inpatient Admission
   └─► Intake initiated: `POST /api/v1/inpatient/admissions`
         └─► Bed atomically locked (`FOR UPDATE`): Bed status -> `occupied`
               └─► IPD number issued: `ADM-XXXXX`

2. Ward Clinical Care & e-MAR
   └─► Daily doctor rounds: `POST /api/v1/inpatient/admissions/:id/rounds`
   └─► e-MAR dose administration: `POST /api/v1/nursing/medications/administer`
   └─► Fluid balance charting: `POST /api/v1/nursing/intake-output`

3. Patient Discharge & Automated Bed Sanitization
   └─► Physician signs discharge summary: `POST /api/v1/inpatient/admissions/:id/discharge`
         ├─► Admission status updated to `discharged`
         ├─► Bed status automatically transitions to `cleaning`
         └─► Final billing invoice generated & settled
```

---

## 3. Data Integrity & Concurrency Controls
1. **Pessimistic Concurrency**: Prevents double-booking doctors and prevents two patients from being assigned the same bed using `SELECT ... FOR UPDATE` row-level locks.
2. **Atomic Inventory Decrements**: Disallows negative pharmaceutical stock; dispensing commits only if stock is available across valid, unexpired batches.
3. **Immutable Auditing**: Finalized clinical notes, lab results, and paid invoices cannot be altered; all corrections require versioned amendments or credit notes.
4. **Idempotent Financial Settlement**: Duplicate webhook callbacks or repeated payment clicks with the same `idempotency_key` return the original receipt without double-charging.

