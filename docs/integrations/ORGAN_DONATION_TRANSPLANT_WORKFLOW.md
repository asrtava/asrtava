# ASRTAVA Organ Donation & Transplantation Coordination Workflow
## Statutory Compliance with India's NOTTO / SOTTO Framework & THOA 1994

---

### 1. Executive Summary & Regulatory Authority

Organ donation and transplantation is one of healthcare's most sensitive, strictly regulated operations. Under the **Transplantation of Human Organs and Tissues Act (THOA) 1994** (and subsequent amendments and rules), organ procurement and allocation in India is governed through a unified government framework:
- **National Organ and Tissue Transplant Organisation (NOTTO)**: Apex national regulatory body under the Ministry of Health and Family Welfare (MoHFW), Directorate General of Health Services.
- **Regional Organ and Tissue Transplant Organisations (ROTTO)**: Regional operational coordinators.
- **State Organ and Tissue Transplant Organisations (SOTTO)**: State-level registries and allocation execution authorities.

> [!IMPORTANT]
> **ASRTAVA's Non-Negotiable Regulatory Stance**:
> 1. ASRTAVA **does not allocate organs** or run independent matching algorithms. Allocation priority and recipient matching is the exclusive statutory responsibility of NOTTO/SOTTO.
> 2. ASRTAVA provides the **hospital clinical coordination and logistics platform** to ensure compliance with legal documentation, brain death board certifications, cross-match verification, and Green Corridor transport timing.
> 3. Organ donation is strictly **non-commercial**: no buying, selling, commercial priority, or bidding is permitted.

---

### 2. End-to-End Deceased Donor Workflow

```
[ Step 1: Donor Identification ]
  • ICU / Emergency identifies potential brain-stem dead patient
  • Medical team initiates donor evaluation protocol
                 │
                 ▼
[ Step 2: Brain-Stem Death Certification (THOA Form 8 / 10) ]
  • Mandates 4-Doctor Board:
    1. Medical Administrator / Medical Superintendent
    2. Treating Physician / Surgeon
    3. Independent Neurologist / Neurosurgeon
    4. Independent Medical Specialist
  • Mandates 2 Apnea Tests >= 6 hours apart
                 │
                 ▼
[ Step 3: Legal Consent Verification & SOTTO Notification ]
  • Next-of-kin legal declaration signed and hashed
  • Non-commercial affidavit recorded
  • Immediate electronic notification dispatched to SOTTO / NOTTO
                 │
                 ▼
[ Step 4: Official Allocation & Recipient Evaluation ]
  • NOTTO/SOTTO reviews national waitlist and issues allocation order
  • ASRTAVA records official NOTTO Registry Reference Token
  • Ephemeral case data (HLA typing, ABO match) shared with recipient center
                 │
                 ▼
[ Step 5: Retrieval & Green Corridor Transport Coordination ]
  • Retrieval team ETA synchronized with donor hospital OT
  • Green Corridor activated with Traffic Police & Airport Authorities
  • Cold Ischemia Time (CIT) countdown initiated at cross-clamp
                 │
                 ▼
[ Step 6: Recipient Hospital Admission & Transplant Completion ]
  • Receiving hospital performs final cross-match verification
  • Transplant surgery documented and finalized
  • Post-procedure outcome reported to NOTTO/SOTTO registry
```

---

### 3. Verification Safeguards & Technical Gates

| Stage | Required Legal / Clinical Gate | ASRTAVA System Enforcement |
|---|---|---|
| **Brain Death** | 2 Apnea tests $\ge 6$ hrs apart | Code throws `THOA Statutory Violation` if interval is $< 6$ hours |
| **Brain Death Board** | 4-doctor certification | Requires `brainDeathBoardCertified = true` before case initiation |
| **Next-of-Kin Consent** | Form 8 declaration | Requires `form8LegalDeclarationSigned = true` |
| **Anti-Commercialization** | Section 19 THOA affidavit | Requires SHA-256 non-commercial affidavit hash |
| **Allocation Authority** | NOTTO/SOTTO mandate | Enforces `officialAllocationAuthority = 'NOTTO/SOTTO'` constant |
| **Audit Traceability** | Complete legal audit log | Chained SHA-256 event logged into `inter_hospital_audit_trail` |

---

### 4. Integration Endpoints

All endpoints require active hospital tenant context and authorized roles (`Transplant Coordinator`, `Hospital Admin`, `Transplant Surgeon`):
- `POST /api/v1/federated-network/organ-transplant/initiate-case`: Registers donor evaluation and notifies SOTTO.
- `POST /api/v1/federated-network/case-share/issue-token`: Issues time-limited token for HLA tissue typing reports.
- `GET /api/v1/federated-network/case-share/access/:token`: Destination transplant team accesses case diagnostics.
