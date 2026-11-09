# ASRTAVA — Hospital Quality Management & Patient Safety Architecture

## 1. High-Level Architecture
The ASRTAVA Quality & Patient Safety subsystem functions as the central clinical governance nervous system of the hospital. It ingests data from every operational department to monitor safety events, drive continuous quality improvement (CQI), and ensure compliance with healthcare accreditation bodies.

```
                      ┌────────────────────────────────────────┐
                      │    Quality & Safety Command Center     │
                      │  (Quality Dashboard & Executive KPIs)  │
                      └───────────────────┬────────────────────┘
                                          │
       ┌──────────────────┬───────────────┴───────────────┬──────────────────┐
       ▼                  ▼                               ▼                  ▼
┌──────────────┐   ┌──────────────┐                ┌──────────────┐   ┌──────────────┐
│  Incident &  │   │  Infection   │                │   Clinical   │   │ Accreditation│
│Adverse Events│   │ Control & HAI│                │   Audits &   │   │  & Evidence  │
│  Management  │   │ Surveillance │                │  Grievances  │   │  Repository  │
└──────┬───────┘   └──────┬───────┘                └──────┬───────┘   └──────┬───────┘
       │                  │                               │                  │
       ▼                  ▼                               ▼                  ▼
┌──────────────┐   ┌──────────────┐                ┌──────────────┐   ┌──────────────┐
│  Root Cause  │   │ Hand Hygiene │                │   Hospital   │   │ Policy & SOP │
│Analysis (RCA)│   │  & Cleaning  │                │Risk Register │   │   Document   │
│ & 5-Whys/Fish│   │    Audits    │                │ & Indicators │   │   Control    │
└──────┬───────┘   └──────┬───────┘                └──────┬───────┘   └──────┬───────┘
       │                  │                               │                  │
       └──────────────────┴───────────────┬───────────────┴──────────────────┘
                                          ▼
                      ┌────────────────────────────────────────┐
                      │     CAPA Closed-Loop Engine            │
                      │ (Corrective Action & Preventive Action)│
                      │   Assignment -> Verification -> Audit  │
                      └───────────────────┬────────────────────┘
                                          ▼
                      ┌────────────────────────────────────────┐
                      │       PostgreSQL Persistence Layer     │
                      │   (Multi-Tenant RLS & Cryptographic)   │
                      └────────────────────────────────────────┘
```

---

## 2. Core Subsystems

### 2.1. Incident & Adverse Event Lifecycle
- **Incident Types**: Patient falls, Medication errors, Diagnostic errors, Surgical near-misses, Equipment failures, Communication breakdowns, Staff injuries, Hospital-acquired infections.
- **Severity Grading**: Sentinel event, Serious adverse event, Minor adverse event, Near miss, Hazardous condition.
- **RCA Engine**: 5-Whys analysis, Fishbone / Ishikawa diagram (People, Machine, Material, Method, Environment).

### 2.2. Infection Prevention & Control (IPC) & HAI Surveillance
- Automated surveillance for Catheter-Associated UTI (CAUTI), Central Line-Associated Bloodstream Infection (CLABSI), Ventilator-Associated Pneumonia (VAP/VAE), and Surgical Site Infection (SSI).
- Denominator-based infection rate calculations per 1,000 device-days.
- Digital Hand Hygiene observation checklists (WHO 5 Moments of Hand Hygiene).

### 2.3. Closed-Loop Corrective & Preventive Actions (CAPA)
- Action item assignment with target completion date and designated owner.
- Mandatory effectiveness verification gate conducted after completion by an independent Quality Auditor before final closure.

### 2.4. Hospital Risk Register & Quality Indicators
- Inherent vs. Residual risk matrix scoring (Likelihood $1-5 \times$ Impact $1-5$).
- Standard healthcare KPIs (Fall rate per 1,000 patient-days, Medication error rate per 1,000 admissions, Hand hygiene compliance %, Readmission rate within 30 days).

### 2.5. Accreditation & Evidence Repository
- Configurable clause mapping against NABH (5th Edition), NABL (ISO 15189), and JCI.
- Controlled document workflows for Hospital Policies, SOPs, Clinical Guidelines, and Quality Manuals with version control and superseding archives.

