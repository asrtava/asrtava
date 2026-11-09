# ASRTAVA Emergency Department Security & Compliance Audit

## 1. Multi-Tenant Row-Level Security (RLS)
- PostgreSQL Row-Level Security active on all 11 emergency tables: `ed_encounters`, `ed_triage_records`, `ed_trauma_activations`, `ed_resuscitation_checklists`, `ed_stat_orders`, `ed_medico_legal_cases`, `ambulance_fleet`, `ambulance_trips`, `ambulance_pcr_records`, `ed_observation_beds`, `ed_dispositions`.
- Strict isolation enforced across hospital tenants via `hospital_id = CURRENT_SETTING('app.current_hospital_id', true)`.

## 2. Medico-Legal Case (MLC) Security & Chain of Custody
- MLC records are legally sensitive documents subject to court subpoena and statutory police review.
- Any edit or intimation timestamp is permanently recorded in the immutable audit trail.
- Biological samples collected in MLC cases (e.g., toxicological blood samples, gastric aspirates) maintain a chain of custody log with police constable signatures.

## 3. Clinical Exemption Security Assertion
- Financial gates are completely bypassed for acute emergency clinical workflows while maintaining transactional traceability:
  - `is_stat_override = true`
  - `clinical_override_reason` mandatory documentation.

