# ASRTAVA Emergency Department & Trauma Implementation Plan

## 1. Execution Stages

### Stage 1: Database Architecture (Prompt 22)
- Author database migration `database/migrations/029_emergency_department_triage_and_ambulance.sql`.
- 11 tables with Row-Level Security, foreign keys, and status indexes.

### Stage 2: Backend Implementation
- Author `backend/src/modules/emergency/emergency-advanced.service.ts`.
- Author `backend/src/modules/emergency/emergency-advanced.routes.ts`.
- Mount at `/api/v1/emergency/advanced` in `backend/src/server.ts`.
- Verify TypeScript compilation (`npm --prefix backend run build`).

### Stage 3: Frontend Interface
- Author `apps/web-portal/src/portals/emergency/AdvancedEmergencyHub.tsx`.
- Author `apps/web-portal/src/portals/emergency/EmergencyDashboard.tsx`.
- Register `'emergency'` portal in `AuthContext.tsx`, `AppShell.tsx`, and `App.tsx`.
- Verify Vite frontend compilation (`npm --prefix apps/web-portal run build`).

### Stage 4: Automated Testing
- Author `backend/tests/advanced_emergency_management.test.ts` (16 scenarios).
- Execute test suite and add to `backend/package.json`.

### Stage 5: Documentation & Governance
- Complete all validation files in `docs/emergency/*`.

