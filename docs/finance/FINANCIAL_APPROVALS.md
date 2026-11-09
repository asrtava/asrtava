# ASRTAVA Financial Approvals & Segregation of Duties

## 1. Role-Based Authorization Threshold Matrix

To prevent internal fraud, embezzlement, or accidental revenue leakage, ASRTAVA enforces strict monetary authorization thresholds:

| Action | Billing Clerk | Billing Supervisor | Finance Manager | Chief Financial Officer |
| :--- | :--- | :--- | :--- | :--- |
| **Patient Discount** | Up to ₹500 | Up to ₹5,000 | Up to ₹25,000 | Above ₹25,000 |
| **Cash Refund** | Prohibited | Up to ₹5,000 (PIN) | Up to ₹25,000 | Above ₹25,000 |
| **Credit Note** | Prohibited | Up to ₹10,000 | Up to ₹50,000 | Above ₹50,000 |
| **AP Bill Release** | Data Entry | Prohibited | Up to ₹1,00,000 | Above ₹1,00,000 |
| **Bad-Debt Write-Off**| Prohibited | Prohibited | Prohibited | Dual Approval (CFO + Admin) |

---

## 2. Managerial Supervisor Override PIN Protocol

For high-speed counter operations (e.g. urgent refund for a cancelled ultrasound scan), supervisors can approve requests directly at the counter by entering their personal 4-digit cryptographic authorization PIN:
- PIN entry is masked.
- Failed attempts are logged with counter location and timestamp.
- Three consecutive incorrect PIN attempts freeze supervisor counter authorization for 15 minutes.

