# ASRTAVA Ambulance Fleet & Pre-Hospital Mobile PCR Validation

## 1. Ambulance Fleet Categories
- **ALS (Advanced Life Support Mobile ICU)**: Ventilator, multi-parameter defibrillator/monitor, intubation kit, emergency resuscitation drugs. Staffed by licensed emergency paramedic and emergency physician/nurse.
- **BLS (Basic Life Support)**: Oxygen cylinder, automated external defibrillator (AED), suction unit, splints, and stretcher.
- **Neonatal Transport Unit**: Transport infant incubator with micro-ventilator and phototherapy.

## 2. Dispatch Workflow
1. Emergency call logged with caller identity, contact number, and exact GPS coordinates/address.
2. Nearest available ambulance flagged and dispatched (`status = DISPATCHED`).
3. Real-time GPS location tracking and Estimated Time of Arrival (ETA) calculation.

## 3. Pre-Hospital Patient Care Report (Mobile PCR)
- Paramedics record vital signs, GCS, blood glucose, ECG rhythm, and administered medications (e.g. IV fluids, sublingual nitroglycerin, aspirin, epinephrine) directly on the mobile PCR device.
- The PCR data syncs with the hospital ED command dashboard in real time, enabling the trauma team to assemble and prepare the resuscitation bay before ambulance wheels touch the emergency bay.

