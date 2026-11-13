# ASRTAVA Accessibility & Assistive-User Evaluation Report
## Workstream: Gate 3E Supervised Assistive-Technology & Screen Reader Evaluation

**Document Reference:** `OPS-A11Y-USER-2026-FINAL`  
**Execution Date:** November 13, 2026  
**Standards Conformance:** W3C WCAG 2.1 Level AA / Section 508 / Indian RPwD Act 2016  
**Evaluation Profiles:**
- Screen Reader Profile 1: NVDA 2024.3 + Google Chrome 130 (Speech synthesizer: eSpeak NG)
- Screen Reader Profile 2: Freedom Scientific JAWS 2024 + Mozilla Firefox 132 (Speech synthesizer: Eloquence)
- Keyboard-Only Profile: Zero mouse interaction, 100% Tab / Shift+Tab / Enter / Space / Arrow keys
- Low Vision Profile: Windows High Contrast Mode (Aquatic & Desert themes) + 200% Browser Zoom  
**Readiness Classification:** **VERIFIED (TECHNICAL & USER-CENTRIC CONFORMANCE)**

---

### 1. Executive Summary

This evaluation verified that healthcare workers, clinicians, and administrative staff who rely on screen readers or keyboard-only navigation can independently perform critical clinical workflows in ASRTAVA without encountering navigational dead ends or unannounced modals.

Automated ARIA checkers alone were not relied upon; interactive task walkthroughs were executed step-by-step to assess speech synthesizer clarity, focus management, and cognitive load.

---

### 2. Task-by-Task Assistive Evaluation Matrix

| Workflow Task | Modality / Tool | Expected Assistive Behavior | Observed Synthesizer Output / Interaction | Compliance Status |
| :--- | :--- | :--- | :--- | :--- |
| **1. Multi-Tenant Login & Role Selection** | NVDA / Chrome | Clear announcement of hospital tenant selector and role choices | *"Hospital Organization dropdown, selected: ASRTAVA Pilot Hospital Alpha. Role selection list, 5 items. Doctor / Clinician radio button checked."* | **PASS** |
| **2. Patient Registration Form** | JAWS / Firefox | Dynamic announcement of mandatory fields and live validation errors | *"Patient Full Name, required, edit text. Date of Birth, edit text format YYYY-MM-DD. Error alert: Invalid phone number format, 10 digits required."* | **PASS** |
| **3. Clinical SOAP Consultation Note** | Keyboard-Only | Section accordions expandable via Space/Enter; logical tab order | Tab smoothly navigates Subjective $\rightarrow$ Objective $\rightarrow$ Assessment $\rightarrow$ Plan without focus jumping. | **PASS** |
| **4. eMAR Medication Administration** | NVDA / Chrome | High-alert narcotic modal traps focus; second nurse login inputs read out clearly | *"Dialog: High-Alert Controlled Medication Cosign Required. Nurse 2 User ID, edit text. Warning: Administration cannot proceed without second clinician authentication."* | **PASS** |
| **5. Laboratory Critical Panic Alert** | NVDA / Chrome | Urgent alert announcement bypassing quiet hours; verbatim read-back guidance | *"Urgent Alert: Critical Panic Value. Cardiac Troponin I is 0.18 ng/mL. Immediate telephone read-back required. Verbal transcript text area, edit text."* | **PASS** |
| **6. Clinical Conflict Queue (P0-05)** | JAWS / Firefox | Radio group navigation for merge strategies; dynamic justification length read | *"Resolution strategy group, 3 items. Manual Merge radio button checked. Required clinical justification: 18 characters entered. Resolves conflict button enabled."* | **PASS** |
| **7. Radiology DICOM Imaging Viewport** | NVDA / Low Vision | Alternate textual transcript provides complete radiologist findings | Textual transcript card alongside canvas announces: *"Authorized Impression: Normal acute cerebral perfusion; no intracranial hemorrhage."* | **PASS** |

---

### 3. Assistive Ergonomics & Refinements

1. **Focus Trapping in Modals:** When the eMAR dual-sign cosign modal or the Clinical Conflict resolution modal opens, focus is immediately shifted to the modal header and trapped within the dialog. Assistive users cannot inadvertently press Tab and edit background patient records while a critical modal is active.
2. **Dynamic Live Regions (`aria-live`):**
   - Non-critical notifications (e.g. *"Autosaved draft consultation"*) use `aria-live="polite"` so they do not interrupt clinical dictation.
   - Critical clinical alerts (e.g. *"NEWS2 score 9 - Impending shock"*) use `aria-live="assertive"` to immediately notify the clinician.
3. **High Contrast & Scalability:** At 200% zoom, text reflows cleanly into a single-column layout without horizontal scrollbars, and buttons maintain minimum touch targets of $44 \times 44\text{ pixels}$.

