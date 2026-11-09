# ASRTAVA KPI and Metric Definition Catalogue

The metric definition catalogue serves as the authoritative single source of truth for business intelligence calculations across ASRTAVA:

| Metric Code | Metric Name | Category | Unit | Mathematical Formula | Source Tables |
|---|---|---|---|---|---|
| `ALOS` | Average Length of Stay | Clinical | Days | $\frac{\sum (\text{discharge\_date} - \text{admission\_date})}{\text{COUNT}(\text{discharged\_admissions})}$ | `admissions` |
| `BED_OCCUPANCY_RATE` | Inpatient Bed Occupancy | Operational | % | $\frac{\text{COUNT}(\text{occupied\_beds})}{\text{COUNT}(\text{operational\_beds})} \times 100$ | `beds` |
| `LAB_TAT` | Laboratory Turnaround Time | Laboratory | Hours | $\text{AVG}(\text{approved\_at} - \text{received\_at})$ | `lab_orders`, `lab_results` |
| `GROSS_REVENUE` | Gross Recognized Billings | Financial | INR | $\sum \text{gross\_amount}$ | `invoices` |
| `NET_COLLECTIONS` | Net Cash & Digital Collections | Financial | INR | $\sum \text{payments.amount\_paid} - \sum \text{refunds.refund\_amount}$ | `payments`, `refunds` |
| `FEFO_EXPIRY_RISK` | Near-Expiry Stock Valuation | Pharmacy | INR | $\sum (\text{remaining\_qty} \times \text{cost\_price}) \text{ within 90 days}$ | `medicine_batches` |
| `MRR` | Monthly Recurring Revenue | SaaS Platform | INR | $\sum \text{active\_subscriptions.price\_monthly}$ | `hospital_subscriptions` |
| `ARR` | Annual Recurring Revenue | SaaS Platform | INR | $\text{MRR} \times 12$ | `hospital_subscriptions` |
| `CHURN_RATE` | Monthly Tenant Churn Rate | SaaS Platform | % | $\frac{\text{Cancelled Tenants in Period}}{\text{Active Tenants at Start}} \times 100$ | `hospitals` |

