# ASRTAVA — Telemedicine & Remote Patient Care User Guide

## 1. Quick Navigation
In the Patient Web Portal ([`PatientDashboard.tsx`](file:///c:/Users/madha/Desktop/Medical_Project/apps/web-portal/src/portals/patient/PatientDashboard.tsx)), select the **Telemedicine & Virtual Care** tab to access the complete remote care suite.

---

## 2. Patient Guide: Booking & Attending Teleconsultation
1. **Find Doctor**: Navigate to **Doctor Discovery & Booking**. Filter by specialty (e.g. Cardiology, Endocrinology).
2. **Book Slot**: Select your preferred time slot, describe symptoms, review fee (e.g. ₹800), and click **Pay & Confirm Booking**.
3. **Sign Consent**: Complete the digital informed consent agreement before entry.
4. **Enter Waiting Room**: 15 minutes before your slot, click **Join Waiting Room**. Review camera, microphone, and internet connection indicators.
5. **Video Call**: Once the doctor admits you, the WebRTC video stream begins. Toggle mute/cam, share clinical documents in the in-call chat, and consult with your physician.
6. **Post-Call Summary**: View your digital prescription (eRx), investigation orders, and follow-up appointment details directly in your portal.

---

## 3. Remote Patient Monitoring (RPM) Guide
1. Navigate to **Remote Patient Monitoring (RPM)**.
2. Select your measurement type (e.g. Blood Pressure, Blood Glucose, SpO2, Heart Rate).
3. Input the reading and submit.
4. The system validates the reading against clinical target thresholds. If a critical value is detected (e.g. Systolic BP $\ge 180$), an immediate emergency alert is dispatched to your managing care team.

