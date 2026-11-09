# Module 17: Centralized Document Management Specification

## 1. Overview
The Centralized Document Management module manages secure storage, metadata tracking, tenant-level isolation, and access auditing for clinical, financial, and administrative files across the hospital.

---

## 2. Core Functional Capabilities

### 1. Document Categories
Categorizes files across healthcare workflows:
- `clinical_summary`: Consultation notes and referral letters.
- `lab_report`: Signed pathology investigation PDFs.
- `radiology_dicom`: Medical imaging reports and DICOM attachments.
- `prescription`: Signed electronic prescription PDF documents.
- `id_proof`: Government-issued patient identity proofs.
- `consent_form`: Signed surgical and anesthesia digital consent forms.
- `discharge_summary`: Final inpatient discharge summaries.

### 2. Tenant Isolation & Access Auditing
- Storage paths are never exposed publicly.
- Every document access requires an authenticated session belonging to the patient's tenant.
- Audit logs capture every download, view, and version upload.

---

## 3. API Endpoints
- `GET /api/v1/documents`: List documents by category and patient ID.
- `POST /api/v1/documents/upload`: Upload file with category and metadata.
- `GET /api/v1/documents/:id/download`: Secure tenant-verified document streaming.

