# ASRTAVA End-to-End Laboratory Workflow Map

## 1. Laboratory Order to Phlebotomy Collection

```
+---------------------------------------------------------------------------------------------------+
| 1. CLINICAL ORDER ENTRY (CPOE)                                                                    |
| Doctor orders tests in OPD / IPD / Emergency -> Priority set (ROUTINE, URGENT, STAT)              |
| Financial clearance verified via RCM / Cashier / Insurance coverage                               |
+---------------------------------------------------------------------------------------------------+
                                                  │
                                                  ▼
+---------------------------------------------------------------------------------------------------+
| 2. ACCESSIONING & BARCODE GENERATION                                                              |
| LIS generates unique Accession Number (e.g. ACC-2026-08812)                                       |
| Phlebotomy label emitted: Patient Name, UHID, Accession Barcode, Container Type (e.g. Lavender)   |
+---------------------------------------------------------------------------------------------------+
                                                  │
                                                  ▼
+---------------------------------------------------------------------------------------------------+
| 3. PHLEBOTOMY SPECIMEN COLLECTION                                                                 |
| Phlebotomist scans patient wristband -> Scans collection tube barcode                             |
| Blood / Urine / CSF collected -> Time, phlebotomist ID, and collection site recorded               |
+---------------------------------------------------------------------------------------------------+
```

---

## 2. Specimen Receipt, Quality Inspection & Testing

```
+---------------------------------------------------------------------------------------------------+
| 4. CENTRAL LAB RECEIPT & CENTRIFUGATION                                                           |
| Specimen arrives in central receiving -> Barcode scanned                                         |
| Quality inspection:                                                                               |
|   - Acceptable: Routed to centrifuge and analyzer bench                                           |
|   - Unacceptable (Hemolyzed, Clotted, Insufficient): Rejection logged -> Recollection ticket      |
+---------------------------------------------------------------------------------------------------+
                                                  │
                         ┌────────────────────────┴────────────────────────┐
                         ▼                                                 ▼
             [Automated Analyzers]                             [Manual / Specialty Bench]
       Sysmex / Roche Cobas / Mindray                    Microbiology / Histology / Manual
       ASTM/HL7 result auto-imported                      Manual entry with double-key check
                         │                                                 │
                         └────────────────────────┬────────────────────────┘
                                                  ▼
+---------------------------------------------------------------------------------------------------+
| 5. RESULT CALCULATION & DELTA CHECK                                                               |
| System compares value against age/sex reference range & patient previous historical results       |
| Flags: Normal, Abnormal High/Low, or CRITICAL PANIC                                               |
+---------------------------------------------------------------------------------------------------+
```

---

## 3. Two-Tier Validation, Panic Escalation & Report Release

```
+---------------------------------------------------------------------------------------------------+
| 6. TECHNICAL VALIDATION (Medical Technologist)                                                    |
| Lab Technologist verifies instrument calibration, QC status, and delta check -> Technologist sign |
+---------------------------------------------------------------------------------------------------+
                                                  │
                         ┌────────────────────────┴────────────────────────┐
                         ▼                                                 ▼
               [Normal / Routine]                                [Critical Panic Value]
                         │                                                 │
                         │                                     CRITICAL RESULT NOTIFICATION
                         │                                     - Immediate telephone broadcast
                         │                                     - Delivery & acknowledgement log
                         │                                                 │
                         └────────────────────────┬────────────────────────┘
                                                  ▼
+---------------------------------------------------------------------------------------------------+
| 7. PATHOLOGIST MEDICAL AUTHORIZATION                                                              |
| Senior Pathologist reviews abnormal flags, morphology, and clinical notes -> Applies Digital Seal |
| Status transitions to AUTHORIZED -> PDF report generated                                          |
+---------------------------------------------------------------------------------------------------+
                                                  │
                                                  ▼
+---------------------------------------------------------------------------------------------------+
| 8. REPORT DELIVERY & CLINICAL REVIEW                                                              |
| Released instantly to:                                                                            |
|   - Doctor EMR Progress Chart & OPD Queue                                                         |
|   - Patient Web Portal & Mobile App (Encrypted download)                                          |
+---------------------------------------------------------------------------------------------------+
```

