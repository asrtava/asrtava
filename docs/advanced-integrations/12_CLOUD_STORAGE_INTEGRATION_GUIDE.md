# ASRTAVA Cloud Storage & Document Archival Guide

## 1. Overview
ASRTAVA provides a tenant-isolated object storage layer connecting with **Amazon S3**, **Azure Blob Storage**, **Google Cloud Storage (GCS)**, or on-premise S3-compatible **MinIO** clusters for diagnostic scans, PDF lab reports, discharge summaries, and patient document uploads.

## 2. Presigned URL Architecture
Clients never upload files directly through backend memory buffers or public open buckets.
1. Web or mobile client requests upload authorization:
   `POST /api/v1/integrations/storage/presigned-url`
2. Backend generates a presigned PUT URL valid for 15 minutes (`expirationSeconds = 900`).
3. Mandatory security headers:
   - `Content-Type`: Validated against allowed MIME types (`application/pdf`, `image/jpeg`, `application/dicom`).
   - `x-amz-server-side-encryption`: Must be `AES256` or `aws:kms`.
4. Client uploads file directly to storage provider over TLS 1.3.

## 3. Storage Hierarchy & Tenant Isolation
Objects are strictly segregated by tenant hospital ID:
`tenants/{hospital_id}/documents/{year}/{month}/{document_uuid}.pdf`
`tenants/{hospital_id}/radiology/{study_uid}/{series_uid}.dcm`
Cross-tenant object retrieval is prevented by verifying that the requested object path prefix matches the authenticated user's `hospitalId`.

