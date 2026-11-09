# ASRTAVA Laboratory Analyzer & Device Gateway Validation

## 1. Multi-Protocol Ingestion Architecture

ASRTAVA integrates with clinical diagnostic analyzers using standard communication protocols:
- **ASTM 1394-97 (CLSI LIS2-A2):** High-speed multi-frame serial (RS-232) and TCP/IP socket feeds used by automated haematology and biochemistry analyzers (Sysmex, Mindray, Roche Cobas).
- **HL7 v2.5.1 (ORU^R01):** Observational diagnostic result messages with OBX segments and abnormal flag characters.

```
+---------------------------------------------------------------------------------------------------+
|                            AUTOMATED CLINICAL LABORATORY ANALYZER                                 |
+---------------------------------------------------------------------------------------------------+
                                                  │
                             ASTM Frames: H | P | O | R | C | L
                                                  │
                                                  ▼
+---------------------------------------------------------------------------------------------------+
|                                 ASRTAVA ANALYZER GATEWAY SERVICE                                  |
|   Frame Verification  |  Sliding Window Duplicate Check  |  Parameter Code Translation Engine     |
+---------------------------------------------------------------------------------------------------+
                                                  │
                                                  ▼
+---------------------------------------------------------------------------------------------------+
|                                  UNVERIFIED RESULT STAGING QUEUE                                  |
|   Preserves original raw packet  |  Flags out-of-range delta  |  Locks automatic patient release  |
+---------------------------------------------------------------------------------------------------+
                                                  │
                                                  ▼
+---------------------------------------------------------------------------------------------------+
|                                  TECHNOLOGIST TECHNICAL VALIDATION                                |
|   Medical Technologist inspects calibration and flags -> Approves for Pathologist sign-off       |
+---------------------------------------------------------------------------------------------------+
```

---

## 2. Unverified Results Safety Gate

To guarantee patient safety and avoid releasing erroneous values caused by instrument calibration drift or reagent depletion:
1. All instrument-imported measurements enter `lis_test_results` with `validation_status = 'ENTERED'`.
2. Results remain strictly hidden from patient portals, doctor progress charts, and discharge summaries until technical and medical sign-offs are completed.

