# ASRTAVA Radiology Information System & PACS User Manual

## 1. For Radiographers & Imaging Technicians
1. **Navigating Modality Worklists**:
   - Access the *Radiology Dashboard* -> *Enterprise RIS / PACS Suite* -> *Modality Worklists*.
   - Filter by modality (`CT`, `MRI`, `Digital X-Ray`, `Ultrasound`).
   - Confirm patient identity using two unique identifiers (UHID and full name).
2. **Pre-Procedure Safety Checklist**:
   - Before positioning the patient, complete the mandatory safety screening.
   - For contrast-enhanced scans, verify that the patient's eGFR is above 30 mL/min.
   - For MRI procedures, verify that the patient has zero ferromagnetic cardiac pacemakers, neurostimulators, or metallic ocular fragments.
3. **Contrast Administration**:
   - Record the contrast agent trade name, lot number, volume (mL), flow rate (mL/s), and IV cannula gauge in the contrast media tab.

## 2. For Consultant Radiologists
1. **Launching the PACS Diagnostic Workstation**:
   - Select a study from the *Radiology Worklist* and click **Launch DICOM Viewer**.
   - Use window presets (Bone, Soft Tissue, Lung, Brain) to optimize diagnostic inspection.
2. **Structured Reporting**:
   - Enter systematic findings and conclusions.
   - Apply standard classification systems (BI-RADS, LI-RADS) where indicated.
   - Click **Digitally Sign & Release** to generate an immutable cryptographic timestamp and publish to the patient's EMR.
3. **Critical Finding Panic Protocol**:
   - If life-threatening pathology is discovered, check the **Critical Finding** alert box.
   - Immediately place a direct telephone call to the treating physician or ICU nurse, and log the verbal read-back confirmation.

