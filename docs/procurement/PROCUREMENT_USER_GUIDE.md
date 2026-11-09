# ASRTAVA — Procurement, Inventory & Asset Management User Guide

## 1. Quick Navigation in the Portal
From the main navigation sidebar, navigate to **Inventory & Supply Chain**. The **Advanced Procurement Hub** includes seven operational tabs:
1. **Requisitions**: Review and approve departmental supply requests.
2. **RFQs & Quotes**: Ingest vendor quotations and review automated comparative pricing matrices.
3. **Purchase Orders**: Generate, authorize, and dispatch formal purchase orders with GST computations.
4. **Dock GRN & QA**: Record dock receipts and perform quality inspections (segregating passed vs. quarantined units).
5. **Multi-Store Stock**: Monitor stock across Central Stores and Departmental Sub-stores; issue FEFO transfers.
6. **3-Way Matching**: Match supplier invoices against PO and GRN, and post balanced journal vouchers.
7. **Biomedical & Assets**: Register medical equipment, manage preventive maintenance schedules, and track breakdown work orders.

---

## 2. Common Workflows

### How to Transfer Stock to Operation Theatre (OT)
1. Navigate to **Multi-Store Stock**.
2. Click **Transfer Stock**.
3. Select Source Warehouse (`Central Medical Warehouse`) and Destination (`OT Satellite Store`).
4. Select the Item and Quantity.
5. The system automatically selects batches using **First-Expiry-First-Out (FEFO)**, ensuring older stock is consumed first.

### How to Handle an Inbound Delivery at the Dock
1. Navigate to **Dock GRN & QA**.
2. Click **Receive Delivery**.
3. Enter the Purchase Order Number and physical delivery challan details.
4. The system logs the GRN with status `PENDING_INSPECTION` (stock is quarantined).
5. The QA inspector performs packaging, sterility, and cold-chain checks, then inputs accepted and rejected counts.
6. Accepted items immediately update available stock balances; rejected items remain isolated in quarantine.

### How to Report and Resolve Equipment Breakdowns
1. Navigate to **Biomedical & Assets**.
2. Select the malfunctioning device and click **Report Breakdown Ticket**.
3. The asset status immediately flips to `UNDER_REPAIR`, preventing clinicians from scheduling procedures with it.
4. Once repaired by the biomedical technician, click **Resolve & Return to Service**.
5. Input downtime hours, replacement parts cost, and complete the mandatory electrical safety checklist.
6. Upon digital signature, the asset status is restored to `OPERATIONAL`.

