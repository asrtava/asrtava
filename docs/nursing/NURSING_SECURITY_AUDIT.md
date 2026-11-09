# ASRTAVA Advanced Nursing Security & Authorization Audit

## 1. Role-Based Access Control & Individual Overrides

Nursing endpoints enforce explicit capabilities with strict DENY > ALLOW precedence:

| Permission Identifier | Description | Default Roles Bound |
| :--- | :--- | :--- |
| `nursing.dashboard.view` | View ward census and assigned patients. | Registered Nurse, Ward Sister, Supervisor |
| `nursing.patient_assignment.view` | View nurse allocations and workload acuity. | Staff Nurse, Charge Nurse, Nursing Supervisor |
| `nursing.patient_assignment.manage` | Assign nurses to beds/wards and reassign patients. | Nursing Supervisor, Matron, Head of Nursing |
| `nursing.observations.record` | Document vital signs, consciousness, pain, and blood glucose. | Staff Nurse, ICU Nurse, Charge Nurse |
| `nursing.assessment.create` | Perform Braden, Morse, GCS, and MUST assessments. | Registered Nurse |
| `nursing.medication.administer` | Sign eMAR medication administration and dual cosign. | Licensed Registered Nurse |
| `nursing.orders.acknowledge` | Review and acknowledge doctor orders. | Registered Nurse |
| `nursing.care_plan.manage` | Create, update, and evaluate nursing care plans. | Staff Nurse, Clinical Nurse Specialist |
| `nursing.fluid_balance.manage` | Record hourly intake/output and calculate net balance. | Staff Nurse, ICU Nurse |
| `nursing.wound_care.manage` | Stage wounds, document dimensions, apply dressings. | Registered Nurse, Wound Ostomy Continence Nurse |
| `nursing.shift_handover.manage` | Submit and countersign SBAR shift handovers. | Outgoing Nurse, Incoming Nurse |
| `nursing.incident.create` | Report patient falls, medication errors, and safety events. | Any Clinical Staff |
| `nursing.incident.review` | Conduct Root Cause Analysis (RCA) and close incidents. | Nursing Quality Manager, Risk Officer |

---

## 2. Multi-Tenant Scope & Row-Level Security

- All 15 nursing tables in `025_advanced_nursing_management.sql` have PostgreSQL Row-Level Security (`ENABLE ROW LEVEL SECURITY`) activated.
- Queries are strictly scoped to the active tenant context (`SET LOCAL app.current_tenant_id = ?`).
- Scope-based ward filtering prevents cross-department snooping: nurses only see patients assigned to their active ward shift.

---

## 3. Immutability of Safety Incidents & Administration Records

- Medication administration entries cannot be deleted; corrections require controlled amendments.
- Safety incident logs (`patient_safety_incidents`) are flagged with `is_immutable = true`. Ordinary staff cannot delete or alter logged incident reports; only authorized QA officers can append investigation findings.

