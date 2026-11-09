# ASRTAVA Known Limitations, Operational Boundaries & Workarounds

**Document Reference:** `docs/release/KNOWN_LIMITATIONS.md`  
**Assessment Date:** 2026-11-09  
**Version:** ASRTAVA 1.0.0-RC1  
**Principle:** Radical Transparency & Clinical Engineering Rigor

---

## 1. Known Architectural & Operational Boundaries

To maintain engineering integrity, the following limitations, external dependencies, and operational boundaries in Release Candidate 1 (RC1) are formally documented:

---

## 2. Itemized Limitations Register

### 2.1 Ayushman Bharat Digital Mission (ABDM) Live Connectivity
- **Limitation**: While all internal database schemas, ABHA number validations, consent artefact models, and FHIR R4 transformers are implemented, direct integration with the National Health Authority (NHA) gateway is currently operating in **Sandbox Simulation Mode**.
- **Root Cause**: Commercial access to NHA production endpoints requires institutional accreditation, static IP whitelisting, and security audit empanelment by the NHA.
- **Operational Workaround**: Local development and staging environments use the internal NHA mock harness (`modules/integrations/abdm.ts`). Patient registration functions seamlessly with standard UHIDs.

### 2.2 Physical PACS / DICOM Hardware Integration
- **Limitation**: Direct C-STORE and C-FIND communication with physical GE, Siemens, or Philips hospital imaging machines requires an on-premises DICOM router or VPN gateway within the hospital local area network (LAN).
- **Current State**: The cloud-hosted DICOMweb abstraction (WADO-RS) serves pre-uploaded multipart DICOM studies and generates 15-minute signed viewer tokens.
- **Workaround**: For pilot hospitals, radiologists upload studies via the secure Web Portal S3 presigned upload bridge until dedicated site-to-site IPsec VPN tunnels are established.

### 2.3 Third-Party Communication Gateways in Local Environments
- **Limitation**: Automated WhatsApp notifications (via Meta Cloud API) and SMS OTPs (via MSG91 DLT) require active vendor subscription credentials.
- **Current State**: In development and unconfigured environments, the system falls back to structured console logging (`[MOCK_SMS] OTP for +91-9876543210 is 492104`) without crashing the application thread.
- **Remediation**: Hospital administrators must supply approved MSG91 DLT Entity IDs and Meta Business verification tokens in production environment variables.

### 2.4 Multi-Region Disaster Recovery Topology
- **Limitation**: ASRTAVA is architected as an **Active-Passive Multi-AZ** deployment in AWS `ap-south-1` (Mumbai) with asynchronous automated snapshot replication to AWS `ap-south-2` (Hyderabad).
- **Boundary**: Full failover to `ap-south-2` is not active-active multi-master. In the event of catastrophic failure of the entire Mumbai AWS region, automated failover requires 15 to 30 minutes of orchestration time (Recovery Time Objective: RTO < 30 min).

### 2.5 Multi-Facility Inter-Hospital Inventory Transfers
- **Limitation**: Drug inventory and batch movements are strictly isolated per hospital facility. Automated inter-hospital transfers between two separate legal hospital entities require explicit export/import documentation rather than automated single-click stock reallocation.
- **Clinical Justification**: Mandated by state drug licensing laws; stock transfers between distinct legal pharmacies require formal GST tax invoices and drug license declarations.

