# ASRTAVA Centralized Inventory & Inter-Branch Stock Transfers

## 1. Overview

Healthcare groups achieve major economies of scale by centralizing pharmaceutical procurement through a central warehouse and executing controlled stock distribution to peripheral hospital pharmacies and satellite clinics.

---

## 2. Central Procurement & Inter-Branch Transfers

```
[ Central Corporate Depot / Warehouse ] 
       │ (Bulk Direct-from-Manufacturer Purchasing)
       ├─────────────────────────────────┬─────────────────────────────────┐
       ▼                                 ▼                                 ▼
[ Hospital Delhi Pharmacy ]       [ Hospital Bengaluru Pharmacy ]   [ Clinic Hyderabad Pharmacy ]
  (Batch BAT-ADR-2026-X1)           (Received & Added to Stock)       (Reorder Auto-Indent)
```

### Table Schema: `inter_branch_stock_transfers`
- `transfer_number`: Formatted tracking code (e.g. `STK-TRF-2026-1049`).
- `source_hospital_id` & `destination_hospital_id`: Origin and destination facility records.
- `medicine_id`, `batch_number`, `expiry_date`: Exact drug identification.
- `quantity_transferred`: Number of units transferred.
- `status`: Lifecycle states (`draft` $\rightarrow$ `approved` $\rightarrow$ `dispatched` $\rightarrow$ `in_transit` $\rightarrow$ `received`).

---

## 3. Strict Traceability & FEFO Preservation

1. **No Silent Stock Deductions**: Stock is never decremented or incremented without an immutable transaction record.
2. **First-Expiry-First-Out (FEFO)**: Transfers prioritize batches with the nearest expiry date, preventing drug waste in peripheral stores.
3. **Receipt Acknowledgment**: When receiving stock, the recipient pharmacist scans batch barcodes and confirms received quantity (`received_at`, `received_by`). Any discrepancy (breakage, cold chain breach) triggers a partial acceptance or rejection workflow.

