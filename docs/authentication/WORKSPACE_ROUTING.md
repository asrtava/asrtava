# ASRTAVA — Workspace Resolution & Dynamic Routing

## 1. Role-to-Workspace Mapping

When a staff member authenticates at `/staff/login`, the backend evaluates all active roles for the hospital tenant and resolves the authorized workspace list:

| System Role Code | Primary Portal Key | Route Path | Dashboard Component |
| :--- | :--- | :--- | :--- |
| `super_admin` | `super-admin` | `/super-admin/*` | `SuperAdminDashboard` |
| `hospital_owner`, `hospital_admin` | `hospital-admin` | `/hospital/*` | `HospitalAdminDashboard` |
| `doctor` | `doctor` | `/doctor/*` | `DoctorDashboard` |
| `nurse` | `nursing` | `/nursing/*` | `NursingDashboard` |
| `receptionist` | `reception` | `/reception/*` | `ReceptionDashboard` |
| `pharmacist` | `pharmacy` | `/pharmacy/*` | `PharmacyDashboard` |
| `lab_staff` | `laboratory` | `/laboratory/*` | `LaboratoryDashboard` |
| `radiology_staff` | `radiology` | `/radiology/*` | `RadiologyDashboard` |
| `billing_executive`, `accountant` | `finance` | `/finance/*` | `FinanceDashboard` |
| `hr_manager` | `hr` | `/hr/*` | `HRDashboard` |
| `inventory_manager` | `inventory` | `/inventory/*` | `InventoryDashboard` |
| `patient` | `patient` | `/patient/*` | `PatientDashboard` |

---

## 2. Server-Revalidated Workspace Switching

When a multi-role user switches workspaces via the top navigation dropdown:
1. The frontend dispatches `POST /api/v1/auth/switch-workspace` with `{ hospitalId, targetPortal }`.
2. The server verifies:
   - User holds an active membership in the target hospital.
   - User holds assigned roles granting access to the target workspace.
3. The server generates a **new scoped JWT access token** reflecting the updated active workspace context.
4. An audit record is logged with event type `workspace_switch`.
5. Client-supplied role tampering is completely prevented since the server is the sole authority for token generation.

