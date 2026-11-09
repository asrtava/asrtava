# ASRTAVA Indian GST & Healthcare Tax Configuration

## 1. Statutory Exemption Framework (SAC 999312)

Under Notification No. 12/2017-Central Tax (Rate), dated 28th June 2017, healthcare services provided by a clinical establishment, an authorized medical practitioner, or paramedics are **exempt from Goods and Services Tax (GST)**:

- **SAC Code 999312**: "Services provided by authorized medical practitioners, doctors, and hospitals including diagnosis, treatment, and care."
- **Applicable Tax Rate**: **0.00% (Exempt)**.
- **Scope**: OPD consultations, IPD room and nursing care (except high-rent luxury suites exceeding statutory threshold), lab tests, X-rays, MRI scans, and surgeries.

---

## 2. Taxable Retail Pharmacy & Medical Consumables

Unlike clinical care, retail sales of pharmaceuticals to walk-in patients or retail counter buyers are subject to Indian GST:

| Classification | Description | HSN Code | CGST | SGST | Total GST Rate |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Medicaments (Standard)** | Measured dosage pharmaceuticals | **3004** | 2.5% | 2.5% | **5%** |
| **Diagnostic Reagents** | Lab reagents, test kits, contrast media | **300490** | 6.0% | 6.0% | **12%** |
| **Medical Devices / Equip.** | Diagnostic instruments, monitors | **9018** | 9.0% | 9.0% | **18%** |

---

## 3. Statutory Tax Return Export (GSTR-1 & GSTR-3B)

The ASRTAVA Tax Management service generates ready-to-upload JSON and tabular summaries for statutory GST returns:
1. **GSTR-1 Summary**:
   - Table 4: B2B Invoices (Corporate panel credit billing with corporate GSTIN).
   - Table 7: B2C Small (Retail walk-in pharmacy sales).
   - Table 8: Exempt Supplies (SAC 999312 healthcare turnover).
   - Table 12: HSN/SAC Summary of outward supplies.
2. **GSTR-3B Summary**:
   - Section 3.1(a): Outward taxable supplies (Pharmacy sales).
   - Section 3.1(c): Other outward supplies (Nil rated, exempt healthcare turnover).
   - Section 6.1: Net CGST and SGST liability.

