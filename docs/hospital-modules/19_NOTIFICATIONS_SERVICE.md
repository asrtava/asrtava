# Module 19: Centralized Notifications & Communication Specification

## 1. Overview
The Notifications & Communication module delivers event-driven notifications across multiple channels: In-App notification drawers, SMS, Email, WhatsApp Business, and Mobile Push Notifications.

---

## 2. Supported Event Triggers

| Event Type | Trigger Origin | Target Recipient | Channel |
| :--- | :--- | :--- | :--- |
| `appointment_confirmed` | Appointment Engine | Patient & Doctor | In-App, SMS, WhatsApp |
| `appointment_cancelled` | Reception Desk | Patient | In-App, SMS |
| `critical_vitals_alert` | Nursing Station / ED | Consulting Physician | In-App, Push Notification |
| `lab_report_ready` | Laboratory LIMS | Patient & Doctor | In-App, SMS |
| `invoice_generated` | Cashier / Billing | Patient | In-App, Email |
| `low_stock_warning` | Pharmacy Dispensary | Procurement Manager | In-App, Email |

---

## 3. Delivery Tracking & Verification
- Notifications are queued with an initial status of `queued`.
- Upon successful transmission through the provider gateway, the status updates to `delivered` and stores the provider message ID.
- Failures record error codes and initiate retry attempts following an exponential backoff schedule.

---

## 4. API Endpoints
- `GET /api/v1/notifications/my-notifications`: Fetch active user's notifications and unread badge count.
- `PATCH /api/v1/notifications/:id/read`: Mark notification as read.
- `POST /api/v1/notifications/dispatch`: System event dispatcher.

