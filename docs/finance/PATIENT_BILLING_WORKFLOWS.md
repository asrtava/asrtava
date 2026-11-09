# ASRTAVA Patient Billing Workflows

## 1. Patient Billing Lifecycle

The patient billing lifecycle spans seven operational departments:

```
[1. Registration] --> [2. OPD Consultation] --> [3. Diagnostics (Lab/X-Ray)]
         |                        |
         v                        v
[7. Emergency Care]       [4. Pharmacy Dispensing]
         |                        |
         v                        v
[5. Inpatient Admission] -> [6. Operation Theatre] -> [Discharge Clearance]
```

### 1.1 Patient Registration Billing
- Standard registration fee or valid exemption check (e.g. follow-up within 7 days, senior citizen quota, emergency trauma).
- Generation of unique UHID linked to patient ledger (`patient_billing_ledgers`).

### 1.2 Outpatient Department (OPD) Billing
- Direct pay-as-you-go billing model.
- Payment collected at front desk or digital kiosk via UPI QR, card, or cash prior to consultation token generation.
- Instant thermal receipt and digital WhatsApp/SMS receipt link generated.

### 1.3 Diagnostics (Laboratory & Radiology) Billing
- Electronic lab orders (`LIS`) and imaging orders (`RIS`) automatically query tariff catalog.
- If ordered for an outpatient, payment verification occurs prior to phlebotomy or scanner check-in.
- If ordered for an inpatient, charges append to running IPD ledger folio.

### 1.4 Pharmacy Billing
- Integrated with First-Expiry-First-Out (FEFO) drug dispensing.
- Drug batches carry distinct MRP, cost, and GST rate (0%, 5%, or 12%).
- Counter sales generate retail invoices; IPD medication charts charge to the patient's running bill.

### 1.5 Inpatient Department (IPD) Admission Billing
- Initial admission security deposit collected and credited to `2101: Patient Deposits & Advances`.
- Automated daily midnight bed charges based on ward class (General Ward, Semi-Private, Deluxe, ICU, CCU, NICU).
- Nursing care fees, RMO charges, and medical equipment rentals logged dynamically.

### 1.6 Operation Theatre & Surgical Package Billing
- Surgical packages bundle surgeon fees, anesthetist fees, OT charges, and standard consumables into an agreed fixed tariff.
- Unbundled high-value implants (e.g. coronary stents, orthopedic joint prostheses) are billed as specific line items with serial number traceability.

### 1.7 Final Discharge Settlement & Financial Clearance
1. Nursing station initiates clinical discharge summary.
2. Pharmacy reconciliation: unused sealed medications returned for credit note credit.
3. Billing clerk audits all departmental service slips and posts final consolidated invoice.
4. Patient advances applied against gross invoice.
5. Outstanding balance settled via cash, card, UPI, or final cashless TPA authorization.
6. Financial discharge gate cleared; gate pass issued for security and nursing release.

