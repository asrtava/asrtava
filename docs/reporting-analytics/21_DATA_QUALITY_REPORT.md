# ASRTAVA Data Quality Assurance Report

## 1. Automated Integrity Checks
The Data Quality Service (`DataQualityService.ts`) runs automated scans across clinical and financial tables:

1. **Financial Equation Integrity Check**:
   $$\text{Variance} = |\text{Net Payable} - (\text{Total Paid} + \text{Outstanding Balance})|$$
   - Tolerance threshold: $\le ₹ 0.05$ (to account for rounding).
   - Any invoice exceeding this threshold is flagged as a `critical` data quality issue.
2. **Duplicate Patient Phone Check**:
   - Identifies active patient profiles sharing identical 10-digit mobile numbers, preventing accidental duplicate patient registrations and unmerged medical records.
3. **Bed Census vs Admission Consistency**:
   - Validates that every bed marked with status `occupied` has a corresponding active inpatient admission record (`admissions.status = 'admitted'`).
4. **Overall Hospital Data Health Score**:
   - Computes a weighted 0–100% health score based on detected critical, warning, and informational anomalies. Baseline Apex Care hospital health score: **98%**.

