# ASRTAVA Centralized Component Library Documentation

**Document Reference:** `docs/project/COMPONENT_LIBRARY.md`  
**Package:** `apps/web-portal/src/components/ui`  
**Version:** 1.0.0-ENTERPRISE  
**Design Standard:** Tailwind CSS 3.4, WCAG 2.2 AA Accessible, React 19 Compatible

---

## 1. Overview & Export Roster

The ASRTAVA UI library provides 15 standardized, battle-tested components built to satisfy the operational ergonomics of high-pressure clinical workflows and administrative oversight.

All components are directly importable from `@/components/ui` or `../components/ui`:

```typescript
import {
  Button,
  Input,
  Badge,
  Card,
  Modal,
  EmptyState,
  Toast,
  Select,
  SearchInput,
  Switch,
  Tabs,
  Alert,
  Skeleton,
  TableSkeleton,
  CardSkeleton,
  ConfirmDialog,
  DataTable
} from '@/components/ui';
```

---

## 2. Component Specifications & Usage Guide

### 2.1 Button (`Button.tsx`)
- **Variants:** `primary` (brand teal), `secondary` (navy slate), `outline` (bordered white), `ghost` (transparent), `danger` (rose), `success` (emerald)
- **Sizes:** `sm` (px-3 py-1.5), `md` (px-4 py-2), `lg` (px-5 py-2.5)
- **Props:** `isLoading`, `leftIcon`, `rightIcon`, standard HTML button attributes
- **Accessibility:** Focus-visible ring offset, `disabled` state with `opacity-50 cursor-not-allowed`

### 2.2 Input (`Input.tsx`)
- **Features:** Floating/explicit labels, required asterisk (`*`), field-level error messages with Alert icon, helper text, left/right icon slots
- **Props:** `label`, `error`, `helperText`, `leftIcon`, `rightIcon`, standard HTML input props

### 2.3 Select (`Select.tsx`)
- **Features:** Custom chevron styling, label, field-level error message, disabled state, accessible `<select>` dropdown
- **Props:** `label`, `options: SelectOption[]`, `error`, `helperText`, standard select props

### 2.4 SearchInput (`SearchInput.tsx`)
- **Features:** Integrated magnifying glass icon, clear button (`X`), focused ring, debouncing support
- **Props:** `value: string`, `onChange: (val: string) => void`, `onClear?: () => void`, `placeholder`

### 2.5 Badge (`Badge.tsx`)
- **Variants:** `success`, `warning`, `danger`, `info`, `purple`, `brand`, `neutral`
- **Sizes:** `sm` (text-[10px]), `md` (text-[11px])
- **Props:** `dot?: boolean`, `children`, `className`

### 2.6 Card (`Card.tsx`)
- **Sub-components:** `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`
- **Features:** Standardized border (`border-slate-200`), subtle elevation (`shadow-subtle`), rounded corners (`rounded-xl`)

### 2.7 Modal (`Modal.tsx`)
- **Sizes:** `sm` (max-w-md), `md` (max-w-lg), `lg` (max-w-2xl), `xl` (max-w-4xl), `full` (max-w-6xl)
- **Features:** Backdrop blur, Escape key dismissal, scroll lock, title bar with close button

### 2.8 ConfirmDialog (`ConfirmDialog.tsx`)
- **Variants:** `danger` (destructive actions like supervisor refunds, staff suspensions), `warning`, `primary`
- **Features:** High-visibility alert icon, clear message body, dual buttons (Cancel + Confirm) with loading state

### 2.9 DataTable (`Table.tsx`)
- **Features:**
  - Responsive horizontal scrolling wrapper
  - Sticky/uppercase column headers
  - Right-aligned monospaced numeric cells for currency/dosages
  - Row click handler with hover feedback
  - Integrated `TableSkeleton` during loading
  - Integrated `EmptyState` when records array is empty
  - Integrated Pagination controls (Previous/Next, page counter)

### 2.10 Tabs (`Tabs.tsx`)
- **Variants:** `underline` (classic tab bar with bottom accent indicator), `pills` (compact rounded pill switcher)
- **Features:** Optional badge counts per tab, icon support, disabled tab state

### 2.11 Switch (`Switch.tsx`)
- **Features:** Accessible `role="switch"`, ARIA checked state, smooth sliding toggle transition, optional title & description labels

### 2.12 Alert (`Alert.tsx`)
- **Variants:** `emergency` (rose), `urgent` (amber), `stable` (emerald), `info` (sky)
- **Features:** Icon pairing, dismissal button, semantic role="alert"

### 2.13 SkeletonLoader (`SkeletonLoader.tsx`)
- **Components:** `Skeleton` (generic bar), `TableSkeleton` (multi-column shimmers), `CardSkeleton` (KPI metric boxes)
- **Features:** Gentle CSS pulse animation (`animate-pulse`) avoiding layout shifts

### 2.14 EmptyState (`EmptyState.tsx`)
- **Features:** Illustrated placeholder icon, title, description, and primary call-to-action button

