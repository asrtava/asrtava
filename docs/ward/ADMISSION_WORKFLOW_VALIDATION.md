# ASRTAVA — Inpatient Admission Workflow Validation

## 1. Overview
The IPD Admission workflow coordinates the journey from outpatient or emergency referral to ward placement, ensuring clinical prioritization, bed matching, consent verification, and auditability.

## 2. Inpatient Admission Lifecycle
```
[OPD / ED / Referral Doctor]
             |
             v
 [Admission Request Submitted]
   - Patient ID, Provisional Diagnosis, Urgency (ROUTINE / URGENT / EMERGENCY)
   - Preferred Bed / Room Type, Special Equipment Needs (Ventilator, Telemetry)
             |
             v
 [Bed Management Coordinator Triage]
   - Validate bed availability, clinical specialty match, and urgency
   - Set Status: APPROVED / WAITLISTED / REJECTED
             |
             v
 [Bed Reservation (Holding Window)]
   - Bed temporarily placed in RESERVED state with automatic expiry
             |
             v
 [Formal IPD Admission Execution]
   - Generate unique IPD Admission Number (IPD-YYYY-XXXXX)
   - Record Admitting Consultant, Primary Nurse, Attending Department
   - Flip Bed State to OCCUPIED
   - Emit Inpatient Admission Notification Event
             |
             v
 [Active Inpatient Episode Care & Monitoring]
```

## 3. Key Validation Rules
- **Decoupled Financial Hold**: Clinical emergency admissions cannot be blocked by payment clearance gates.
- **Identity Integrity**: All admission records retain immutable patient ID, admitting doctor ID, timestamp, and primary diagnosis.
- **Audit Logging**: Every transition (Request -> Triage -> Reservation -> Formal Admission) writes an audit event with actor ID and timestamp.

