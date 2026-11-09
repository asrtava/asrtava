# ASRTAVA — Centralized Notification & Communication System Audit

**Audit Date:** 2026-11-09  
**Ecosystem:** ASRTAVA Multi-Tenant SaaS Hospital Management System  
**Lead Architect & Integration Specialist:** Chief Software Architect & Integration Lead

---

## 1. Executive Summary & Audit Scope

This audit examines the existing communication and notification infrastructure across the ASRTAVA platform, evaluating:
1. Existing notification tables in PostgreSQL (`notifications`).
2. Existing external provider adapters (`email.adapter.ts`, `sms.adapter.ts`, `whatsapp.adapter.ts`, `push.adapter.ts`).
3. Existing API routes in `backend/src/modules/notifications/notifications.routes.ts` and `integrations.routes.ts`.
4. In-app notification center UI in `AppShell.tsx` and `HomeScreen.tsx` (`apps/patient-mobile`).
5. Gaps in template management, dynamic rules engine, patient consent/preferences, critical alert escalations, and delivery audit tracking.

---

## 2. Component-by-Component Findings

### 2.1 Database Entities & Schemas
- **Existing Assets:**
  - Table `notifications` exists with columns: `id`, `hospital_id`, `recipient_user_id`, `channel`, `event_type`, `title`, `message`, `metadata`, `is_read`, `status`, `sent_at`, `created_at`.
- **Identified Gaps:**
  - Missing normalized tables for:
    - `notification_templates`: Database-driven templates with channel-specific bodies, subjects, and variable schemas.
    - `notification_rules`: Event-to-recipient-to-channel routing rules with priority and quiet hour parameters.
    - `notification_preferences`: Patient and staff opt-in/opt-out channel matrix and DPDP consent records.
    - `critical_alert_acknowledgements`: Clinical panic value and emergency order escalation records with physician sign-off.
    - `device_tokens`: Multi-device push notification tokens for Android (FCM) and iOS (APNs).

### 2.2 Integration Adapters & Provider Capabilities
- **Existing Assets:**
  - `email.adapter.ts`: AWS SES, SendGrid, and SMTP adapters with HTML templates.
  - `sms.adapter.ts`: MSG91 DLT (India entity templates) and Twilio with E.164 phone normalization.
  - `whatsapp.adapter.ts`: Meta Cloud API v19.0 with approved template format and interactive buttons.
  - `push.adapter.ts`: Firebase Cloud Messaging (FCM v1) and Apple Push Notification service (APNs).
  - `credential-vault.ts`: AES-256-GCM hardware/software encryption of third-party API credentials.
- **Identified Gaps:**
  - Provider adapters exist in `modules/integrations/providers/adapters`, but need to be unified behind a centralized **Notification Rules & Orchestration Engine** in `modules/notifications/`.

### 2.3 Template Engine & Security
- **Identified Gaps:**
  - Currently, several message strings are constructed inline within routes (e.g., appointment confirmations in `appointments.routes.ts`).
  - Need centralized, database-backed template rendering with strict HTML entity escaping to prevent cross-site scripting (XSS) or template injection.
  - Need variable validation to ensure required tokens (e.g. `patient_name`, `doctor_name`, `appointment_date`, `token_number`) are supplied before transmission.

### 2.4 Patient & Staff Preferences (DPDP Compliance)
- **Identified Gaps:**
  - Patients must have granular control over non-essential communications (WhatsApp vs SMS vs Email), while transactional security messages (OTPs, password resets, critical clinical alerts) remain mandatory.
  - Staff require configurable quiet hours (e.g., night shift off-duty hours) while guaranteeing that **Critical Clinical Alerts** (Panic Lab Values, Emergency Resuscitation) immediately bypass quiet hours and escalate if unacknowledged.

### 2.5 Critical Alert Escalation
- **Identified Gaps:**
  - Clinical safety mandates that panic lab values (e.g. Potassium > 6.5 mEq/L) or critical radiological findings must be acknowledged by the primary consultant within a configured window (e.g., 15 minutes).
  - If unacknowledged, the alert must automatically escalate to the Department Head, Ward In-Charge Nurse, or RMO on duty.

---

## 3. Implementation Roadmap

1. **Phase 1: Notification Engine Service (`notification-engine.service.ts`)**:
   - Implement Event Catalog, Rules Engine, Template Renderer, Preference Guard, and Critical Escalation Manager.
2. **Phase 2: Database Entities & Extended Routes (`notifications.routes.ts`)**:
   - Add endpoints for templates, rules, preferences, alert acknowledgements, device tokens, and communication history logs.
3. **Phase 3: Automated Test Suite (`centralized_notifications.test.ts`)**:
   - Implement 15 comprehensive automated test scenarios verifying in-app notifications, multi-channel dispatch, template safety, quiet hours, escalation, idempotency, tenant isolation, and PII masking.
4. **Phase 4: Documentation Deliverables**:
   - Author architecture, event catalog, template guide, preferences specification, security audit, and test results.

