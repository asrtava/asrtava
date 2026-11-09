# ASRTAVA RIS / PACS & DICOM Imaging Test Plan

## 1. Scope
Comprehensive automated and end-to-end testing of the Radiology Information System (RIS), Picture Archiving and Communication System (PACS) metadata indexing, and DICOM integration pipelines.

## 2. Test Objectives
- Verify modality device registration with standard DICOM AE Titles and ports.
- Verify conflict prevention for physical imaging rooms and modality suites.
- Validate pre-procedure patient safety screening (eGFR, CIN risk, MRI metal hazards, pregnancy protection).
- Validate DICOM Modality Worklist (MWL) query responses.
- Verify PACS relational metadata indexing (StudyInstanceUID, SeriesInstanceUID, SOPInstanceUID) without SQL blob pollution.
- Validate structured reporting, digital signature locks, and immutable addendum workflow.
- Validate emergency critical findings panic alert dispatch with mandatory telephone read-back confirmation.
- Validate contrast media injection ledger.

## 3. Test Suites
- Automated Test Suite: `backend/tests/advanced_ris_pacs_management.test.ts`
- E2E API Verification: `/api/v1/diagnostics/ris/advanced/*`
- Web Portal Interface: `apps/web-portal/src/portals/radiology/AdvancedRISHub.tsx`

