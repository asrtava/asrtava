# Payment Gateway Integration & Webhook Deduplication

## 1. Provider Abstraction Architecture
ASRTAVA abstracts payment processing through standard gateway adapters (supporting Razorpay and Stripe):
- `POST /api/v1/saas/webhooks/payment` receives signed asynchronous event notifications.
- All secrets are loaded from environment variables (`RAZORPAY_KEY_SECRET`, `STRIPE_WEBHOOK_SECRET`). Sensitive card numbers, expiry dates, and CVVs are NEVER persisted in ASRTAVA databases.

## 2. Webhook Signature Verification & Idempotency
To prevent financial race conditions and double-invoicing from webhook retries:
1. **Signature Verification**: Validates HMAC SHA-256 header signature against webhook raw payload.
2. **Idempotency Deduplication**: Looks up incoming `event_id` in `payment_gateway_events`:
   - If `event_id` already exists, immediately returns HTTP 200 with `{ status: 'duplicate_ignored' }`.
   - If new, records event in transaction, marks corresponding `subscription_invoices` as `paid`, and extends tenant subscription end date.

