# ASRTAVA Payment Gateway Integration Guide

## 1. Domain Separation Mandate
ASRTAVA enforces strict architectural and legal segregation between two distinct financial domains:
1. **Hospital Patient Billing**: Revenue collected by individual hospital organizations for clinical consultations, bed charges, pharmacy dispensing, and surgical procedures. Funds settle into the hospital's registered merchant account.
2. **SaaS Subscription Billing**: Software subscription fees (MRR/ARR) paid by hospital organizations to the ASRTAVA platform owner.

Both domains use separate merchant keys and webhook secret configurations.

```mermaid
graph LR
    subgraph Patient Web & Mobile
        Patient[Patient Payment Flow]
    end

    subgraph Hospital Tenant Admin
        HospAdmin[Subscription Payment Flow]
    end

    subgraph ASRTAVA Backend
        PBRouter[/api/v1/billing/payments]
        SaaSRouter[/api/v1/saas/invoices]
        PayAdapter[PaymentGatewayAdapter]
    end

    subgraph Financial Gateways
        RazorpayHosp[Razorpay Hospital MID]
        RazorpayPlatform[Razorpay Platform MID]
    end

    Patient --> PBRouter
    HospAdmin --> SaaSRouter
    PBRouter -->|domain: patient_billing| PayAdapter
    SaaSRouter -->|domain: saas_subscription| PayAdapter
    PayAdapter --> RazorpayHosp
    PayAdapter --> RazorpayPlatform
```

## 2. Security & Verification Requirements
- **Server-Side HMAC-SHA256 Signature Verification**: Frontend payment callbacks are **never trusted alone**. The backend validates:
  $$\text{signature} = \text{HMAC-SHA256}(\text{order\_id} \mid \text{payment\_id}, \text{key\_secret})$$
- **Idempotency Keys**: Every payment request requires an `idempotencyKey` preventing double-charging during network retries.
- **Zero Cardholder Data Storage**: ASRTAVA never captures, stores, or processes card CVVs or Primary Account Numbers (PANs), maintaining PCI-DSS Level 1 compliance.
- **Refund Engine**: Supports partial and full refunds with audit logging.

