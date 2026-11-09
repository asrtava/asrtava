# ASRTAVA — Remote Patient Monitoring (RPM) & Clinical Alerts Validation

## 1. Overview
The Remote Patient Monitoring (RPM) engine allows clinicians to track high-risk chronic patients (Hypertension, Diabetes, Congestive Heart Failure, COPD, Postoperative) from their homes, detecting early decompensation before it escalates into hospital readmission.

---

## 2. Clinical Thresholds & Alert Engine
Hospital clinical governance sets target physiological bands for each monitored vital sign. Measurements are classified automatically upon receipt:

| Metric Type | Normal Range | Warning Range | Critical Emergency Limit |
|---|---|---|---|
| **Systolic BP** | 90 – 139 mmHg | 140 – 179 mmHg | $\ge 180$ or $\le 80$ mmHg |
| **Diastolic BP** | 60 – 89 mmHg | 90 – 119 mmHg | $\ge 120$ or $\le 50$ mmHg |
| **Blood Glucose** | 70 – 140 mg/dL | 141 – 299 mg/dL | $\ge 300$ or $\le 55$ mg/dL |
| **Oxygen Saturation (SpO2)** | 95 – 100 % | 91 – 94 % | $\le 90$ % |
| **Heart Rate** | 60 – 100 bpm | 101 – 129 bpm | $\ge 130$ or $\le 45$ bpm |

---

## 3. Clinician Acknowledgement & Emergency Escalation
1. When a reading breaches critical thresholds (e.g. Systolic BP = 190 mmHg), a high-priority alert is immediately dispatched into `rpm_alerts` with status `UNACKNOWLEDGED`.
2. Push notifications and SMS alerts are triggered to the on-call tele-monitoring nurse and managing cardiologist.
3. The clinician reviews the alert, records an emergency outreach instruction, and marks status as `ESCALATED`.

