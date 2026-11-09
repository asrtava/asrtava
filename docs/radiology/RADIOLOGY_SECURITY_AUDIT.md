# ASRTAVA Radiology Information System Security Audit

## 1. Access Control & Row-Level Security (RLS)
- Every relational query across modalities, orders, appointments, screenings, and reports enforces PostgreSQL Row-Level Security parameterized by tenant `hospital_id`.
- Radiologists have read-write access to reporting worklists; radiographers/technicians have access to modality acquisition and patient screening forms; non-authorized staff are barred from viewing unreleased preliminary interpretations.

## 2. Emergency Override & Clinical Exemption Policy
- In compliance with ASRTAVA's core clinical mission, emergency trauma scans (`priority = STAT`) are never blocked due to pending billing clearance or cashier collection delays.
- Emergency procedures allow immediate imaging acquisition while financial recording proceeds asynchronously in the background.

## 3. Critical Finding Panic Protocol & Audit Trail
- High-risk pathology findings (e.g., tension pneumothorax, intracranial hemorrhage, acute arterial occlusion, aortic dissection) immediately generate a high-priority panic notification.
- To satisfy hospital accreditation and clinical governance standards, the radiologist must document a direct telephone read-back confirmation (`readBackConfirmed: true`, `readBackVerifiedBy: string`, `confirmedAt: timestamp`).

