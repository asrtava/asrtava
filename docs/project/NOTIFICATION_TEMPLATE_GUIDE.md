# ASRTAVA Notification Template Guide & Variable Interpolation Standards

**Document Reference:** `docs/project/NOTIFICATION_TEMPLATE_GUIDE.md`  
**Version:** 1.0.0-ENTERPRISE  
**Authority:** ASRTAVA Communications Lead & Security Architect

---

## 1. Safe Template Rendering Principles

1. **Strict HTML Entity Escaping**:
   - All dynamic variables (e.g. `patient_name`, `doctor_name`, `chief_complaint`) are automatically sanitized against character sequences (`<`, `>`, `&`, `"`, `'`) before being inserted into HTML or text templates.
2. **Mandatory Variable Validation**:
   - If an event fails to supply a required variable defined in `requiredVariables`, the template engine throws a structured `MISSING_REQUIRED_TEMPLATE_VARIABLE` exception to prevent sending blank or corrupted tokens to patients.
3. **No Arbitrary Code Execution**:
   - The engine uses a pure declarative regex replacement parser (`/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g`) rather than `eval()`, preventing template injection vulnerabilities.

---

## 2. Standard Channel Templates

### 2.1 WhatsApp Notification Templates (Approved Meta Format)
```
🏥 *{{hospital_name}} - Appointment Confirmation*

Dear {{patient_name}},
Your consultation has been confirmed:
• *Doctor:* {{doctor_name}}
• *Date & Time:* {{appointment_date}} at {{appointment_time}}
• *Queue Token:* #{{token_number}}

Please arrive 10 minutes prior for queue check-in.
```

### 2.2 SMS Notification Templates (DLT Registered Indian Format)
```
ASRTAVA: Appt confirmed with {{doctor_name}} on {{appointment_date}} at {{appointment_time}}. Token: #{{token_number}}. Hospital: {{hospital_name}}. - ASRTAV
```

### 2.3 Email Notification Templates (HTML Clean Format)
```html
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; color: #1e293b; line-height: 1.6;">
  <div style="max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px;">
    <h2 style="color: #0f766e; margin-top: 0;">Appointment Confirmed</h2>
    <p>Dear <strong>{{patient_name}}</strong>,</p>
    <p>Your appointment with <strong>{{doctor_name}}</strong> has been scheduled successfully.</p>
    <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
      <tr style="background: #f8fafc;"><td style="padding: 8px; font-weight: bold;">Date & Time:</td><td style="padding: 8px;">{{appointment_date}} at {{appointment_time}}</td></tr>
      <tr><td style="padding: 8px; font-weight: bold;">Queue Token:</td><td style="padding: 8px;">#{{token_number}}</td></tr>
      <tr style="background: #f8fafc;"><td style="padding: 8px; font-weight: bold;">Facility:</td><td style="padding: 8px;">{{hospital_name}}</td></tr>
    </table>
    <p style="font-size: 12px; color: #64748b; margin-top: 24px;">Powered by ASRTAVA Healthcare Technology</p>
  </div>
</body>
</html>
```

### 2.4 In-App Critical Panic Alert Banner
```
🚨 CRITICAL PANIC LAB VALUE: {{test_name}}
Patient: {{patient_name}} (UHID {{uhid}})
Result: {{result_value}} {{unit}} (Flag: {{flag}})
Immediate clinical review & electronic acknowledgement required.
```

