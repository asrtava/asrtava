# ASRTAVA — Stock Traceability & Lot Tracking Validation

## 1. Overview
ASRTAVA provides end-to-end forward and backward batch traceability. In the event of a manufacturer recall or drug safety alert, every unit can be tracked from the supplier's delivery invoice down to the individual patient bedside or OT tray where it was administered.

---

## 2. Traceability Dimensions
| Dimension | Captured Attributes |
|---|---|
| **Batch / Lot** | Batch Number, Expiry Date, Manufacturing Date, Country of Origin |
| **Supplier Linkage** | Vendor ID, Vendor Invoice Number, Purchase Order Reference |
| **Receiving Dock** | GRN Number, Receiving Dock ID, QA Inspector ID, Cold Chain Cert |
| **Storage Hierarchy** | Warehouse ID $\to$ Zone $\to$ Aisle $\to$ Rack $\to$ Shelf $\to$ Bin |
| **Internal Transfers** | Stock Transfer Order, Dispatching User, Receiving Pharmacist |
| **Clinical Consumption**| Patient ID, Encounter ID, Prescribing Doctor, Administering Nurse |

---

## 3. Product Recall Simulation
1. **Recall Trigger**: Manufacturer issues recall for Batch `#BT-9901-X`.
2. **System Isolation**: Administrator enters batch number; system immediately sets `status: QUARANTINED` across all sub-stores.
3. **Traceability Report**: System generates immediate census:
   - Units remaining in Central Warehouse.
   - Units in departmental satellite sub-stores.
   - Units already administered to patients with patient MRNs and attending physician alerts.

