# ASRTAVA — Asset & Biomedical Equipment Lifecycle Map

## 1. Overview
Hospital assets—especially critical life-support medical devices—require rigorous tracking from procurement to decommissioning.

```mermaid
flowchart TD
    A["1. Capital Procurement & Delivery"] --> B["2. Commissioning & Biomedical Inspection"]
    B --> C["3. Asset Tagging (Barcode / RFID / Serial No)"]
    C --> D["4. Departmental Allocation (OT, ICU, ER, Lab, Radiology)"]
    D --> E["5. Active Clinical Operation"]
    E --> F["6. Routine Calibration & Planned Preventive Maintenance (PPM)"]
    E --> G["7. Breakdown Reporting & Corrective Work Order"]
    G --> H["8. Technician / Vendor Repair & Spare Parts Logging"]
    H --> I["9. Return-to-Service Biomedical Certification"]
    I --> E
    E --> J["10. End-of-Life Decommissioning & Condemnation Board Approval"]
    J --> K["11. Safe Disposal / Electronic Waste Recycling"]
```

---

## 2. Biomedical Maintenance & Safety Invariants
1. **Calibration Status**: Equipment past its statutory calibration date is automatically flagged `CALIBRATION_OVERDUE` and alerts are routed to the Nursing Supervisor and Biomedical Lead.
2. **Post-Repair Certification**: After a breakdown repair, equipment cannot be returned to active patient care until a certified biomedical engineer or clinical supervisor records the `RETURN_TO_SERVICE` safety check.
3. **Downtime Auditing**: Every breakdown calculates exact downtime (from ticket creation to service restoration) for NABH/JCI hospital accreditation reporting.

