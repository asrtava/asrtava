import { describe, it } from 'node:test';
import assert from 'node:assert';
import { advancedAnalyticsService } from '../src/modules/analytics/analytics-advanced.service';

describe('ASRTAVA Enterprise Data Warehouse, Business Intelligence & Predictive Analytics Suite', () => {
  const tenantAlpha = 'org-apex-01';
  const tenantBeta = 'org-crest-02';

  let patientKeyAlpha: string;
  let doctorKeyCardio: string;
  let deptKeyCardio: string;
  let deptKeyGeneral: string;

  // 1. Date Dimension
  it('1. Populates and validates date dimension with fiscal calendar keys (YYYYMMDD)', () => {
    const today = new Date();
    const dateKey = advancedAnalyticsService.toDateKey(today);

    assert.ok(typeof dateKey === 'number', 'Date key should be numeric');
    assert.strictEqual(dateKey.toString().length, 8, 'Date key should be 8 digits (YYYYMMDD)');
    assert.ok(dateKey > 20200101, 'Date key should be valid modern year');
  });

  // 2. Patient Dimension with DPDP Pseudonymization
  it('2. Ingests patient dimension with DPDP-compliant cryptographic salt pseudonymization', () => {
    const patientDim = advancedAnalyticsService.ingestPatientDimension(tenantAlpha, {
      patientId: 'PAT-EDW-1001',
      gender: 'MALE',
      age: 48,
      city: 'Bengaluru',
      state: 'Karnataka'
    });

    assert.ok(patientDim.patientKey.startsWith('dim-pat-'), 'Patient key should follow dimension prefix');
    assert.ok(patientDim.pseudonymHash.length >= 64, 'Pseudonym hash must be SHA-256');
    assert.strictEqual(patientDim.ageGroup, '36-50', 'Age 48 must classify into 36-50 bucket');

    patientKeyAlpha = patientDim.patientKey;
  });

  // 3. Department & Doctor Dimensions
  it('3. Ingests clinical department and doctor dimension hierarchies', () => {
    const deptCardio = advancedAnalyticsService.ingestDepartmentDimension(tenantAlpha, {
      departmentCode: 'CARDIO',
      departmentName: 'Department of Cardiology & Cardiac Catheterization',
      departmentType: 'CLINICAL'
    });

    const deptGen = advancedAnalyticsService.ingestDepartmentDimension(tenantAlpha, {
      departmentCode: 'GEN_MED',
      departmentName: 'General Internal Medicine',
      departmentType: 'CLINICAL'
    });

    const docSharma = advancedAnalyticsService.ingestDoctorDimension(tenantAlpha, {
      doctorId: 'DOC-SHARMA-01',
      doctorName: 'Dr. Rajesh Sharma',
      departmentCode: 'CARDIO',
      specialty: 'Interventional Cardiology',
      designation: 'Senior Consultant'
    });

    assert.strictEqual(deptCardio.departmentCode, 'CARDIO');
    assert.strictEqual(docSharma.doctorName, 'Dr. Rajesh Sharma');

    deptKeyCardio = deptCardio.departmentKey;
    deptKeyGeneral = deptGen.departmentKey;
    doctorKeyCardio = docSharma.doctorKey;
  });

  // 4. OPD Encounter Fact
  it('4. Records OPD encounter facts and calculates clinic wait times & consultation duration', () => {
    const todayKey = advancedAnalyticsService.toDateKey(new Date());

    const enc1 = advancedAnalyticsService.recordOpdEncounterFact(tenantAlpha, {
      dateKey: todayKey,
      patientKey: patientKeyAlpha,
      doctorKey: doctorKeyCardio,
      departmentKey: deptKeyCardio,
      waitTimeMinutes: 22,
      consultDurationMinutes: 18,
      feeAmount: 800.0,
      isNoShow: false,
      isTeleconsultation: false,
      icd10Primary: 'I10' // Essential hypertension
    });

    const enc2 = advancedAnalyticsService.recordOpdEncounterFact(tenantAlpha, {
      dateKey: todayKey,
      patientKey: patientKeyAlpha,
      doctorKey: doctorKeyCardio,
      departmentKey: deptKeyCardio,
      waitTimeMinutes: 0,
      consultDurationMinutes: 0,
      feeAmount: 800.0,
      isNoShow: true,
      isTeleconsultation: false
    });

    assert.strictEqual(enc1.waitTimeMinutes, 22);
    assert.strictEqual(enc2.isNoShow, true);
  });

  // 5. IPD Admission Fact & ALOS
  it('5. Records IPD admission facts and computes Average Length of Stay (ALOS)', () => {
    const todayKey = advancedAnalyticsService.toDateKey(new Date());

    advancedAnalyticsService.recordIpdAdmissionFact(tenantAlpha, {
      admissionDateKey: todayKey - 5,
      dischargeDateKey: todayKey,
      patientKey: patientKeyAlpha,
      departmentKey: deptKeyCardio,
      wardType: 'PRIVATE',
      lengthOfStayDays: 5.0,
      totalCharges: 85000.0,
      isEmergencyAdmission: false,
      laceRiskScore: 6,
      readmittedWithin30d: false,
      mortalityFlag: false
    });

    advancedAnalyticsService.recordIpdAdmissionFact(tenantAlpha, {
      admissionDateKey: todayKey - 3,
      dischargeDateKey: todayKey,
      patientKey: patientKeyAlpha,
      departmentKey: deptKeyGeneral,
      wardType: 'GENERAL',
      lengthOfStayDays: 3.0,
      totalCharges: 32000.0,
      isEmergencyAdmission: true,
      laceRiskScore: 8,
      readmittedWithin30d: false,
      mortalityFlag: false
    });

    // 2 discharges: total days = 8.0, ALOS = 4.0 days
    const kpis = advancedAnalyticsService.computeHospitalExecutiveKpis(tenantAlpha, 100, 30);
    assert.strictEqual(kpis.totalDischarges, 2, 'Should record 2 discharges');
    assert.strictEqual(kpis.alos, 4.0, 'ALOS should equal (5.0 + 3.0) / 2 = 4.0 days');
  });

  // 6. Bed Occupancy Rate (BOR)
  it('6. Calculates Bed Occupancy Rate (BOR) across active operational wards', () => {
    // 8 bed days across 100 beds in a 30-day period = 8 / (100 * 30) = 8 / 3000 = 0.27%
    const kpis = advancedAnalyticsService.computeHospitalExecutiveKpis(tenantAlpha, 100, 30);
    assert.ok(kpis.borPercent >= 0.2 && kpis.borPercent <= 0.3, `BOR should be ~0.27%, got ${kpis.borPercent}%`);
  });

  // 7. Bed Turnover Rate (BTR) & Mortality
  it('7. Evaluates Bed Turnover Rate (BTR) and inpatient mortality percentage', () => {
    const kpis = advancedAnalyticsService.computeHospitalExecutiveKpis(tenantAlpha, 100, 30);
    assert.strictEqual(kpis.mortalityRatePercent, 0.0, 'Mortality should be 0.0% with zero deaths');
    assert.strictEqual(kpis.bedTurnoverRate, 0.02, 'BTR should be 2 discharges / 100 beds = 0.02');
  });

  // 8. Financial AR Days & Clean Claim Rate
  it('8. Computes Days in Accounts Receivable (AR Days) and clean claim rate', () => {
    const todayKey = advancedAnalyticsService.toDateKey(new Date());

    advancedAnalyticsService.recordFinancialDailyFact(tenantAlpha, {
      dateKey: todayKey,
      grossBilled: 1500000.0, // 15 Lakhs
      discountsAllowed: 50000.0,
      netBilled: 1450000.0,
      cashCollected: 700000.0,
      tpaCollected: 500000.0,
      arOutstanding: 250000.0, // 2.5 Lakhs
      cleanClaimsSubmitted: 95,
      totalClaimsSubmitted: 100
    });

    const kpis = advancedAnalyticsService.computeHospitalExecutiveKpis(tenantAlpha, 100, 30);
    assert.ok(kpis.arDays > 0, 'AR days should be positive');
    assert.strictEqual(kpis.cleanClaimRatePercent, 95.0, 'Clean claim rate should be 95%');
  });

  // 9. LACE+ 30-Day Readmission Risk Scoring (Low/Moderate)
  it('9. Evaluates LACE+ 30-day readmission risk index (Length of stay, Acuity, Comorbidities, ED visits)', () => {
    const laceLow = advancedAnalyticsService.calculateLaceReadmissionRisk({
      lengthOfStayDays: 2, // 2 pts
      isEmergencyAdmission: false, // 0 pts
      charlsonComorbidityScore: 1, // 1 pt
      emergencyVisitsPast6Months: 0 // 0 pts
    });

    assert.strictEqual(laceLow.totalScore, 3, 'LACE score should be 3');
    assert.strictEqual(laceLow.riskTier, 'LOW');
    assert.ok(laceLow.readmissionRiskPercent < 10, 'Risk percent should be low');
  });

  // 10. LACE+ High Risk Threshold & Clinical Recommendations
  it('10. Triggers high readmission risk alert and post-discharge care protocol when LACE score >= 10', () => {
    const laceHigh = advancedAnalyticsService.calculateLaceReadmissionRisk({
      lengthOfStayDays: 8, // 5 pts (7-13d)
      isEmergencyAdmission: true, // 3 pts
      charlsonComorbidityScore: 3, // 3 pts
      emergencyVisitsPast6Months: 2 // 2 pts
    });

    // Total: 5 + 3 + 3 + 2 = 13 pts
    assert.strictEqual(laceHigh.totalScore, 13);
    assert.strictEqual(laceHigh.riskTier, 'HIGH');
    assert.ok(laceHigh.readmissionRiskPercent >= 25, 'Readmission risk should exceed 25%');
    assert.ok(laceHigh.recommendations.some(r => r.includes('48 hours')), 'Should include 48h follow-up');
  });

  // 11. OPD Appointment No-Show Classifier (Low Risk)
  it('11. Classifies OPD appointment no-show probability using logistic regression model', () => {
    const prediction = advancedAnalyticsService.predictOpdNoShow({
      leadTimeDays: 1,
      historicalNoShowRate: 0.05,
      isPaidOnline: true,
      isFirstVisit: false
    });

    assert.strictEqual(prediction.isHighRisk, false);
    assert.strictEqual(prediction.riskCategory, 'LOW');
    assert.ok(prediction.probability < 0.30, 'Short lead time with online payment should yield low no-show');
  });

  // 12. OPD Appointment No-Show Classifier (High Risk)
  it('12. Flags high no-show risk (probability > 0.40) to activate dynamic queue overbooking', () => {
    const highRiskPrediction = advancedAnalyticsService.predictOpdNoShow({
      leadTimeDays: 28, // 4 weeks in advance
      historicalNoShowRate: 0.45, // frequent no-shower
      isPaidOnline: false,
      isFirstVisit: true
    });

    assert.strictEqual(highRiskPrediction.isHighRisk, true);
    assert.strictEqual(highRiskPrediction.riskCategory, 'HIGH');
    assert.ok(highRiskPrediction.recommendedAction.includes('overbooking slot'), 'Should recommend overbooking slot');
  });

  // 13. Bed Occupancy Surge & Shortage Predictor
  it('13. Projects bed occupancy surge and forecasts bed shortages 24-48 hours in advance', () => {
    // Current Census 92, Total Beds 100, Planned Admissions 15, Expected Discharges 4, Emergency Inflow 5
    // Projected = 92 + 15 + 5 - 4 = 108 beds (> 100) -> CRITICAL Shortage of 8 beds!
    const surge = advancedAnalyticsService.predictBedSurge(tenantAlpha, 92, 100, 15, 4, 5);

    assert.strictEqual(surge.projectedOccupancy, 108);
    assert.strictEqual(surge.surgeRisk, 'CRITICAL');
    assert.strictEqual(surge.estimatedShortageBeds, 8);
    assert.ok(surge.actionProtocol.includes('Shortage of 8 beds predicted'), 'Protocol must trigger shortage alert');
  });

  // 14. Pharmacy Consumption Velocity & Stockout Predictor
  it('14. Predicts pharmacy stockout based on daily consumption velocity and supplier lead time', () => {
    // Current stock: 120 tablets, Avg Daily Consumption: 40 tabs/day -> Days to stockout = 3 days.
    // Supplier lead time: 3 days + Safety buffer: 2 days = 5 days threshold.
    // Imminent stockout!
    const stockout = advancedAnalyticsService.predictPharmacyStockout({
      itemCode: 'MED-MEROPENEM-1G',
      currentStock: 120,
      avgDailyConsumption: 40,
      supplierLeadTimeDays: 3,
      safetyBufferDays: 2
    });

    assert.strictEqual(stockout.daysToStockout, 3.0);
    assert.strictEqual(stockout.isStockoutImminent, true);
    assert.ok(stockout.recommendedOrderQuantity > 0, 'Must recommend non-zero replenishment quantity');
  });

  // 15. Departmental & Doctor Productivity Rankings
  it('15. Aggregates departmental clinical volume and physician encounter productivity rankings', () => {
    const deptPerf = advancedAnalyticsService.getDepartmentPerformance(tenantAlpha);
    const docPerf = advancedAnalyticsService.getDoctorProductivity(tenantAlpha);

    assert.ok(deptPerf.length > 0, 'Should return departmental performance');
    const cardioDept = deptPerf.find(d => d.departmentCode === 'CARDIO');
    assert.ok(cardioDept, 'Cardiology department must exist');
    assert.strictEqual(cardioDept.opdVolume, 2, 'Should reflect 2 recorded OPD visits');

    assert.ok(docPerf.length > 0, 'Should return doctor productivity');
    const docSharma = docPerf.find(d => d.doctorId === 'DOC-SHARMA-01');
    assert.ok(docSharma, 'Dr. Sharma should exist in doctor rankings');
    assert.strictEqual(docSharma.encountersCount, 2);
    assert.strictEqual(docSharma.totalConsultationRevenue, 1600.0);
  });

  // 16. Multi-Tenant Data Isolation
  it('16. Strictly enforces multi-tenant isolation across analytical data marts (zero cross-tenant bleed)', () => {
    // Record admission for Hospital Beta
    const todayKey = advancedAnalyticsService.toDateKey(new Date());
    advancedAnalyticsService.recordIpdAdmissionFact(tenantBeta, {
      admissionDateKey: todayKey,
      patientKey: 'dim-pat-beta-999',
      departmentKey: 'dim-dept-beta-1',
      wardType: 'GENERAL',
      lengthOfStayDays: 2.0,
      totalCharges: 18000.0,
      isEmergencyAdmission: false,
      laceRiskScore: 4,
      readmittedWithin30d: false,
      mortalityFlag: false
    });

    const isIsolated = advancedAnalyticsService.verifyTenantIsolation(tenantAlpha, tenantBeta);
    assert.strictEqual(isIsolated, true, 'Tenants must remain strictly segregated');

    // Hospital Beta KPIs should not see Hospital Alpha's 2 discharges
    const betaKpis = advancedAnalyticsService.computeHospitalExecutiveKpis(tenantBeta, 50, 30);
    assert.strictEqual(betaKpis.totalAdmissions, 1, 'Hospital Beta must have exactly 1 admission');
  });
});

