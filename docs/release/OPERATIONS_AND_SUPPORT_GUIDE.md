# ASRTAVA Operations, Customer Support & Incident Management Guide

**Document Reference:** `docs/release/OPERATIONS_AND_SUPPORT_GUIDE.md`  
**Target Audience:** SREs, Customer Support Engineers, Hospital Onboarding Liaisons, Data Protection Officers (DPO)  
**Security Standard:** Zero-Standing-Privilege Just-in-Time (JIT) Support Access

---

## 1. Customer Support Architecture & Data Privacy Shield

Customer Support Engineers and Technical Staff assisting hospital administrators and doctors **MUST NOT** receive unrestricted or persistent access to electronic health records (EHR), clinical notes, or financial ledgers.

```
+---------------------------------------------------------------------------------------------------+
|                                 Zero-Standing-Privilege JIT Access Flow                           |
|                                                                                                   |
|  [ Hospital Support Ticket Raised ]                                                               |
|    - Hospital Administrator requests technical assistance for a stuck encounter                   |
|                                                                                                   |
|  [ JIT Support Request Initiated ]                                                                |
|    - Support Engineer requests 60-minute scoped access with explicit technical justification       |
|                                                                                                   |
|  [ Multi-Party Authorization ]                                                                    |
|    - Hospital Admin approves JIT request via Web Portal OTP / Confirmation                         |
|                                                                                                   |
|  [ Ephemeral Access Granted ]                                                                     |
|    - Temporary cryptographic token issued; strictly auto-expires in 60 minutes                    |
|    - All engineer actions (read/write) recorded to immutable audit Merkle chain                   |
+---------------------------------------------------------------------------------------------------+
```

---

## 2. Support Workflows & Escalation Tiers

### 2.1 Escalation Tiers
| Tier | Support Team | Scope & Responsibilities | First Response SLA | Resolution Target |
| :---: | :--- | :--- | :---: | :---: |
| **Tier 1** | Help Desk / Customer Care | User account lockouts, password resets, onboarding navigation, billing queries | < 15 minutes | < 2 hours |
| **Tier 2** | Technical Operations / Integration Specialist | Lab analyzer connectivity, DICOM viewer issues, payment gateway reconciliation | < 30 minutes | < 6 hours |
| **Tier 3** | SRE & Core Backend Engineering | ECS container crashes, database replica lag, zero-day vulnerabilities, API outages | < 5 minutes (P0) | < 30 minutes (P0) |
| **Governance**| Data Protection Officer (DPO) | Patient privacy complaints, DPDP Data Subject Rights (DSR), statutory legal holds | < 2 hours | Statutory 30 days |

---

## 3. Incident Severity Levels & Response Protocols

```
+-----------------------------------------------------------------------------------------------+
| Severity | Description                              | Target MTTA | Target MTTR | Notification|
+----------+------------------------------------------+-------------+-------------+-------------+
| P0 - Crit| Hospital clinical operations blocked     | < 5 min     | < 30 min    | SMS/Call/All|
| P1 - High| Major module degraded (e.g., Billing)    | < 15 min    | < 2 hours   | Slack/Email |
| P2 - Med | Non-critical service failure (e.g., SMS) | < 1 hour    | < 8 hours   | Dashboard   |
| P3 - Low | Minor cosmetic bug / telemetry warning   | < 4 hours   | Next sprint | Jira ticket |
+-----------------------------------------------------------------------------------------------+
```

---

## 4. Operational Incident Runbooks

### 4.1 Payment Gateway Transaction Dispute Resolution
1. Verify payment status in the `payment_gateway_txns` table using transaction reference.
2. Cross-reference transaction state with Razorpay/Stripe Dashboard via API query.
3. If funds were debited from patient bank account but hospital invoice remains `UNPAID`:
   - Trigger manual reconciliation webhook: `POST /api/v1/integrations/payments/reconcile/:txn_id`.
   - System updates invoice status to `PAID`, emits receipt, and appends payment audit event.

### 4.2 Patient Privacy & Data Subject Rights (DSR) Handling
1. Patient submits request for data access, correction, or erasure via the Patient Mobile App.
2. DPO reviews request in the Security Governance portal.
3. If erasure is requested:
   - System evaluates statutory legal retention criteria under NMC RMP 2023 (clinical notes must be retained for minimum 3 years; IPD records 5 years; medico-legal cases indefinitely).
   - If an active legal hold applies, erasure is placed on hold; non-clinical marketing data is purged immediately; patient receives statutory explanation.

### 4.3 Scheduled Maintenance Notification Procedure
1. Planned maintenance windows are restricted to **Sunday 02:00 – 04:00 IST**.
2. Advance broadcast notifications are dispatched to all Hospital Administrators via in-app banner and email at least **72 hours in advance**.
3. A persistent maintenance banner is displayed on staff and patient portals **2 hours prior** to commencement.

