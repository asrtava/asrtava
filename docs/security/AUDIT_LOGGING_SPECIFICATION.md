# ASRTAVA Cryptographic Audit Logging Specification

## 1. Objectives & Guarantees

The ASRTAVA Clinical & System Audit Framework provides:
1. **Non-Repudiation**: Every clinical action (reading medical histories, altering prescriptions, dispensing pharmaceuticals, exporting reports) is tied to a verified user identity.
2. **Immutability**: Historical audit records can never be updated, truncated, or removed.
3. **Cryptographic Verification**: Consecutive audit entries are linked sequentially via SHA-256 hashes, creating an unalterable Merkle chain.

---

## 2. Payload Checksum Formula

For each event block $N$, the cryptographic checksum is computed as:

$$\text{Checksum}_N = \text{SHA-256}(\text{HospitalId} \parallel \text{ActorId} \parallel \text{Action} \parallel \text{Table} \parallel \text{ResourceId} \parallel \text{BeforeJSON} \parallel \text{AfterJSON} \parallel \text{Checksum}_{N-1} \parallel \text{Timestamp})$$

Where $\text{Checksum}_0 = \text{"GENESIS\_BLOCK"}$.

---

## 3. Database Tamper Prevention Trigger

```sql
CREATE OR REPLACE FUNCTION prevent_clinical_audit_tampering()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'TAMPER_ALERT: clinical_audit_events is an immutable append-only ledger. Updates and deletions are strictly prohibited by HIPAA/DPDP compliance policy.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_audit_update
    BEFORE UPDATE OR DELETE ON clinical_audit_events
    FOR EACH ROW
    EXECUTE FUNCTION prevent_clinical_audit_tampering();
```

---

## 4. Cryptographic Chain Verification API

The endpoint `POST /api/v1/security/audit/verify-integrity`:
- Sequentially scans the ledger for a hospital tenant.
- Re-calculates the expected SHA-256 hash for every block.
- Confirms that $\text{Checksum}_{N-1}$ matches the stored `previous_checksum`.
- Emits an instant alert identifying the corrupted row index if any byte in the database was modified out-of-band.

