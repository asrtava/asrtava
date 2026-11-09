# ASRTAVA Accounts Receivable (AR) & Aging Management

## 1. Accounts Receivable 4-Bucket Aging Architecture

The ASRTAVA Accounts Receivable engine segments all outstanding hospital balances into four standard temporal buckets:

```
+-----------------------------------------------------------------------------------------+
|                                TOTAL OUTSTANDING AR: ₹ 14,25,000                        |
+-----------------------------------------------------------------------------------------+
| Current (0–30 Days)  | 31–60 Days           | 61–90 Days           | Over 90 Days       |
| ₹ 8,50,000 (59.6%)   | ₹ 3,20,000 (22.5%)   | ₹ 1,65,000 (11.6%)   | ₹ 90,000 (6.3%)    |
+-----------------------------------------------------------------------------------------+
```

### 1.1 Payer Segmentation
Receivables are tracked across three payer groups:
1. **Self-Pay Patients**: ₹3,85,000 (27.0%)
2. **TPA & Private Health Insurers**: ₹7,80,000 (54.7%)
3. **Corporate Panels & PSUs**: ₹2,60,000 (18.3%)

---

## 2. Collection Escalation & Follow-Up Workflows

### 2.1 Automated Patient Follow-Up
- At day 7 post-discharge: Friendly SMS / WhatsApp reminder with instant UPI payment link.
- At day 15 post-discharge: Automated email reminder with detailed statement of account.
- At day 30 post-discharge: Outbound call center follow-up task queued for hospital billing desk.

### 2.2 TPA Claim Adjudication Tracking
- Claims remaining unpaid beyond 30 days are flagged in the Cashless TPA dashboard with aging telemetry.
- Direct query reconciliation with TPA nodal officers via automated status requests.

### 2.3 Bad-Debt Provisioning & Write-Off Rules
- Debts exceeding 90 days trigger automated provisioning recommendations:
  - 91–180 days: 25% doubtful debt provision.
  - 181–365 days: 50% doubtful debt provision.
  - 365+ days: 100% write-off candidate.
- Write-offs require dual authorization (Chief Financial Officer + Hospital Administrator).

