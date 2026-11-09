# ASRTAVA — Telehealth Informed Consent Validation

## 1. Regulatory Context & Legal Requirements
In compliance with the Indian Telemedicine Practice Guidelines and DPDP (Digital Personal Data Protection Act), informed consent is mandatory prior to conducting any remote clinical consultation.

---

## 2. Consent Capturing & Verification Architecture
1. **Consent Workflow**:
   - The patient is presented with the consent agreement before being allowed to join the Virtual Waiting Room.
   - The consent form clearly discloses that telemedicine cannot handle acute emergency situations (e.g. cardiac arrest, major trauma, stroke).
   - In emergency situations, patients are advised to call 108 or report immediately to the physical hospital Emergency Department.
2. **Cryptographic Signature Verification**:
   - The consent record captures:
     - Patient identity (`patient_id`)
     - Consent version (`v1.0`)
     - Timestamp
     - Signatory name and relationship (`SELF` or `LEGAL_GUARDIAN`)
     - Signatory IP address
     - SHA-256 integrity hash: $\text{Hash} = \text{SHA256}(\text{PatientID} \parallel \text{Type} \parallel \text{Version} \parallel \text{Timestamp})$
3. **Mandatory Gate**:
   - The Virtual Waiting Room endpoint strictly verifies that an active, valid consent record exists. If not found, the patient's entry into the queue is blocked with `400 Bad Request`.

