# ASRTAVA — Procurement, Inventory, Asset & Facility Architecture

## 1. Architectural Overview
The Procurement, Inventory, Asset, and Facility Management system is designed as an enterprise module within ASRTAVA's modular monolith architecture. It is fully integrated with Central Identity, Finance/RCM, Pharmacy, Laboratory, Radiology, Operation Theatres, and Nursing.

```
+----------------------------------------------------------------------------------------------------+
|                      ASRTAVA Enterprise Procurement, Inventory & Asset Architecture                 |
+----------------------------------------------------------------------------------------------------+
                                                  |
           +--------------------------------------+--------------------------------------+
           |                                      |                                      |
           v                                      v                                      v
+-----------------------+              +-----------------------+              +-----------------------+
|  Procurement Engine   |              |  Unified Inventory    |              |  Biomedical & Assets  |
+-----------------------+              +-----------------------+              +-----------------------+
| - Purchase Requisitions              | - Central Warehouse   |              | - Fixed Asset Master  |
| - Quotation Comparison|              | - Department Stores   |              | - PPM Schedules       |
| - Purchase Orders (PO)|              | - Batch / Serial Trace|              | - Calibration Logs    |
| - Goods Receipt (GRN) |              | - FEFO / FIFO Engine  |              | - Breakdown Tickets   |
| - Quality Inspection  |              | - Stock Movements     |              | - Facility (MGPS/HVAC)|
| - 3-Way Invoice Match |              | - Physical Stock Take |              | - AMC / Warranty Alert|
+-----------------------+              +-----------------------+              +-----------------------+
           |                                      |                                      |
           +--------------------------------------+--------------------------------------+
                                                  |
                                                  v
                   +------------------------------------------------------+
                   |         Central Services & Cross-Module Bridges       |
                   +------------------------------------------------------+
                   | 1. Finance & General Ledger (3-Way Matching, AP/GL)  |
                   | 2. Centralized Identity & RBAC (Users, Permissions)  |
                   | 3. Pharmacy, LIS, RIS, OT & Nursing Workspaces       |
                   | 4. Notifications & Statutory Compliance Alerts       |
                   +------------------------------------------------------+
```

---

## 2. Core Architectural Subsystems

### Subsystem 1: Vendor & Supplier Lifecycle
- **Vendor Master**: Centralized records with legal entity classification, GSTIN, PAN, bank account details, and credit terms.
- **Vendor Performance**: Tracking on-time delivery rates, quality acceptance percentages, and price variance ratings.
- **Contract & Warranty Management**: Annual Maintenance Contracts (AMC), Comprehensive Maintenance Contracts (CMC), and supplier agreements with automated expiry alerts.

### Subsystem 2: Procure-to-Pay (P2P) Pipeline
- **Purchase Requisitions (PR)**: Departmental requests with priority (`ROUTINE`, `URGENT`, `STAT_EMERGENCY`), item specifications, estimated cost, and approval hierarchies.
- **Quotation Comparison Matrix**: Side-by-side vendor quotation analysis evaluating unit cost, delivery lead time, warranty period, and quality certifications.
- **Purchase Orders (PO)**: Versioned PO documents with line items, tax breakdowns (GST/SAC), delivery schedules, and partial receipt tracking.
- **Goods Receipt Notes (GRN)**: Tracking ordered vs delivered vs accepted vs rejected vs quarantined quantities.
- **Quality Inspection Gate**: Two-stage physical and technical quality check before stock is released to available inventory.
- **Three-Way Matching**: Automated validation ($PO == GRN == Invoice$) before AP invoice posting to the General Ledger.

### Subsystem 3: Multi-Location Inventory & Traceability Ledger
- **Multi-Store Management**: Central warehouse, pharmacy store, laboratory reagent room, OT satellite store, ICU emergency crash cart stock, and ward sub-stores.
- **Dual Unit of Measurement (UOM)**: Purchase unit (e.g. Box of 100) to consumption unit (e.g. Single Ampoule / Tablet) with integer/decimal conversion factors.
- **Stock Movement Ledger**: Immutable transaction ledger for receipts, issues, departmental transfers, returns, damages, and physical adjustments.
- **Traceability**: High-precision tracking of batch numbers, lot numbers, serial numbers, manufacturing dates, and expiration dates.
- **Automated Reordering**: Min/max stock alerts and suggested purchase requisitions based on lead times and average daily consumption.

### Subsystem 4: Biomedical & Hospital Facility Management
- **Asset Master Register**: Medical equipment (ventilators, patient monitors, defibrillators, dialysis machines), IT hardware, and facility systems.
- **Planned Preventive Maintenance (PPM)**: Automated scheduling of routine maintenance, electrical safety inspections, and clinical calibrations.
- **Corrective Breakdown Work Orders**: Issue ticketing, technician assignment, spare parts consumption, downtime measurement, and return-to-service sign-offs.
- **Facility Infrastructure**: Monitoring medical gas pipeline systems (MGPS), HVAC isolation air exchanges, backup diesel generators, and fire safety systems.

