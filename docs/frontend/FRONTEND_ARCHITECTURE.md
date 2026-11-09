# ASRTAVA Frontend Architecture Specification

## 1. Executive Overview

ASRTAVA is an enterprise-grade multi-tenant SaaS Hospital Management System (HMS) developed with a modern, modular, component-driven frontend architecture. It provides specialized, role-tailored workspaces for all healthcare roles while maintaining centralized identity, security, and tenant isolation through PostgreSQL Row-Level Security (RLS).

```
                      ┌────────────────────────────────────────┐
                      │            ASRTAVA Monorepo            │
                      └───────────────────┬────────────────────┘
                                          │
            ┌─────────────────────────────┴─────────────────────────────┐
            ▼                                                           ▼
┌─────────────────────────┐                                 ┌─────────────────────────┐
│     apps/web-portal     │                                 │   apps/patient-mobile   │
│  React 18 + TypeScript  │                                 │ React Native CLI 0.88.1 │
│    Vite + Tailwind CSS  │                                 │ Android & iOS Platforms │
└───────────┬─────────────┘                                 └───────────┬─────────────┘
            │                                                           │
            └─────────────────────────────┬─────────────────────────────┘
                                          │  REST APIs + JWT Bearer
                                          ▼
                            ┌───────────────────────────┐
                            │      Backend Gateway      │
                            │   Port 5000 /api/v1       │
                            └─────────────┬─────────────┘
                                          │  pg RLS
                                          ▼
                            ┌───────────────────────────┐
                            │    PostgreSQL Database    │
                            │   13 Migration Schemas    │
                            └───────────────────────────┘
```

---

## 2. Technology Stack

| Layer | Technology | Specification / Version |
| :--- | :--- | :--- |
| **Framework** | React 18 | `react@18.3.1`, `react-dom@18.3.1` |
| **Build Tool** | Vite | `vite@6.4.5` with ESM hot module replacement (HMR) |
| **Language** | TypeScript | `typescript@5.4.5` strict mode enabled |
| **Styling** | Tailwind CSS + PostCSS | `tailwindcss@3.4.1`, `autoprefixer@10.4.19`, PostCSS 8 |
| **Icons** | Lucide React | `lucide-react@0.460.0` (accessible SVG icons) |
| **HTTP Client** | Axios | `axios@1.7.2` with rotated refresh token interceptors |
| **Mobile App** | React Native CLI | `react-native@0.88.1` targeting Android SDK 34 & iOS 17 |
| **State Management** | React Context + Hooks | `AuthContext`, `ToastContext`, localized workbench state |

---

## 3. Directory Layout

```
apps/web-portal/
├── index.html                  # HTML5 entry with viewport & responsive meta
├── package.json                # Dependencies, build scripts & type: module
├── postcss.config.js           # PostCSS Tailwind CSS & Autoprefixer plugin config
├── tailwind.config.js          # ASRTAVA clinical teal design token extensions
├── tsconfig.json               # Path mappings, strict checks & React 18 types
├── vite.config.ts              # Vite dev server proxy & plugins
└── src/
    ├── index.css               # Tailwind directives (@tailwind base, components, utilities)
    ├── main.tsx                # React DOM root render
    ├── App.tsx                 # Main portal switcher & authentication gateway
    ├── auth/                   # Distinct gateway screens
    │   ├── SuperAdminLogin.tsx # Platform owner TOTP MFA challenge
    │   ├── HospitalAdminLogin.tsx # Tenant domain & administrator credentials
    │   ├── StaffLogin.tsx      # Common staff login with role quick-selector
    │   └── PatientLogin.tsx    # Patient phone / OTP & ABHA login
    ├── components/
    │   ├── layout/
    │   │   └── AppShell.tsx    # Responsive sidebar, header, role switcher & Ctrl+K search
    │   └── ui/                 # Reusable component library
    │       ├── Button.tsx      # 6 visual variants, loading spinners, 3 sizes
    │       ├── Input.tsx       # Accessible text inputs with prefix/suffix icons
    │       ├── Badge.tsx       # Status badges (success, danger, warning, brand, info)
    │       ├── Card.tsx        # Compound cards with header, title, and footer
    │       ├── Modal.tsx       # Accessible modal dialog with backdrop blur & keyboard trap
    │       ├── EmptyState.tsx  # Fallback states & animated loading skeletons
    │       ├── Toast.tsx       # Toast context provider & notifications queue
    │       └── index.ts        # Barrel export
    ├── context/
    │   └── AuthContext.tsx     # Session management, token refresh, workspace switching
    ├── portals/                # 12 Dedicated functional portal interfaces
    │   ├── super-admin/        # Tenant management & SaaS billing matrix
    │   ├── hospital-admin/     # Department operations & staff provisioning
    │   ├── doctor/             # OPD workbench, EMR, e-Prescriptions & diagnostics
    │   ├── nursing/            # Live bed occupancy grid & e-MAR schedule
    │   ├── reception/          # Front desk registration, tokens & IPD admission
    │   ├── pharmacy/           # FEFO dispensing & POS counter retail checkout
    │   ├── laboratory/         # Specimen accessioning & pathologist sign-off
    │   ├── radiology/          # PACS DICOM study viewer & diagnostic reporting
    │   ├── finance/            # Invoices, multi-mode payments & TPA claims
    │   ├── hr/                 # Staff directory, duty shifts & leave approvals
    │   ├── inventory/          # Purchase orders & Goods Receipt Note (GRN)
    │   └── patient/            # Patient appointments, e-Rx, lab reports & bills
    └── services/
        └── api.ts              # Centralized Axios client & REST endpoints
```

---

## 4. State Management & Data Flow

1. **Authentication State**: Handled centrally via `AuthContext`. Tokens (`accessToken`, `refreshToken`) are stored securely in browser session storage with automatic rotated renewal via `/api/v1/auth/refresh`.
2. **Workspace Switching**: Healthcare professionals holding multiple roles (e.g. Chief of Cardiology and Hospital Administrator) can seamlessly switch workspaces using `switchWorkspace()`. The backend revalidates permissions and returns a fresh scoped JWT.
3. **Optimistic Updates**: Clinical actions (e.g., administering a medication dose in e-MAR, calling an OPD queue token, dispensing medicine) reflect immediately in local React state with automated toast notifications, while dispatching asynchronous mutations to backend REST APIs.
4. **Tenant Context**: Every HTTP request automatically passes the active `x-tenant-id` header (or extracts it from the JWT payload) to guarantee Row-Level Security isolation at the PostgreSQL database level.

