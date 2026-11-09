# ASRTAVA Operation Theatre Security & Compliance Audit

## 1. Multi-Tenant Data Isolation
- Enforced via PostgreSQL Row-Level Security (RLS) policies on `ot_theatres`, `ot_surgery_requests`, `ot_schedules`, `ot_who_checklists`, `ot_surgical_counts`, and `ot_pacu_records`.
- Query contexts parameterized with `app.current_hospital_id`.

## 2. Emergency Priority Exemption Policy
- In compliance with ASRTAVA's medical charter, emergency surgical procedures (`priority = STAT_EMERGENCY`) are never gated by cashier deposits, insurance pre-authorization delays, or administrative billing queues.
- Surgical suite allocation and anaesthesia induction proceed immediately while accounting transactions record asynchronously.

## 3. Controlled Narcotics Ledger & Cosignatures
- Intraoperative narcotic administration requires documented dual-verification (Administering Anaesthetist + Circulating Nurse) to comply with international drug enforcement and scheduled substance regulations.

