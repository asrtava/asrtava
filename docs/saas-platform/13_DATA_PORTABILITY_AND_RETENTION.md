# Data Portability, Retention & Export Architecture

## 1. Healthcare Data Retention Governance
Under medical council regulations, patient medical records, clinical notes, and financial tax records must be retained for at least 7 to 10 years:
- **No Hard-Deletions**: Deleting a patient or deactivating a hospital marks `deleted_at = NOW()` and retains the historical records for audit compliance.
- **Legal Holds**: If a legal inquiry or insurance audit is active, the tenant can be placed into `read_only` or `legal_hold` mode, preventing any data purging.

## 2. Self-Service Data Portability (`tenant_data_export_jobs`)
Hospitals maintain full sovereignty over their healthcare data:
- Hospital Admins can trigger asynchronous export requests via `POST /api/v1/saas/tenant/data-export`.
- Formats supported: JSON (full schema preservation) and CSV (relational tables).
- Output packages are encrypted with an ephemeral key and uploaded to tenant-isolated storage.
- Download links expire automatically after 7 calendar days.

