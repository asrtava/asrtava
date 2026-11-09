# Enterprise Data Flow & Integration Architecture

## 1. Architectural Principles
ASRTAVA operates as an enterprise modular monolith where all clinical, diagnostic, pharmaceutical, surgical, operational, financial, and analytical subsystems communicate through strongly typed internal domain services, transactional database boundaries, and standard REST APIs.

## 2. Cross-Subsystem Integration Schema
```mermaid
graph TD
    subgraph ClinicalFrontier ["Clinical & Operational Layer"]
        REG[Patient Registry] --> OPD[OPD & Appointments]
        REG --> ED[Emergency & Trauma]
        OPD --> EMR[Clinical EMR & SOAP]
        ED --> EMR
        EMR --> LIS[Laboratory Diagnostics]
        EMR --> RIS[Radiology PACS]
        EMR --> OT[Operation Theatre]
        EMR --> IPD[Wards & Inpatient Beds]
    end

    subgraph CareExecution ["Care Delivery & Safety"]
        IPD --> NURS[Nursing NEWS2 & eMAR]
        OT --> PACU[PACU Recovery]
        PACU --> IPD
        NURS --> PHARM[Inpatient Pharmacy]
        PHARM --> PROC[Procurement & Inventory]
    end

    subgraph FinancialAndGovernance ["Financial, Governance & Intelligence"]
        OPD --> RCM[Revenue Cycle & Billing]
        IPD --> RCM
        OT --> RCM
        PHARM --> RCM
        RCM --> GL[Double-Entry General Ledger]
        
        EMR --> QM[Quality & Patient Safety]
        PHARM --> QM
        IPD --> QM
        
        EMR --> EDW[Enterprise Data Warehouse]
        RCM --> EDW
        IPD --> EDW
        EDW --> BI[Executive BI & Predictive AI]
    end
```

## 3. Strict Cross-Domain Invariants
1. **Single Source of Truth**: All clinical episodes link to the immutable patient record via UHID.
2. **Immediate Financial Encumbrance**: Every medical procedure or drug dispensation writes an itemized tariff entry to the unbilled staging ledger.
3. **Double-Entry Mathematical Balance**: All cash, TPA, or card payments generate balancing debit and credit entries ($\sum Dr == \sum Cr$).
4. **Physical Inventory Integrity**: Stock deductions occur at the exact batch number level using First-Expiry-First-Out (FEFO) logic.

