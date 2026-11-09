# ASRTAVA Medical Device Integration Framework

**Document Reference:** `docs/integrations/MEDICAL_DEVICE_INTEGRATION.md`  
**Standard Protocols:** ASTM 1394-97, CLSI LIS2-A2, HL7 v2.x, RS-232 Serial, TCP/IP Sockets  
**Last Verified:** 2026-11-09

---

## 1. Supported Medical Device Categories

| Category | Typical Equipment | Communication Protocol | Typical Baud / Port |
|---|---|---|---|
| **Hematology Analyzers** | Sysmex XN-1000, Beckman Coulter DxH | ASTM 1394-97 / TCP Sockets | 9600 bps / Port 5000 |
| **Biochemistry Analyzers** | Roche Cobas c311, Abbott Architect | HL7 v2.5.1 / MLLP | Port 5001 |
| **Immunoassay Analyzers** | Siemens Atellica, bioMérieux VIDAS | ASTM 1394-97 / TCP | Port 5002 |
| **Blood Gas Analyzers (ABG)** | Radiometer ABL90, Nova Stat Profile | HL7 ORU^R01 | Port 5003 |
| **Urinalysis Systems** | Sysmex UC-3500, Dirui H-800 | ASTM 1394-97 | Port 5004 |
| **Patient Vital Monitors** | Mindray BeneVision N12, Philips IntelliVue | TCP Socket / Serial | Port 8080 |
| **ECG Machines** | GE MAC 2000, Schiller Cardiovit | DICOM-ECG / PDF / XML | Port 104 / REST |

---

## 2. ASTM 1394-97 Frame Structure & Processing

ASTM 1394 (CLSI LIS2-A2) packets utilize single-character record identifiers:
- **`H` (Header Record)**: Delimiters, transmitter name, analyzer model (`SYS-XN-1000`), software version.
- **`P` (Patient Record)**: Patient sequence, UHID, patient name, birthdate, sex.
- **`O` (Order Record)**: Specimen barcode ID, requested test battery (`CBC`), order priority.
- **`R` (Result Record)**: Universal test identifier (`^^^WBC`), observed numerical data (`8.5`), units (`10^3/uL`), reference range (`4.0-11.0`), abnormal flag (`N`, `L`, `H`, `HH`), test status (`F`).
- **`C` (Comment Record)**: Quality control flags or instrument error descriptions.
- **`L` (Terminator Record)**: Message termination frame.

---

## 3. Real-Time Device Connectivity & Calibration Tracking

- Devices report periodic heartbeat signals (`last_communication_at`).
- Equipment calibration cycles (`last_calibration_date`) are monitored; uncalibrated machines generate proactive administrative warnings before test execution.
- Disconnected devices transition from `active` to `standby` or `offline` after 5 minutes of missed telemetry.

