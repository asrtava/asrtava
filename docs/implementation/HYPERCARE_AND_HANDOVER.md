# ASRTAVA 30-Day Hypercare Support & Handover Protocol

## 1. Executive Overview

Following production go-live, the hospital enters an intensive **30-day Hypercare Period**. During this phase, dedicated ASRTAVA implementation engineers remain assigned to the hospital to provide immediate on-site or rapid-response technical support, workflow optimization, and defect resolution.

---

## 2. Hypercare SLA Severity Tiers & Response Matrices

| Ticket Severity | Description | Initial Response SLA | Target Resolution SLA | Escalation Path |
|---|---|---|---|---|
| **Critical** | Hospital-wide downtime, clinical blockage, patient triage halt, or data corruption risk. | **< 15 Minutes** | **< 2 Hours** | Direct pager to Principal Architect & Lead Engineer |
| **High** | Core departmental workflow impaired without direct patient danger (e.g., pharmacy label printer failing). | **< 30 Minutes** | **< 4 Hours** | On-site Field Engineer + Technical Lead |
| **Medium** | Isolated non-critical issue with viable operational workaround (e.g., slow export report). | **< 2 Hours** | **< 12 Hours** | Assigned Support Engineer |
| **Low / Inquiry** | Staff user how-to inquiry, minor UI preference, or cosmetic suggestion. | **< 4 Hours** | **< 24 Hours** | Standard Support Queue |

---

## 3. Formal Handover to Standard Support Protocol

At the conclusion of the 30-day hypercare window, a formal operational handover occurs to transition the hospital from implementation status to standard ongoing support under their perpetual license terms.

### Handover Prerequisite Checklist
- [x] All Critical and High severity hypercare tickets are resolved (`status = 'resolved'`).
- [x] Unresolved Low/Cosmetic inquiries transferred to the product enhancement backlog.
- [x] Hospital IT staff trained on local database backup execution and routine maintenance.
- [x] Emergency downtime procedures, air-gapped recovery drills, and failover runbooks handed over.
- [x] Formal sign-off completed by the Hospital Administrator and ASRTAVA Handover Specialist.

Upon execution of `OnboardingService.handoverToStandardSupport()`:
- Implementation project stage transitions to `implementation_completed`.
- The hospital's commercial profile transitions to Active Production with optional Annual Maintenance Contract (AMC) support.
- All telemetry dashboards reflect a successful, fully completed deployment.

