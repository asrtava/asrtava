# ASRTAVA Operation Theatre & Perioperative Implementation Plan

## 1. Execution Phases

### Phase 1: Planning, Schema & Core Services (Prompt 21)
1. Architectural planning and clinical audit documentation (`docs/ot/*`).
2. Database migration `database/migrations/028_operation_theatre_and_perioperative_care.sql` with 11 tables, RLS policies, foreign keys, and indexes.
3. Backend service `backend/src/modules/ot/ot-advanced.service.ts` implementing:
   - OT room and equipment register.
   - Surgery request and multi-resource conflict checking (room + surgeon + anaesthetist).
   - Preoperative assessment (PAC, ASA classification I-VI, Mallampati score).
   - Informed consent management with dual-signature verification.
   - Three-phase WHO Surgical Safety Checklist (Sign-In, Time-Out, Sign-Out).
   - Anaesthesia record and intraoperative vital logging.
   - Surgical sponge, sharps, and instrument count verification.
   - PACU admission and Modified Aldrete scoring (0-10) with ward discharge validation.
4. REST routes `backend/src/modules/ot/ot-advanced.routes.ts` mounted at `/api/v1/ot/advanced`.

### Phase 2: Frontend Integration
1. Author `apps/web-portal/src/portals/ot/AdvancedOTHub.tsx`.
2. Connect into `apps/web-portal/src/portals/ot/OTDashboard.tsx` with dedicated navigation tabs.
3. Build verification with `npm --prefix apps/web-portal run build`.

### Phase 3: Automated Testing & Verification
1. Author `backend/tests/advanced_ot_management.test.ts` covering 16 scenarios.
2. Run test suite and integrate into `backend/package.json`.
3. Verify backend TypeScript compilation (`npm --prefix backend run build`).

### Phase 4: Full Documentation & Compliance
1. Author complete validation reports, user guide, API specs, and implementation status.

