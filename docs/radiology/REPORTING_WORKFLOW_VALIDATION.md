# ASRTAVA Structured Radiology Reporting & Clinical Validation

## 1. Structured Reporting Framework
To ensure diagnostic clarity and standards-compliant medical communication, ASRTAVA supports standardized structured reporting sections:
1. **Clinical Indication & History**: Reason for examination and prior surgical history.
2. **Technique & Protocol**: Scanning parameters, IV contrast dosage, timing, and reconstruction slice width.
3. **Comparison**: Formal correlation with earlier diagnostic imaging studies.
4. **Findings**: Systematic anatomical breakdown by organ/compartment.
5. **Impression**: Concisely numbered diagnostic conclusions.
6. **Standard Classification Scores**:
   - BI-RADS (Breast Imaging Reporting and Data System, Categories 0-6).
   - LI-RADS (Liver Imaging Reporting and Data System).
   - PI-RADS (Prostate Imaging Reporting and Data System).
   - Lung-RADS (Lung CT Screening).

## 2. Digital Signatures & Legal Addendum Protocol
- Finalized reports are cryptographically sealed with a SHA-256 digital signature hash.
- Once status transitions to `FINALIZED` or `AUTHORIZED`, direct modification of report text is strictly blocked by backend security assertions (`IMMUTABLE_REPORT_LOCK`).
- Clarifications, interval changes, or secondary reviews must be submitted as versioned, time-stamped legal Addenda (`amendReport()`), preserving the complete diagnostic history.

