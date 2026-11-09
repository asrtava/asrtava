# ASRTAVA — Housekeeping & Terminal Bed Sanitization Workflow Validation

## 1. Overview
Hospital-acquired infections (HAIs) are a primary patient safety risk. ASRTAVA enforces automated, auditable, and gated bed turnover workflows. A vacated bed can **never** be reallocated until terminal sanitization has been completed by environmental services and independently approved by a housekeeping supervisor.

## 2. Terminal Cleaning Lifecycle
```
[Bed Vacated (Transfer or Discharge)]
                 |
                 v
   [Bed Status -> CLEANING_REQUIRED]
   [Housekeeping Task Created: PENDING]
                 |
                 v
   [Housekeeping Staff Assigned]
   [Task Status -> IN_PROGRESS]
   [Bed Status -> CLEANING_IN_PROGRESS]
                 |
                 v
   [Terminal Cleaning Protocol Executed]
   - Mattress disinfection, bed rails, IV poles, nurse call button, floors.
   - High-grade disinfectant logged (e.g. Quat/Bleach solution, Hydrogen peroxide vapor).
   - Task Status -> COMPLETED
                 |
                 v
   [Supervisor Sanitization Inspection]
                 |
      +----------+----------+
      |                     |
  (Passed)               (Failed)
      v                     v
[Inspection APPROVED]   [Inspection REJECTED]
[Bed -> AVAILABLE]      [Bed -> CLEANING_REQUIRED]
[Ready for Patient]     [Rework Housekeeping Task Queued]
```

## 3. Two-Person Integrity
The cleaner performing the sanitization cannot self-certify the bed's clinical readiness. An authorized housekeeping supervisor or infection control nurse must conduct a physical/visual inspection and record their digital signature before the bed status flips to `AVAILABLE`.

