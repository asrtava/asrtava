# ASRTAVA — Inventory & Stock Movement Workflow Map

## 1. Overview
This map details how inventory flows from initial supplier delivery to central stores, department distribution, clinical consumption, and waste disposal.

```mermaid
flowchart TD
    A["1. Supplier Delivery at Receiving Bay"] --> B["2. Goods Receipt Note (GRN) Ingestion"]
    B --> C{"3. Quality Inspection"}
    C -- "Failed / Damaged" --> D["4a. Quarantined & Supplier Return Note"]
    C -- "Passed" --> E["4b. Accepted into Central Warehouse Stock"]
    E --> F["5. Department Stock Requisition"]
    F --> G["6. Store Issue & Transfer (FEFO / FIFO)"]
    G --> H["7. Department Sub-Store Receipt (Pharmacy, OT, Lab, Ward)"]
    H --> I["8. Point-of-Care Clinical Consumption (eMAR, Surgery, Test)"]
    I --> J["9. Automated Inventory Deduction & Batch Logging"]
    E --> K["10. Automated Reorder Alert (Stock <= Reorder Point)"]
    K --> L["11. Auto-Draft Purchase Requisition"]
```

---

## 2. Invariants & Rules
1. **Quarantine Isolation**: Damaged or uninspected goods are placed in `QUARANTINED` status and **cannot** be allocated or issued to any clinical department.
2. **First-Expiry-First-Out (FEFO)**: When fulfilling departmental requests, items with the earliest expiration date are systematically prioritized for dispatch.
3. **No Duplicate Deductions**: Stock issued to an OT sub-store is deducted from the Central Warehouse and added to the OT Sub-Store. Clinical consumption during surgery deducts from the OT Sub-Store only, preventing double deductions.
4. **Physical Stock Reconciliation**: Discrepancies identified during cycle counts require authorized adjustment notes with audit explanations; system stock is never silently overwritten.

