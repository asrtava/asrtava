# Digital Prescriptions & FEFO Pharmacy Integration

## 1. Overview (`PrescriptionsScreen.tsx`)
Patients can view and verify all active and historical e-prescriptions finalized by attending doctors:
- Tabbed view: `Current Regimen` vs `Prescription Archive`.
- Prescription Card Details:
  - Prescribing Doctor, Department, Hospital, and Consultation Date.
  - ICD-10 Diagnosis (e.g. *I20.9 - Angina Pectoris, Unspecified*).
  - Itemized Drug List:
    - Drug Name & Strength (e.g. *Atorvastatin 20mg*).
    - Dosage (e.g. *1 Tablet*).
    - Frequency (e.g. *Once Daily (Night)*).
    - Duration & Remaining Days Calculation (e.g. *22 Days Left*).
    - Patient Instructions (e.g. *Take with water after dinner*).
- **Direct Actions**:
  - `Download Signed PDF`: Exports digitally signed PDF with physician registration number.
  - `Share with Pharmacy`: Securely dispatches prescription barcode to in-hospital pharmacy POS counter for immediate FEFO batch dispensing.

