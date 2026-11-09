# ASRTAVA SMS Gateway Integration Guide

## 1. Overview & Indian DLT Telecom Compliance
For Indian deployments, SMS transmission is governed by Telecom Regulatory Authority of India (TRAI) Distributed Ledger Technology (DLT) regulations. ASRTAVA natively supports:
- **Principal Entity (PE) ID**: Hospital's registered corporate registration number.
- **Sender Header / Sender ID**: 6-character alpha header (e.g., `APEXCR`).
- **Approved DLT Template IDs**: Registered message formats mapped to system event codes.

## 2. Supported SMS Providers
- **Gupshup Enterprise**: Indian high-volume transactional gateway.
- **Twilio SMS**: Global SMS fallback for international patients.
- **MSG91**: Alternative Indian telecom aggregator.

## 3. DLT Template Mapping
```sql
INSERT INTO notification_templates (channel, template_code, name, dlt_template_id, body_template)
VALUES 
('sms', 'OTP_VERIFICATION', 'Login OTP', '11071618293049182', 'Your ASRTAVA verification code for {#var#} is {#var#}. Valid for 5 minutes. Do not share.'),
('sms', 'APPOINTMENT_BOOKED', 'Appointment Confirmation', '11071618293049183', 'Dear {#var#}, your appointment with {#var#} at {#var#} is confirmed for {#var#}. View pass: {#var#}');
```

## 4. Security & Abuse Protection
- **No Plaintext Logging**: OTP values are explicitly masked (`[PROTECTED_OTP]`) before entering application logs or delivery reports.
- **Rate Limiting**: Maximum 3 OTP requests per phone number within a rolling 15-minute window.
- **DND Registry Check**: Marketing alerts are automatically filtered against national Do-Not-Disturb registries; transactional medical alerts bypass DND under category 1 exemption.

