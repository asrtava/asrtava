# ASRTAVA Enterprise Design System & Visual Tokens

**Document Reference:** `docs/project/ASRTAVA_DESIGN_SYSTEM.md`  
**Version:** 1.0.0-ENTERPRISE  
**Authority:** ASRTAVA Design System Lead & Frontend Architect  
**Design Principles:** Trust, Clinical Clarity, High Legibility, WCAG 2.2 AA Accessibility, Operational Efficiency

---

## 1. Brand Color System & Semantic Palette

The ASRTAVA design system balances authoritative deep navy structure with clinical teal accents and explicit, unmistakable medical status indicators.

### 1.1 Structural Navy Tokens (Layout & Typography)
- `navy-950` (`#0A0E17`): Deepest contrast ground
- `navy-900` (`#0F172A`): Primary headings, top navigation brand, active sidebar background
- `navy-850` (`#151F32`): High-density sidebar surface
- `navy-800` (`#1E293B`): Secondary surfaces, high-contrast modal headers
- `navy-700` (`#334155`): Secondary body text, table column headers
- `navy-500` (`#64748B`): Muted text, timestamps, helper labels, placeholder icons
- `navy-200` (`#E2E8F0`): Card borders, table dividers, input borders
- `navy-100` (`#F1F5F9`): Subtle table alternating rows, badge background
- `navy-50`  (`#F8FAFC`): Application page ground

### 1.2 Clinical Brand Teal Tokens (Primary Actions & Focus)
- `brand-50`  (`#F0FDFA`): Highlight background, selected table rows
- `brand-100` (`#CCFBF1`): Active nav pill, low-emphasis badge
- `brand-500` (`#14B8A6`): Interactive hover, chart series 1
- `brand-600` (`#0D9488`): **Primary Brand Action** (buttons, active tabs, focus ring)
- `brand-700` (`#0F766E`): Pressed buttons, primary link states
- `brand-800` (`#115E59`): High-contrast text on teal ground

### 1.3 Medical Alert & Status Semantics (Unmistakable Clinical Indicators)

| Status Category | Solid Color | Light Background | Border Color | Standard Use Cases |
| :--- | :--- | :--- | :--- | :--- |
| **Emergency / Critical** | `#E11D48` (`rose-600`) | `#FFF1F2` (`rose-50`) | `#FECDD3` (`rose-200`) | ESI-1 Resuscitation, Panic Lab Values, Drug Allergies, Overdue Invoices |
| **Urgent / Warning** | `#D97706` (`amber-600`) | `#FFFBEB` (`amber-50`)| `#FDE68A` (`amber-200`)| STAT Imaging, Low Stock Reorder, Unverified Admin, Pending Discharge |
| **Stable / Success** | `#059669` (`emerald-600`)| `#ECFDF5` (`emerald-50`)| `#A7F3D0` (`emerald-200`)| Normal Vitals, Paid Invoice, Dispensed Rx, Cleaned Bed, Completed Round |
| **Routine / Information**| `#0284C7` (`sky-600`) | `#F0F9FF` (`sky-50`) | `#BAE6FD` (`sky-200`) | Scheduled OPD, Confirmed Appointment, Checked-in Token, Standard Order |
| **Neutral / Muted** | `#64748B` (`slate-500`) | `#F8FAFC` (`slate-50`) | `#E2E8F0` (`slate-200`)| Cancelled, Draft, Inactive Staff, Unallocated Bed |

---

## 2. Typography Hierarchy

The typography system uses `Inter` for exceptional legibility on high-density medical tables, paired with tabular figures for currency and patient identifiers.

| Token | Class | Size / Line Height | Weight | Typical Application |
| :--- | :--- | :--- | :--- | :--- |
| **Display 1** | `text-3xl md:text-4xl` | 36px / 44px | Bold (700) | Public Hero Title, SaaS Platform Overview |
| **Heading 1** | `text-2xl` | 24px / 32px | Bold (700) | Portal Dashboard Title, Module Header |
| **Heading 2** | `text-xl` | 20px / 28px | Semibold (600) | Modal Title, Section Header, Card Group Title |
| **Heading 3** | `text-lg` | 18px / 26px | Semibold (600) | Card Title, Sub-panel Header |
| **Body Regular**| `text-sm` | 14px / 20px | Regular (400) | Default table cells, form labels, paragraph text |
| **Body Medium** | `text-sm` | 14px / 20px | Medium (500) | Form input text, navigation items, button text |
| **Caption** | `text-xs` | 12px / 16px | Medium (500) | Status badges, table headers, metadata timestamps |
| **Monospace** | `font-mono text-xs/sm` | 12-14px | Regular/Med | UHID, ICD-10 Code, Invoice Number, Batch Number |

---

## 3. Elevation, Spacing & Corner Radii

### 3.1 Shadows & Z-Index Layers
- `shadow-subtle`: Subtle separation for cards on `#f8fafc` (`0 1px 3px 0 rgba(15,23,42,0.05)`)
- `shadow-card`: Hover state on clickable cards (`0 4px 6px -1px rgba(15,23,42,0.06)`)
- `shadow-elevated`: Flyout dropdowns, popovers, notifications drawer (`0 10px 15px -3px rgba(15,23,42,0.08)`)
- `shadow-modal`: Dialog backdrops, full clinical encounters (`0 20px 25px -5px rgba(15,23,42,0.15)`)
- `z-50`: Modals, toast notifications, confirmation overlays

### 3.2 Corner Radii
- `rounded-md` (`6px`): Buttons, input fields, badges, select menus
- `rounded-lg` (`8px`): Content cards, table containers, alerts
- `rounded-xl` (`12px`): Modal dialogs, dashboard metric summaries, hero banners

---

## 4. Operational Usability & Ergonomics Standards

1. **Information Density Rules**:
   - Operational dashboards (Doctor, Nursing, Laboratory) use high information density with 8px-12px padding per table cell to ensure clinicians view maximum queue context without excessive scrolling.
   - Patient web portal and mobile screens use comfortable 16px-24px padding for welcoming, touch-friendly interactions.
2. **Tabular Numerals & Monospaced Identifiers**:
   - All monetary figures (`₹12,450.00`) are right-aligned with tabular numbers to prevent decimal misalignments.
   - All patient UHIDs (`SIM-PT-00100`), prescription numbers (`RX-00042`), and batch IDs (`BAT-2026-B`) use `font-mono` to prevent misreading characters like `0` vs `O` or `1` vs `I`.
3. **Accessibility (WCAG 2.2 AA Compliance)**:
   - All text against background meets or exceeds a 4.5:1 contrast ratio.
   - Interactive elements feature explicit `:focus-visible` rings with a 2px offset.
   - Tap targets on mobile and touchscreen tablets are calibrated to a minimum 44x44px.

