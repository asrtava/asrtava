# ASRTAVA Laboratory Information System (LIS) Security & Authorization Audit

## 1. Granular Role-Based Permissions

Endpoints mounted under `/api/v1/diagnostics/lis/advanced/*` enforce verified capabilities with DENY > ALLOW precedence:

| Permission String | Description | Authorized Roles |
| :--- | :--- | :--- |
| `lab.dashboard.view` | View lab census, accession lists, and bench worklists. | Lab Tech, Phlebotomist, Pathologist |
| `lab.departments.manage` | Configure laboratory sections, room locations, and catalogs. | Lab Director, Hospital Admin |
| `lab.test_catalog.manage` | Manage test parameters, reference ranges, and panic limits. | Pathologist, Lab Quality Manager |
| `lab.specimens.collect` | Accession specimens and print 2D barcode labels. | Phlebotomist, Ward Nurse, Lab Tech |
| `lab.specimens.reject` | Reject unsuitable specimens and request recollection. | Lab Technologist, Specimen Receiving Clerk |
| `lab.results.enter` | Enter manual results or import analyzer telemetry. | Medical Laboratory Technologist |
| `lab.results.validate` | Perform technologist technical validation. | Medical Laboratory Technologist |
| `lab.results.authorize` | Perform pathologist medical authorization and digital sign-off. | Senior Consultant Pathologist |
| `lab.results.amend` | Issue controlled amendments with reason documentation. | Consultant Pathologist only |
| `lab.quality_control.manage`| Record daily IQC control runs and Westgard evaluations. | QC Officer, Laboratory Technologist |

---

## 2. Row-Level Security & Multi-Tenancy

- All 13 tables in `026_complete_laboratory_information_system.sql` have PostgreSQL Row-Level Security (`ENABLE ROW LEVEL SECURITY`) activated.
- Queries are restricted by `hospital_id` ensuring zero cross-hospital test catalog or patient result leakage.

---

## 3. Tamper-Evident Result Immutability

- Authorized reports cannot be silently mutated.
- Amendments are preserved in `lis_test_results` with `is_amended = true`, previous values retained, and mandatory pathologist amendment reasons.

