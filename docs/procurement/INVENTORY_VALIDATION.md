# ASRTAVA — Inventory Management & Warehouse Allocation Validation

## 1. Overview
The multi-tier inventory subsystem manages stock across central warehouses and departmental sub-stores (Pharmacy, OT, ICU, Laboratory, Radiology, Emergency), preventing stockouts while minimizing holding costs and expiration waste.

---

## 2. Multi-Tier Warehouse Architecture
```
[Central Medical Warehouse]
          │
          ├───► [OT Satellite Sub-Store]
          ├───► [Inpatient Pharmacy Sub-Store]
          ├───► [Emergency Crash-Cart Sub-Store]
          ├───► [ICU Clean Supply Room]
          └───► [Central Laboratory Reagent Store]
```

---

## 3. Stock Control Invariants
1. **First-Expiry-First-Out (FEFO)**: Transfers and department issues strictly consume from batches with the earliest expiry dates.
2. **Over-Allocation Prevention**: Stock reservations and transfer orders exceeding current available on-hand stock are blocked at the service level with validation errors.
3. **Automated Reordering**: When total warehouse stock drops below the configured `min_reorder_level`, automatic purchase requisitions are suggested with economic order quantities (EOQ).
4. **Physical Cycle Count Reconciliation**: Discrepancies between physical counts and system balances generate auditable adjustment entries with reason codes (e.g. breakage, evaporation, packaging defect, count error).

