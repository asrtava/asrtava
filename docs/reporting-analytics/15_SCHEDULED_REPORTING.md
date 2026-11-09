# ASRTAVA Scheduled Reporting System

## 1. Overview
The Scheduled Reporting module automates periodic compilation and dispatch of management reports, delivering scheduled exports directly to executive email addresses and in-app notification centers.

## 2. Supported Frequencies
- **Daily**: Runs every morning at 08:00 AM (e.g. daily census & revenue summary).
- **Weekly**: Runs every Monday at 08:00 AM (e.g. department performance and bed occupancy).
- **Monthly**: Runs on the 1st of each month (e.g. financial ledgers, GST tax summary, ALOS report).
- **Quarterly**: Runs at the start of each fiscal quarter.

## 3. Delivery Channels & Security
- **Email Delivery**: Dispatches a secure, expiring download link via Amazon SES/SendGrid. Sensitive PDFs are **not** attached unencrypted over clear-text email.
- **In-App Notification**: Alerts administrators when scheduled reports are generated and ready for review in the web portal.
- **Access Verification**: The background scheduler re-validates the requesting user's authorization and tenant scope on every execution.

