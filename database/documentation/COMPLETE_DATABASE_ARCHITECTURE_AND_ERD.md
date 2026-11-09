# ASRTAVA — Complete Production Database Architecture & ERD Specification
**Enterprise Multi-Tenant Healthcare Technology Platform (PostgreSQL 15+)**

See full interactive document and artifact at: `ASRTAVA-Complete-Database-Architecture-ERD.md`

### Summary of Domains Covered:
1. Multi-hospital tenant architecture with dual-layer PostgreSQL Row-Level Security (RLS)
2. User authentication, unified staff sessions, and multi-portal routing
3. Hybrid Authorization: 14 Standard RBAC roles + Individual custom permission overrides (explicit allow/deny, expiry, and approval logs)
4. Hospital, branch, and departmental hierarchies
5. Patient master identity with dependent mapping, allergies, and chronic medical history
6. Doctor availability schedules and exclusion-based appointment concurrency protection
7. OPD clinical consultations, SOAP notes, vital tracking, and ICD-10 diagnoses
8. IPD admissions, ward/room/bed allocation with partial unique index double-allocation protection
9. Medication Administration Records (MAR) and nursing handovers
10. Pharmacy medicine catalog, FIFO batch tracking, row-locked dispensing, and stock movements
11. Laboratory test catalog, specimen barcoding, and pathologist report approval
12. Radiology modality scheduling, PACS/DICOM integration links, and structured reports
13. Consolidated billing (OPD + IPD + Pharmacy + Lab), payment collection, and audited refunds
14. HR staff profiles, biometric attendance, duty rosters, and leave approvals
15. Material inventory, purchase orders, goods receipt notes (GRN), and stock adjustments
16. Patient web and React Native mobile app shared session/device architecture with push tokens
17. SaaS subscription tiers, tenant subscriptions, automated invoices, and platform audits
18. Purpose-limited, audited Super Admin support access sessions
19. 10 complete Mermaid Entity-Relationship Diagrams (ERDs)
20. Data retention lifecycle and 14-stage migration roadmap

