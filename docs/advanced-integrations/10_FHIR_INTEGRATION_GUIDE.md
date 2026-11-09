# ASRTAVA FHIR R4 & ABDM Interoperability Guide

## 1. Overview
ASRTAVA provides a modern **HL7 Fast Healthcare Interoperability Resources (FHIR) Release 4** interface, designed to align with Ayushman Bharat Digital Mission (ABDM) Milestone 1, 2, and 3 guidelines for longitudinal health record exchange.

## 2. Supported FHIR R4 Resources
| Resource | Purpose | Mapping Function |
|---|---|---|
| `Patient` | Demographic identity & ABHA ID linkage | `FHIRService.toFHIRPatient` |
| `Observation` | Diagnostic lab analytes, vital signs | `FHIRService.toFHIRObservation` |
| `DiagnosticReport` | Signed Pathology & Radiology studies | Packaged with LOINC codes |
| `Encounter` | OPD consultations & IPD ward stays | Tied to attending practitioner |
| `MedicationRequest` | Digital e-prescriptions | Drug codes (generic + brand) |
| `Bundle` | Care Context collection package for ABDM | `FHIRService.createFHIRBundle` |

## 3. ABDM (Ayushman Bharat Digital Mission) Alignment
- **M1 Profile**: ABHA ID creation, verification, and mapping as official secondary identifier in `Patient.identifier`.
- **M2 Profile**: Health Facility Registry (HFR) identification and HIP/HIU provider linking.
- **M3 Profile**: Consent Manager integration: Patients approve time-bound health data exchanges before FHIR Bundles are transmitted.

## 4. Standard Coding Systems
- **Tests & Observations**: LOINC (`http://loinc.org`)
- **Clinical Diagnoses**: ICD-10 (`http://hl7.org/fhir/sid/icd-10`)
- **Procedures**: SNOMED CT (`http://snomed.info/sct`)
- **Units of Measure**: UCUM (`http://unitsofmeasure.org`)

