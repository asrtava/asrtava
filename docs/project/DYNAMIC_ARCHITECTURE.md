# ASRTAVA Dynamic-First Architecture & Zero-Hardcoded-Data Blueprint

**Document Reference:** `docs/project/DYNAMIC_ARCHITECTURE.md`  
**Architecture Model:** Database-Driven, Configuration-Driven, API-Integrated Modular Monolith  
**Core Directive:** Zero Inappropriate Hardcoded Business Data in Application Source Code

---

## 1. Dynamic-First Architectural Overview

The ASRTAVA Dynamic-First Architecture enforces a single authoritative source of truth: **The PostgreSQL Database and Backend API Services**. No presentation component (web portal, mobile app, or dashboard) is permitted to maintain autonomous, static copies of business records, prices, patient queues, or operational configurations.

```
+---------------------------------------------------------------------------------------------------------+
|                                    React 19 Portals & React Native Clients                              |
|                                                                                                         |
|  [ UI Presentation Layer ]                                                                              |
|    - Static: Component structure, UI labels, icons, route definitions, layout shells                   |
|    - Dynamic: All tables, dropdown options, queue lists, statistics, bed maps, invoices                |
|    - State: Managed via React `useEffect` hooks fetching from centralized `apiClient`                  |
|    - States: Dedicated Skeleton Loading, Interactive Empty States ("No records found"), Error Banners   |
+---------------------------------------------------------------------------------------------------------+
                                                     |
                                                     v (Axios API Client: JWT + x-hospital-id)
+---------------------------------------------------------------------------------------------------------+
|                                    ASRTAVA Centralized Backend REST API                                 |
|                                                                                                         |
|  [ Dynamic Business Logic & Validation Engine ]                                                         |
|    - Zod Schema Request Validation                                                                      |
|    - Centralized Hybrid RBAC & Individual Precedence: Deny > Allow > Role > Default Deny                |
|    - Dynamic Pricing & Tariff Snapshot Resolution (preserves historical invoice amounts)               |
|    - Dynamic Hospital Settings Resolution (currency, timezone, slot duration, GST rates)               |
+---------------------------------------------------------------------------------------------------------+
                                                     |
                                                     v (Knex Pool: Transactional Context)
+---------------------------------------------------------------------------------------------------------+
|                                     PostgreSQL 16 Multi-AZ Database                                     |
|                                                                                                         |
|  [ Persistent Source of Truth ]                                                                         |
|    - `hospitals`, `hospital_settings`, `hospital_branches`, `departments`                              |
|    - `patients`, `appointments`, `consultation_notes`, `prescriptions`                                 |
|    - `wards`, `rooms`, `beds`, `admissions`, `nursing_notes`                                            |
|    - `medicines`, `medicine_batches` (FEFO ordering), `dispensations`                                   |
|    - `billing_tariffs`, `invoices`, `invoice_items`, `payments`                                         |
|    - `audit_events_immutable` (SHA-256 Merkle chain non-repudiation)                                    |
|  [ Enforced Row-Level Security (RLS) ]                                                                  |
|    - Zero cross-tenant data bleed at the database kernel level                                          |
+---------------------------------------------------------------------------------------------------------+
```

---

## 2. Dynamic Component Design Standards

### 2.1 Dynamic State Lifecycle Pattern
Every frontend component that displays or mutates business records must adhere to this standard pattern:

```typescript
export const DynamicDomainView: React.FC = () => {
  const [data, setData] = useState<DomainRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecords = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await domainApi.getRecords();
      setData(res.data?.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load records from server');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  if (isLoading) return <LoadingSpinner message="Fetching live records from database..." />;
  if (error) return <ErrorBanner message={error} onRetry={fetchRecords} />;
  if (data.length === 0) return <EmptyState title="No records found" description="Create a new entry to get started." />;

  return <RecordTable data={data} onRefresh={fetchRecords} />;
};
```

### 2.2 Dynamic Dropdowns & Dependent Lookups
- **No Hardcoded Options**: Selection fields for Departments, Doctors, Wards, Beds, Medicines, and Tariffs must fetch their options dynamically from their respective `/api/v1/*` endpoints.
- **Immediate Cross-Workflow Availability**: When an administrator adds a new department via `POST /hospitals/departments`, subsequent doctor registration and appointment scheduling modals immediately reflect the new department without application rebuild or page reload.

### 2.3 Configuration-Driven Hospital Customization
- Every hospital tenant's operational behavior is dictated by `hospital_settings` in PostgreSQL:
  - `appointment_slot_duration`: Dictates appointment scheduling granularity (e.g., 15 vs 30 minutes).
  - `working_hours_start` & `working_hours_end`: Restricts bookable doctor slots.
  - `currency`: Display symbol and monetary formatting (e.g., `INR`, `USD`).
  - `tax_enabled` & `default_tax_rate`: Dynamic GST tax calculation (e.g., 18%, 12%, 0%).
  - `invoice_prefix` & `patient_id_prefix`: Formatting of UHID and Invoice numbers (e.g., `APEX-2026-00001`).

### 2.4 Dynamic Price Snapshots
- When service charges or doctor consultation fees are modified in `billing_tariffs`, existing invoices must **NEVER** silently change.
- Invoicing endpoints snapshot the effective price and tax rate into `invoice_items` at the exact moment of invoice creation, preserving historical audit and legal integrity.

