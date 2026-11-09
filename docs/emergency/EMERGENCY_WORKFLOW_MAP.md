# ASRTAVA Complete Emergency Patient Workflow Map

## 1. Acute Emergency Care Pathway

```mermaid
flowchart TD
    A[Emergency Arrival: Walk-in / Ambulance] --> B{Patient Known / Conscious?}
    B -->|Yes| C[Rapid Emergency Registration]
    B -->|No / John Doe| D[Issue Instant Emergency Temp UHID]
    C --> E[Immediate Triage Assessment ESI 1 - 5]
    D --> E
    E --> F{ESI Acuity Level}
    F -->|ESI Level 1 / Critical| G[Red Resuscitation Bay: Immediate Team Influx]
    F -->|ESI Level 2 / High Risk| H[Yellow Acute Care Bay: < 10 Min Assessment]
    F -->|ESI Level 3 / Multiple Resources| I[Yellow Urgent Care: Bed Observation]
    F -->|ESI Level 4 - 5 / Stable| J[Green Fast-Track Clinic]
    G --> K[ATLS ABCDE Resuscitation & Massive Transfusion]
    K --> L[STAT Diagnostic Imaging & Bloods with Clinical Override]
    H --> L
    L --> M{Emergency Disposition Decision}
    M -->|Emergency Surgery| N[Transfer to Emergency Operation Theatre]
    M -->|Critically Unstable| O[Transfer to Intensive Care Unit ICU]
    M -->|Stabilized for Admission| P[Inpatient Surgical / Medical Ward]
    M -->|Treated & Resolved| Q[Safe Discharge with Discharge Summary]
```

## 2. Emergency Operational Exemption
- All diagnostic orders (CT Angio, USG FAST, crossmatched PRBCs, IV inotropes) are flagged with `is_stat_override: true`, allowing instantaneous processing without cashier invoice payment verification.

