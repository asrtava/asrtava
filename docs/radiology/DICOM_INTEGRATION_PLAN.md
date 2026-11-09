# ASRTAVA DICOM & Modality Integration Plan

## 1. Supported DICOM SOP Classes & Operations

ASRTAVA implements standards-compliant DICOM 3.0 network services:

| DICOM Service | Operation | Protocol / Transport | Purpose |
| :--- | :--- | :--- | :--- |
| **Modality Worklist (MWL)** | C-FIND | TCP/IP Port 104 / DICOMweb | Supplies scanner console with scheduled patient demographic and procedure metadata. |
| **Storage (C-STORE)** | C-STORE | TCP/IP Port 11112 | Ingests acquired DICOM instances (CT, MR, XA, US, CR, DX) from modality scanners. |
| **DICOMweb WADO-RS** | RESTful HTTP GET | HTTPS Port 443 | Streams multi-frame DICOM instances and metadata to browser-based zero-footprint viewers. |
| **DICOMweb QIDO-RS** | RESTful HTTP GET | HTTPS Port 443 | Queries PACS studies and series by Patient ID, Accession Number, Modality, and Date range. |
| **DICOMweb STOW-RS** | RESTful HTTP POST | HTTPS Port 443 | Stores DICOM studies uploaded via web portal presigned URLs. |

---

## 2. Storage Tier Architecture

1. **Structured Metadata (PostgreSQL):**
   - Study UID, Series UID, SOP Instance UID, Patient ID, Study Date/Time, Modality, Body Part, Slice Thickness, Series Description, Window Center/Width.
2. **Binary Pixel Data (Compliance Storage):**
   - Raw `.dcm` files are stored in AWS S3 or on-premises MinIO with Object Lock enabled in **Compliance Mode**, satisfying 3-year adult and 21-year pediatric retention mandates.
   - Zero binary pixel blobs are stored inside PostgreSQL tables.

