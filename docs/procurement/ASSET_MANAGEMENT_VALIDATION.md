# ASRTAVA — Fixed & Biomedical Asset Management Validation

## 1. Overview
The Asset Management module tracks high-value medical devices (MRI, CT, Ventilators, Infusion Pumps, Anaesthesia Workstations) and general hospital infrastructure (Generators, HVAC, Chillers, Ambulances) throughout their operational lifecycles.

---

## 2. Asset Lifecycle
```
[Asset Capitalization & Tagging] ─── (Barcode/RFID, Department, Serial No.)
               │
               ▼
   [Operational Commissioning] ─── (Initial Safety Check & Calibration)
               │
      ┌────────┴────────┐
      ▼                 ▼
[Planned Maintenance] [Breakdown Ticket]
 (PPM Schedules)       (Auto-lock status: UNDER_REPAIR)
      │                 │
      ▼                 ▼
[Maintenance Done]    [Biomedical Repair & Parts]
      │                 │
      └────────┬────────┘
               ▼
[Safety Inspection & Return-to-Service]
               │
               ▼
[Decommissioning & Disposal] ─── (Depreciation, Residual Value, Scrapping)
```

---

## 3. Critical Biomedical Controls
1. **Barcode / Asset Tag Uniqueness**: Every asset has an immutable asset tag (e.g. `AST-VENT-ICU-08`) indexed with uniqueness constraints.
2. **Breakdown Interlock**: When an asset failure or breakdown ticket is logged, the asset's status is automatically flipped to `UNDER_REPAIR`. Clinical scheduling modules are prevented from allocating this device.
3. **Mandatory Certification Gate**: Returning an asset to `OPERATIONAL` status strictly requires an authorized Biomedical Engineer's digital sign-off and electrical/functional safety checklist completion.
4. **Depreciation Tracking**: Straight-line and written-down value (WDV) depreciation calculated according to Indian Companies Act / IT Act schedules.

