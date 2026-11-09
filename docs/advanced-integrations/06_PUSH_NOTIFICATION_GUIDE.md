# ASRTAVA Push Notification Integration Guide

## 1. Overview
The ASRTAVA mobile push notification adapter connects with **Firebase Cloud Messaging (FCM)** for Android and Apple Push Notification service (**APNs**) for iOS native mobile applications.

## 2. Privacy-Preserving Lock-Screen Previews
Mobile device lock screens are considered semi-public surfaces visible to family members or bystanders. Under HIPAA and Indian DPDP Act 2023 guidelines, push notifications emitted by ASRTAVA **never reveal diagnostic findings or sensitive health conditions** on device lock screens.

### Preview Sanitization Rules:
- **Sensitive Clinical Test Ready**: Displays *"New Diagnostic Report: A verified report has been published to your medical chart. Log in to review."* (Never reveals *"HIV Positive"* or *"Biopsy Malignancy"*).
- **Billing Notification**: Displays *"New Billing Statement: Invoice INV-0042 has been generated."*
- **Appointment Pass**: Displays *"Appointment Confirmed: Scheduled for 10:30 AM with Dr. Sharma."*

## 3. Deep-Linking Structure
Push notification payloads deliver secure deep links handled by the React Native CLI mobile application (`apps/patient-mobile`):
- `asrtava://appointments/:id`: Opens digital optical consultation pass
- `asrtava://records/labs`: Opens lab reports viewer
- `asrtava://records/radiology`: Opens imaging reports
- `asrtava://billing`: Opens outstanding invoice checkout

When tapped, the mobile app verifies biometric FaceID/fingerprint or session token before displaying the protected view.

