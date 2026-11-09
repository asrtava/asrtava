# ASRTAVA Hospital Dashboard Implementation

## 1. Overview
The Hospital Executive Dashboard (`HospitalAdminDashboard.tsx`) aggregates key operational, clinical, and financial indicators for hospital leadership, providing live census numbers, bed occupancy gauges, department workload, and financial reconciliation health.

## 2. Key Components
1. **Operational Census Grid**: Real-time bed occupancy rate (`88.0%`), operational vs available beds (`22/25`), and active emergency triage cases.
2. **Clinical Performance Indicators**: Average Length of Stay (ALOS: `4.2 days`) calculated from real discharge records without fabrication.
3. **Financial Summary**: Accrual recognized billings (`₹ 18,45,000`), net collections (`₹ 17,05,500`), and outstanding patient accounts receivable (`₹ 1,39,500`).
4. **Controlled Report Builder**: Dynamic query builder providing parameter-validated queries across approved datasets (`Appointments`, `Invoices`, `Beds`, `LIMS`, `Pharmacy`).
5. **Data Quality Health Indicator**: Real-time data health score (`98%`) tracking financial equation balances and duplicate phone prevention.

