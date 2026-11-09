# Module 09: Laboratory Information Management System (LIMS) Specification

## 1. Overview
The Laboratory Information Management System (LIMS) manages clinical pathology test catalogs, specimen collection with unique barcodes, analyzer result entry with biological reference ranges, automated abnormal/critical panic flags, and pathologist digital signature sign-off.

---

## 2. Core Functional Capabilities

### 1. Specimen Accessioning & Barcode Tracking
- Generates a unique barcode accession number per specimen.
- Records vacutainer color code (e.g. Purple EDTA for Hematology, Gold Gel for Biochemistry).
- Logs phlebotomist ID, collection timestamp, and laboratory receipt timestamp.
- Allows specimen rejection with documented clinical reasons (e.g., hemolyzed, clotted, insufficient volume).

### 2. Biological Reference Ranges & Critical Panic Values
Parameters are evaluated against configured ranges:
- **Normal**: Within configured reference interval.
- **Abnormal (High/Low)**: Out of standard bio-reference range.
- **Critical Panic Value**: Extreme life-threatening value (e.g., Troponin-I $> 0.04\text{ ng/mL}$, Potassium $< 2.5\text{ mEq/L}$) triggering urgent phone call alerts and prominent red warning badges.

### 3. Pathologist Digital Sign-Off
- Result entry by lab technologists remains preliminary until verified.
- A licensed pathologist reviews results, appends clinical notes, and digitally signs the report.
- Published reports are immediately available to the consulting doctor's EMR and the Patient Web/Mobile Portal.

---

## 3. API Endpoints
- `GET /api/v1/diagnostics/lab/catalog`: Retrieve diagnostic test catalog with standard fees and reference ranges.
- `POST /api/v1/diagnostics/lab/orders`: Place lab order with priority (`routine`, `urgent`, `stat`).
- `POST /api/v1/diagnostics/lab/order-items/:itemId/result`: Record parameter values and pathologist sign-off.

