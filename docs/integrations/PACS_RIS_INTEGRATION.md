# ASRTAVA PACS & Radiology Information System (RIS) Integration

**Document Reference:** `docs/integrations/PACS_RIS_INTEGRATION.md`  
**Services Supported:** DICOM C-FIND, C-STORE, C-MOVE, DICOMweb QIDO-RS, WADO-RS, STOW-RS, Modality Worklist (MWL)  
**Last Verified:** 2026-11-09

---

## 1. Modality Worklist (MWL) Management

To prevent clerical patient mismatch errors at the imaging scanner console, ASRTAVA exposes a DICOM Modality Worklist (MWL) provider. When a radiology order is scheduled in ASRTAVA, it creates a worklist entry (`dicom_modality_worklist`) indexed by:
- `accession_number`: Unique diagnostic tracking identifier.
- `scheduled_station_aet`: Application Entity (AE) Title of the target scanner.
- `modality`: Imaging modality code (`CT`, `MR`, `CR`, `US`, `XA`, `NM`, `MG`, `PET`).
- `scheduled_procedure_step_id`: Procedure step ID.

Technicians select the scheduled patient directly from the scanner worklist screen, eliminating manual patient entry.

---

## 2. Ambiguous Study Quarantine & Clinical Reconciliation Gate

In cases where images are sent from external clinics or manual emergency entries occur:
1. **Uncertain Match Detection**: If an incoming DICOM study has an unknown Accession Number or conflicting patient name/UHID, ASRTAVA immediately places the study in **Quarantine** (`MANUAL_RECONCILIATION_REQUIRED`).
2. **Clinical Safety Firewall**: The study is hidden from the general patient portal and outpatient records until reconciled.
3. **Authorized Manual Reconciliation**: An authorized radiologist or hospital administrator must review the study metadata, verify physical patient records, and submit a reconciliation request with mandatory clinical justification notes.
4. **Audit Trail**: Every reconciliation action logs the actor user ID, timestamp, original study UID, and justification in the immutable audit ledger.

