# ASRTAVA End-to-End Inpatient Flow Map

## 1. Acute Inpatient Lifecycle Flowchart

```mermaid
flowchart TD
    A[OPD Clinic / Emergency / External Referral] --> B[Doctor Submits IPD Admission Request]
    B --> C{Bed Manager Review}
    C -->|Approved| D[Rule-Assisted Bed Selection & Reservation]
    C -->|Waitlisted| E[Admission Queue / Holding Area]
    D --> F[Patient Physical Arrival & Ward Intake]
    F --> G[Admission Formalized: Bed Status 'Occupied']
    G --> H[Initial Nursing Assessment & Doctor Workup]
    H --> I[Daily Ward Care: Rounds, eMAR, Vitals, Care Plans]
    I --> J{Need Higher/Lower Level of Care?}
    J -->|Yes: ICU Step-Up or Step-Down| K[Submit Bed Transfer Request]
    K --> L[Receiving Ward Accepts & Bed Allocated]
    L --> M[Old Bed Marked 'Cleaning Required']
    L --> I
    J -->|No: Treatment Progressing| N[Proactive Discharge Planning & Barrier Check]
    N --> O{Patient Clinically Ready?}
    O -->|Yes| P[Doctor Signs Clinical Discharge Summary]
    P --> Q[Medication Reconciliation & Discharge Counselling]
    Q --> R[Patient Departs Ward: Bed Status 'Cleaning Required']
    R --> S[Housekeeping Terminal / Isolation Sanitization]
    S --> T[Supervisor Inspection & Quality Sign-Off]
    T --> U[Bed Status Flips to 'Available' on Live Grid]
```

## 2. Invariant Rules
- **No Double-Booking**: Simultaneous active allocation or reservation of the same bed is prevented via database-level row locks (`FOR UPDATE`).
- **No Premature Availability**: A vacated bed cannot become `available` until housekeeping completes sanitization and supervisor logs inspection approval.
- **Financial Decoupling**: Clinical discharge summary and patient education are never gated by cashier payment clearance.

