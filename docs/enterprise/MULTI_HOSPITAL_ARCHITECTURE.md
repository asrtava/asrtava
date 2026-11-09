# ASRTAVA Enterprise Multi-Hospital Group & Branch Management Architecture

## 1. Executive Architecture Overview

ASRTAVA's Enterprise Multi-Hospital Group and Branch Management Architecture provides a scalable, multi-tier operational framework designed for:
- Independent standalone hospitals
- Multi-branch hospital networks
- Healthcare corporate groups (e.g., Apollo, Max, Manipal, Fortis)
- Multi-location clinic and diagnostic chains
- Regional healthcare delivery systems
- Government public health missions and hospital directorates

```
+---------------------------------------------------------------------------------------------------------------+
|                                    ASRTAVA ENTERPRISE ORGANIZATIONAL HIERARCHY                                |
+---------------------------------------------------------------------------------------------------------------+
|                                                                                                               |
|                        [ LEVEL 1: Enterprise Organization / Hospital Group ]                                  |
|                                       (e.g., Apex Healthcare Global)                                          |
|                                                     │                                                         |
|                     ┌───────────────────────────────┴───────────────────────────────┐                         |
|                     ▼                                                               ▼                         |
|     [ LEVEL 2: Regional Division / Office ]                       [ LEVEL 2: Regional Division / Office ]     |
|          (e.g., Northern Region)                                       (e.g., Southern Region)                |
|                     │                                                               │                         |
|         ┌───────────┴───────────┐                                       ┌───────────┴───────────┐             |
|         ▼                       ▼                                       ▼                       ▼             |
|  [ LEVEL 3: Hospital ]   [ LEVEL 3: Hospital ]                   [ LEVEL 3: Hospital ]   [ LEVEL 3: Clinic ]  |
|   (Apex Metro Saket)      (Apex Super Speciality)                 (Apex Bengaluru)        (Apex Whitefield)   |
|         │                                                               │                                     |
|    ┌────┴────┐                                                     ┌────┴────┐                                |
|    ▼         ▼                                                     ▼         ▼                                |
| [ Branch ] [ Branch ]                                           [ Branch ] [ Branch ]                         |
| (Saket OPD)(Saket IPD)                                          (Indira)   (Koramangala)                      |
|    │                                                               │                                          |
|    ▼                                                               ▼                                          |
| [ Department ] ──► [ Operational Unit ]                         [ Department ] ──► [ Operational Unit ]       |
| (Cardiology)         (Cath Lab #1)                              (Pediatrics)         (NICU Bay #2)            |
|                                                                                                               |
+---------------------------------------------------------------------------------------------------------------+
```

---

## 2. Architecture Gap Analysis

| Architectural Domain | Existing Baseline (v1.3.0) | Enterprise Multi-Hospital Requirement | Architectural Enhancement |
|---|---|---|---|
| **Organizational Hierarchy** | Flat `hospitals` table with 1-level `hospital_branches` child table | Arbitrary N-level hierarchy (Group -> Region -> Hospital -> Branch -> Clinic -> Department -> Unit) | Recursive hierarchical node engine with DAG loop prevention |
| **Identity & Access** | Users bound to a single `hospital_id` with local roles | Single user identity working across multiple hospitals/branches with primary & secondary assignments | Central `staff_workplace_assignments` table with scoped RBAC |
| **Patient Identity (MPI)** | UHID scoped strictly per `hospital_id` with separate records | Enterprise Master Patient Index (EMPI) linking patient encounters across group facilities with consent | Central Patient Identity Index (`enterprise_patient_identities` & `patient_identity_links`) |
| **Clinical Workflows** | Intra-hospital consultations, admissions, and orders | Authorized cross-hospital patient referrals, transfers, and diagnostic sharing | `cross_hospital_transfers` & `cross_hospital_referrals` with audit logs |
| **Doctor Scheduling** | OPD schedules per hospital | Doctors consulting across multiple branches on different days without schedule collision | `doctor_branch_schedules` with cross-branch conflict validation |
| **Finance & Billing** | Single hospital P&L and itemized tariffs | Consolidated group financial reporting + traceable branch-level P&L + inter-branch transactions | `inter_branch_financial_transactions` & Group consolidated analytics |
| **Inventory & Supply Chain** | Local hospital pharmacy formulary & store | Central group procurement warehouse + traceable inter-branch stock dispatch & receipt | `central_warehouse_inventory` & `inter_branch_stock_transfers` |
| **Licensing Integration** | Single license with `authorized_locations` | Multi-facility perpetual license enforcement, expansion tracking, and non-blocking warnings | Enterprise location quotas, branch activation keys, expansion requests |
| **Deployment Model** | Cloud, On-Prem, and Hybrid single-node | Multi-site hybrid clusters (Group Central Cloud + Regional Edge Nodes) with transactional sync | Multi-node transactional outbox sync with offline resilience |

---

## 3. Configuration Precedence Framework

Settings and policies resolve in strict hierarchical order:

$$\text{Platform Defaults} \longrightarrow \text{Organization Group Defaults} \longrightarrow \text{Hospital Settings} \longrightarrow \text{Branch-Specific Overrides}$$

- If a branch defines a custom price list or tariff, the branch override applies.
- If no branch override exists, the setting falls back to the parent hospital, then the organization group, and finally platform defaults.
- All configuration changes are recorded in `configuration_change_logs` with pre- and post-values.

