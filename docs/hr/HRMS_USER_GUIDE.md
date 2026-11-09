# ASRTAVA — HRMS User Guide

## 1. Introduction
Welcome to the ASRTAVA Human Resource Management System (HRMS) guide. This guide explains how HR managers, hospital administrators, department heads, and healthcare workers interact with the centralized workforce platform.

---

## 2. Navigating the Enterprise HRMS Hub

### Accessing the Hub
1. Log into the ASRTAVA Web Portal as an HR Manager, Hospital Administrator, or Department Head.
2. Select **HR & Staffing Workspace** from the portal switcher.
3. Click on the **Enterprise HRMS & Workforce Hub (Prompt 24)** tab.

---

## 3. Core Workflows

### A. Employee Onboarding & Identity Provisioning
1. Click **Onboard Employee** in the Workforce Directory tab.
2. Fill in the employee's personal demographics, department, designation, and monthly base salary.
3. Click **Create Master Record**.
4. In the employee profile, click **Upload Document** to attach medical qualifications and government IDs.
5. To grant portal login access, click **Request User Account Provisioning**. Once approved by Hospital Admin, login credentials will be linked to the profile.

### B. Shift Rostering & Anti-Collision
1. In the **Shift Rostering** tab, click **Assign Duty Shift**.
2. Select staff member, date, and shift template (Morning, Evening, Night, On-Call).
3. The system automatically validates rest periods and checks for conflicting assignments on the same date. If a conflict exists, an alert is displayed.

### C. Leave Management & Approvals
1. Staff members apply for leave specifying dates and reason.
2. Department Heads review pending leave requests in the **Leave Management** tab.
3. Click **Approve & Deduct** to confirm the leave, which updates the quota ledger automatically.

### D. Monthly Payroll & General Ledger Integration
1. In the **Payroll & GL** tab, review the calculated monthly payroll batch.
2. Verify basic earnings, HRA, and statutory deductions (PF, ESI, Professional Tax, TDS).
3. Click **Post Balanced JV to General Ledger**. The system generates a balanced journal voucher ($\sum \text{Debits} == \sum \text{Credits}$) directly in Finance & Accounting.

### E. Professional Credential Expiry Tracking
1. Open the **Credentials & Licenses** tab to view medical council registrations (MCI/NMC, INC, PCI) and BLS/ACLS certificates.
2. Licenses expiring within 30 days are highlighted with an amber alert tag.

### F. Separation & Immediate Access Termination
1. Open the **Exit & Access Revocation** tab when an employee resigns.
2. Check off clinical handover and asset return clearances.
3. Click **Revoke System Access & Close**. The employee's user account is immediately deactivated and active session tokens are revoked.

