# ASRTAVA HL7 v2.x Healthcare Messaging Guide

## 1. Overview
ASRTAVA implements native parser and serializer services for the **Health Level Seven (HL7) Version 2.5.1** standard, supporting hospital interoperability with legacy lab equipment, hospital information exchanges (HIEs), and modality worklists.

## 2. Supported HL7 Message Types
- `ORU^R01`: Unsolicited Observation Result (Diagnostic lab results transmission)
- `ADT^A01`: Admit / Visit Notification (Inpatient ward admissions)
- `ADT^A08`: Update Patient Information (Demographic revisions)
- `ORM^O01`: General Order Message (Placer / filler diagnostic orders)
- `ACK`: Standard Application Acknowledgement (`AA`, `AE`, `AR`)

## 3. Segment Mapping Reference
| Segment | Name | ASRTAVA Entity Mapping |
|---|---|---|
| `MSH` | Message Header | Sender App, Hospital Tenant Code, Timestamp, Control ID |
| `PID` | Patient Identification | Patient UHID, Full Name, DOB, Biological Sex, Mobile |
| `PV1` | Patient Visit | Inpatient Admission ID, Attending Physician, Assigned Bed |
| `OBR` | Observation Request | Diagnostic Lab Order Number, LOINC Test Code |
| `OBX` | Observation Result | Test Code, Analytes, Value, Units, Bio-Range, Normal/Abnormal Flag |

## 4. Sample HL7 v2.5.1 ORU^R01 Payload
```text
MSH|^~\&|SYSMEX_XN|LAB_AUTOMATION|ASRTAVA_HMS|APEX_HOSPITAL|20261109083000||ORU^R01|MSG-CTRL-99881|P|2.5.1
PID|1||ASR-UHID-1002||Sharma^Rajesh||19850412|M
OBR|1|ORD-2026-001||CBC^Complete Blood Count|||20261109082500||||||||||||||||F
OBX|1|NM|HGB^Hemoglobin||14.5|g/dL|13.0-17.0|N|||F
OBX|2|NM|PLT^Platelet Count||180000|cells/mcL|150000-450000|N|||F
```
Response:
```text
MSH|^~\&|ASRTAVA_HMS|RECEIVER|EXT_LIS|SENDER|20261109083001||ACK|ACK-17042890|P|2.5.1
MSA|AA|MSG-CTRL-99881
```

