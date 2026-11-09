# ASRTAVA Enterprise Perpetual Licensing & Multi-Location Scope

## 1. Perpetual Software Ownership for Hospital Groups

ASRTAVA's commercial model guarantees **One-Time Perpetual Software Ownership** for hospital groups. Rather than obligating hospitals to recurring monthly software subscriptions, the enterprise license permanently entitles the organization to operate the agreed edition across authorized facilities:

```
[ ASRTAVA Enterprise Perpetual License ]
       │
       ├─► Permanent Ownership of Software Version
       ├─► Core Operational & Clinical Modules
       ├─► Multi-Facility Entitlement (e.g. 5 Authorized Locations)
       └─► Total Bed Tier Quota (e.g. 1,000 Licensed Beds)
```

---

## 2. Multi-Location Entitlement & Branch Allocation

When a healthcare organization purchases an Enterprise License, `authorized_locations` specifies the maximum number of physical hospital and clinic sites authorized to activate nodes:

```typescript
export interface LicenseBranchAllocationRecord {
  id: string;
  license_id: string;
  organization_id: string;
  hospital_id: string;
  branch_id?: string;
  allocated_beds: number;
  allocated_modules: string[];
  activation_key: string;
  is_active: boolean;
}
```

### Allocation Rules
1. **Quota Enforcement**: `GroupManagementService.allocateLicenseBranch()` verifies that the number of allocated sites does not exceed `authorized_locations`.
2. **Clinical Continuity & Non-Blocking Design**: If an organization opens a branch that exceeds its currently purchased location quota, the system **never blocks ongoing clinical care** or patient operations. Instead:
   - A non-blocking commercial warning is logged in the Group Admin portal.
   - A formal expansion request (`requestLicenseExpansion()`) is generated for executive review.
   - The branch operates without administrative disruption.
3. **Support & Maintenance Separation**: Annual Maintenance Contracts (AMC) are strictly separate commercial service agreements. Lapsing an AMC restricts software upgrades and premium SLAs, but never invalidates the enterprise perpetual license or impairs patient care.

