# ASRTAVA Design System Specification

## 1. Brand Identity & Design Principles

The ASRTAVA visual language embodies trust, clinical precision, calm authority, and accessibility. Designed specifically for high-stress hospital environments, the UI minimizes cognitive fatigue through intentional whitespace, crisp typography, and unambiguous status indicators.

- **Primary Brand Color**: ASRTAVA Clinical Teal (`#0F766E` / `#14B8A6`)
- **Neutral Palette**: Clean Slate Grays (`#F8FAFC` to `#0F172A`)
- **Semantic Accents**: High-contrast, WCAG 2.1 AA-compliant feedback colors (Emerald for Success, Rose for Alerts/Critical, Amber for Warnings, Blue for Info).

---

## 2. Color Palette & Design Tokens

### Primary Brand (Teal)
```css
--brand-50:  #f0fdfa;
--brand-100: #ccfbf1;
--brand-200: #99f6e4;
--brand-300: #5eead4;
--brand-400: #2dd4bf;
--brand-500: #14b8a6; /* Primary Teal */
--brand-600: #0d9488;
--brand-700: #0f766e; /* Deep Clinical Teal */
--brand-800: #115e59;
--brand-900: #134e4a;
--brand-950: #042f2e;
```

### Semantic Status Colors
| State | Light Background | Border | Text | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **Success** | `bg-emerald-50` (`#ecfdf5`) | `border-emerald-200` | `text-emerald-800` | Signed encounters, normal lab results, paid invoices |
| **Warning** | `bg-amber-50` (`#fffbeb`) | `border-amber-200` | `text-amber-800` | Waiting queue, near expiry batches, pending approvals |
| **Danger / Alert** | `bg-rose-50` (`#fff1f2`) | `border-rose-200` | `text-rose-800` | Critical vitals, abnormal pathology, overdue bills |
| **Info / Modality** | `bg-blue-50` (`#eff6ff`) | `border-blue-200` | `text-blue-800` | In consultation, scheduled appointments, PACS studies |
| **Platform Owner** | `bg-purple-50` (`#faf5ff`) | `border-purple-200` | `text-purple-800` | Super Admin console, multi-tenant infrastructure |

---

## 3. Typography Scale

ASRTAVA utilizes system sans-serif typography (`Inter`, system-ui, `-apple-system`, `Segoe UI`, `Roboto`) optimized for dense clinical tables and dashboards:

| Style | Tailwind Classes | Size / Line Height | Usage |
| :--- | :--- | :--- | :--- |
| **Display Heading** | `text-2xl font-bold tracking-tight` | 24px / 32px | Portal primary titles |
| **Section Title** | `text-base font-bold text-slate-900` | 16px / 24px | Card headers, modal titles |
| **Body Bold** | `text-sm font-semibold text-slate-800` | 14px / 20px | Table column headers, form labels |
| **Body Standard** | `text-xs text-slate-600` | 12px / 16px | Standard table rows, descriptions |
| **Caption / Mono** | `text-[11px] font-mono text-slate-500` | 11px / 14px | UHIDs, batch numbers, timestamps |

---

## 4. Spacing, Elevation & Shadows

- **Grid Spacing**: 4px base increment (`gap-2`, `gap-3`, `gap-4`, `gap-6`).
- **Card Corners**: `rounded-xl` (12px) for cards, `rounded-2xl` (16px) for hero containers.
- **Elevation**:
  - `shadow-xs`: Subtle input & tag border lift.
  - `shadow-sm`: Standard dashboard cards and table containers.
  - `shadow-md`: Interactive hover states and floating drawers.
  - `shadow-xl`: Modal dialogs and backdrop popovers.

---

## 5. Accessibility (WCAG 2.1 AA Standards)

1. **Contrast Ratio**: All body copy and status badges maintain a contrast ratio >= 4.5:1 against their backgrounds.
2. **Focus Visibility**: All interactive buttons, inputs, and selects provide an explicit 2px focus ring (`focus:ring-2 focus:ring-teal-500`).
3. **Keyboard Navigation**:
   - `Ctrl + K` or `Cmd + K`: Instant global search trigger.
   - `Escape`: Closes open modals and drawers.
   - `Tab` / `Shift + Tab`: Natural focus progression across modal form inputs.
4. **Touch Targets**: Minimum interactive tap target size of 44x44px on mobile viewports.

