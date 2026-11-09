# ASRTAVA DICOM Conformance Statement & Integration Specification

## 1. Overview
ASRTAVA provides native compliance with the DICOM 3.0 standard (NEMA PS3.1-PS3.20) for medical imaging interoperability across modalities, Picture Archiving and Communication Systems (PACS), and diagnostic workstations.

## 2. Supported SOP Classes & Service Roles

| SOP Class Name | SOP Class UID | SCU Role | SCP Role |
|:---|:---|:---:|:---:|
| Verification SOP Class (C-ECHO) | `1.2.840.10008.1.1` | Supported | Supported |
| Modality Worklist Information Model - FIND | `1.2.840.10008.5.1.4.31` | Supported | Supported |
| CT Image Storage | `1.2.840.10008.5.1.4.1.1.2` | Supported | Supported |
| Enhanced CT Image Storage | `1.2.840.10008.5.1.4.1.1.2.1` | Supported | Supported |
| MR Image Storage | `1.2.840.10008.5.1.4.1.1.4` | Supported | Supported |
| Enhanced MR Image Storage | `1.2.840.10008.5.1.4.1.1.4.1` | Supported | Supported |
| Digital X-Ray Image Storage - For Presentation | `1.2.840.10008.5.1.4.1.1.1` | Supported | Supported |
| Ultrasound Multi-frame Image Storage | `1.2.840.10008.5.1.4.1.1.3.1` | Supported | Supported |
| Secondary Capture Image Storage | `1.2.840.10008.5.1.4.1.1.7` | Supported | Supported |

## 3. Network Communication & AE Title Configuration
- **Default Application Entity (AE) Title**: `ASRTAVA_DICOM`
- **Default Listening Port**: `104` (Standard DICOM) / `11112` (High-port mode for non-root containers)
- **Modality Worklist (MWL) Attributes**:
  - `(0010,0010)` Patient's Name
  - `(0010,0020)` Patient ID (ASRTAVA UHID)
  - `(0008,0050)` Accession Number
  - `(0040,0100)` Scheduled Procedure Step Sequence
  - `(0040,0001)` Scheduled Station AE Title
  - `(0040,0002)` Scheduled Procedure Step Start Date
  - `(0040,0003)` Scheduled Procedure Step Start Time
  - `(0008,0060)` Modality (`CT`, `MR`, `DX`, `US`)

## 4. Transfer Syntaxes Supported
- Explicit VR Little Endian (`1.2.840.10008.1.2.1`)
- Implicit VR Little Endian (`1.2.840.10008.1.2`)
- JPEG Lossless, Non-Hierarchical (`1.2.840.10008.1.2.4.70`)
- JPEG 2000 Part 1 Lossless (`1.2.840.10008.1.2.4.90`)

