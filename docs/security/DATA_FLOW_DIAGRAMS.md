# ASRTAVA End-to-End Data Flow & Network Boundary Diagrams

## 1. Clinical Data Ingress & Persistence Flow

```mermaid
sequenceDiagram
    autonumber
    actor Staff as Doctor / Clinician
    participant UI as Role Portal (React)
    participant Edge as TLS 1.3 Reverse Proxy / Helmet
    participant API as Centralized Express Gateway
    participant Guard as Tenant & IDOR Guard
    participant DB as PostgreSQL (RLS Enforced)
    participant Audit as Cryptographic Audit Engine

    Staff->>UI: Submit Clinical SOAP Encounter & Rx
    UI->>Edge: HTTPS POST /api/v1/clinical/consultations (Bearer JWT)
    Edge->>API: Validated TLS Handshake, HSTS Checked
    API->>API: Verify JWT Claims & Check Explicit DENY Precedence
    API->>Guard: Verify Patient ID belongs to Authenticated Hospital ID
    Guard-->>API: Tenant Ownership Verified
    API->>DB: BEGIN Transaction -> SET LOCAL app.current_tenant_id = ?
    DB->>DB: Execute INSERT into consultations with RLS validation
    DB-->>API: Consultation Record Committed
    API->>Audit: Compute SHA-256 Checksum (Payload + Previous Hash)
    Audit->>DB: Append-Only INSERT into clinical_audit_events
    API-->>UI: 201 Created (Encrypted / Masked Result)
    UI-->>Staff: Visual Confirmation & E-Prescription QR Generated
```

---

## 2. Token Rotation & Replay Reuse Detection Flow

```mermaid
sequenceDiagram
    autonumber
    actor Client as Patient Mobile App
    participant API as /api/v1/security/sessions/refresh
    participant Sec as SessionSecurityService
    participant DB as auth_session_tokens
    participant Incident as security_incidents

    Client->>API: POST /sessions/refresh (Composite Token: sessionId.rawToken)
    API->>Sec: Evaluate Presented Token Hash
    Sec->>DB: Query Session by ID
    
    alt Token Hash Valid & Unused
        Sec->>DB: Mark Current Token as Revoked (reason: rotated)
        Sec->>Sec: Generate New Token Pair in Same Family
        Sec->>DB: Insert New Refresh Token Hash
        Sec-->>Client: 200 OK (New Access Token + Rotated Refresh Token)
    else Replay Attack Detected (Token already rotated or hash mismatch)
        Sec->>DB: Invalidate ENTIRE Token Family (revoke all sessions)
        Sec->>Incident: Log Critical Incident (category: token_replay_attack)
        Sec-->>Client: 401 Unauthorized (Security Alert: Compromised session detected)
    end
```

---

## 3. Data Subject Right (DSR) Erasure Request Evaluation Flow

```mermaid
flowchart TD
    Start([Patient Submits Erasure Request under DPDP 2023]) --> VerifyIdentity[Verify Patient Identity & Multi-Factor Auth]
    VerifyIdentity --> FetchHistory[Fetch Patient Clinical & Financial History]
    FetchHistory --> CheckClinicalRetention{Are Clinical Records < 3 yrs (Adult) or < 21 yrs (Minor)?}
    
    CheckClinicalRetention -- Yes --> ApplyClinicalHold[Apply Statutory Medical Legal Hold: NMC RMP Regulations 2023]
    CheckClinicalRetention -- No --> CheckFinancialRetention{Are Financial Ledgers < 8 years old?}
    
    ApplyClinicalHold --> CheckFinancialRetention
    CheckFinancialRetention -- Yes --> ApplyFinancialHold[Apply Statutory Tax Legal Hold: Income Tax Act Sec 44AA]
    CheckFinancialRetention -- No --> CheckHoldsActive{Are Any Statutory Holds Active?}
    
    ApplyFinancialHold --> CheckHoldsActive
    CheckHoldsActive -- Yes --> PseudonymizeIdentifiers[Pseudonymize Non-Essential Identifiers (Phone, Email, Contact)]
    PseudonymizeIdentifiers --> UpdateStatusHold[Update DSR Status: 'legal_hold_retained' with Statutory Citation]
    UpdateStatusHold --> End([Audit Trail Appended & Patient Informed])
    
    CheckHoldsActive -- No --> CryptographicPurge[Cryptographically Erase Patient Direct Identifiers]
    CryptographicPurge --> UpdateStatusComplete[Update DSR Status: 'completed']
    UpdateStatusComplete --> End
```

