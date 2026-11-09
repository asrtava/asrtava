# ASRTAVA Centralized Secrets Management Policy

## 1. Secrets Management Hierarchy

ASRTAVA employs **AWS Secrets Manager** and **AWS KMS** for centralized secrets lifecycle management:

```
+-----------------------------------------------------------------------------------+
|                        AWS KMS (Key Encryption Key - KEK)                         |
|  - Hardware Security Module (HSM) FIPS 140-2 Level 3 Validated                     |
|  - Annual Automated Key Rotation                                                  |
+-----------------------------------------------------------------------------------+
                                        | (Envelope Encryption)
+-----------------------------------------------------------------------------------+
|                       AWS Secrets Manager (Encrypted Payloads)                    |
|  - Production RDS Database Master Password                                        |
|  - Production Redis Auth Secret                                                   |
|  - High-Entropy JWT Signing Key (256-bit)                                         |
|  - Integration API Tokens (Meta WhatsApp, Razorpay, Gupshup, SES)                |
+-----------------------------------------------------------------------------------+
                                        | (IAM Task Role Retrieval at Container Startup)
+-----------------------------------------------------------------------------------+
|                         ECS Fargate Container Memory Only                         |
|  - Never written to disk                                                          |
|  - Never logged to stdout / stderr / CloudWatch                                   |
|  - Masked in all exception stack traces                                           |
+-----------------------------------------------------------------------------------+
```

---

## 2. Secrets Invariant Rules

1. **Zero Raw Secret Commits**: Repositories contain `.env.example`, `.env.staging.example`, and `.env.production.example` templates with sanitized placeholder values only.
2. **Automated Secret Rotation**: RDS database master passwords rotate automatically every 60 days via AWS Secrets Manager rotation Lambda.
3. **Emergency Secret Revocation**: If a credential leak is suspected, the secret is regenerated in Secrets Manager and ECS tasks are restarted with `--force-new-deployment` to consume the new credential within 5 minutes.

