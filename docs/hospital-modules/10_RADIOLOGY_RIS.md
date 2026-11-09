# Module 10: Radiology Information System (RIS) Specification

## 1. Overview
The Radiology Information System (RIS) coordinates diagnostic medical imaging orders, modality suite management (CT, MRI, Digital X-Ray, Ultrasound), PACS study linking, preliminary findings, and structured radiologist reports.

---

## 2. Core Functional Capabilities

### 1. Modality Worklist & Study Tracking
- Tracks imaging requests across modalities:
  - **CT**: Computed Tomography (e.g. HRCT Chest, CT Coronary Angiogram)
  - **MRI**: Magnetic Resonance Imaging (e.g. Brain, Spine, Knee)
  - **X-Ray**: Digital Radiography (AP, Lateral, Oblique views)
  - **Ultrasound (USG)**: Abdomen, Pelvis, Doppler studies
- Generates a unique PACS Study Instance UID (`STUDY-MODALITY-XXXXX`).

### 2. Structured Diagnostic Reporting
Follows standardized radiological reporting structures:
- **Clinical Indication**: Referring physician's query and relevant symptoms.
- **Technique**: Slice thickness, contrast administration (IV / Oral), views captured.
- **Findings**: Detailed anatomic evaluation across organ systems.
- **Impression**: Final diagnostic conclusion and differential diagnosis.
- **Digital Signature**: Radiologist identity and timestamp.

---

## 3. API Endpoints
- `GET /api/v1/diagnostics/radiology/orders`: Modality worklist filtering by scheduled date and status.
- `POST /api/v1/diagnostics/radiology/orders`: Place imaging order with clinical indication.
- `POST /api/v1/diagnostics/radiology/reports`: Record findings, impression, and radiologist approval.

