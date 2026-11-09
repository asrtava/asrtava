# ASRTAVA Centralized Staff Management & Multi-Workplace Assignments

## 1. Executive Summary

In enterprise healthcare organizations, doctors, visiting specialists, nursing supervisors, and administrative executives routinely practice across multiple facilities. ASRTAVA solves the challenge of multiple identities by establishing **One Central Staff Identity** linked to multiple authorized facility assignments.

---

## 2. Staff Workplace Assignment Model

Instead of duplicating user accounts for each branch, a user account in `users` links to one or more rows in `staff_workplace_assignments`:

```sql
CREATE TABLE staff_workplace_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES enterprise_organizations(id) ON DELETE CASCADE,
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES hospital_branches(id) ON DELETE CASCADE,
    department_id UUID,
    assignment_type VARCHAR(30) NOT NULL DEFAULT 'primary' CHECK (assignment_type IN ('primary', 'secondary', 'temporary', 'visiting')),
    is_primary BOOLEAN DEFAULT FALSE,
    designation VARCHAR(150),
    role_key VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    assigned_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Assignment Classifications
1. **Primary Assignment**: The staff member's core home base facility where payroll, statutory benefits, and employee records originate.
2. **Secondary Assignment**: Permanent or standing privileges at another group hospital or branch (e.g., attending surgical rounds twice weekly).
3. **Visiting Specialist Assignment**: Specific outpatient consultation or interventional procedure shifts at satellite clinics.
4. **Temporary / Deputation Assignment**: Time-bound relief assignment during staffing shortages or epidemic surges with automated expiration (`end_date`).

---

## 3. Workplace Switching & Session Security

- When a multi-workplace user logs in, they select their active facility context from their authorized assignments.
- The JWT session token encodes the active `hospitalId` and optional `branchId`.
- Context switching requires selecting a valid assigned facility, immediately updating the active tenant scope (`x-hospital-id`) without requiring re-authentication or password entry.

