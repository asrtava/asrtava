# ASRTAVA Critical / Panic Laboratory Value Escalation Protocol

## 1. Panic Value Policy & Accreditation Standards

In accordance with international accreditation guidelines (CAP / ISO 15189 / NABH), laboratory results representing life-threatening physiological states must be actively communicated to the responsible clinician within **15 minutes** of detection.

---

## 2. Standard Panic Thresholds Table

| Analyte | Parameter Code | Panic Low Threshold | Panic High Threshold | Unit | Clinical Risk |
| :--- | :--- | :---: | :---: | :---: | :--- |
| **Potassium** | `K_POTASSIUM` | $< 2.8$ | $\ge 6.5$ | $\text{mmol/L}$ | Fatal cardiac arrhythmia, asystole |
| **Sodium** | `NA_SODIUM` | $< 120$ | $\ge 160$ | $\text{mmol/L}$ | Cerebral edema, seizures, central pontine myelinolysis |
| **Glucose** | `GLU_FASTING` | $< 45$ | $\ge 450$ | $\text{mg/dL}$ | Hypoglycemic coma, diabetic ketoacidosis |
| **Hemoglobin** | `HB_HEMOGLOBIN` | $< 6.5$ | $\ge 20.0$ | $\text{g/dL}$ | Severe tissue hypoxia, hyperviscosity |
| **Platelets** | `PLT_COUNT` | $< 20,000$ | $\ge 1,000,000$ | $/\mu\text{L}$ | Spontaneous intracranial hemorrhage, thrombosis |
| **Calcium** | `CA_TOTAL` | $< 6.5$ | $\ge 13.0$ | $\text{mg/dL}$ | Tetany, laryngospasm, cardiac arrest |

---

## 3. Verbal Read-Back & Audit Trail

1. **Panic Detection:** System automatically detects critical value and creates a record in `lis_critical_alerts`.
2. **Immediate Telephone Read-Back:** Laboratory staff contacts attending doctor or ward charge nurse by phone.
3. **Mandatory Documentation:**
   - Clinician name and designation.
   - Date and exact time of verbal communication.
   - Confirmation that the recipient read back the patient name, UHID, and critical value.
   - Resulting clinical action taken (e.g. *"Calcium gluconate infusion started, repeat serum potassium in 2 hours"*).

