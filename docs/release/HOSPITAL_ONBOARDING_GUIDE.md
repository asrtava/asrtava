# ASRTAVA Hospital Onboarding & First-Time Configuration Guide

**Document Reference:** `docs/release/HOSPITAL_ONBOARDING_GUIDE.md`  
**Target Audience:** Hospital Administrators, Implementation Specialists, Platform Onboarding Engineers  
**Application Component:** `apps/web-portal/src/auth/OnboardingWizard.tsx`

---

## 1. Overview of the 20-Step Hospital Onboarding Lifecycle

To ensure clinical safety, regulatory compliance, and smooth operations, a newly registered hospital must progress through a 20-step onboarding and verification framework before clinical workflows (OPD, IPD, e-Prescriptions, and Pharmacy Dispensing) can be activated.

```
[ Step 1-5: SaaS Registration & Verification ]
  -> Hospital Registration -> Identity Verification -> Tenant Provisioning -> Subscription -> Activation
         |
         v
[ Step 6-10: Hospital Infrastructure Configuration ]
  -> Primary Admin Creation -> Hospital Profile & GST -> Branch Locations -> Clinical Departments -> Services
         |
         v
[ Step 11-15: Clinical Staff & Financial Policy ]
  -> Medical Staff Onboarding -> Staff Access & Roster -> RBAC & Overrides -> Doctor Fee Tariffs -> GST / Tax Setup
         |
         v
[ Step 16-20: Departmental Calibration & Go-Live ]
  -> Pharmacy FEFO Setup -> Lab / Radiology Calibration -> Notification Preferences -> Patient Portal Open -> Normal Operations
```

---

## 2. Detailed Step-by-Step Execution Guide

### Phase I: Institutional Registration & SaaS Tenancy (Steps 1–5)
1. **Hospital Registration**: Hospital legal representative submits entity details (Hospital Name, Clinical Establishment Registration No., State Council License) via `/register-hospital`.
2. **Entity Verification**: Super Admin review team validates the medical license and institution registration against the state healthcare registry.
3. **Tenant Provisioning**: System provisions the tenant record, isolated database schema namespace, default clinical roles, and sets `current_status = 'PROVISIONED'`.
4. **Subscription Selection**: Admin selects subscription tier (Silver: up to 15 beds, Gold: up to 50 beds, Platinum: up to 250 beds, Enterprise: custom).
5. **Account Activation**: Initial platform billing cycle initiated; hospital tenancy transitions to `ACTIVE_ONBOARDING`.

### Phase II: Organizational & Facility Setup (Steps 6–10)
6. **Primary Hospital Administrator Creation**: Creates Hospital Owner / Medical Director account with mandatory RFC 6238 TOTP Two-Factor Authentication.
7. **Hospital Profile & Statutory Configuration**: Uploads institution logo, hospital address, contact information, PAN, and GSTIN registration numbers.
8. **Branch Locations**: Adds physical hospital campuses (Main Hospital, Specialty Clinic Branch, Satellite Center).
9. **Clinical Departments**: Configures departments (e.g., General Medicine, Cardiology, Pediatrics, Obstetrics & Gynecology, Orthopedics, General Surgery).
10. **Clinical Services Catalog**: Defines service categories (e.g., OPD Consultations, Emergency Triage, ICU Care, Daycare Surgery).

### Phase III: Medical Staffing & Governance (Steps 11–15)
11. **Doctor Onboarding**: Registers physicians with State Medical Council (SMC) registration numbers, specialties, and consultation room assignments.
12. **Staff Onboarding**: Adds nursing staff, pharmacists, laboratory technicians, radiologists, receptionists, and billing clerks.
13. **Role & Permission Customization**: Customizes role assignments; configures explicit `ALLOW` or `DENY` overrides for sensitive actions (e.g., VIP patient record access).
14. **Consultation Tariffs & Fee Schedules**: Configures doctor fee schedules (First Visit, Review / Follow-Up within 14 days, Emergency Consult).
15. **Billing & Tax Policies**: Configures CGST/SGST rates (typically 18% on applicable non-exempt hospital tariffs), rounding rules, and billing folio numbering schemes.

### Phase IV: Departmental Activation & Clinical Go-Live (Steps 16–20)
16. **Pharmacy & Inventory Configuration**: Configures drug store locations, batch alert thresholds (default 90-day expiry warning), and initial stock receipts via FEFO.
17. **Laboratory & Radiology Calibration**: Configures diagnostic test menu, bio-reference ranges (Male, Female, Pediatric), analyzer formats, and DICOM modality endpoints.
18. **Notification Gateway Preferences**: Selects notification channels (WhatsApp, SMS, Email) and configures message templates for appointment reminders.
19. **Patient Registration Gateway**: Enables public patient self-service portal, mobile app discovery, and reception kiosk check-in modes.
20. **Final Clinical Go-Live**: The Medical Director completes the Pre-Flight Safety Verification Checklist; clinical locks are lifted, and normal patient operations commence.

---

## 3. Pre-Flight Clinical Lock Enforcement

> [!CAUTION]
> **Safety Guard**: Clinical consultation and inpatient admission modules remain hard-locked in the user interface and backend API until Steps 1 through 17 are completed and verified. Attempting to schedule patients or allocate beds prior to completing fee schedules, staff rosters, and department setups returns HTTP `428 Precondition Required`.

