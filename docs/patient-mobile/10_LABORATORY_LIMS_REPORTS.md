# Laboratory LIMS Reports & Panic Flag Detection

## 1. Overview (`LabReportsScreen.tsx`)
Displays verified pathology, biochemistry, and hematology test results released by hospital laboratories:
- Test Name, Category, Ordering Physician, and Authorization Date.
- Structured Results Table:
  - Investigation / Parameter (e.g. *Total Cholesterol*, *Triglycerides*, *Troponin I*).
  - Measured Result & Unit (e.g. *215 mg/dL*).
  - Reference Bio-Range (e.g. *< 200 mg/dL*).
  - Normal vs Abnormal Panic Indicators:
    - Normal results rendered in Green.
    - Out-of-range results highlighted in Red with a `⚠️` warning flag.
- Clinical Disclaimer: Explicit medical note that lab investigations require physician interpretation.
- Download Button: Fetches pathologist-signed diagnostic PDF.

