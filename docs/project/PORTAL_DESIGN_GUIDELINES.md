# ASRTAVA Portal Design Guidelines & Operational Workspace Specifications

**Document Reference:** `docs/project/PORTAL_DESIGN_GUIDELINES.md`  
**Version:** 1.0.0-ENTERPRISE  
**Audience:** Frontend Developers, Product Designers, Clinical Informaticists  
**Standard:** WCAG 2.2 AA Compliant, High Information Density, Zero-Drift Visual Cohesion

---

## 1. Architectural Philosophy: Role-Specialized Workspaces

ASRTAVA intentionally rejects "one-size-fits-all" dashboard templates. Every hospital role operates under different cognitive demands, physical environments, and urgency constraints:
- **Clinical Workspaces (Doctor, Nurse, OT)**: Must minimize clutter, prioritize immediate patient identity (UHID, Age, Blood Group, Allergies), and present actionable queues with 1-click status transitions.
- **Diagnostic Workspaces (Laboratory, Radiology)**: Must highlight biological reference interval out-of-range flags, pre-analytical sample integrity, and PACS DICOM study telemetry.
- **Operational & Front Desk (Reception, Pharmacy)**: Must facilitate rapid barcode scanning, token calling, receipt printing, and FEFO drug dispensing.
- **Administrative & Governance (Hospital Admin, Super Admin, Finance, HR)**: Must offer deep tabular inspection, filterable audit trails, date-range analytics, and dual-control reversal workflows.
- **Patient Self-Service (Web & Mobile)**: Must use welcoming, empathetic, jargon-free terminology with clear chronological timelines.

---

## 2. Portal-by-Portal Design Specifications

### 2.1 Public Homepage & Navigation (`/`)
- **Visual Tone:** Enterprise Trust, Sovereign Infrastructure, Modern Medical Reliability.
- **Hero Typography:** 48-60px bold display typography paired with high-contrast dual call-to-actions ("Hospital Admin Portal" in teal, "Doctor Workspace" in slate).
- **Navigation Bar (`PublicNavbar`):** Sticky translucent navy navbar (`bg-slate-900/95 backdrop-blur-md`) featuring the **Select Role** dropdown categorized into:
  - Clinical Workspaces: Doctor, Nursing Station
  - Diagnostics & Pharmacy: Laboratory, Radiology, Pharmacy
  - Administration & Finance: Hospital Admin, Reception, Finance & Billing, HR & Staff, Inventory
  - Patient & Platform: Patient Portal, Super Admin Console

### 2.2 Hospital Admin Control Center (`/hospital-admin`)
- **Key Modules:** 19 Administrative Domains across 6 dedicated panels (Overview, Departments, Doctors, Wards & Beds, Billing Tariffs, Notifications, Settings, Audit Logs).
- **Data Presentation:** Card-based metric grids with 4-metric KPIs (Registered Patients, Active Doctors, Active Staff, Bed Occupancy %) and real-time database-backed charts.
- **Forms & Actions:** Inline table actions with subtle action buttons; modal dialogs with dual cancel/save buttons.

### 2.3 Doctor Workspace (`/doctor`)
- **Key Modules:** Live OPD Queue, Consultation EMR (SOAP Notes), ICD-10 Diagnostic Search, e-Prescriptions, Lab & Imaging Orders, Daily IPD Ward Rounds.
- **Patient Identity Banner:** Always visible in consultation mode with Patient Name, UHID (`SIM-PT-XXXXX`), Age, Gender, and Blood Group.
- **Visual Cues:**
  - High-priority allergies flagged in `bg-rose-50 border-rose-300 text-rose-800`.
  - ICD-10 diagnostic codes displayed in `font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded`.

### 2.4 Nursing Station (`/nursing`)
- **Key Modules:** Ward Census Grid, Vitals Monitoring Charts, e-MAR Medication Administration (5-Rights verified), Nursing Care Plans (NCP), Fluid Balance (I/O), SBAR Shift Handover.
- **Color Semantics:**
  - Occupied beds in `bg-white border-brand-500 shadow-sm`.
  - Beds scheduled for sanitization in `bg-amber-50 border-amber-300 text-amber-800`.
  - Available beds in `bg-slate-50 border-slate-200 text-slate-500`.

### 2.5 Reception & Front Office (`/reception`)
- **Key Modules:** Live Token Queue, Patient Lookup & Registration, Appointment Booking, OPD Quick Billing.
- **Ergonomics:** Prominent, keyboard-accessible quick search bar; oversized token numbers (`Token #014`) visible from distance.

### 2.6 Laboratory Diagnostics (`/laboratory`)
- **Key Modules:** Order Accessioning, Specimen Pre-Analytical Inspection, Result Entry, Panic Alert Broadcast.
- **Critical Indicators:**
  - Values outside biological reference ranges highlighted in `bg-amber-50 text-amber-800`.
  - Critical panic values (e.g., Potassium > 6.5 mEq/L) highlighted in pulsating `bg-rose-600 text-white font-bold px-2 py-0.5 rounded`.

### 2.7 Radiology & PACS (`/radiology`)
- **Key Modules:** Modality Worklist (X-Ray, CT, MRI, Ultrasound), Radiographer Assignment, PACS DICOM Viewer Bridge, Structured Radiologist Reporting.
- **Display Mode:** High-contrast slate table with live DICOM link badges (`DICOMweb WADO-RS Active`).

### 2.8 Pharmacy & Dispensary (`/pharmacy`)
- **Key Modules:** e-Prescription Fulfillment Queue, FEFO Batch Allocator, Formulary Generic Drug Substitution, Counter Retail POS, Purchase Requisitions.
- **Inventory Safety:**
  - Batch expiry date shown prominently with nearest expiry badge (`Exp: Dec 2026`).
  - Stock levels below reorder threshold flagged in `bg-rose-50 text-rose-700`.

### 2.9 Finance & Accounts (`/finance`)
- **Key Modules:** Consolidated Invoicing, Multi-Mode Payment Terminal (Cash, Card, UPI), Supervisor PIN-Authorized Refunds, TPA Insurance Pre-Auth.
- **Numeric Precision:** All monetary amounts formatted to 2 decimal places with `font-mono` right-aligned columns (`₹ 2,424.90`).

### 2.10 HR & Staff Management (`/hr`)
- **Key Modules:** Employee Directory, 3-Shift Duty Roster (Morning, Evening, Night), Shift Reassignments with Audit Notes, Leave Authorizations.

### 2.11 Inventory & Procurement (`/inventory`)
- **Key Modules:** Central Item Catalog, Stock Threshold Buffers, Purchase Orders (PO), Goods Received Notes (GRN), Internal Ward Stock Transfers.

### 2.12 Patient Web Portal (`/patient`)
- **Key Modules:** Health Timeline, Upcoming Appointments, Active Prescriptions with Dosage Intervals, Diagnostic Reports, Bills & Receipts.
- **Tone:** Empathetic, calm, clean white cards with large readable text and straightforward download buttons.

### 2.13 Patient Mobile Application (`apps/patient-mobile`)
- **Key Screens:** Mobile Login, Home Dashboard, Appointments, QR Check-In Pass, Lab Reports, Prescriptions, Bill Payment.
- **Touch Targets:** Minimum 44x44px clickable areas; safe area insets respected for iOS notch and Android navigation gestures.

### 2.14 Platform Super Admin (`/super-admin`)
- **Key Modules:** SaaS Multi-Tenant Manager, Subscription Plans, Global Audit Ledger, JIT Support Access.
- **Visual Separation:** High-contrast purple and deep navy branding, clearly distinct from hospital operational portals.

