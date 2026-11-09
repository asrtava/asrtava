# ASRTAVA Preoperative Assessment & Surgical Consent Validation

## 1. Pre-Anaesthetic Checkup (PAC) Protocol
- **ASA Physical Status Classification**:
  - `ASA_I`: Normal healthy patient.
  - `ASA_II`: Patient with mild systemic disease (e.g. controlled hypertension, diabetes).
  - `ASA_III`: Patient with severe systemic disease (e.g. poorly controlled diabetes, stable angina).
  - `ASA_IV`: Patient with severe systemic disease that is a constant threat to life.
  - `ASA_V`: Moribund patient who is not expected to survive without the operation.
  - `ASA_VI`: Declared brain-dead patient whose organs are being harvested.
  - `ASA_E`: Emergency operation suffix.
- **Airway & Mallampati Evaluation**: Class I (Soft palate, uvula, fauces visible) to Class IV (Only hard palate visible).
- **NPO Fasting Rules**:
  - Minimum 6 hours for solid foods.
  - Minimum 2 hours for clear fluids.
  - Cases violating fasting requirements are automatically rejected (`isClearedForSurgery = false`) with pulmonary aspiration hazard warnings.

## 2. Informed Consent Integrity
- Mandatory recording of procedure name, specific risks disclosed, and witness credentials.
- Stored with an immutable cryptographic digital signature hash (`consentSignatureHash`).

