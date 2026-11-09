# ASRTAVA — Purchase Order & Quotation Lifecycle Validation

## 1. Overview
The Purchase Order (PO) and Requisition workflow governs expenditure authorization across hospital departments, ensuring competitive vendor selection, budgetary compliance, and automated multi-tier tax computations.

---

## 2. Requisition-to-PO Sequence
```
[Departmental Requisition]
          │
          ▼
[Clinical & Administrative Approval Gate]
          │
          ▼
[Quotation Ingestion & Multi-Vendor Comparison]
          │
          ▼
[Winning Quotation Selection]
          │
          ▼
[Purchase Order Generation with GST]
          │
          ▼
[PO Issuance to Supplier]
```

### Key Controls:
1. **Requisition Limits**: Requisitions exceeding predefined departmental thresholds require Department Head and Finance Director digital sign-off.
2. **Quotation Comparison Matrix**:
   - Unit prices evaluated across multiple qualified bidders.
   - Lead time (days) and delivery terms incorporated into recommendation ranking.
   - Quality ratings and historical supplier reliability factored into selection.
3. **Multi-Tier GST Engine**:
   - Intra-state transactions: Equal split of CGST and SGST (e.g. 6% CGST + 6% SGST = 12%).
   - Inter-state transactions: Full IGST applied (e.g. 12% IGST).
   - Exempt supplies (certain lifesaving drugs/implants) tagged with 0% GST.

