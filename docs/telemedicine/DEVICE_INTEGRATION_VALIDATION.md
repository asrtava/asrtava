# ASRTAVA — Medical Device Integration & Data Provenance Validation

## 1. Data Provenance & Source Labeling
To prevent unverified consumer gadgets from corrupting clinical decision-making, ASRTAVA tags every vital reading with explicit data-source provenance:

- `MANUAL_PATIENT`: Self-reported patient entry via Web Portal or Mobile App.
- `VERIFIED_DEVICE`: FDA / CE / CDSCO certified medical devices (e.g. Omron smart blood pressure cuff, Accu-Chek glucometer, Masimo pulse oximeter) paired via Bluetooth Low Energy (BLE) or cellular hub.
- `MOBILE_BLUETOOTH`: Smartphone sensor telemetry.
- `CLINICAL_STAFF`: Recorded during an in-person home visit by a community nurse.

---

## 2. Connected Device Security & Pairing
1. **Device Identity**: Each measurement captures `device_identifier` (e.g. `Omron-HEM-7120-BT-MAC-44A9`).
2. **Anti-Tampering**: Readings received from paired hubs are validated against device hardware serial numbers and timestamps to prevent backdated or forged data injection.
3. **Clinical Presentation**: On doctor dashboards, verified device readings display a green shield badge, whereas patient-reported readings display a manual-entry indicator.

