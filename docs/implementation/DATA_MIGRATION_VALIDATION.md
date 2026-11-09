# ASRTAVA Data Migration Validation & Reconciliation Guide

## 1. Validation Rules Matrix

Every entity imported into ASRTAVA must satisfy rigorous domain validation rules prior to staging:

| Target Entity | Mandatory Fields | Field Format Validation | Duplicate Check Criteria | Failure Action |
|---|---|---|---|---|
| **Patients** | `fullName`, `phone` | Phone: 10-15 digits, DOB: ISO date (YYYY-MM-DD), Gender: M/F/O | `fullName + phone` or `nationalId` | Excluded from import; flagged in validation errors |
| **Staff** | `fullName`, `email`, `role`, `department` | Email: RFC 5322 regex, Role: valid ASRTAVA role key | `email` or `employeeId` | Block import batch until email uniqueness resolved |
| **Pharmacy Formulary** | `brandName`, `molecule`, `batchNumber`, `expiryDate` | Expiry: Future date YYYY-MM-DD, Quantity: Non-negative integer | `batchNumber + brandName` | Replaced or stock incremented based on policy |
| **Billing Tariffs** | `serviceCode`, `serviceName`, `standardRate` | Rate: Numeric &ge; 0, HSN/SAC: 4-8 digits | `serviceCode` | Existing code flagged for manual tariff review |
| **Beds** | `wardCode`, `bedNumber`, `category` | Bed Number: Alphanumeric &le; 10 chars | `wardCode + bedNumber` | Import rejected; duplicate bed number in ward |

---

## 2. Sample Migration Reconciliation Report

The following structured JSON demonstrates the exact reconciliation output produced by `OnboardingService.executeProductionMigration()`:

```json
{
  "jobId": "mig-1731140000-4f9a",
  "implementationId": "impl-1731139000-882e",
  "hospitalId": "hosp-max-delhi-01",
  "category": "patients",
  "reconciliationTimestamp": "2026-11-09T08:20:00.000Z",
  "executedBy": "usr-admin-hosp-001",
  "sourceSystemName": "Legacy_Medix_SQLServer_2012",
  "sourceFormat": "json",
  "totalSourceRows": 4,
  "successfullyMigrated": 2,
  "duplicatesExcluded": 1,
  "failedRows": 1,
  "dataIntegrityVerified": true,
  "traceabilityChecksum": "7f4a8b92c019d381023beaa1902847a9e18b01a2f9012384a91823719bca1209",
  "reconciliationStatus": "verified_clean"
}
```

---

## 3. Rollback & Disaster Recovery Safeguards

1. **Transactional Savepoints**: All migration inserts are wrapped in database transactions (`knex.transaction()`). If an unhandled SQL exception or foreign key violation occurs mid-batch, the entire transaction rolls back to the pre-migration state.
2. **Pre-Migration Snapshot**: A point-in-time PostgreSQL snapshot is captured immediately prior to executing any production migration job.
3. **Audit Trail**: Every imported record is tagged with `migration_job_id` and `imported_at`, allowing surgical rollback of a specific import batch without disrupting ongoing clinical activity.

