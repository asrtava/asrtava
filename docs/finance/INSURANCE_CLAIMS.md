# ASRTAVA Cashless Insurance & TPA Claims Management

## 1. Cashless Insurance Lifecycle

The cashless insurance lifecycle manages the interactions between the hospital, Third Party Administrators (TPAs), and insurance providers:

```
[1. Admission Desk]  -->  [2. TPA Pre-Authorization Request]
                                    |
                                    v
                          [3. Initial Authorization / Query]
                                    |
                                    v
                          [4. Inpatient Treatment & Interim Enhancements]
                                    |
                                    v
                          [5. Final Discharge Summary & Claim Submission]
                                    |
                                    v
                          [6. Final Adjudication / Deduction Breakdown]
                                    |
                                    v
                          [7. Electronic Remittance & Settlement]
```

### 1.1 Pre-Authorization Desk
- Collects insurance card, policy number, corporate ID, and photo identification.
- Attending doctor inputs provisional diagnosis (ICD-10) and estimated cost.
- Standard IRDAI pre-auth form generated and dispatched via NHCX / TPA portal.

### 1.2 Initial Approval vs Query Management
- **Approved**: Approved amount reserved against patient's running bill.
- **Query Raised**: Assigned to medical coordinator for immediate submission of lab reports or clinical history notes within the 4-hour SLA window.
- **Denied**: Patient informed immediately; financial status transitions to Cash / Self-Pay.

### 1.3 Final Settlement & Deduction Handling
Upon patient discharge, the TPA issues the final sanction letter. Deductions (co-pay, non-medical items, consumables beyond cap) are classified:
```
Total Hospital Bill:                     ₹ 1,50,000
TPA Final Approved Amount:               ₹ 1,20,000 (Dr. 1203 TPA Receivables)
Non-Medical Deductions (Co-Pay):         ₹   25,000 (Dr. 1001 Cash / Card collected from patient)
Contractual Tariff Deduction:            ₹    5,000 (Dr. 5004 Discounts & Deductions)
                                        --------------------------------------------------
                                         ₹ 1,50,000 (Cr. 1202 IPD Receivables)
```

