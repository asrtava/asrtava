# ASRTAVA — Goods Receipt Note (GRN) & Quality Inspection Validation

## 1. Overview
The Goods Receipt Note (GRN) and Quality Assurance (QA) gate enforce strict verification of all physical deliveries arriving at the hospital receiving dock before goods can be accepted into active inventory.

---

## 2. Inbound Receiving Workflow
```
[Delivery Arrives at Receiving Dock]
                │
                ▼
[Physical Delivery Check vs. PO] ─── (Vendor invoice / delivery challan matched to open PO)
                │
                ▼
[GRN Created & Goods Placed on Quarantine Hold]
                │
                ▼
[Quality Inspection Execution]
     ├── Packaging integrity check
     ├── Cold chain temperature data logger verification
     ├── Batch number and expiry date validation
     └── Sterility certification review
                │
         ┌──────┴──────┐
         ▼             ▼
   [Accepted Qty]  [Rejected Qty]
         │             │
         ▼             ▼
[Admitted to Stock] [Quarantine Segregation & Vendor Return Notice]
```

---

## 3. Mandatory Inspection Gates
1. **Quarantine State Enforcement**: Newly received stock is assigned `status: QUARANTINED`. It cannot be issued, transferred, or consumed until inspection approval is registered.
2. **Batch & Expiry Recording**: Every accepted unit must have its manufacturer batch number, manufacturing date, and expiry date captured in `proc_stock_batches`.
3. **Cold-Chain Audit**: Temperature-sensitive items (vaccines, insulins, reagents) require loggers verifying storage maintained between +2°C and +8°C or -20°C during transit.
4. **Rejection Segregation**: Damaged packaging, expired items, or broken seals are flagged as `REJECTED`, recorded in `proc_quality_inspections`, and isolated from warehouse balances.

