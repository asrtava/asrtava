# Radiology RIS Imaging & Diagnostic Reports

## 1. Overview (`RadiologyScreen.tsx`)
Provides patients with direct access to finalized imaging studies:
- Modality Badges: `X-Ray`, `CT Scan`, `MRI`, `Ultrasound`.
- Examination Details: Study Title, Examination Date, Reporting Radiologist.
- Structured Diagnostic Sections:
  - **Clinical Findings**: Detailed anatomical and radiological observations.
  - **Impression / Conclusion**: Actionable clinical summary (e.g. *Mild non-obstructive coronary artery disease. CAD-RADS 1*).
- Authenticated PDF Export: Download signed radiological reports with digital PACS accession links.

