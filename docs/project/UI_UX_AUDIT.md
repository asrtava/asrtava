# ASRTAVA — Enterprise UI/UX Audit & Design Baseline

**Audit Date:** 2026-11-09  
**Ecosystem:** ASRTAVA Multi-Tenant SaaS Hospital Management System  
**Lead Auditor:** Senior Full-Stack UX Architect & Design Lead

---

## 1. Executive Summary

This audit assesses the visual design, component architecture, layout consistency, interaction patterns, accessibility, and responsive behavior across all 14 user interfaces of the ASRTAVA platform:
1. Public Homepage & Navigation (`/`)
2. Role Selection & Authentication (`/login/*`)
3. Hospital Admin Portal (`/hospital-admin`)
4. Doctor Portal (`/doctor`)
5. Nursing Station (`/nursing`)
6. Reception & OPD Desk (`/reception`)
7. Laboratory Diagnostics (`/laboratory`)
8. Radiology & PACS (`/radiology`)
9. Pharmacy & Dispensary (`/pharmacy`)
10. Finance & Accounts (`/finance`)
11. HR & Staffing (`/hr`)
12. Inventory & Procurement (`/inventory`)
13. Patient Web Portal (`/patient`)
14. Super Admin SaaS Platform (`/super-admin`)
15. Patient Mobile Application (`apps/patient-mobile`)

---

## 2. Current State Findings & Heuristic Evaluation

### 2.1 Brand Identity & Color System
- **Current Condition:**
  - Tailwind palette utilizes standard `teal-600` and `slate-900`.
  - While clean, color distribution across portals lacks a strict semantic token hierarchy for medical alerts (Panic values, Stat orders, Low stock, Overdue invoices).
  - Several portals define ad-hoc hex values (`#0D9488`, `#0F766E`, `#151F32`) directly in component classes rather than referencing centralized semantic tokens.
- **Remediation Plan:**
  - Formalize unified color tokens in `tailwind.config.js`:
    - `brand`: Deep clinical teal (`brand-600: #0d9488`, `brand-700: #0f766e`, `brand-800: #115e59`)
    - `navy`: Structural slate (`navy-900: #0f172a`, `navy-800: #1e293b`, `navy-700: #334155`)
    - `medical`: Dedicated clinical status colors:
      - `emergency`: `#e11d48` (Rose 600) for ESI Level 1, Critical Panic Values
      - `urgent`: `#d97706` (Amber 600) for STAT orders, pending approvals
      - `stable`: `#059669` (Emerald 600) for normal vitals, paid invoices, cleared beds
      - `info`: `#0284c7` (Sky 600) for routine appointments, scheduled shifts

### 2.2 Shared Component Library
- **Current Condition:**
  - `src/components/ui` contains basic primitives: `Badge`, `Button`, `Card`, `EmptyState`, `Input`, `Modal`, `Toast`.
  - Missing standardized shared components for common data-intensive hospital workflows:
    - `Select`: Many portals use raw `<select>` elements with inconsistent styling and missing focus rings.
    - `Table`: Tables are manually coded across portals with varying border styles, header padding, and missing sort/pagination wrappers.
    - `SearchInput`: Inconsistent search field layouts; missing clear buttons and keyboard shortcuts.
    - `Switch`: Toggle controls for doctor availability, bed status, and notification preferences use disparate radio buttons or checkboxes.
    - `SkeletonLoader`: Several portals show jarring empty boxes during initial data fetch rather than subtle shimmer placeholders.
    - `ConfirmDialog`: Critical destructive actions (e.g. bed reallocation, supervisor refunds, staff deactivations) use varied modal implementations.
- **Remediation Plan:**
  - Implement full suite of enterprise components in `src/components/ui/` with comprehensive TypeScript props, accessible ARIA attributes, and cohesive visual styling.

### 2.3 Navigation & Shared AppShell
- **Current Condition:**
  - `AppShell.tsx` provides sidebar navigation, but lacks:
    - Explicit breadcrumb path tracking for deep nested screens.
    - Global keyboard search pill (`Ctrl + K`).
    - Dedicated hospital tenant badge showing active facility name and branch.
    - Role indicator badge prominently showing active role privileges.
    - Compact collapsed mode for high-density clinical views (e.g. Intensive Care or OT schedules).
- **Remediation Plan:**
  - Upgrade `AppShell.tsx` to include hospital tenant banner, breadcrumbs, role badge, notification drawer trigger, and responsive mobile overlay.

### 2.4 Data-Heavy Screens & Tables
- **Current Condition:**
  - Tables in Pharmacy, Finance, Laboratory, and HR lack sticky headers on long vertical scrolls.
  - Column alignment varies (monetary figures are sometimes left-aligned rather than right-aligned for decimal clarity).
- **Remediation Plan:**
  - Implement reusable `Table` component with right-aligned numeric formatting, monospace fonts for identifiers (`UHID`, `Invoice #`, `Batch #`), and sticky headers.

### 2.5 Mobile & Touch Target Ergonomics
- **Current Condition:**
  - Desktop web portal is responsive via Tailwind, but certain dense action buttons (e.g. table row action menus) fall below the 44x44px touch target guideline on touchscreens.
  - Patient mobile app (`apps/patient-mobile`) screens are functional but benefit from enhanced typography tokens and visual parity with the web portal.
- **Remediation Plan:**
  - Enforce minimum 44px tap targets on all interactive controls. Standardize elevation cards and action sheets on mobile.

---

## 3. Prioritized Redesign Roadmap

1. **Phase 1: Design Tokens & Tailwind Configuration**:
   - Update `tailwind.config.js` with semantic tokens (`brand`, `navy`, `medical`, `surface`).
2. **Phase 2: Enterprise Shared Component Library**:
   - Add `Select`, `SearchInput`, `Table`, `Tabs`, `Switch`, `Tooltip`, `SkeletonLoader`, `ConfirmDialog`.
3. **Phase 3: Shared AppShell Polish**:
   - Refactor `AppShell.tsx` with tenant header, breadcrumbs, role badge, and mobile drawer.
4. **Phase 4: Public Website & Role Navigation Polish**:
   - Enhance `PublicHomePage.tsx` and `PublicNavbar.tsx` with enterprise medical typography, trust metrics, and categorized role selector.
5. **Phase 5: Staff Portals Modernization**:
   - Standardize table styles, status badges, and modals across Doctor, Nursing, Reception, Diagnostics, Pharmacy, Finance, HR, and Inventory.
6. **Phase 6: Patient Web & Mobile Experience**:
   - Polish `PatientDashboard.tsx` and `apps/patient-mobile` screens with clean patient-friendly cards.
7. **Phase 7: Audits, Tests & Performance Validation**:
   - Conduct responsive and accessibility audits; verify `npm run build` chunk sizes remain under 500 kB.

