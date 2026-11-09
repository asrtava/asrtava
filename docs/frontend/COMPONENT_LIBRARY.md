# ASRTAVA Reusable UI Component Library

## 1. Overview & Principles

The ASRTAVA component library located in `apps/web-portal/src/components/ui/` provides standardized, accessible, and responsive building blocks across all 12 portals.

All components follow standard React 18 TypeScript patterns with forwardRef support, ARIA attributes, and Tailwind CSS utility styling.

---

## 2. Component Specifications

### 1. Button (`Button.tsx`)
A flexible button component supporting 6 visual variants, 3 sizes, loading state with an SVG spinner, and custom left/right icons.

```typescript
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}
```

**Usage Example:**
```tsx
import { Button } from '@/components/ui';

<Button variant="primary" size="sm" onClick={handleSave}>
  Save Prescription
</Button>

<Button variant="danger" size="sm" isLoading={isDeleting}>
  Delete Record
</Button>
```

---

### 2. Input (`Input.tsx`)
Accessible form text input with floating labels, error text, helper hints, and prefix/suffix icon slots.

```typescript
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}
```

**Usage Example:**
```tsx
import { Input } from '@/components/ui';
import { Search } from 'lucide-react';

<Input
  label="Patient Telephone"
  placeholder="+91 98765 43210"
  leftIcon={<Search className="w-4 h-4 text-slate-400" />}
  error={errors.phone}
/>
```

---

### 3. Badge (`Badge.tsx`)
Status pill component with color tokens mapped to clinical and operational workflows.

```typescript
interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'brand' | 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'neutral';
  size?: 'sm' | 'md';
  dot?: boolean;
}
```

**Usage Example:**
```tsx
import { Badge } from '@/components/ui';

<Badge variant="success" size="sm" dot>
  Report Verified
</Badge>

<Badge variant="danger" size="sm">
  Critical Value
</Badge>
```

---

### 4. Modal (`Modal.tsx`)
Accessible dialog box with blurred backdrop, title, subtitle description, action footer, and escape key listener.

```typescript
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}
```

**Usage Example:**
```tsx
import { Modal, Button } from '@/components/ui';

<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Dispense Medication"
  description="Verify batches before dispensing"
  footer={
    <>
      <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
      <Button variant="primary" onClick={handleConfirm}>Confirm</Button>
    </>
  }
>
  <div>Modal body content...</div>
</Modal>
```

---

### 5. Card (`Card.tsx`)
Modular card container with header, title, description, content, and footer sub-components.

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui';

<Card>
  <CardHeader>
    <CardTitle>Bed Management</CardTitle>
    <CardDescription>Ward ICU-A Occupancy</CardDescription>
  </CardHeader>
  <CardContent>
    <p>22 of 25 beds currently occupied.</p>
  </CardContent>
  <CardFooter>
    <Button size="sm">Manage Beds</Button>
  </CardFooter>
</Card>
```

---

### 6. EmptyState & LoadingSkeleton (`EmptyState.tsx`)
Provides graceful fallback states when queries return zero records, and animated pulse placeholders during asynchronous data fetches.

```tsx
import { EmptyState, LoadingSkeleton } from '@/components/ui';
import { Pill } from 'lucide-react';

{isLoading ? (
  <LoadingSkeleton rows={4} />
) : items.length === 0 ? (
  <EmptyState
    icon={<Pill className="w-6 h-6 text-slate-400" />}
    title="No Medications Prescribed"
    description="Click '+ Add Medicine' to prescribe from the hospital formulary."
  />
) : (
  <ItemsList data={items} />
)}
```

---

### 7. Toast Notification System (`Toast.tsx`)
Global notification queue providing non-intrusive feedback across clinical encounters and transactions.

```tsx
import { useToast } from '@/components/ui';

const { showToast } = useToast();

showToast({
  type: 'success', // 'success' | 'error' | 'warning' | 'info'
  title: 'Consultation Finalized',
  message: 'Electronic prescription synced with Central Pharmacy.',
  duration: 4000
});
```

