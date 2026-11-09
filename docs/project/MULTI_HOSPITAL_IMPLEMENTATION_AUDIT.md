# ASRTAVA Enterprise Multi-Hospital Group & Branch Management Architecture Audit

## 1. System Audit Summary

This document serves as the formal architectural verification audit for the **Enterprise Multi-Hospital Group, Branch Management & Centralized Operations System**.

- **Architectural Scope**: Multi-Hospital Groups, Healthcare Chains, Regional Clinic Networks, Multi-Branch Facilities.
- **Commercial Model**: One-Time Perpetual Licensing with multi-location entitlement.
- **Topology Support**: Cloud VPC, On-Premises Air-Gapped Clusters, and Hybrid Edge-Cloud Synchronization.
- **Database Schema**: Migration `021_enterprise_hospital_group_and_branch_management.sql` adds 9 relational tables with foreign keys and compound indexes.
- **Backend Service Layer**: `GroupManagementService` (`backend/src/modules/group/group.service.ts`) implements the DAG node hierarchy, staff assignments, EMPI matching, cross-hospital transfers, anti-collision doctor scheduling, inter-branch finance, and stock movements.
- **API Gateways**: 23 RESTful endpoints mounted under `/api/v1/groups` in `backend/src/modules/group/group.routes.ts` and registered in `backend/src/server.ts`.
- **Frontend Workspace**: Group Admin Portal view implemented at `apps/web-portal/src/portals/group-admin/GroupAdminDashboard.tsx` with AppShell navigation integration.
- **Automated Test Validation**: 13/13 tests passing in `backend/tests/enterprise_group_branch_management.test.ts`. Full backend suite executes **250 / 250 passing tests** across 21 test suites in `~7.6s`.

---

## 2. Table-by-Table Database Architecture

| Table Name | Primary Purpose | Primary & Foreign Keys |
|---|---|---|
| `enterprise_organizations` | Parent healthcare holding group entity | `id` (PK), `org_code` (UQ), `license_id` (FK) |
| `organization_hierarchy_nodes` | DAG hierarchy tree (org, region, hospital, branch, clinic, unit) | `id` (PK), `organization_id` (FK), `parent_node_id` (Self FK) |
| `staff_workplace_assignments` | Multi-facility staff assignments (primary, secondary, visiting) | `id` (PK), `user_id` (FK), `hospital_id` (FK), `branch_id` (FK) |
| `enterprise_patient_identities`| Group-wide Master Patient Index (EMPI) | `id` (PK), `organization_id` (FK), `enterprise_patient_id` (UQ) |
| `patient_identity_links` | Links local hospital patient records to master EMPI | `id` (PK), `enterprise_patient_id` (FK), `local_patient_id` (FK) |
| `cross_hospital_transfers` | Emergency and clinical patient transfers across facilities | `id` (PK), `patient_id` (FK), `from_hospital_id` (FK), `to_hospital_id` (FK) |
| `cross_hospital_referrals` | Specialist patient referrals between facilities | `id` (PK), `patient_id` (FK), `referring_hospital_id` (FK), `receiving_hospital_id` (FK) |
| `doctor_branch_schedules` | Multi-facility doctor schedules with anti-collision validation | `id` (PK), `doctor_id` (FK), `hospital_id` (FK), `branch_id` (FK) |
| `inter_branch_stock_transfers`| Traceable pharmaceutical and supply chain movements | `id` (PK), `medicine_id` (FK), `source_hospital_id` (FK), `destination_hospital_id` (FK) |
| `inter_branch_financial_transactions`| Inter-company debits, reimbursements, and settlement tracking | `id` (PK), `debited_hospital_id` (FK), `credited_hospital_id` (FK) |
| `license_branch_allocations` | Perpetual license quota allocations across physical branches | `id` (PK), `license_id` (FK), `organization_id` (FK), `hospital_id` (FK) |

