# ASRTAVA Role-Based Dashboard Implementation

ASRTAVA implements 10 specialized, permission-scoped dashboards in `RoleDashboardsService`:

1. **Hospital Owner**: Comprehensive enterprise health: census, gross billings, collections, department billings, critical alerts.
2. **Hospital Administrator**: Day-to-day operations: appointments scheduled, bed census, pending invoices, active headcount, doctor on-duty workload.
3. **Doctor Workspace**: Personal workload statistics: completed vs scheduled consultations, average consult duration, follow-up adherence, upcoming queue.
4. **Nursing Station**: Inpatient ward census, occupied beds, pending vitals recordings, pending e-MAR medication administrations, shift handover ratio.
5. **Reception**: Appointment queue status, check-ins, waiting times, walk-in patients, cancelled slots.
6. **Pharmacy**: Daily OTC and prescription revenue, prescription fulfillment rates, near-expiry FEFO batches, stock valuation.
7. **Laboratory (LIMS)**: Tests ordered, pending accessioning, in-processing samples, finalized reports, turnaround time (TAT: 2.4h), critical panic value alerts.
8. **Finance & Accounts**: Recognized billings, cash/UPI collections, outstanding receivables, approved refunds, GST tax summary (18%).
9. **Human Resources (HR)**: Active headcount, department allocations, daily attendance rate (96.2%), leaves approved, payroll processing status.
10. **Super Admin Platform BI**: Total registered hospital tenants, active subscriptions, MRR (₹19.5L), ARR (₹2.34Cr), churn rate (0.8%), cloud storage utilization.

