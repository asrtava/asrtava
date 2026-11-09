# ASRTAVA RIS / PACS REST API Specification

## Base Path
`/api/v1/diagnostics/ris/advanced`

## Endpoints

### 1. Modality Registration
- **POST** `/modalities`
- **Request Body**:
  ```json
  {
    "hospitalId": "hosp-apex-001",
    "modalityCode": "MOD-CT-01",
    "modalityType": "CT",
    "name": "Siemens Somatom Force 128-Slice",
    "aeTitle": "SOMATOM_CT1",
    "ipAddress": "192.168.10.45",
    "portNumber": 104,
    "locationRoom": "Rad-Suite 101"
  }
  ```

### 2. Modality Appointment Scheduling
- **POST** `/appointments`
- **Request Body**:
  ```json
  {
    "hospitalId": "hosp-apex-001",
    "orderId": "order-101",
    "modalityId": "mod-101",
    "scheduledStart": "2026-11-10T10:00:00Z",
    "scheduledEnd": "2026-11-10T10:30:00Z",
    "radiographerUserId": "user-tech-anil"
  }
  ```

### 3. Patient Pre-Screening
- **POST** `/screenings`
- **Request Body**:
  ```json
  {
    "hospitalId": "hosp-apex-001",
    "appointmentId": "appt-101",
    "patientId": "pat-101",
    "egfrValue": 78,
    "isContrastAllergyHistory": false,
    "isPacemakerOrFerrousImplant": false,
    "isPregnant": false,
    "screenedByUserId": "user-dr-sethi"
  }
  ```

### 4. PACS Study Indexing
- **POST** `/pacs/studies`
- **Request Body**:
  ```json
  {
    "hospitalId": "hosp-apex-001",
    "studyInstanceUid": "1.2.840.113619.2.55.3.2831154.99120",
    "accessionNumber": "ACC-2026-9041",
    "patientId": "pat-101",
    "studyDate": "2026-11-09",
    "studyTime": "10:15:00",
    "studyDescription": "CT Thorax High-Resolution (HRCT)",
    "modality": "CT",
    "totalSeries": 4,
    "totalInstances": 684,
    "storageUri": "dicom-archive://pacs/ct/2026/11/09/ACC-2026-9041.tar"
  }
  ```

### 5. Structured Reporting & Digital Signature
- **POST** `/reports` (Drafts report)
- **POST** `/reports/:reportId/authorize` (Digitally signs and releases report)
- **POST** `/reports/:reportId/amend` (Attaches versioned legal addendum)
- **POST** `/critical-findings/:alertId/confirm-read-back` (Verifies verbal telephone read-back)
- **POST** `/contrast/administer` (Records contrast agent, volume, flow rate, and lot)

