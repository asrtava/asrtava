# ASRTAVA — Ward & Bed Management User Guide

## 1. Introduction
Welcome to the ASRTAVA Ward & Bed Management portal guide. This guide explains how nurses, ward managers, bed coordinators, doctors, and housekeeping teams interact with the visual bed grid, manage admissions, coordinate patient transfers, oversee terminal cleaning, and prepare for safe discharge.

---

## 2. Navigating the Visual Bed Grid

### Accessing the Hub
1. Log into the ASRTAVA Web Portal as a Nurse, Ward Incharge, or Bed Coordinator.
2. Select **Nursing Workspace** from the top portal switcher or sidebar.
3. Click on the **Advanced Ward & Bed Hub** tab.

### Color-Coded Bed Status Indicators
- 🟢 **Available (Green)**: The bed is sanitized, inspected, and ready for patient intake.
- 🔴 **Occupied (Red)**: A patient is currently admitted to this bed. Clicking the bed displays the patient's name, IPD number, admitting consultant, and care team.
- 🟡 **Reserved (Amber)**: The bed is temporarily held for an incoming patient with a countdown timer to reservation expiry.
- 🟠 **Cleaning Required (Orange)**: The patient has been transferred or discharged. Terminal cleaning is pending.
- 🔵 **Cleaning in Progress (Blue)**: Housekeeping staff is actively sanitizing the bed and room.
- ⚫ **Maintenance / Blocked (Dark Gray)**: Bed or attached biomedical equipment is offline for repair or infection isolation quarantine.

---

## 3. Inpatient Admission Workflow

### For Clinicians (OPD / Emergency):
1. In the patient consultation screen, click **Request Admission**.
2. Specify Department, Admitting Doctor, Urgency Level (`ROUTINE`, `URGENT`, `EMERGENCY`), and Provisional Diagnosis.
3. Select preferred accommodation (`GENERAL`, `SEMI_PRIVATE`, `PRIVATE`, `ICU`, `ISOLATION`) and flag any required equipment (e.g. Oxygen Concentrator, Telemetry, Ventilator).
4. Click **Submit Admission Request**.

### For Bed Coordinators:
1. In the Advanced Ward Hub, open the **Admission Requests** tab.
2. Review pending requests filtered by priority.
3. Click **Triage & Allocate Bed**. Select a matching available bed from the visual matrix.
4. Click **Confirm Inpatient Admission**. The system generates the unique `IPD-YYYY-XXXXX` identifier and notifies the receiving ward nursing station.

---

## 4. Bed Transfers & Room Changes

1. In the visual bed matrix, click the occupied bed of the patient requiring transfer.
2. Click **Transfer Patient**.
3. Select the target ward and destination bed.
4. Provide the clinical reason (e.g. Clinical deterioration requiring ICU, post-op step-down, or patient preference).
5. Confirm transfer.
   - The patient is instantaneously reassigned to the destination bed.
   - The vacated bed automatically flips to **Cleaning Required**.

---

## 5. Housekeeping & Bed Turnover

1. Environmental services view the **Housekeeping Board**.
2. Staff accepts the terminal cleaning task and clicks **Start Cleaning**. Bed flips to **Cleaning in Progress**.
3. Once terminal sanitization and chemical disinfection protocols are complete, staff checks off the hygiene checklist and clicks **Submit for Inspection**.
4. The Housekeeping Supervisor inspects the room:
   - If clean: clicks **Approve & Release Bed**. Bed status returns to **Available**.
   - If deficiencies found: clicks **Reject / Request Rework** with specific deficiency notes.

---

## 6. Proactive Discharge Planning & Finalization

1. Within 24 hours of admission, ward nurses open the **Discharge Planning** tab.
2. Enter Target Discharge Date (TDD), home care requirements, transport needs, and barrier checklists.
3. When the consultant authorizes discharge, open the patient's card and click **Finalize Clinical Discharge**.
4. Print the Clinical Discharge Summary with medications, warnings, and follow-up dates.
5. Bed is automatically marked **Cleaning Required**.

