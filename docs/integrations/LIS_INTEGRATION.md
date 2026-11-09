# ASRTAVA Laboratory Information System (LIS) Integration

**Document Reference:** `docs/integrations/LIS_INTEGRATION.md`  
**Standard Protocols:** HL7 v2.5.1 (ORM^O01 / ORU^R01), ASTM 1394-97, JSON Webhooks  
**Last Verified:** 2026-11-09

---

## 1. Laboratory Workflow & Bi-Directional Exchange

```mermaid
sequenceDiagram
    participant Doctor as Doctor / OPD Clinic
    participant LISGateway as ASRTAVA LIS Gateway
    participant Analyzer as Sysmex / Roche Analyzer
    participant Pathologist as Pathologist Workstation

    Doctor->>LISGateway: Order Diagnostic Panel (e.g. Complete Blood Count)
    LISGateway->>Analyzer: Transmit Order & Specimen Barcode (ORM / ASTM 'O')
    Analyzer->>Analyzer: Process Specimen & Compute Analytes
    Analyzer->>LISGateway: Stream Results Packet (ORU^R01 / ASTM 'R')
    LISGateway->>LISGateway: Check Bio-Reference Ranges & Panic Values
    alt Panic Value Detected
        LISGateway->>LISGateway: Flag CRITICAL & Quarantine
        LISGateway->>Pathologist: Immediate Critical Alert Notification
    end
    Pathologist->>LISGateway: Review Quality Control & Sign-off
    LISGateway->>LISGateway: Release to Patient EMR Chart & Portal
```

---

## 2. Bio-Reference Ranges & Abnormal Flagging

Incoming laboratory analytes are automatically categorized according to age and gender specific reference intervals:
- **`NORMAL`**: Value falls within expected biological reference interval.
- **`LOW` (`L`)**: Value falls below reference low threshold.
- **`HIGH` (`H`)**: Value exceeds reference high threshold.
- **`CRITICAL` (`HH` / `LL` / `PANIC`)**: Extreme value indicating life-threatening physiological distress (e.g., Potassium > 6.5 mmol/L, Platelets < 20,000 /uL, Troponin I positive).

---

## 3. Pathologist Sign-Off Safety Gate

Under National Medical Commission (NMC) and NABL guidelines:
- Unverified raw analyzer readings **cannot** be auto-released to patient-facing mobile apps or discharge summaries.
- Results remain in `pending_approval` state until a qualified medical biochemist, microbiologist, or pathologist verifies calibration and quality controls.
- Any amendment or correction to previously approved laboratory reports creates a new immutable audit version, preserving original values for legal compliance.

