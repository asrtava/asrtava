# ASRTAVA Pharmacy Module Dependency Map

## 1. Subsystem Inter-Dependencies

```
+---------------------------------------------------------------------------------------------------+
|                                      UPSTREAM DEPENDENCIES                                        |
|  Patients & EMR (UHID, Allergies)  |  Doctors & Consultations  |  Inpatient Admissions & Wards    |
+---------------------------------------------------------------------------------------------------+
                                                  |
                                                  v
+---------------------------------------------------------------------------------------------------+
|                                 CORE PHARMACY SUBSYSTEM (THIS MODULE)                             |
|  Drug Master Catalog  |  Clinical Safety Engine  |  eRx Lifecyle  |  Pharmacist Verification      |
|  Batch FEFO Inventory |  Cold Chain & Recalls   |  Inpatient eMAR |  Narcotic Vault               |
+---------------------------------------------------------------------------------------------------+
                                                  |
                                                  v
+---------------------------------------------------------------------------------------------------+
|                                     DOWNSTREAM DEPENDENCIES                                       |
|  Revenue Cycle Management (HSN 3004)  |  Double-Entry General Ledger  |  Patient Web/Mobile App   |
|  Multi-Hospital Branch Logistics       |  Supplier Accounts Payable    |  Audit & Governance Logs  |
+---------------------------------------------------------------------------------------------------+
```

---

## 2. Table Relationship Matrix

| Primary Entity | Foreign Key References | Dependent Downstream Entities | Integrity Constraint |
| :--- | :--- | :--- | :--- |
| `drug_catalog` | `hospitals(id)`, `drug_categories(id)` | `drug_ingredients`, `drug_substitutions`, `pharmacy_batches`, `prescription_items` | `ON DELETE RESTRICT` if referenced |
| `drug_ingredients` | `drug_catalog(id)` | `drug_drug_interactions` | `ON DELETE CASCADE` |
| `prescriptions` | `hospitals(id)`, `patients(id)`, `doctors(id)`, `consultations(id)` | `prescription_items`, `prescription_versions`, `clinical_alert_overrides` | `ON DELETE RESTRICT` |
| `pharmacy_verification_queue` | `hospitals(id)`, `prescriptions(id)`, `users(id)` | `pharmacy_dispensings` | `ON DELETE RESTRICT` |
| `pharmacy_batches` | `hospitals(id)`, `drug_catalog(id)`, `suppliers(id)` | `pharmacy_stock_movements`, `pharmacy_dispense_items`, `product_recalls` | `ON DELETE RESTRICT` |
| `product_recalls` | `hospitals(id)`, `pharmacy_batches(id)` | `quarantined_batches` | `ON DELETE RESTRICT` |
| `inpatient_emar_records` | `hospitals(id)`, `admissions(id)`, `prescription_items(id)`, `users(id)` | `controlled_drug_waste_logs` | `ON DELETE RESTRICT` |
| `narcotic_vault_ledger` | `hospitals(id)`, `drug_catalog(id)`, `pharmacy_batches(id)`, `users(id)` | `narcotic_count_discrepancies` | Immutable Audit Ledger |

