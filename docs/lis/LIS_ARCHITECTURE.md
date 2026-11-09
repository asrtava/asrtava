# ASRTAVA Laboratory Information System (LIS) Architecture

## 1. Domain Blueprint

The ASRTAVA Laboratory Information System is structured into twelve decoupled domain services:

```
+---------------------------------------------------------------------------------------------------+
|                                     LABORATORY ORDER DISPATCH                                     |
|     OPD / IPD / Emergency Encounter  |  Billing Tariff Validation  |  Priority Triage (STAT)      |
+---------------------------------------------------------------------------------------------------+
                                                  │
                                                  ▼
+---------------------------------------------------------------------------------------------------+
|                              ACCESSIONING & SPECIMEN LIFECYCLE                                    |
|   Phlebotomy Worklist  |  Barcode Accession  |  Container Color Coding  |  Rejection / Recollect  |
+---------------------------------------------------------------------------------------------------+
                                                  │
                         ┌────────────────────────┴────────────────────────┐
                         ▼                                                 ▼
+-----------------------------------------------+ +-------------------------------------------------+
|       AUTOMATED ANALYZER INTEGRATION          | |         MANUAL TESTING & SPECIALTY BENCH        |
|  Sysmex / Roche Cobas / Mindray (ASTM & HL7)  | |  Microbiology (Cultures & AST) | Histopathology |
|  Staging Queue  |  Unverified Results Gate    | |  Grossing | Cassettes | Microscopic Diagnosis   |
+-----------------------------------------------+ +-------------------------------------------------+
                         │                                                 │
                         └────────────────────────┬────────────────────────┘
                                                  ▼
+---------------------------------------------------------------------------------------------------+
|                                   RESULT VALIDATION & QUALITY GATES                               |
|   Delta Checks  |  Bio-Reference Range (Age/Sex)  |  Westgard IQC Evaluation  |  Panic Alerts     |
+---------------------------------------------------------------------------------------------------+
                                                  │
                         ┌────────────────────────┴────────────────────────┐
                         ▼                                                 ▼
+-----------------------------------------------+ +-------------------------------------------------+
|          TECHNICAL VALIDATION TIER            | |           PATHOLOGIST AUTHORIZATION TIER        |
|   Lab Technologist review of instrument flags | |   Medical interpretation | Digital Signature    |
+-----------------------------------------------+ +-------------------------------------------------+
                                                  │
                                                  ▼
+---------------------------------------------------------------------------------------------------+
|                                REPORT GENERATION & DIGITAL DELIVERY                               |
|   PDF Reports  |  Doctor Portal Review  |  Patient Portal Released View  |  EMR Progress Chart    |
+---------------------------------------------------------------------------------------------------+
```

---

## 2. Core Domain Services & Data Contracts

1. **Test Catalog & Parameter Master (`TestCatalogService`):**
   Manages individual analytes, units, LOINC bindings, container tube requirements, methodologies (e.g. Hexokinase, ECLIA, Flow Cytometry), and age/sex-specific reference ranges.
2. **Accessioning & Specimen Tracker (`SpecimenTrackingService`):**
   Assigns unique accession numbers (`ACC-2026-XXXXX`), generates 2D barcode labels, and tracks specimen transit through Phlebotomy $\to$ Transport $\to$ Lab Centrifugation $\to$ Testing Bench $\to$ Storage/Biohazard Disposal.
3. **Automated Analyzer Gateway (`AnalyzerGatewayService`):**
   Parses ASTM 1394-97 and HL7 v2.x analyzer messages, maps instrument test codes to hospital parameters, detects duplicate packets, and buffers raw messages in an unverified staging queue.
4. **Result Entry & Abnormality Flagging (`ResultManagementService`):**
   Evaluates entered or imported numeric and qualitative results against dynamic reference ranges, setting abnormality flags:
   - `NORMAL`: Within reference range.
   - `ABNORMAL_HIGH` / `ABNORMAL_LOW`: Outside normal limits.
   - `CRITICAL_PANIC`: Severe risk requiring immediate verbal clinician notification (e.g. Potassium $> 6.5\text{ mmol/L}$, Platelets $< 20,000/\mu\text{L}$).
5. **Pathologist Review & Sign-Off Gate (`ResultAuthorizationService`):**
   Enforces a two-step validation model: Technologist Technical Validation $\to$ Pathologist Medical Sign-off. Unverified results are never released to patient portals.
6. **Microbiology & Antimicrobial Susceptibility (`MicrobiologyService`):**
   Documents specimen cultures, Gram staining, organism isolation, colony counts, and antibiotic susceptibility testing (AST) with Kirby-Bauer / MIC interpretations (Sensitive, Intermediate, Resistant).
7. **Histopathology & Surgical Pathology (`HistopathologyService`):**
   Tracks tissue biopsy specimens through Grossing $\to$ Cassette Processing $\to$ Paraffin Embedding $\to$ Microtomy Slides $\to$ Special Stains $\to$ Microscopic Pathologist Diagnosis.
8. **Internal Quality Control (IQC) Engine (`QualityControlService`):**
   Evaluates daily control runs against Levey-Jennings baselines and automates Westgard Multirule rejection checks ($1_{2s}, 1_{3s}, 2_{2s}, R_{4s}, 10_{\bar{x}}$).

