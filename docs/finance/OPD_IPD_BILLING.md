# ASRTAVA OPD and IPD Billing Specification

## 1. Outpatient (OPD) vs Inpatient (IPD) Operational Comparison

| Parameter | Outpatient Department (OPD) | Inpatient Department (IPD) |
| :--- | :--- | :--- |
| **Encounter Duration** | 15 minutes to 3 hours | 1 day to multiple months |
| **Billing Model** | Pay-as-you-go / Immediate checkout | Running ledger with periodic advances |
| **Bed Charges** | None (Daycare observation charged hourly) | Nightly bed charges based on ward class |
| **Deposit Workflow** | Not required for general consultation | Mandatory admission deposit |
| **Interim Invoicing** | Single final invoice generated per visit | Daily running folios and weekly interim bills |
| **Clinical Discharge** | Immediate after doctor prescription | Multi-step clinical, pharmacy, and billing clearance |
| **TPA Pre-Authorization** | Limited to OPD dental/optical policies | Universal cashless pre-auth and enhancements |

---

## 2. IPD Running Ledger Mechanics

1. **Patient Admission**:
   - Patient enrolled in IPD encounter.
   - Admission deposit collected:
     ```
     Dr. 1001 / 1002 Cash / Bank
         Cr. 2101 Patient Deposits & Advances
     ```

2. **Automated Midnight Room Occupancy Job**:
   - A scheduled batch worker runs at 00:01 AM daily.
   - For every active inpatient bed occupancy:
     ```
     Dr. 1202 Accounts Receivable - IPD
         Cr. 4002 IPD Room & Nursing Care Revenue
     ```

3. **Interim Billing & Deposit Thresholds**:
   - System continuously calculates:
     $$\text{Estimated Bill Balance} = \text{Total Charges Logged} - \text{Total Advances Paid}$$
   - When the unbilled balance reaches the configured hospital threshold (e.g. ₹50,000), automated alerts are dispatched to the patient and nursing desk requesting an interim top-up deposit.

4. **Final Discharge Reconciliation**:
   - Clinical discharge summary marked complete by attending doctor.
   - All unbilled nursing station orders, blood bank charges, and physiotherapy sessions closed.
   - Final invoice posted:
     ```
     Dr. 2101 Patient Deposits & Advances (Consume deposit)
     Dr. 1001 / 1002 Cash / Card / UPI (Balance paid by patient)
     Dr. 1203 TPA Receivables (Approved cashless amount)
         Cr. 1202 Accounts Receivable - IPD (Clear running IPD bill)
     ```

