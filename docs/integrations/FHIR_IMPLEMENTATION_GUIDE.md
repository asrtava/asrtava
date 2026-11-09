# ASRTAVA FHIR R4 Implementation Guide

**Document Reference:** `docs/integrations/FHIR_IMPLEMENTATION_GUIDE.md`  
**FHIR Release:** HL7 FHIR Release 4 (v4.0.1)  
**Profile Alignment:** ABDM Health Information Exchange (HIE) & US Core / International Patient Summary (IPS)  
**Base URL:** `/api/v1/interop/fhir`  
**Last Verified:** 2026-11-09

---

## 1. Supported FHIR R4 Resources

| Resource Type | Supported Interactions | Search Parameters | ABDM / Clinical Role |
|---|---|---|---|
| **`Patient`** | `read`, `search-type`, `create` | `_id`, `identifier`, `name`, `gender`, `birthdate`, `phone` | Demographics, UHID, and ABHA address |
| **`Practitioner`** | `read`, `search-type` | `_id`, `identifier`, `name` | Doctors and clinical specialists |
| **`PractitionerRole`** | `read`, `search-type` | `_id`, `practitioner`, `organization`, `role` | Department and specialty assignments |
| **`Organization`** | `read`, `search-type` | `_id`, `identifier`, `name` | Hospital legal entities and clinic branches |
| **`Location`** | `read`, `search-type` | `_id`, `organization`, `status` | Wards, beds, consultation rooms, OT suites |
| **`Encounter`** | `read`, `search-type`, `create` | `_id`, `patient`, `date`, `status`, `class` | OPD consultations, IPD stays, ED episodes |
| **`Appointment`** | `read`, `search-type` | `_id`, `patient`, `practitioner`, `date`, `status` | Outpatient slot bookings |
| **`Condition`** | `read`, `search-type` | `_id`, `patient`, `code`, `clinical-status` | ICD-10 and SNOMED-CT diagnoses |
| **`Observation`** | `read`, `search-type`, `create` | `_id`, `patient`, `code`, `date`, `status`, `category` | Vital signs, laboratory analytes, social history |
| **`DiagnosticReport`** | `read`, `search-type` | `_id`, `patient`, `code`, `date`, `status` | Lab panels and radiology PACS reports |
| **`ServiceRequest`** | `read`, `search-type` | `_id`, `patient`, `code`, `status` | Diagnostic and surgical procedure orders |
| **`Medication`** | `read`, `search-type` | `_id`, `code` | Pharmaceutical catalog & generics |
| **`MedicationRequest`**| `read`, `search-type` | `_id`, `patient`, `status`, `authoredon` | E-prescriptions with dosage and duration |
| **`MedicationDispense`**| `read`, `search-type` | `_id`, `patient`, `status` | Pharmacy batch dispensing records |
| **`AllergyIntolerance`**| `read`, `search-type` | `_id`, `patient`, `severity` | Clinical drug and food allergies |
| **`Procedure`** | `read`, `search-type` | `_id`, `patient`, `date`, `status` | Surgical operations and interventions |
| **`ImagingStudy`** | `read`, `search-type` | `_id`, `patient`, `series`, `accession` | DICOM studies, series, and instance UIDs |
| **`DocumentReference`** | `read`, `search-type` | `_id`, `patient`, `type`, `date` | Discharge summaries and medical records |
| **`Coverage`** | `read`, `search-type` | `_id`, `beneficiary`, `payor`, `status` | Insurance policies, TPAs, Ayushman Bharat |
| **`Claim`** | `read`, `search-type`, `create` | `_id`, `patient`, `use`, `status` | NHCX claim submissions and pre-auths |
| **`CarePlan`** | `read`, `search-type` | `_id`, `patient`, `status` | Inpatient nursing care plans (NCP) |

---

## 2. CapabilityStatement Metadata

```http
GET /api/v1/interop/fhir/$metadata HTTP/1.1
Host: asrtava.health
Accept: application/fhir+json
```

**Response Sample:**
```json
{
  "resourceType": "CapabilityStatement",
  "id": "asrtava-fhir-r4",
  "status": "active",
  "fhirVersion": "4.0.1",
  "format": ["application/fhir+json", "json"],
  "rest": [
    {
      "mode": "server",
      "resource": [
        { "type": "Patient", "interaction": [{ "code": "read" }, { "code": "search-type" }] },
        { "type": "Observation", "interaction": [{ "code": "read" }, { "code": "search-type" }] }
      ]
    }
  ]
}
```

---

## 3. Bundle Containers & OperationOutcome

- Multi-resource queries return a `Bundle` with `type: "searchset"` and total entry count.
- API validation and access errors return standard `OperationOutcome` with `severity`, `code`, and diagnostic text.

