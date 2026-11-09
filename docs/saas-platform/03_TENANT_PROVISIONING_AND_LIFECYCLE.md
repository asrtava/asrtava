# Tenant Provisioning & Lifecycle Governance

## 1. Lifecycle Status State Machine
Every tenant in ASRTAVA transitions through strictly audited lifecycle states:

```
[Public Registration]
        |
        v
 (pending_verification) ---> (provisioning) ---> (trial)
                                                    |
                                                    v
[Subscription Payment] ----------------------> (active)
                                                    |
                                    [Payment Failure / Notice]
                                                    |
                                                    v
                                             (grace_period)
                                                    |
                                       [Unresolved after 30 days]
                                                    |
                                                    v
                                               (read_only)
                                                    |
                                                    v
                                               (suspended)
                                                    |
                                                    v
                                              (deactivated)
```

| Lifecycle State | Clinical Read Access | Clinical Write Access | Staff Login Allowed | Patient Portal Access |
| :--- | :--- | :--- | :--- | :--- |
| **trial** | Yes | Yes | Yes | Yes |
| **active** | Yes | Yes | Yes | Yes |
| **grace_period** | Yes | Yes | Yes (with warning banners) | Yes |
| **read_only** | Yes | Blocked (Emergency override only) | Yes (Read-only views) | Yes |
| **suspended** | Blocked | Blocked | Blocked | Blocked |
| **deactivated** | Archival export only | Blocked | Blocked | Blocked |

## 2. Suspension Compliance & Mandatory Audit Trail
Under healthcare accreditation standards (NABH/HIPAA), suspending an active hospital tenant has legal ramifications.
- The Super Admin cannot toggle a tenant to `Suspended` without submitting a **Mandatory Audit Reason** (minimum 8 characters).
- The action, timestamp, administrator user ID, and justification are permanently written to `tenant_lifecycle_events` and `platform_audit_logs`.
- Patient clinical history is NEVER destroyed upon suspension; records remain encrypted and safely preserved for legal retention requirements.

