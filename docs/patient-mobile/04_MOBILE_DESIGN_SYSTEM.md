# Mobile Design System & UI/UX Guidelines

## 1. Brand Palette & Color Tokens
- Primary Brand Teal: `#0F766E` (Dark), `#14B8A6` (Light), `#F0FDFA` (Surface)
- Background: `#F8FAFC` (Slate 50)
- Cards & Modals: `#FFFFFF` with 1px border `#E2E8F0` and subtle elevation
- Status Colors:
  - Success / Normal: `#16A34A` / `#F0FDF4`
  - Warning / Alert: `#D97706` / `#FFFBEB`
  - Danger / Abnormal: `#DC2626` / `#FEF2F2`
  - Info: `#2563EB` / `#EFF6FF`

## 2. Reusable Component Primitives
- **Header (`Header.tsx`)**: Consistent navigation title, subtitle, optional back chevron, and right-hand action slots.
- **Button (`Button.tsx`)**: Primary, Secondary, Outline, and Danger variants with integrated `ActivityIndicator` spinners and accessible touch targets (min 44px).
- **Card (`Card.tsx`)**: Rounded 14px container with soft border and shadow.
- **Badge (`Badge.tsx`)**: Micro-status tags with color-coded surface fills.
- **Input (`Input.tsx`)**: Text inputs with uppercase labels, secure entry toggles, and inline validation error text.

