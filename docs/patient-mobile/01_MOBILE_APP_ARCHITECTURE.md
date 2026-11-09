# ASRTAVA Patient Mobile Application Architecture

## 1. System Vision & Architecture
The ASRTAVA Patient Mobile Application is a cross-platform, enterprise-grade healthcare companion for patients across Android and iOS. Built with **React Native CLI (TypeScript)**, it interfaces with the centralized ASRTAVA Node.js/Express backend (`/api/v1/*`) and PostgreSQL multi-tenant database.

```
+-------------------------------------------------------------------------+
|                  ASRTAVA Patient Mobile App (React Native)              |
|        (TypeScript, Clean Healthcare Design System, Secure Storage)     |
+------------------------------------+------------------------------------+
                                     |
+------------------------------------+------------------------------------+
|                      Mobile Application Modules                         |
|  - Patient Central Identity & Biometric Auth (FaceID / Fingerprint)    |
|  - Multi-Hospital Tenant Switcher (x-hospital-id context injection)     |
|  - Doctor Discovery & Concurrency-Protected Slot Booking                |
|  - Digital Appointment Check-In QR Pass & Directions                    |
|  - Finalized Clinical EMR & Digital Prescriptions (FEFO linked)        |
|  - Pathology Lab Reports with Bio-Reference Ranges & Panic Flags       |
|  - Radiology RIS Reports (X-Ray, CT, MRI, USG) & DICOM Links            |
|  - Hospital Billing Ledger & UPI / Card Online Payment Gateway          |
|  - Inpatient IPD Stays & Discharge Course Summaries                     |
|  - Encrypted Document Uploads (Scans, Previous Prescriptions, Insurance)|
|  - Notification Center (Push, In-App, SMS, WhatsApp)                   |
|  - Family / Dependent Profiles & DPDP 2023 Consent History              |
+------------------------------------+------------------------------------+
                                     | (TLS 1.3 / Axios Client)
+------------------------------------+------------------------------------+
|                   Centralized Backend API Gateways                      |
|       (auth, patients, appointments, clinical, diagnostics, billing)    |
+------------------------------------+------------------------------------+
                                     | (Row-Level Security)
+------------------------------------+------------------------------------+
|                  PostgreSQL 15+ Multi-Tenant Database                   |
+-------------------------------------------------------------------------+
```

## 2. Directory Structure
```
apps/patient-mobile/
├── android/                 # Android Native Gradle Project (SDK 34+, Kotlin/Java)
├── ios/                     # iOS Xcode Workspace (CocoaPods, Swift/Obj-C)
├── src/
│   ├── api/                 # Axios HTTP client, token interceptors, domain APIs
│   ├── components/          # Design system primitives (Header, Button, Card, Badge, Input)
│   ├── screens/
│   │   ├── auth/            # LoginScreen, RegisterScreen
│   │   ├── home/            # HomeScreen (Command center & hospital switcher)
│   │   ├── appointments/    # DoctorDiscovery, BookAppointment, AppointmentDetails
│   │   ├── records/         # Prescriptions, LabReports, Radiology
│   │   ├── billing/         # BillingPayments
│   │   ├── admissions/      # Admissions (IPD)
│   │   ├── documents/       # DocumentUpload
│   │   ├── notifications/   # Notifications
│   │   └── profile/         # Profile, Family, DPDP Consent & Logout
│   ├── theme/               # Primary Teal palette, spacing, typography
│   └── types/               # Full TypeScript interfaces for medical entities
├── tests/                   # Automated validation & security test suite
├── App.tsx                  # Root navigation & deep linking controller
└── package.json             # React Native CLI configuration
```

