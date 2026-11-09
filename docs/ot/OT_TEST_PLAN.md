# ASRTAVA Operation Theatre & Perioperative Test Plan

## 1. Scope
Comprehensive automated and end-to-end verification of Operation Theatre management, scheduling conflict engines, preoperative PAC workflows, WHO surgical safety checklists, intraoperative anaesthesia charting, sponge/instrument count reconciliation, and PACU Modified Aldrete discharge protocols.

## 2. Test Objectives
- Verify registration and status tracking of multiple operating theatres (specialty, laminar flow).
- Validate triple resource conflict checking: OT room collisions, lead surgeon overlaps, and consultant anaesthetist overlaps.
- Validate pre-anaesthetic checkup (PAC) scoring: ASA Physical Status (I-VI), Mallampati airway classification, and NPO fasting compliance (solid fasting $\ge 6$h).
- Validate legally binding informed consent with risks and cryptographic signature hash.
- Verify 3-phase WHO Surgical Safety Checklist (Sign-In, Time-Out, Sign-Out) with sequence enforcement.
- Verify intraoperative vital telemetry and controlled narcotic dosing ledger.
- Verify surgical count reconciliation for sponges, sharps, and instruments with discrepancy alerting.
- Validate PACU recovery monitoring and enforce Modified Aldrete Score $\ge 9$ before ward transfer.

## 3. Test Suites
- Automated Test Suite: `backend/tests/advanced_ot_management.test.ts`
- REST Routes: `/api/v1/ot/advanced/*`
- Web Portal Interface: `apps/web-portal/src/portals/ot/AdvancedOTHub.tsx`

