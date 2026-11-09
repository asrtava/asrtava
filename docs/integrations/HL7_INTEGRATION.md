# ASRTAVA HL7 Integration Specification

**Document Reference:** `docs/integrations/HL7_INTEGRATION.md`  
**Standard:** HL7 Version 2.5.1 Standard for Electronic Data Exchange in Healthcare  
**Transport:** MLLP (Minimal Lower Layer Protocol) over TCP/IP and HTTP REST Gateway  
**Last Verified:** 2026-11-09

---

## 1. Supported HL7 v2 Message Types

| Message Type | Trigger Event | Clinical Workflow | Description |
|---|---|---|---|
| **ADT^A01** | Admission | Inpatient Admission | Patient admitted to hospital ward/bed. |
| **ADT^A03** | Discharge | Inpatient Discharge | Patient discharged; bed transitioned to cleaning cycle. |
| **ADT^A08** | Update | Demographics Change | Patient profile, contact, or guardian update. |
| **ORM^O01** | Order | Order Requisition | Laboratory or Radiology diagnostic test placed. |
| **ORU^R01** | Observation | Result Transmission | Pathology analyte or diagnostic imaging result finalized. |
| **SIU^S12** | Schedule | Appointment Booking | OPD consultation slot confirmed for doctor. |
| **MDM^T02** | Document | Document Status | Clinical progress note or discharge summary signed. |
| **ACK** | Any | Acknowledgement | Application Accept (`AA`), Error (`AE`), or Reject (`AR`). |

---

## 2. Segment Parsing & Field Mapping

```text
MSH|^~\&|LAB_SYS|APEX_CARE|ASRTAVA_HMS|MAIN|20261109120000||ORU^R01|MSG-CTRL-9921|P|2.5.1
PID|1||UHID-2026-8801||Verma^Arjun||19820410|M|||Connaught Place^New Delhi^^110001||+919811122233
PV1|1|O|||||DOC-102^Gupta^Sanjay|||||||||||VISIT-7701
OBR|1|ORD-501|FILL-501|CBC^Complete Blood Count|||20261109113000
OBX|1|NM|6690-2^Leukocytes|1|8.5|10^3/uL|4.0-11.0|N|||F
OBX|2|NM|718-7^Hemoglobin|1|15.2|g/dL|13.5-17.5|N|||F
```

- **`MSH`**: Message Header (`sendingApp`, `sendingFacility`, `messageType`, `messageControlId`, `version`).
- **`PID`**: Patient Identification (`patientId`, `uhid`, `patientName`, `dob`, `gender`, `address`, `phone`).
- **`PV1`**: Patient Visit (`patientClass`, `assignedLocation`, `attendingDoctor`, `visitNumber`).
- **`OBR`**: Observation Request (`placerOrderNumber`, `fillerOrderNumber`, `universalServiceId`, `observationDateTime`).
- **`OBX`**: Observation Result (`valueType`, `observationIdentifier`, `observationValue`, `units`, `referenceRange`, `abnormalFlags`, `resultStatus`).

---

## 3. Acknowledgement Generation (ACK)

Every incoming HL7 message receives a deterministically constructed ACK:

```text
MSH|^~\&|ASRTAVA_HMS|APEX_CARE|EXTERNAL_CLIENT|EXTERNAL_FACILITY|20261109120001||ACK|ACK-179421777-101|P|2.5.1
MSA|AA|MSG-CTRL-9921|Message processed successfully into clinical outbox
```

- **`AA` (Application Accept)**: Syntax valid, patient matched, clinical record updated.
- **`AE` (Application Error)**: Schema violation, missing required MSH-9 or PID-3.
- **`AR` (Application Reject)**: Duplicate `messageControlId` detected within sliding window.

