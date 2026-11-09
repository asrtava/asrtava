# Predictive Analytics & Machine Learning Models Specification

## 1. LACE+ Readmission Risk Scoring Algorithm
- **Input Variables**:
  - `lengthOfStayDays`: Inpatient duration (1-14+ days)
  - `isEmergencyAdmission`: Binary (3 points if Emergency, 0 if Elective)
  - `charlsonComorbidityScore`: 0 to 6+ points (Diabetes, CHF, COPD, Renal failure, Cancer)
  - `emergencyVisitsPast6Months`: Count of ED presentations (0 to 4+ points)
- **Point Scale**:
  - $L$: 1 day = 1 pt, 2 days = 2 pts, 3 days = 3 pts, 4-6 days = 4 pts, 7-13 days = 5 pts, $\ge 14$ days = 7 pts
  - $A$: Emergency = 3 pts
  - $C$: 0 = 0 pts, 1 = 1 pt, 2 = 2 pts, 3 = 3 pts, $\ge 4$ = 5 pts
  - $E$: 0 = 0 pts, 1 = 1 pt, 2 = 2 pts, 3 = 3 pts, $\ge 4$ = 4 pts
- **Risk Stratification**:
  - Score 0-4: Low Risk (< 5% probability of 30-day readmission)
  - Score 5-9: Moderate Risk (5-12%)
  - Score $\ge 10$: High Risk (> 15% probability; triggers mandatory post-discharge nurse call and 7-day follow-up)

## 2. OPD Appointment No-Show Classifier
- **Calculation Formula**:
  $$\text{Probability} = \frac{1}{1 + e^{-z}}$$
  where:
  $$z = -1.5 + (0.05 \times \text{LeadTimeDays}) + (1.2 \times \text{HistoricalNoShowRate}) - (0.4 \times \text{IsPaidOnline}) + (0.3 \times \text{IsFirstVisit})$$
- **Classification**:
  - If $\text{Probability} > 0.40 \implies$ High No-Show Risk. Trigger SMS reminder and enable queue overbooking slot.

## 3. Bed Occupancy & Shortage Predictor
- Forecast for day $T+1$:
  $$\text{ExpectedCensus}_{T+1} = \text{CurrentCensus}_T + \text{ScheduledAdmissions}_{T+1} + \text{ProjectedEmergencyAdmissions}_{T+1} - \text{PlannedDischarges}_{T+1}$$
- If $\text{ExpectedCensus}_{T+1} > \text{AvailableBeds} \implies$ Alert `BED_CAPACITY_SURGE_RISK` with required expedited discharge quota.

## 4. Pharmacy Consumption Velocity & Stockout Predictor
- Run-out calculation:
  $$\text{DaysToStockout} = \frac{\text{CurrentUsableStock}}{\text{AverageDailyConsumption}_{30\text{d}}}$$
- If $\text{DaysToStockout} \le \text{SupplierLeadTimeDays} + \text{SafetyBufferDays} \implies$ Trigger automated Emergency Requisition `REQ-AUTO-STAT`.

