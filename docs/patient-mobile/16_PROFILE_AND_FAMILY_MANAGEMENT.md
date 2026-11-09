# Patient Profile & Family Management

## 1. Overview (`ProfileScreen.tsx`)
- **Patient Profile**: Full name, UHID, verified mobile number, email, blood group, age, and drug allergies.
- **Linked Hospital Management**: Displays all hospital networks connected to the patient's identity with quick context switching and "+ Add Hospital" linking via OTP.
- **Family & Dependent Records**:
  - Dependent profiles (Spouse, Children, Elderly Parents) with unique UHIDs.
  - Granular authorization badges preventing unauthorized record access across family members.
- **Security & Device Controls**:
  - Biometric quick unlock toggle (FaceID / Fingerprint).
  - WhatsApp notification opt-in.
  - "Log Out Current Device" vs "Log Out All Devices (Revoke Central Sessions)".

