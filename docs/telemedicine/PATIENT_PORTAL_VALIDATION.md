# ASRTAVA — Patient Web Portal Telemedicine Integration Validation

## 1. Overview
The Patient Web Portal (`apps/web-portal`) provides a unified, accessible, and responsive interface for patients to discover doctors, book appointments, join the virtual waiting room, attend WebRTC video consultations, record home vitals, and access verified educational content.

---

## 2. Integrated Portal Components
1. **Telemedicine & Virtual Care Tab**: Mounted directly inside [`PatientDashboard.tsx`](file:///c:/Users/madha/Desktop/Medical_Project/apps/web-portal/src/portals/patient/PatientDashboard.tsx), featuring:
   - **Doctor Discovery**: Interactive specialty filter, experience, qualifications, and consultation mode pills.
   - **Virtual Waiting Room**: Live queue position countdown, pre-flight device check (Camera, Mic, Speaker, 42 Mbps bandwidth), and preparation checklist.
   - **WebRTC Call View**: HD video viewport, Picture-in-Picture (PIP) self-view, in-call encrypted chat, microphone/video controls, and call timer.
   - **Remote Patient Monitoring (RPM)**: Daily vitals logger (Blood Pressure, Glucose, SpO2, Heart Rate) and longitudinal history table with clinical severity indicators.
   - **Patient Education Library**: Peer-reviewed hospital health guides with verified clinician authorship.

