# ASRTAVA Complete Laboratory Information System (LIS) Test Plan

**Milestone:** Phase XIV — Laboratory Information System, Pathology, Analyzer Integration & Quality Control  
**Test Framework:** Node.js native test runner via `ts-node`  
**Target Suite:** `backend/tests/advanced_lis_management.test.ts`  
**Execution Environment:** Modular Monolith Integration Harness  

---

## 1. Test Coverage Scope

| Test ID | Test Scenario | Subsystem Under Test | Expected Validation |
| :---: | :--- | :--- | :--- |
| **TC-LIS-01** | Register laboratory department | `lis_departments` | Active department record with room binding |
| **TC-LIS-02** | Register test parameter with ranges | `lis_test_parameters` | Dynamic age/sex reference limits & panic thresholds |
| **TC-LIS-03** | Specimen accessioning & 2D barcode | `lis_specimens` | Unique accession number and container assignment |
| **TC-LIS-04** | Specimen rejection & recollection ticket | `lis_specimen_rejections` | Rejection reason, status update & recollection order |
| **TC-LIS-05** | Normal result entry within reference limits | `lis_test_results` | Abnormality flag = NORMAL, validation status = ENTERED |
| **TC-LIS-06** | Abnormal high result detection | `lis_test_results` | Abnormality flag = ABNORMAL_HIGH |
| **TC-LIS-07** | Critical panic value detection & alert | `lis_critical_alerts` | Panic flag and urgent telephone read-back ticket |
| **TC-LIS-08** | Technologist technical validation gate | `lis_test_results` | Status = TECHNICALLY_VALIDATED |
| **TC-LIS-09** | Pathologist medical authorization gate | `lis_test_results` | Status = PATHOLOGIST_AUTHORIZED with digital signature |
| **TC-LIS-10** | Controlled amendment of authorized result | `lis_test_results` | Status = AMENDED, reason documented, full audit preserved |
| **TC-LIS-11** | Microbiology culture & colony count | `lis_microbiology_cultures`| Bacterial growth, colony counts, gram stain |
| **TC-LIS-12** | Histopathology grossing & diagnosis | `lis_histopathology_cases` | Biopsy number, grossing cassettes, microscopic diagnosis |
| **TC-LIS-13** | In-control IQC run ($|Z| \le 1.0$) | `lis_qc_measurements` | Status = IN_CONTROL, no Westgard violation |
| **TC-LIS-14** | Westgard $1_{3s}$ out-of-control rejection | `lis_qc_measurements` | Status = OUT_OF_CONTROL_REJECT, violation = 1_3S |
| **TC-LIS-15** | Westgard $1_{2s}$ warning rule | `lis_qc_measurements` | Status = WARNING, violation = 1_2S |
| **TC-LIS-16** | Multi-hospital tenant isolation | Multi-Tenant Kernel | Strict separation of test catalogs across hospitals |

