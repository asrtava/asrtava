# ASRTAVA Advanced Nursing Test Plan & Verification Strategy

**Target Milestone:** Phase XIII — Advanced Nursing Management, Patient Monitoring & eMAR  
**Execution Authority:** ASRTAVA Lead Clinical QA Engineer  
**Scope:** Automated testing covering nurse assignment, workload acuity, NEWS2 early warning scoring, alert triggers, Braden pressure ulcer assessment, Morse fall scale, eMAR Five Rights, High-Alert dual-nurse cosign, doctor orders, care plans, fluid balance, wound staging, SBAR handover handshake.

---

## 1. Test Matrix & Coverage Targets

| Test ID | Test Scenario | Subsystem Tested | Verification Method | Target Status |
| :---: | :--- | :--- | :--- | :---: |
| **TC-NUR-01** | Nurse patient assignment & workload calculation | `NursingAssignmentService` | Automated integration test | **PASS** |
| **TC-NUR-02** | Reassignment with documented clinical reason | `NursingAssignmentService` | Automated integration test | **PASS** |
| **TC-NUR-03** | NEWS2 normal physiological baseline ($Score = 0$) | `PatientMonitoringService` | Unit & algorithm test | **PASS** |
| **TC-NUR-04** | NEWS2 critical deterioration ($Score \ge 7$, Alert) | `PatientMonitoringService` | Integration & alert test | **PASS** |
| **TC-NUR-05** | Clinical observation alert acknowledgement | `PatientMonitoringService` | Workflow state machine | **PASS** |
| **TC-NUR-06** | Braden scale pressure injury risk & interventions | `NursingAssessmentService` | Validated protocol test | **PASS** |
| **TC-NUR-07** | Morse fall scale assessment ($\ge 45$ High Risk) | `NursingAssessmentService` | Validated protocol test | **PASS** |
| **TC-NUR-08** | Bedside eMAR standard medication administration | `BedsideEMARService` | Five Rights & time log | **PASS** |
| **TC-NUR-09** | Block single-nurse administration of High-Alert drugs | `BedsideEMARService` | Safety gate exception | **PASS** |
| **TC-NUR-10** | Rejection of self-cosigning on High-Alert drugs | `BedsideEMARService` | Dual-identity check | **PASS** |
| **TC-NUR-11** | Mandatory reason documentation for omitted/held dose | `BedsideEMARService` | Compliance gate check | **PASS** |
| **TC-NUR-12** | Doctor order review, acknowledgement & execution | `DoctorOrderCarePlanService` | Order lifecycle test | **PASS** |
| **TC-NUR-13** | Nursing care plan establishment & interventions | `DoctorOrderCarePlanService` | Care plan lifecycle | **PASS** |
| **TC-NUR-14** | Shift fluid balance calculation ($\text{Net} = \text{In} - \text{Out}$) | `FluidManagementService` | Math & unit verification | **PASS** |
| **TC-NUR-15** | Wound assessment, metric dimensions & dressing | `WoundCareService` | Staging & healing test | **PASS** |
| **TC-NUR-16** | SBAR handover submission & countersignature | `ShiftHandoverService` | Dual-sign handshake | **PASS** |

