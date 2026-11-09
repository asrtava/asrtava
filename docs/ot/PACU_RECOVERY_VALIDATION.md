# ASRTAVA Post-Anaesthesia Care Unit (PACU) & Aldrete Recovery Validation

## 1. Post-Anaesthesia Care Unit (PACU) Architecture
The PACU manages immediate emergence from general and regional anaesthesia, monitoring airway patency, hemodynamic stability, shivering, nausea/vomiting, and acute post-surgical pain.

## 2. Modified Aldrete Scoring Methodology
Five physiological parameters rated from 0 to 2 (Maximum Score: 10):

| Parameter | Score 2 | Score 1 | Score 0 |
|:---|:---|:---|:---|
| **Activity** | Moves 4 extremities voluntarily or on command | Moves 2 extremities | Unable to move extremities |
| **Respiration** | Breathes deeply and coughs freely | Dyspneic, shallow, or limited breathing | Apneic or requires mechanical airway |
| **Circulation** | Blood pressure $\pm 20\%$ of pre-op level | Blood pressure $\pm 20-49\%$ of pre-op level | Blood pressure $\pm 50\%$ of pre-op level |
| **Consciousness** | Fully awake and oriented | Arousable on verbal calling | Non-responsive |
| **$O_2$ Saturation** | $SpO_2 > 92\%$ on ambient room air | Needs supplemental $O_2$ to maintain $SpO_2 > 90\%$ | $SpO_2 < 90\%$ even with supplemental $O_2$ |

## 3. Safe Discharge Threshold Assertion
- Safe discharge to an inpatient surgical ward strictly requires $\text{Modified Aldrete Score} \ge 9$.
- Discharging a patient with a score $< 9$ is blocked by hard-stop validation (`PACU_DISCHARGE_BLOCKED`) to prevent ward-level respiratory depression or hypoxemic arrest.

