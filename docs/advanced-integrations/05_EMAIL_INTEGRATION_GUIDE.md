# ASRTAVA Transactional Email Integration Guide

## 1. Overview
ASRTAVA provides high-deliverability transactional email delivery powered by **Amazon SES** (Simple Email Service), **Twilio SendGrid**, or custom SMTP servers. 

## 2. Key Capabilities
- **Hospital-Branded Templates**: Injects the hospital's name, brand colors (`#0F766E`), logo, and legal disclosures dynamically into responsive HTML layouts.
- **DKIM & SPF Domain Verification**: Supports tenant-specific custom sender domains (e.g., `notifications@apexcare.asrtava.com`).
- **Suppression List Engine**: Automatically captures bounce notifications and spam complaints; blocks subsequent dispatches to protect IP reputation.

## 3. Template Architecture
Templates support variable interpolation with strict sanitization:
- `patient_name`: Addressee name
- `doctor_name`: Attending practitioner
- `hospital_name`: Operating healthcare organization
- `slot_time`: Scheduled consultation time
- `invoice_number` & `net_payable`: Financial statements
- `portal_url`: Secure link to ASRTAVA patient portal

## 4. Bounce & Complaint Webhooks
Amazon SES and SendGrid send JSON delivery events to `/api/v1/integrations/webhooks/email_ses`. Upon receiving a `Permanent` bounce or `Complaint` event, the email is automatically inserted into `notification_suppressions` with `reason = 'hard_bounce'`.

