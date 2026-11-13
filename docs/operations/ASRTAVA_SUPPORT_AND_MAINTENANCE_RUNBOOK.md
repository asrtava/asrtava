# ASRTAVA Customer Support & Maintenance Operations Runbook

**Document Reference:** `docs/operations/ASRTAVA_SUPPORT_AND_MAINTENANCE_RUNBOOK.md`  
**Standard:** Enterprise Commercial Support & Maintenance Model  
**Licensing Invariant:** One-Time Perpetual License Ownership; Optional AMC Never Terminates Core Clinical Usage  
**Status:** **READY WITH DOCUMENTED PREREQUISITES**

---

## 1. Executive Summary: The Perpetual Software & Support Model

ASRTAVA is built on an enterprise capital-expenditure (CapEx) software model:
- **Perpetual Usage Rights:** The hospital acquires permanent, non-expiring rights to run the purchased software edition and licensed modules indefinitely on their authorized infrastructure.
- **Independence of Maintenance (AMC):** Annual Maintenance Contracts (AMC) are strictly optional service agreements covering software updates, new feature releases, regulatory patches, and Level-3 engineering support SLAs.
- **The Golden Safety Invariant:** **Lapsing or non-renewal of an AMC locks major version upgrades, but NEVER terminates or disables core clinical software usage.** No "kill switch", timebomb, or recurring subscription lockout can shut down hospital operations.

---

## 2. Customer Support Tiers & Service Level Agreements (SLAs)

| Support Tier | Scope & Coverage | Target Response SLA | Resolution Target | Handling Cadre |
| :---: | :--- | :---: | :---: | :--- |
| **Tier 1 (Hospital Local IT)** | First-line end-user assistance, password resets, hardware peripherals (printers, barcode scanners), local LAN issues. | Immediate on-site | Within 30 minutes | Hospital Internal IT Helpdesk |
| **Tier 2 (ASRTAVA Application Support)** | User workflow questions, role permission adjustments, report template configuration, batch data reconciliation. | $\le 2\text{ hours}$ | $\le 8\text{ hours}$ | ASRTAVA Certified Support Engineers |
| **Tier 3 (Core Engineering & Clinical Safety)** | Critical system defects, database corruption, clinical safety overrides, emergency crash triage, security patches. | **$\le 15\text{ minutes}$** | **$\le 2\text{ hours}$** | ASRTAVA Core Engineering & CMIO Escalation |

---

## 3. Perpetual Licensing Operations

### 3.1 License Issuance & Cryptographic Binding
In `backend/src/modules/licensing/license.service.ts`:
- Platform Super Admin issues a license specifying:
  - Hospital ID (`hospital_id`)
  - Software Edition (`clinic_basic`, `standard_hospital`, `enterprise_multispecialty`, `custom`)
  - Licensed Modules (`ALL_16_MODULES`)
  - Capacity Quotas (`maxBeds`, `maxDoctors`, `authorizedLocations`)
  - Optional Hardware Fingerprint Hash (`hardwareFingerprintHash`)
- The system generates an immutable HMAC-SHA256 signed claims token (`<payload>.<signature>`) using the platform master secret.

### 3.2 Offline Air-Gapped Validation
- On-premises servers validate the claims token entirely in memory using standard SHA-256 HMAC timing-safe equality checks.
- Zero network packets are transmitted to external servers.
- The hospital is protected from vendor server downtime or internet severed cables.

### 3.3 AMC Expiration Rules
When an AMC agreement passes its `end_date`:
1. `is_active` remains `true` on the core software license.
2. `amc_status` transitions to `expired`.
3. The software restricts installation of new major version releases (e.g. v3.0 to v4.0) while permitting all current version operations.
4. An administrative notification banner is displayed to the Hospital Admin with renewal details.
5. **Zero clinical workflows are locked out.**

---

## 4. Maintenance & Support Handover Protocol

During the transition from the Onboarding Phase to Steady-State Maintenance:
1. **Support Desk Registration:** Hospital IT personnel are enrolled in the ASRTAVA 24/7 Ticketing Portal and Emergency Paging Service.
2. **Designated Escalation Officers:** Identification of Primary and Secondary Hospital Incident Commanders.
3. **Runbook Handover:** Delivery of local backup scripts, disaster recovery documentation, and offline license keys.
4. **Scheduled Maintenance Windows:** Established protocol for applying updates (scheduled Sundays 02:00–04:00 AM with mandatory 48-hour prior notice).
5. **Formal Handover Sign-Off:** Dual sign-off between ASRTAVA Implementation Lead and Hospital IT Director.
