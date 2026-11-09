# ASRTAVA Organizational Hierarchy & Node Governance

## 1. Overview

ASRTAVA's organizational structure avoids rigid, hardcoded schemas by adopting a **Directed Acyclic Graph (DAG) Hierarchical Node Engine**. An enterprise healthcare customer can model complex holding structures, regional divisions, university hospitals, urban outpatient centers, and rural community outreach clinics.

---

## 2. Configurable Node Classifications

Every node within an organization's hierarchy is assigned a classification:

| Node Classification | Typical Scope | Operational Capabilities | Permissible Parent Nodes |
|---|---|---|---|
| `organization` | Corporate Entity / Group HQ | Financial consolidation, executive dashboards, master procurement | Root (None) |
| `region` | Regional Division / State Cluster | Regional oversight, shared ambulance fleet, regional inventory depot | `organization` |
| `hospital` | Full-Service Multi-Specialty Facility | 24/7 Inpatient beds, Emergency, OT, Diagnostics, Full Pharmacy | `organization`, `region` |
| `branch` | Satellite Facility / Specialty Wing | Specific service delivery (e.g., Saket Daycare Oncology Branch) | `hospital` |
| `clinic` | Outpatient Consultation Center | OPD consultation suites, sample collection, dispensing kiosk | `organization`, `region`, `hospital` |
| `department` | Clinical / Administrative Service | Cardiology, Pediatrics, Central Billing, Medical Records | `hospital`, `branch`, `clinic` |
| `unit` | Specific Operational Workstation | Cath Lab 1, Dialysis Bay 4, Inpatient Ward 3 Bed Cluster | `department` |

---

## 3. Cycle & Loop Prevention Algorithm

To guarantee tree integrity and prevent circular references (e.g., Node A $\rightarrow$ Node B $\rightarrow$ Node A), every parent-child assignment undergoes an automated recursive ancestry check prior to insertion:

```typescript
export function validateHierarchyNoCycles(
  nodes: Map<string, OrganizationNodeRecord>,
  targetNodeId: string,
  proposedParentId?: string
): boolean {
  if (!proposedParentId) return true; // Root node
  if (targetNodeId === proposedParentId) {
    throw new Error('A node cannot be set as its own parent.');
  }

  let currentParentId: string | undefined = proposedParentId;
  const visited = new Set<string>();

  while (currentParentId) {
    if (currentParentId === targetNodeId) {
      throw new Error(`Circular reference detected: proposed parent ${proposedParentId} is a descendant of node ${targetNodeId}.`);
    }
    if (visited.has(currentParentId)) {
      throw new Error('Cycle detected in existing parent ancestry.');
    }
    visited.add(currentParentId);

    const parentNode = nodes.get(currentParentId);
    currentParentId = parentNode?.parent_node_id;
  }

  return true;
}
```

---

## 4. Shared Services Architecture

Hospital groups frequently maintain shared service centers serving multiple facilities:
1. **Central Tele-Radiology Hub**: Specialists at Group HQ reporting on CT/MRI scans acquired at peripheral branches.
2. **Central Blood Bank & Cold Chain**: Group blood bank supplying 5 regional hospitals.
3. **Consolidated Revenue Cycle Management (RCM)**: Central billing and TPA claim processing team managing insurance claims across all branches.
4. **Shared Specialist Roster**: Senior super-specialists visiting different branches on scheduled days of the week.

