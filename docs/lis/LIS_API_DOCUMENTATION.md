# ASRTAVA Laboratory Information System (LIS) REST API Specification

**Base URL:** `/api/v1/diagnostics/lis/advanced`  
**Authentication:** Bearer JWT (`Authorization: Bearer <TOKEN>`)  
**Content-Type:** `application/json`

---

## 1. Department & Parameter Catalog

### `POST /departments`
Register a laboratory department.
- **Permissions:** `lab.departments.manage`
- **Request Body:** `{ "code": "BIOCHEM", "name": "Clinical Biochemistry", "locationRoom": "Room 204" }`

### `POST /parameters`
Register an analyte parameter with age/sex bio-reference ranges.
- **Permissions:** `lab.test_catalog.manage`
- **Request Body:**
```json
{
  "departmentId": "dept-101",
  "parameterCode": "K_POTASSIUM",
  "parameterName": "Serum Potassium (K+)",
  "unitOfMeasure": "mmol/L",
  "refRangeMaleMin": 3.5,
  "refRangeMaleMax": 5.1,
  "criticalLow": 2.8,
  "criticalHigh": 6.5
}
```

---

## 2. Specimen Lifecycle

### `POST /specimens/accession`
Accession a collected specimen and generate barcode.
- **Permissions:** `lab.specimens.collect`
- **Request Body:** `{ "patientId": "pat-100", "specimenType": "SERUM", "containerType": "SST_GOLD" }`

### `POST /specimens/:id/reject`
Reject an unsuitable specimen.
- **Permissions:** `lab.specimens.reject`
- **Request Body:** `{ "reason": "Hemolyzed sample (Gross hemolysis +++)", "notes": "Redraw required" }`

---

## 3. Results & Two-Tier Validation

### `POST /results`
Enter or import test result. Evaluates reference range and sets panic flags.
- **Permissions:** `lab.results.enter`
- **Request Body:** `{ "specimenId": "spec-01", "parameterId": "param-01", "numericValue": 6.9, "patientSex": "MALE" }`

### `POST /results/:id/validate`
Technical validation by laboratory technologist.
- **Permissions:** `lab.results.validate`

### `POST /results/:id/authorize`
Medical authorization by Pathologist with digital seal.
- **Permissions:** `lab.results.authorize`

### `POST /results/:id/amend`
Issue controlled amendment to an authorized result.
- **Permissions:** `lab.results.amend`
- **Request Body:** `{ "newValue": 6.85, "reason": "Repeated on second analyzer" }`

---

## 4. Quality Control

### `POST /qc/measurements`
Record daily control measurement and run Westgard rule evaluation.
- **Permissions:** `lab.quality_control.manage`
- **Request Body:** `{ "controlLotNumber": "LOT-2026A", "parameterId": "param-01", "targetMean": 4.0, "standardDeviation": 0.1, "measuredValue": 4.35 }`

