# ASRTAVA Post-Launch Engineering Roadmap (v1.1 – v1.3)

**Document Reference:** `docs/release/POST_LAUNCH_ROADMAP.md`  
**Planning Horizon:** Q1 2027 – Q4 2027  
**Guiding Vision:** Transitioning ASRTAVA from a Multi-Tenant Hospital Management System to an AI-Augmented, ABDM-Unified National Healthcare Platform

---

## 1. Roadmap Horizon Overview

```
 [ GA v1.0: Controlled Pilot Launch ]
   -> Core Hospital Management, 12 Portals, Patient Mobile App, Multi-AZ Cloud, Security Hardening
          |
          v
 [ Minor Release v1.1: National Interoperability (Q1 2027) ]
   -> Live ABDM M1/M2/M3 Certification, Edge DICOM Router Appliance, Bi-directional Lab Analyzer Sync
          |
          v
 [ Major Release v1.2: Clinical AI & Diagnostic Decision Support (Q2-Q3 2027) ]
   -> Ambient Doctor AI Scribe, Automated ICD-10 Coding, Drug-Drug Interaction Warning Engine
          |
          v
 [ Enterprise Release v1.3: Healthcare Network Scaling (Q4 2027) ]
   -> Multi-Facility Hospital Chain Consolidation, Continuous IoT Vitals Telemetry, Real-time Bed Exchanges
```

---

## 2. Milestone Deliverables

### Milestone v1.1 — National Interoperability & Medical Hardware Edge
- **Official ABDM Empanelment**: Transition ABHA creation, address linking, and Consent Management from sandbox simulation to full live production certification with the National Health Authority (NHA).
- **ASRTAVA Edge DICOM Appliance**: Lightweight containerized on-premises agent deployed within hospital LANs to bridge physical modality PACS hardware (CT/MRI) directly into cloud S3 storage via TLS tunnels.
- **Bi-directional Laboratory Analyzer Sync**: Direct RS-232 and TCP/IP ASTM/HL7 drivers for automated blood chemistry and hematology analyzer result ingestion.

### Milestone v1.2 — Clinical AI & Decision Support System (CDSS)
- **Ambient AI Clinical Scribe**: Real-time speech-to-text consultation transcription generating draft SOAP consultation notes for doctor review.
- **Automated ICD-10 & SNOMED-CT Coding**: Machine learning suggestion engine mapping clinical impressions to standardized international diagnosis codes.
- **Real-Time Drug-Drug & Drug-Allergy Interaction Engine**: Microsecond safety check intercepting e-prescriptions when contraindications or patient allergies are detected.

### Milestone v1.3 — Multi-Facility Network Scaling & IoT Telemetry
- **Cross-Branch Centralized Billing & Corporate TPA Portal**: Unified insurance desk managing claims across 20+ hospital branches under a single corporate parent entity.
- **Continuous Inpatient IoT Telemetry**: MQTT / WebSocket ingestion of telemetry data from patient bedside monitors (ECG, pulse oximetry, blood pressure) triggering instant nursing station alarms.
- **Regional Bed & Blood Bank Exchange**: Inter-hospital exchange platform allowing affiliated hospitals to query ICU bed availability and rare blood unit reserves during municipal emergencies.

