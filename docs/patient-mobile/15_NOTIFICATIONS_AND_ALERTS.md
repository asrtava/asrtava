# Patient Notifications & Alerts Engine

## 1. Overview (`NotificationsScreen.tsx`)
A centralized inbox aggregating operational and clinical updates:
- Event Types:
  - `appointment`: Booking confirmations, queue alerts, and token calls.
  - `lab`: Verification and release of diagnostic reports.
  - `prescription`: Refill reminders and physician note updates.
  - `billing`: Invoice payment confirmations and receipts.
  - `system`: Scheduled hospital maintenance alerts.
- Unread status tracking with 1-tap "Mark All Read" capability.
- Multi-channel delivery points: Push notifications (FCM / APNs), in-app alerts, SMS, and WhatsApp messages.

