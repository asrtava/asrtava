# ASRTAVA End-to-End Imaging Workflow Map

```
+---------------------------------------------------------------------------------------------------+
| 1. ORDER & SCHEDULING                                                                             |
| Doctor requests CT Brain Non-Contrast -> System checks modality room availability & schedules slot |
+---------------------------------------------------------------------------------------------------+
                                                  │
                                                  ▼
+---------------------------------------------------------------------------------------------------+
| 2. PRE-PROCEDURE SCREENING CHECKLIST                                                              |
| Radiographer verifies identity wristband -> Screens for contrast allergy, eGFR, metal implants    |
+---------------------------------------------------------------------------------------------------+
                                                  │
                                                  ▼
+---------------------------------------------------------------------------------------------------+
| 3. MODALITY WORKLIST (MWL) & IMAGE ACQUISITION                                                    |
| CT Scanner queries MWL via C-FIND -> Patient details populate scanner console without manual entry|
| Radiographer completes scan -> Scanner sends DICOM images via C-STORE / STOW-RS to PACS            |
+---------------------------------------------------------------------------------------------------+
                                                  │
                                                  ▼
+---------------------------------------------------------------------------------------------------+
| 4. RADIOLOGIST INTERPRETATION WORKSPACE                                                           |
| Radiologist opens Web Viewer -> Adjusts Window/Level (Brain vs Bone window) -> Reviews prior scans|
| Dictates structured report: Technique, Findings, Impression, Recommendations                       |
+---------------------------------------------------------------------------------------------------+
                                                  │
                         ┌────────────────────────┴────────────────────────┐
                         ▼                                                 ▼
            [No Urgent Findings]                              [Critical Finding Identified]
                         │                                    (e.g. Epidural Hematoma)
                         │                                                 │
                         │                                     Immediate Telephone Alert to Surgeon
                         │                                     Verbal Read-Back recorded in log
                         │                                                 │
                         └────────────────────────┬────────────────────────┘
                                                  ▼
+---------------------------------------------------------------------------------------------------+
| 5. DIGITAL REPORT RELEASE                                                                         |
| Radiologist applies cryptographic digital signature -> Report released to EMR & Patient Portal   |
+---------------------------------------------------------------------------------------------------+
```

