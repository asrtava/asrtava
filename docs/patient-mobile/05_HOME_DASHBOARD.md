# Patient Home Dashboard Specification

## 1. Overview
The Home Screen (`HomeScreen.tsx`) is the primary landing view for authenticated patients:
1. **Header & Profile Summary**: Personalized greeting, full name, avatar letter, and unread notification bell.
2. **Active Hospital Switcher**: Highlights currently active hospital and provides horizontal pill switcher to change active hospital context on the fly.
3. **Medical Identity & Allergy Bar**: Displays permanent UHID (`APEX-2026-00084`), blood group (`O+`), age, and prominent red warning banner if drug allergies are recorded (e.g. *Penicillin*).
4. **Live Upcoming Appointment Widget**: Displays attending doctor, specialty, assigned Token number, estimated queue wait time, OPD room number, and quick action to view Check-In QR Pass.
5. **8 Quick Action Tiles**:
   - `Book Visit` 📅
   - `Find Doctor` 🩺
   - `Prescriptions` 💊
   - `Lab Reports` 🔬
   - `Radiology` 🩻
   - `Pay Bills` 💳
   - `Admissions` 🛏️
   - `Upload Files` 📁
6. **Active Medications Summary**: Real-time remaining medication days (e.g. *Atorvastatin 20mg - 22 Days Left*).
7. **24/7 Emergency Support Contact**: Direct 1-tap dialer for ambulance dispatch and emergency trauma center intake.

