# ASRTAVA Centralized Notifications & Communication Test Results

**Test Suite:** `backend/tests/centralized_notifications.test.ts`  
**Execution Timestamp:** 2026-11-09T12:43:05Z  
**Duration:** 10.865ms  
**Result:** **100% PASSED (13 of 13 Passed, 0 Failures)**

---

## 1. Test Execution Breakdown

| # | Test Scenario | Verified Behavior | Actual Outcome | Status |
|---|---------------|-------------------|----------------|:------:|
| 1 | In-App Notification Center | Unread count calculation, mark single read, mark all read, pagination | Unread count accurate; 2 -> 1 -> 0 verified | **PASS** |
| 2 | Multi-Channel Dispatch | SMS, WhatsApp, and Email dispatch with channel validation | Dispatched cleanly across all 3 external channels | **PASS** |
| 3 | Safe Template Rendering | Variable substitution and HTML entity escaping (`<script>` to `&lt;script&gt;`) | XSS defense confirmed; no raw tags rendered | **PASS** |
| 4 | Missing Required Variable Validation | Rejection when required token (e.g. `doctor_name`) is omitted | Threw `MISSING_REQUIRED_TEMPLATE_VARIABLE` | **PASS** |
| 5 | Patient Communication Preferences | Automatic fallback from disabled WhatsApp to enabled SMS | Dispatched via SMS per patient opt-out | **PASS** |
| 6 | Staff Quiet Hours Enforcement | Non-critical notification during quiet hours (23:30) suppressed to silent in-app | Handled silently; `isSuppressedByQuietHours: true` | **PASS** |
| 7 | Critical Alert Quiet Hours Bypass | Panic lab value at 23:45 immediately bypasses quiet hours | Dispatched with urgency; `isSuppressed: false` | **PASS** |
| 8 | Critical Alert Escalation | Unacknowledged alert past 15-minute timeout escalates to Department Head; physician acknowledgement clears alert | Escalated to `usr-department_head-duty` after 16m; acknowledged by Dr. Sharma | **PASS** |
| 9 | Idempotency & Deduplication | Duplicate send within 10-minute window suppressed without double charge | Replay returned original notification ID | **PASS** |
| 10 | Multi-Tenant Message Isolation | Hospital Alpha notifications completely inaccessible to Hospital Beta users | Zero cross-tenant notification leakage verified | **PASS** |
| 11 | Sensitive PII Redaction in Logs | Phone numbers (`+919******210`) and emails (`r***l@asrtava.com`) dynamically masked | Masking format verified | **PASS** |
| 12 | Mobile Device Push Tokens | Registration and rotation of multi-device tokens (Android FCM + iOS APNs) | Multi-device array stored and rotated cleanly | **PASS** |

---

## 2. Technical Evidence & Output

```
▶ ASRTAVA Centralized Notifications & Patient Engagement Suite
  ✔ 1. In-App Notification Center: Unread count, mark read, mark all read (1.9666ms)
  ✔ 2. Multi-Channel Dispatch: SMS, WhatsApp, Email, In-App and Push (0.4897ms)
  ✔ 3. Safe Template Rendering: HTML entity escaping and variable substitution (0.2581ms)
  ✔ 4. Missing Required Template Variable: Throws descriptive validation error (0.5544ms)
  ✔ 5. Patient Communication Preferences: Respects opt-outs for non-essential communications (0.3633ms)
  ✔ 6. Staff Quiet Hours: Non-critical notifications suppressed / switched to silent in-app (1.8933ms)
  ✔ 7. Critical Alert Quiet Hours Bypass: Panic values immediately bypass quiet hours (0.2936ms)
  ✔ 8. Critical Alert Escalation: Unacknowledged alert past 15 min timeout escalates (0.5425ms)
  ✔ 9. Idempotency & Deduplication: Prevents double sending within window (0.3672ms)
  ✔ 10. Multi-Tenant Isolation: Hospital Alpha messages cannot be read by Hospital Beta (0.5394ms)
  ✔ 11. PII Redaction: Phone numbers, emails and device tokens are masked (0.3942ms)
  ✔ 12. Mobile Device Push Tokens: Multi-device registration and rotation (0.3958ms)
✔ ASRTAVA Centralized Notifications & Patient Engagement Suite (10.8653ms)
ℹ tests 13
ℹ suites 0
ℹ pass 13
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 18.2549
```

