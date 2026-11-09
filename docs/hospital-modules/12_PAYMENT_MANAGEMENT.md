# Module 12: Payment Management & Gateway Integration Specification

## 1. Overview
The Payment Management module handles multi-mode financial settlement across Cash, Credit/Debit Card, UPI (Unified Payments Interface), Net Banking, and Cashless Insurance/TPA pre-authorizations, with strict idempotency key protection against duplicate transactions.

---

## 2. Core Functional Capabilities

### 1. Multi-Mode Payment Settlement
- **Cash**: Logged with cashier session ID and physical drawer receipt number.
- **Card**: POS terminal reference and card network authorization code (no raw card numbers or CVV are ever stored).
- **UPI**: Immediate QR code and UPI UTR (Unique Transaction Reference) validation.
- **Cashless TPA / Insurance**: Pre-authorization letter reference and claim approval percentage.

### 2. Idempotency Key Anti-Double-Charge Protection
All payment requests require an `idempotency_key` header or body parameter. The backend checks an in-memory or database idempotency ledger:
- If key is recognized and succeeded: Immediately returns the cached successful receipt without re-executing credit card or UPI charges.
- If key is new: Atomically records the payment, updates the invoice outstanding balance, and commits the transaction reference.

---

## 3. API Endpoints
- `POST /api/v1/billing/payments`: Collect payment with idempotency key and payment method.
- `POST /api/v1/billing/webhooks/gateway`: Payment gateway webhook handler with HMAC signature verification.

