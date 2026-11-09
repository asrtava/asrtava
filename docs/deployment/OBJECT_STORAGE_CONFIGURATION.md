# ASRTAVA Object Storage & Medical Document Architecture

## 1. Storage Specifications

- **Bucket Name**: `asrtava-prod-medical-documents`
- **Region**: `ap-south-1` (Mumbai, India — DPDP Act 2023 compliance)
- **Encryption**: AWS KMS Customer Managed Key (SSE-KMS) with annual automated key rotation.
- **Access Policy**: **100% Private**. S3 Block Public Access enabled across all four settings.

---

## 2. Immutability & Ransomware Protection: WORM Object Lock

To guarantee medical document integrity under **NMC RMP Regulations 2023** and defeat ransomware:
- The S3 bucket is provisioned with **Object Lock in Compliance Mode**.
- Once a diagnostic report, discharge summary, or patient consent PDF is uploaded, it cannot be deleted, modified, or overwritten by any user—including AWS root accounts—until the retention period expires (minimum 3 years for adults, 21 years for minors).

---

## 3. Presigned URL Access Protocol

Direct bucket access is prohibited. All patient and staff downloads use ephemeral presigned URLs:
1. User requests document (e.g. `GET /api/v1/documents/:id/download`).
2. Backend verifies JWT, hospital tenant ownership, and patient consent.
3. If authorized, backend generates a signed S3 URL with a **15-minute maximum expiration window**.
4. Client downloads the file directly from S3 using the signed link.
5. All download operations record an append-only entry in `clinical_audit_events`.

