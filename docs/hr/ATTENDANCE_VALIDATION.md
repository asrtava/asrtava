# ASRTAVA — Attendance & Biometric Integration Validation

## 1. Overview
ASRTAVA provides a multi-channel attendance architecture accommodating physical biometric hardware devices (fingerprint, facial recognition), RFID cards, mobile check-ins with geo-fencing, and web portal overrides.

## 2. Invariants & Deduplication
1. **Deduplication Window**: In hospital environments, staff often accidentally punch twice within seconds. The system enforces a **2-minute deduplication window** per employee per punch type (`CHECK_IN`, `CHECK_OUT`), ignoring subsequent duplicate signals and returning a 409 Conflict.
2. **Device Independence**: Hardware devices connect via standard network protocols (IP/port 4370) or secure webhook adapters. The system logs device ID, punch timestamp, verification mode, and anomaly flags.
3. **Formal Correction Workflow**: If an employee misses a punch due to prolonged emergency surgery or hardware reboot, they submit a formal attendance correction request with reasons. Only an authorized Department Head or HR manager can approve it, which injects verified correction events into the attendance ledger with an audit trail.

