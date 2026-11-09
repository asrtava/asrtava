# ASRTAVA RIS / PACS Architectural Blueprint

## 1. Subsystem Architecture

The ASRTAVA Radiology Information System (RIS) and PACS subsystem coordinates the imaging journey across modalities, scanners, viewing workstations, and reporting radiologists:

```
+---------------------------------------------------------------------------------------------------+
|                                 PHYSICIAN IMAGING ORDER ENTRY                                     |
|    Clinical Indication  |  Procedure Master Catalog  |  Priority (ROUTINE, URGENT, STAT)          |
+---------------------------------------------------------------------------------------------------+
                                                  │
                                                  ▼
+---------------------------------------------------------------------------------------------------+
|                            MODALITY SCHEDULING & SAFETY SCREENING                                 |
|  Anti-Collision Calendar  |  Contrast Safety (eGFR > 30)  |  MRI Ferromagnetic Implant Checklist  |
+---------------------------------------------------------------------------------------------------+
                                                  │
                                                  ▼
+---------------------------------------------------------------------------------------------------+
|                              DICOM MODALITY WORKLIST (MWL) SERVER                                 |
|          Scanner C-FIND Query indexed by Modality AE Title (CT01, MRI01, XRAY01)                  |
+---------------------------------------------------------------------------------------------------+
                                                  │
                                                  ▼
+---------------------------------------------------------------------------------------------------+
|                             PACS IMAGE ACQUISITION & OBJECT STORAGE                               |
|   DICOM C-STORE / STOW-RS Ingestion  |  PostgreSQL Metadata Indexing (Study -> Series -> Instance)|
|   Encrypted Binary Storage (AWS S3 / MinIO WORM Compliance Mode)                                  |
+---------------------------------------------------------------------------------------------------+
                                                  │
                         ┌────────────────────────┴────────────────────────┐
                         ▼                                                 ▼
+-----------------------------------------------+ +-------------------------------------------------+
|            ZERO-FOOTPRINT WEB VIEWER          | |        STRUCTURED RADIOLOGIST REPORTING         |
|  WADO-RS Streaming | Window/Level | Pan/Zoom  | |  Technique | Prior Comparison | Impression      |
|  Multi-Planar Reconstruction (MPR) Annotations| |  Pathologist / Radiologist Digital Signature    |
+-----------------------------------------------+ +-------------------------------------------------+
                                                  │
                         ┌────────────────────────┴────────────────────────┐
                         ▼                                                 ▼
               [Routine Authorization]                           [Critical Imaging Finding]
                         │                                                 │
                         │                                     CRITICAL FINDING ESCALATION
                         │                                     - Intracranial Bleed / Pneumothorax
                         │                                     - Immediate telephone read-back log
                         │                                                 │
                         └────────────────────────┬────────────────────────┘
                                                  ▼
+---------------------------------------------------------------------------------------------------+
|                                REPORT DELIVERY & CLINICAL REVIEW                                  |
|   Attending Doctor Progress Notes  |  Patient Portal Released View  |  Encrypted PDF Download     |
+---------------------------------------------------------------------------------------------------+
```

---

## 2. Core Domain Services

1. **Modality & Procedure Master (`RadiologyProcedureService`):** Manages imaging modalities, scanners, DICOM Application Entity (AE) Titles, body regions, and preparation instructions.
2. **Scheduling & Safety Screening (`ImagingSchedulingService`):** Prevents scanner double-booking and manages pre-procedure screening checklists (Renal eGFR, Metformin, Pacemakers).
3. **PACS Storage & Metadata Indexer (`PACSStorageService`):** Extracts DICOM header tags (Patient Name, UHID, Study UID, Series Number, SOP Instance UID, Slice Thickness, Window Center/Width) and stores binary objects in compliance storage.
4. **Structured Radiology Reporting (`RadiologyReportingService`):** Supports structured reporting templates, preliminary/final stages, digital signatures, and versioned addenda.
5. **Critical Finding Alert Center (`CriticalFindingService`):** Tracks urgent radiological findings requiring immediate physician escalation and verbal read-back confirmation.
6. **Contrast Administration Ledger (`ContrastTrackingService`):** Records contrast agent, volume, injection rate, batch lot number, and adverse reactions.

