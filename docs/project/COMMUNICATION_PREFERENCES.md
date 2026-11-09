# ASRTAVA Patient & Staff Communication Preferences (DPDP Act 2023 Compliant)

**Document Reference:** `docs/project/COMMUNICATION_PREFERENCES.md`  
**Version:** 1.0.0-ENTERPRISE  
**Regulatory Baseline:** Digital Personal Data Protection (DPDP) Act 2023 & NMC RMP Regulations 2023

---

## 1. Regulatory Governance & Consent Separation

Under the DPDP Act 2023, communications must strictly separate **Essential Clinical/Transactional Messages** from **Optional Marketing/Promotional Messages**.

### 1.1 Non-Suppressed Essential Communications (Mandatory)
The following communication categories cannot be opted out of by patients or staff because they represent essential medical treatment, legal obligations, or vital safety information:
1. **Critical Clinical Alerts**: Panic lab values, emergency resuscitation orders, drug allergy contraindications.
2. **Account Security**: One-Time Passwords (OTPs), password reset links, multi-factor authentication codes.
3. **Emergency Dispatches**: Casualty triage summons, disaster response alerts.
4. **Statutory Notices**: Discharge summaries, medico-legal certificates, patient rights notices.

### 1.2 Configurable Patient Preferences (Opt-In / Opt-Out)
Patients retain full sovereignty over elective channels for general hospital communication:
- `whatsappEnabled` (boolean, default: `true` upon patient consent)
- `smsEnabled` (boolean, default: `true`)
- `emailEnabled` (boolean, default: `true`)
- `pushEnabled` (boolean, default: `true` for mobile app)
- `marketingOptIn` (boolean, default: `false`, explicit affirmative consent required)

When a patient opts out of an elective channel (e.g., disables WhatsApp), the ASRTAVA Notification Engine automatically evaluates the next permitted channel in the fallback hierarchy (e.g. falling back to SMS or In-App).

---

## 2. Staff Quiet Hours & Emergency Bypass Policies

### 2.1 Quiet Hours Mechanics
- Medical doctors and healthcare staff can configure off-duty quiet hours (e.g. `22:00` to `07:00`) in their workspace preferences.
- During quiet hours, routine administrative notifications (e.g. regular invoices, routine leave requests) are silenced and queued as non-intrusive In-App messages.

### 2.2 Mandatory Clinical Override
- Any notification bearing priority `critical` (Panic lab value, Critical imaging finding, Emergency Triage Level 1) **immediately overrides and bypasses staff quiet hours**.
- The system sounds a high-urgency audible alarm on the Doctor Portal and mobile device, initiating the 15-minute acknowledgement countdown timer.

