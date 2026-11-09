# ASRTAVA Branch Administration & Local Autonomy Architecture

## 1. Executive Overview

ASRTAVA Branch Management empowers healthcare organizations to operate multiple branches, satellite daycares, and regional clinics under a unified hospital group while preserving local operational autonomy. 

A branch operates with its own operating hours, doctor rosters, wards, pharmacy counters, and local billing rules while inheriting global group standards.

---

## 2. Configuration Precedence & Inheritance Model

To prevent configuration drift and eliminate redundant administrative setup across dozens of branches, ASRTAVA enforces a 4-tier configuration precedence cascade:

$$\text{Tier 1: Platform Defaults} \longrightarrow \text{Tier 2: Organization Group Defaults} \longrightarrow \text{Tier 3: Hospital Settings} \longrightarrow \text{Tier 4: Branch-Specific Overrides}$$

```
+---------------------------------------------------------------------------------------------------+
|                                 CONFIGURATION RESOLUTION FLOW                                     |
+---------------------------------------------------------------------------------------------------+
|                                                                                                   |
|  [ Request for Branch Setting ] (e.g., OPD Consultation Fee, Working Hours, Prescription Header)  |
|                 │                                                                                 |
|                 ▼                                                                                 |
|  Does Branch-Specific Override Exist?                                                             |
|       ├─► YES ──► Return Branch Override (e.g., Whitefield Clinic Fee = ₹ 800)                    |
|       └─► NO                                                                                      |
|            │                                                                                      |
|            ▼                                                                                      |
|  Does Parent Hospital Configuration Exist?                                                        |
|       ├─► YES ──► Return Hospital Setting (e.g., Bengaluru Main Hospital Fee = ₹ 1,000)           |
|       └─► NO                                                                                      |
|            │                                                                                      |
|            ▼                                                                                      |
|  Does Organization Group Default Exist?                                                           |
|       ├─► YES ──► Return Group Default (e.g., Apex Standard Tariff Package)                       |
|       └─► NO                                                                                      |
|            │                                                                                      |
|            ▼                                                                                      |
|  Return Platform System Default (e.g., Standard Indian Rupee, 15-Minute Slot, GST 18%)            |
|                                                                                                   |
+---------------------------------------------------------------------------------------------------+
```

---

## 3. Branch Operational Autonomy Matrix

| Operational Domain | Inherited from Group / Hospital | Locally Autonomous at Branch |
|---|---|---|
| **Patient Identification** | Master Patient Index (EMPI) format, Consent rules | Branch local registration number, local token queue |
| **Clinical Protocols** | Master formulary list, ICD-10 sets, Clinical alert rules | Doctor shift schedules, OPD consulting room allocations |
| **Inpatient & Beds** | Bed classification standards (ICU, General, Deluxe) | Physical bed counts, nurse stations, ward cleaning cycles |
| **Pharmacy & Stores** | Drug molecule master, FEFO enforcement rules | Local store stock levels, local emergency reorder triggers |
| **Billing & Tariffs** | Standard tariff catalog, GST tax rules | Branch-specific discount policies, local cashier tills |
| **Notifications** | Group-wide emergency alerts, maintenance memos | Branch-specific appointment reminders, local doctor delay alerts |

---

## 4. Branch Operating Lifecycle & Audit Tracking

Every branch is tracked with status flags (`active`, `temporarily_closed`, `renovation`, `decommissioned`). All modifications to branch configuration or operating hours are written to `configuration_change_logs` with pre- and post-values, timestamp, and authorizing user ID.

