# ASRTAVA — Procurement, Inventory & Asset Management Security Audit

## 1. Security Architecture & Threat Model
The Procurement, Inventory, and Asset subsystem enforces strict enterprise data protection across multi-hospital, multi-tenant deployments.

### Core Security Controls:
1. **Multi-Tenant Row-Level Security (RLS)**:
   - All 18 procurement tables (`proc_vendors`, `proc_warehouses`, `proc_items`, `proc_stock_batches`, `proc_purchase_orders`, `proc_assets`, etc.) enforce PostgreSQL RLS policies where `organization_id = CURRENT_ORGANIZATION_ID()` and `hospital_id = CURRENT_HOSPITAL_ID()`.
   - Cross-tenant access to supplier contracts, pricing terms, or stock balances is structurally prevented at the database kernel level.
2. **Role-Based Access Control (RBAC)**:
   - `INVENTORY_MANAGER`: Full management of warehouses, catalog items, stock movements, and cycle count adjustments.
   - `PURCHASE_OFFICER`: Creation and issuance of purchase requisitions, RFQs, vendor quotations, and purchase orders.
   - `RECEIVING_CLERK`: Inbound dock registration (GRN) and physical verification.
   - `QUALITY_INSPECTOR`: Sterility, cold chain, packaging evaluation, and pass/reject authorization.
   - `BIOMEDICAL_ENGINEER`: Asset commissioning, preventive maintenance, breakdown repairs, and return-to-service certification.
   - `FINANCE_CONTROLLER`: Three-way invoice matching approval and General Ledger posting.
3. **Data Integrity & Immutability**:
   - Stock movements (`proc_stock_movements`) are append-only. Stock cannot be silently altered or deleted; adjustments require explicit cycle-count entries.
   - Audit trail records `created_by`, `updated_by`, timestamps, and IP addresses on all transactions.

