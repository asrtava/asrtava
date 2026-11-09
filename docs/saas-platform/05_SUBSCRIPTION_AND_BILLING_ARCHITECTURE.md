# SaaS Subscription & Billing Architecture

## 1. Plan Matrix & Pricing Tiers (INR)

| Attribute | Starter Tier | Professional Tier | Enterprise Tier |
| :--- | :--- | :--- | :--- |
| **Monthly Price (INR)** | ₹ 14,999 | ₹ 29,999 | ₹ 59,999 |
| **Annual Price (INR)** | ₹ 1,49,990 (2 mo free) | ₹ 2,99,990 (2 mo free) | ₹ 5,99,990 (2 mo free) |
| **Active Staff Accounts** | 25 | 100 | 500 (Expandable) |
| **Monthly Patient Inflow** | 1,500 | 6,000 | 30,000 |
| **Branches Allowed** | 1 | 3 | 10 |
| **Cloud Storage** | 10 GB | 50 GB | 250 GB |
| **OPD & Pharmacy** | Yes | Yes | Yes |
| **IPD Bed Grid & e-MAR** | No | Yes | Yes |
| **LIMS & Radiology RIS** | No | Yes | Yes |
| **Operation Theatre (OT)** | No | No | Yes |
| **Emergency Triage** | No | No | Yes |
| **HR & Payroll** | No | Basic | Advanced Automated |
| **PACS / DICOM** | No | No | Yes |
| **White-Label Custom Domain**| No | Subdomain | Full Custom Domain |

## 2. Strict Segregation from Hospital Patient Billing
- **SaaS Subscription Invoices (`subscription_invoices`)**:
  - Generated monthly or annually by ASRTAVA Platform.
  - Numbered `ASR-SUB-YYYY-XXXXX`.
  - Calculated with 18% Indian GST (CGST 9% + SGST 9% or IGST 18%).
  - Paid by hospital management to ASRTAVA.
- **Hospital Patient Bills (`invoices`)**:
  - Generated per patient consultation, admission, or lab test.
  - Numbered `HOSP-INV-XXXXX`.
  - Patient payments collected by hospital cashier via hospital's merchant account.

