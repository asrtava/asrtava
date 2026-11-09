# Enterprise Analytics & Predictive AI REST API Documentation

## Base Path: `/api/v1/analytics/advanced`

### 1. Executive C-Suite KPIs
- `GET /executive-kpis?beds=100&days=30`
  - Returns ALOS, BOR %, BTR, mortality rate, gross/net revenue, cash vs TPA collections, AR days, clean claim rate, readmission rate.

### 2. Predictive Models
- `POST /predict/lace`
  - Body: `{ lengthOfStayDays, isEmergencyAdmission, charlsonComorbidityScore, emergencyVisitsPast6Months }`
  - Returns: `{ totalScore, riskTier, readmissionRiskPercent, pointsBreakdown, recommendations }`
- `POST /predict/noshow`
  - Body: `{ leadTimeDays, historicalNoShowRate, isPaidOnline, isFirstVisit }`
  - Returns: `{ probability, isHighRisk, riskCategory, recommendedAction }`
- `POST /predict/bed-surge`
  - Body: `{ currentCensus, totalOperationalBeds, plannedAdmissionsNext24h, projectedDischargesNext24h, projectedEmergencyAdmissions }`
  - Returns: `{ projectedOccupancy, projectedOccupancyPercent, surgeRisk, estimatedShortageBeds, actionProtocol }`
- `POST /predict/stockout`
  - Body: `{ itemCode, currentStock, avgDailyConsumption, supplierLeadTimeDays, safetyBufferDays }`
  - Returns: `{ daysToStockout, isStockoutImminent, recommendedOrderQuantity }`

### 3. Departmental & Doctor Performance
- `GET /departments/performance`
  - Returns departmental OPD volume, IPD admissions, occupancy percentage, average wait times, and MTD revenue.
- `GET /doctors/productivity`
  - Returns clinician encounter count, consultation revenue, average duration, and patient satisfaction rating.

### 4. Dimensional Ingestion
- `POST /dimensions/patient`
  - Ingests patient into Star Schema data mart with salted HMAC-SHA256 pseudonymization.

