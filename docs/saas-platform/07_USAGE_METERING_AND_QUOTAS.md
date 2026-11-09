# Usage Metering & Quota Alert Governance

## 1. Metered Resource Dimensions
ASRTAVA continuously meters resource consumption per tenant:
- Active staff user accounts (`users.is_active = true`).
- Physical branch locations (`hospital_branches.is_active = true`).
- Monthly patient registrations (`patients.created_at`).
- Cloud storage utilized (`storage_used_bytes` for radiology DICOM, lab PDFs, scanned IDs).
- API request volume.
- SMS / WhatsApp notification consumption.

## 2. Multi-Stage Warning Thresholds
- **Normal (< 75%)**: Standard operating state.
- **Warning Threshold (75% - 89%)**: Proactive alert banner shown on Hospital Admin dashboard and notification email sent to administrator.
- **Critical Threshold (90% - 99%)**: Elevated alert warning that upgrade is recommended.
- **Hard Limit Protection Policy**: Under no circumstances does reaching a storage or patient quota block life-critical emergency admissions, triage, or ICU bedside charting. Overage policies log the variance and invoice the hospital on the next billing cycle rather than obstructing clinical care.

