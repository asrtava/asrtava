# ASRTAVA Patient Monitoring & Early Warning System (NEWS2) Validation

## 1. Early Warning Scoring Architecture

ASRTAVA implements the clinically validated **National Early Warning Score 2 (NEWS2)** endorsed by the Royal College of Physicians to detect acute physiological deterioration and sepsis early.

```
+---------------------------------------------------------------------------------------------------+
|                                 PHYSIOLOGICAL OBSERVATION CAPTURE                                 |
|  Systolic BP  |  Heart Rate  |  Respiratory Rate  |  Temperature  |  SpO2  |  Supplemental O2     |
+---------------------------------------------------------------------------------------------------+
                                                  │
                                                  ▼
+---------------------------------------------------------------------------------------------------+
|                                     NEWS2 SCORING ENGINE                                          |
|                                                                                                   |
|  Parameter           3          2          1          0          1          2          3          |
|  Respiration      <= 8         --       9-11      12-20         --      21-24      >= 25          |
|  SpO2 Scale 1    <= 91      92-93      94-95      >= 96         --         --         --          |
|  Air or Oxygen      --     Oxygen         --        Air         --         --         --          |
|  Systolic BP     <= 90     91-100    101-110    111-219         --         --     >= 220          |
|  Pulse Rate      <= 40         --      41-50      51-90     91-110    111-130     >= 131          |
|  Consciousness      --         --         --      Alert         --         --    V, P, or U       |
|  Temperature    <= 35.0        --  35.1-36.0  36.1-38.0  38.1-39.0    >= 39.1         --          |
+---------------------------------------------------------------------------------------------------+
                                                  │
                                                  ▼
+---------------------------------------------------------------------------------------------------+
|                                     CLINICAL RISK CLASSIFICATION                                  |
|                                                                                                   |
|  Aggregate Score 0 - 4       --> LOW RISK     (Routine monitoring Q4H - Q6H)                      |
|  Aggregate Score 5 - 6       --> MEDIUM RISK  (Urgent nurse review, increase to Q1H)              |
|  Aggregate Score >= 7        --> HIGH RISK    (Immediate Medical Emergency Team / Doctor Call)     |
+---------------------------------------------------------------------------------------------------+
```

---

## 2. Alert Escalation & Acknowledgement Lifecycle

The system separates alert delivery from clinical acknowledgement:
1. `ALERT_TRIGGERED`: When NEWS2 $\ge 5$ or single red score ($=3$), alert is created and sent to ward nursing station.
2. `DELIVERED_TO_DEVICE`: Broadcast sent via WebSocket and in-app banner.
3. `CLINICALLY_ACKNOWLEDGED`: Nurse acknowledges alert, entering clinical action notes (e.g. *"MET activated, non-rebreather mask applied"*).
4. `ACTION_DOCUMENTED`: Attending physician arrives, reviews chart, and records clinical escalation note.

