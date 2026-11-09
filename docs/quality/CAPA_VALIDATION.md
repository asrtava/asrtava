# Closed-Loop Corrective & Preventive Action (CAPA) Validation

## 1. Objective
Ensures that no quality non-conformance, sentinel event, or audit finding is marked resolved without independent verification of corrective effectiveness.

## 2. Mandatory State Machine
```
[ OPEN ]
   │
   ▼ Assign Actionee & Set Target Date
[ IN_PROGRESS ]
   │
   ▼ Actionee Completes Remediation & Submits Evidence
[ PENDING_VERIFICATION ]
   │
   ├───────────┬───────────────┐
   │           │               │
   ▼           ▼               ▼
[ REJECTED /  [ VERIFIED_     [ MONITORING /
  RE-OPEN ]     CLOSED ]        SUSTAINED ]
```

## 3. Separation of Concerns & Anti-Tamper Invariants
- The actionee or department head cannot transition an action from `PENDING_VERIFICATION` to `VERIFIED_CLOSED`.
- Transition requires `Quality Auditor` role credential.
- Auditor must record objective evidence of verification (e.g., retrospective 30-day re-audit, sample chart re-examination).
- If root cause reoccurs within 90 days, CAPA automatically flags recidivism and escalates to Hospital Quality Committee.

