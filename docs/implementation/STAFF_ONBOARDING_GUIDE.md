# ASRTAVA Staff Onboarding & Access Control Guide

## 1. Overview

The Staff Onboarding Module enables hospital administrators to provision clinical, nursing, administrative, and allied healthcare accounts in bulk or individually. Every provisioned user is assigned role-based permissions adhering to the principle of least privilege, preventing unauthorized access across departments and hospital tenants.

---

## 2. Supported Hospital Roles & Default Scopes

| Role Key | Portal Destination | Primary Permissions & Responsibilities | Boundary Constraints |
|---|---|---|---|
| `super_admin` | Super Admin Console | Platform telemetry, multi-hospital licensing, JIT support | Cannot access clinical records without approved JIT session |
| `hospital_admin` | Hospital Admin Dashboard | Department setup, staff management, bed configuration, billing tariffs | Scoped strictly to assigned hospital tenant (`x-hospital-id`) |
| `doctor` | Doctor Workspace | OPD queue, clinical SOAP encounters, CPOE, e-prescriptions | Can only view and edit assigned/consulted patients |
| `nurse` | Nursing Workspace | Inpatient census, vital signs, MAR administration, shift handoffs | Restricted to ward/floor assignment |
| `receptionist` | Front Office Portal | Patient registration, OPD scheduling, check-in, queue management | Cannot view clinical consultation notes or diagnostic reports |
| `pharmacist` | Pharmacy Workspace | Prescription queue, FEFO batch dispensing, inventory indents | Row-level stock locking; cannot alter clinical notes |
| `lab_staff` | Laboratory Portal | Specimen accessioning, analyzer telemetry, test results, bio-reference | Results staged until doctor validation |
| `radiology_staff`| Radiology Portal | Modality worklist (MWL), DICOM imaging, radiology reports | Cannot alter billing invoices |
| `finance_officer`| Billing & Accounts | Invoice generation, payments, CGHS/TPA claim processing | Financial records only; no access to raw clinical notes |

---

## 3. Bulk Onboarding Specifications

Hospital administrators can upload CSV or JSON rosters containing staff demographics:

```json
[
  {
    "fullName": "Dr. Ananya Roy",
    "email": "ananya.roy@maxhealth.in",
    "phoneNumber": "+91 98111 22334",
    "roleKey": "doctor",
    "department": "Cardiology",
    "employeeId": "EMP-DOC-001",
    "specialization": "Interventional Cardiology",
    "medicalLicenseNumber": "MCI-DEL-2015-88432"
  },
  {
    "fullName": "Sister Mary Joseph",
    "email": "mary.joseph@maxhealth.in",
    "phoneNumber": "+91 98222 33445",
    "roleKey": "nurse",
    "department": "ICU",
    "employeeId": "EMP-NUR-002",
    "specialization": "Critical Care Nursing",
    "medicalLicenseNumber": "INC-DEL-2018-44123"
  }
]
```

### Security & Password Provisioning
- **NIST 800-63B Passphrase Compliance**: Initial passwords are generated using 16-character high-entropy alphanumeric strings.
- **Forced First-Login Password Change**: `force_password_reset = true` is set on all new accounts.
- **Multi-Factor Authentication (MFA)**: SMS / Authenticator TOTP is mandated for Doctors, Pharmacists, and Administrators prior to accessing production systems.

