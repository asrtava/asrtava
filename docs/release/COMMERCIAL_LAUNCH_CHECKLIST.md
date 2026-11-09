# ASRTAVA Commercial Product Readiness & Launch Checklist

**Document Reference:** `docs/release/COMMERCIAL_LAUNCH_CHECKLIST.md`  
**Commercial Model:** B2B Multi-Tenant SaaS (Subscription per Bed / Doctor per Month)  
**Launch Target:** General Availability (GA) Commercial Release 1.0

---

## 1. Commercial Product Packaging & Subscription Tiers

ASRTAVA commercial tiers are structured to accommodate standalone specialty clinics, mid-size community hospitals, and multi-specialty healthcare networks:

| Plan Name | Target Customer Segment | Bed Limit | Included Doctor Accounts | Storage Quota | Monthly Price (INR) |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **Silver Tier** | Specialty Daycare Clinics / Nursing Homes | Up to 15 Beds | Up to 5 Doctors | 50 GB | ₹9,999 / mo |
| **Gold Tier** | Community & Secondary Care Hospitals | Up to 50 Beds | Up to 20 Doctors | 250 GB | ₹24,999 / mo |
| **Platinum Tier**| Multi-Specialty Tertiary Hospitals | Up to 200 Beds | Up to 75 Doctors | 1,000 GB | ₹59,999 / mo |
| **Enterprise Tier**| Hospital Chains / Medical Colleges | Unlimited | Custom | Dedicated S3 Pool| Custom Quote |

*Note: All subscription tiers include 18% GST invoice generation, unlimited receptionist and nurse accounts, and full patient mobile application access.*

---

## 2. Separation of Commercial SaaS & Hospital Patient Billing

```
+---------------------------------------------------------------------------------------------------+
|                                 STRICT FINANCIAL SUBSYSTEM ISOLATION                              |
|                                                                                                   |
|  [ ASRTAVA Platform SaaS Billing ]                       [ Hospital Patient Billing ]             |
|    - Hospital Tenant -> ASRTAVA SaaS Platform              - Hospital Tenant -> Inpatient / OPD   |
|    - Monthly Subscription Fees (Silver/Gold/Plat)          - Room Rents, Consultations, Drugs     |
|    - Invoiced to Hospital Business Entity                  - Invoiced to Individual Patients      |
|    - Settled via Stripe / Razorpay B2B Billing             - Settled via Cash, Card, UPI, TPA     |
|    - Super Admin Dashboard Scope                           - Hospital Finance Portal Scope        |
+---------------------------------------------------------------------------------------------------+
```

---

## 3. Commercial Launch Feature Scope vs. Post-Launch Roadmap

### 3.1 Features Included in Commercial Launch (GA v1.0)
- [x] Complete multi-tenant hospital onboarding and subscription provisioning.
- [x] 12 role-specific portals (Super Admin, Hospital Admin, Doctor, Nursing, Reception, Pharmacy, Laboratory, Radiology, Finance, HR, Inventory, Patient).
- [x] Outpatient Department (OPD) queue token management & SOAP consultation notes.
- [x] Inpatient Department (IPD) bed allocation, ward monitoring, and atomic discharge.
- [x] Pharmacy inventory management with First-Expiry-First-Out (FEFO) dispensing.
- [x] Laboratory specimen collection, test processing, and critical alert highlighting.
- [x] Consolidated hospital invoicing with automated CGST/SGST 18% calculation.
- [x] Native Patient Mobile Application (Android AAB & iOS IPA) with appointment booking and QR check-in.
- [x] Cryptographic Merkle chain audit logging for non-repudiation.
- [x] Zero-standing-privilege JIT support ticket framework.

### 3.2 Features Scheduled for Post-Launch Releases (v1.1 – v1.3)
- [ ] Direct NHA ABDM Gateway integration (v1.1 - pending official NHA empanelment).
- [ ] Bi-directional live PACS C-STORE integration with physical radiology hardware (v1.1).
- [ ] AI-assisted clinical diagnosis differential generator and ICD-10 auto-coder (v1.2).
- [ ] Inter-hospital multi-facility automated drug batch redistribution (v1.3).
- [ ] Wearable IoT device continuous vitals telemetry ingestion (v1.3).

---

## 4. Commercial Launch Verification Gates

- [x] **Branding & Assets**: Verified high-resolution vector logos, responsive design, and accessible typography across all portals.
- [x] **Subscription Entitlement Enforcement**: Verified that exceeding bed or doctor quotas triggers upgrade banners without corrupting ongoing patient care.
- [x] **Payment Webhooks**: Verified automated subscription status updates on successful recurring payment receipt.
- [x] **Commercial Documentation**: User guides and operational onboarding manuals published in `docs/release/`.

