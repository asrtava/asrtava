# ASRTAVA Pharmacy Inventory Allocation & Reconciliation Protocols

## 1. Inventory Control Principles

ASRTAVA enforces strict batch-level tracking, First-Expiry-First-Out (FEFO) dispensing order, and zero negative stock across all hospital pharmacies, satellite dispensaries, and central stores.

```
+---------------------------------------------------------------------------------------------------+
|                                 DISPENSE ALLOCATION ENGINE (FEFO)                                 |
+---------------------------------------------------------------------------------------------------+
                                                  |
                                                  v
                     Query batches with available_stock > 0 AND status = 'ACTIVE'
                                 ORDER BY expiry_date ASC
                                                  |
                                                  v
       +------------------------------------------+------------------------------------------+
       |                                                                                     |
       v                                                                                     v
[Expiring Lot: 2026-12-31] (Depleted 1st)                                 [Fresh Lot: 2027-08-15] (Depleted 2nd)
       |                                                                                     |
       +------------------------------------------+------------------------------------------+
                                                  |
                                                  v
                           Is any candidate batch past today's date?
                                    |                       |
                                   YES                      NO
                                    v                       v
                         Auto-Quarantine Batch     Allocate & Decrement Stock
                      Throw OUT_OF_STOCK_ERROR      Write Stock Movement Ledger
```

---

## 2. FEFO Allocation & Expiry Protection Verification

### 2.1 First-Expiry-First-Out (FEFO) Mechanics
When a prescription requires $N$ units of a drug:
1. Available active batches in the dispensing location are fetched, ordered strictly by `expiry_date ASC`.
2. Batches with `expiry_date <= CURRENT_DATE` are immediately skipped from allocation and transitioned to `QUARANTINED_EXPIRED`.
3. Allocation takes units from the earliest valid expiry date until the required quantity is satisfied or until batches are exhausted.
4. If multiple lots are required to fulfill an order (split-lot dispensing), each batch movement is tracked with its individual batch number and expiry date printed on the patient dispense label.

### 2.2 Hard Blocking on Stock Exhaustion & Negative Stock Prevention
- Database constraints and service-level validations prevent stock levels from dropping below zero under concurrent race conditions.
- If unexpired inventory is insufficient to satisfy the order, the system refuses the allocation and throws `OUT_OF_STOCK_ERROR`.
- Inventory balances cannot be decremented below zero under any circumstance.

---

## 3. Stock Reconciliation & Blind Auditing

Hospital pharmacies must conduct regular blind physical counts to detect pilferage, breakage, and administrative discrepancies.

### 3.1 Blind Reconciliation Workflow
1. **Audit Initiation:** Store manager initiates a blind count cycle for a category, shelf, or cold room. The system generates count sheets showing item codes and descriptions, but **hides system stock on hand**.
2. **Physical Count Recording:** Two auditors independently count and record physical units on hand (`physical_count`).
3. **Automated Variance Calculation:**
   $$\text{Variance} = \text{Physical Count} - \text{System Book Balance}$$
4. **Reconciliation Thresholds:**
   - **Zero Variance:** Verified and sealed automatically.
   - **Variance $\le \pm 1\%$ (Non-controlled):** Flagged for Pharmacy Manager sign-off and adjustment entry.
   - **Variance in Narcotics / Controlled Substances:** Triggers mandatory security alert, lockdown of the batch, and automated incident report generation.
5. **Double-Entry Stock Adjustment:**
   - Write-off losses credit Asset (Pharmacy Inventory) and debit Expense (Inventory Shrinkage & Loss).
   - Surpluses debit Asset and credit Expense/Revenue adjustment.

---

## 4. Cold-Chain Monitoring & Automated Excursion Quarantine

Biologics, insulin, vaccines, and certain antibiotics require continuous storage between $2.0^\circ\text{C}$ and $8.0^\circ\text{C}$.

```
+---------------------------------------------------------------------------------------------------+
|                           IOT REFRIGERATION SENSOR LOG INGESTION                                  |
+---------------------------------------------------------------------------------------------------+
                                                  |
                                                  v
                             Temperature Reading $T$ & Storage Bin ID
                                                  |
                                                  v
                                Is $T < 2.0^\circ\text{C}$ or $T > 8.0^\circ\text{C}$?
                                    |                       |
                                   YES                      NO
                                    v                       v
                       [TEMPERATURE EXCURSION]          [NORMAL STATUS]
                                    |                   Log telemetry
                                    v
                    1. Flag Storage Unit Alert
                    2. Query all lots in Storage Bin
                    3. Update status = 'QUARANTINED_TEMP_EXCURSION'
                    4. Block all FEFO allocation for affected lots
                    5. Dispatch Urgent SMS/Email to Cold-Chain Officer
```

---

## 5. Manufacturer Product Recalls & Patient Traceability

When a pharmaceutical manufacturer or regulatory body (e.g. CDSCO / FDA) issues a Class I, II, or III product recall:

1. **Immediate Lot Freezing:**
   - Administrator enters `recallNumber`, `lotNumber`, `drugId`, `recallReason`, and `hazardLevel`.
   - The system locks the batch status to `RECALLED_LOCKED` across all central stores, satellite pharmacies, and emergency crash carts. No further dispensing is possible.
2. **Reverse Patient Traceability Query:**
   - The system scans historical `pharmacy_verification_queue`, `pharmacy_dispense_substitutions`, and `inpatient_emar_records` matching the recalled lot.
   - Generates an actionable manifest containing:
     - Patient MRN & Name
     - Contact numbers and email
     - Prescribing physician
     - Date and dose administered or dispensed
     - Current inpatient ward or discharge status
3. **Outreach Dispatch:**
   - Triggers targeted emergency notifications to attending physicians and patients, directing immediate discontinuation and clinical follow-up.

