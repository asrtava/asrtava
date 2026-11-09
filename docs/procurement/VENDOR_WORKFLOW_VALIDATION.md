# ASRTAVA — Vendor Workflow & Compliance Validation

## 1. Overview
The Vendor Management module in ASRTAVA manages the complete supplier lifecycle, from initial onboarding and statutory verification (GSTIN, PAN, MSME, Drug License) to quotation bidding, purchase order dispatch, payment reconciliation, and performance tiering.

---

## 2. Vendor Onboarding & Validation Workflow
```
[Vendor Application]
       │
       ▼
[Statutory Validation] ─── (GSTIN check, PAN check, Drug License verification)
       │
       ▼
[Payment Terms & Bank Details]
       │
       ▼
[Catalog Assignment & Product Qualification]
       │
       ▼
[Performance Rating Engine] ─── (OTIF: On-Time In-Full, Quality score)
```

### Statutory Validations:
- **GSTIN Formatting**: Indian GSTIN structure `^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$` validated for all domestic vendors.
- **PAN Verification**: 10-character PAN checked for vendor tax withholding (TDS).
- **Drug License Number**: Mandated for pharmaceutical and scheduled medical supplies.
- **MSME Classification**: Categorization into Micro, Small, or Medium enterprise to enforce statutory payment timelines (45-day MSME settlement rule).

---

## 3. Evaluation & Rating Metrics
Vendors are continuously evaluated based on:
1. **On-Time In-Full Delivery (OTIF)**: Ratio of deliveries received on or before the committed delivery date.
2. **Quality Inspection Pass Rate**: Percentage of delivered units accepted during dock QA inspections without quarantine rejections.
3. **Price Competitiveness**: Historical quotation competitiveness across standardized catalog items.
4. **Credit Terms Compliance**: Standard credit periods (e.g. Net 30, Net 45, Net 60) tracked to maintain accurate AP working capital projections.

