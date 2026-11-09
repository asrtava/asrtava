# ASRTAVA India Healthcare Ecosystem Integrations (ABDM & NHCX)

**Document Reference:** `docs/integrations/INDIA_HEALTHCARE_INTEGRATIONS.md`  
**Statutory Frameworks:** Ayushman Bharat Digital Mission (ABDM), National Health Authority (NHA), IRDAI NHCX  
**Last Verified:** 2026-11-09

---

## 1. Ayushman Bharat Digital Mission (ABDM) Integration

ASRTAVA implements standards for the 3 core ABDM milestones:

### Milestone 1 (M1): ABHA Creation & Verification
- **Aadhaar OTP & Mobile Auth**: Integration with NHA UIDAI Gateway for Aadhaar-based OTP verification.
- **ABHA Address Issuance**: Patient registers unique identifier (e.g., `sunil.kumar@abdm`) and linked 14-digit ABHA ID (`91-XXXX-XXXX-XXXX`).
- **QR Code Scanning**: Reception desks scan patient's physical/digital ABHA card for rapid 2-second OPD registration.

### Milestone 2 (M2): Health Information Provider (HIP)
- **Record Linking**: Hospital system discovers and links patient health records based on ABHA address and mobile verification.
- **Encrypted Data Push**: Patient medical records (OPD summaries, diagnostic lab reports, prescriptions) are packaged into FHIR R4 document bundles and encrypted via **ECDH (Elliptic Curve Diffie-Hellman) AES-GCM** before transmission through the NHA Consent Manager.

### Milestone 3 (M3): Health Information User (HIU)
- **Consent Request**: Clinicians request patient permission to view past medical history from other hospitals.
- **View Decrypted Records**: Upon patient mobile approval in their ABHA app, ASRTAVA receives, decrypts, and displays historical diagnoses, medications, and laboratory tests.

---

## 2. National Health Claims Exchange (NHCX)

- ASRTAVA adheres to the IRDAI and NHA NHCX specifications utilizing FHIR R4 `Claim`, `ClaimResponse`, and `CoverageEligibilityRequest` resources.
- Direct digital transmission cuts claim settlement cycles from weeks to hours.

---

## 3. Regulatory Honesty & Empanelment Notice

> [!IMPORTANT]
> While ASRTAVA implements 100% compliant FHIR schemas, ECDH encryption, and ABDM data formats, production connectivity to live NHA production networks requires formal security testing, static IP empanelment, and sandbox exit certification from the National Health Authority. ASRTAVA provides an integrated **ABDM Sandbox & Simulator Engine** for pre-production verification.

