import { Router, Request, Response } from 'express';
import { advancedAnalyticsService } from './analytics-advanced.service';
import { logger } from '../../utils/logger';

export const advancedAnalyticsRouter = Router();

// Middleware helper to extract tenant
const getTenant = (req: Request): string => {
  return (req as any).organizationId || (req.headers['x-tenant-id'] as string) || 'org-apex-01';
};

// 1. Executive C-Suite KPIs
advancedAnalyticsRouter.get('/executive-kpis', (req: Request, res: Response) => {
  try {
    const tenantId = getTenant(req);
    const totalBeds = parseInt((req.query.beds as string) || '100', 10);
    const days = parseInt((req.query.days as string) || '30', 10);

    const kpis = advancedAnalyticsService.computeHospitalExecutiveKpis(tenantId, totalBeds, days);
    return res.status(200).json({
      success: true,
      data: kpis
    });
  } catch (error: any) {
    logger.error('Error computing executive KPIs', { error: error.message });
    return res.status(500).json({ success: false, error: error.message });
  }
});

// 2. LACE+ 30-Day Readmission Risk Scoring
advancedAnalyticsRouter.post('/predict/lace', (req: Request, res: Response) => {
  try {
    const { lengthOfStayDays, isEmergencyAdmission, charlsonComorbidityScore, emergencyVisitsPast6Months } = req.body;

    if (lengthOfStayDays === undefined || isEmergencyAdmission === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: lengthOfStayDays, isEmergencyAdmission'
      });
    }

    const result = advancedAnalyticsService.calculateLaceReadmissionRisk({
      lengthOfStayDays: Number(lengthOfStayDays),
      isEmergencyAdmission: Boolean(isEmergencyAdmission),
      charlsonComorbidityScore: Number(charlsonComorbidityScore || 0),
      emergencyVisitsPast6Months: Number(emergencyVisitsPast6Months || 0)
    });

    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error: any) {
    logger.error('Error predicting LACE readmission risk', { error: error.message });
    return res.status(500).json({ success: false, error: error.message });
  }
});

// 3. OPD Appointment No-Show Classifier
advancedAnalyticsRouter.post('/predict/noshow', (req: Request, res: Response) => {
  try {
    const { leadTimeDays, historicalNoShowRate, isPaidOnline, isFirstVisit } = req.body;

    if (leadTimeDays === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: leadTimeDays'
      });
    }

    const result = advancedAnalyticsService.predictOpdNoShow({
      leadTimeDays: Number(leadTimeDays),
      historicalNoShowRate: Number(historicalNoShowRate || 0.1),
      isPaidOnline: Boolean(isPaidOnline),
      isFirstVisit: Boolean(isFirstVisit)
    });

    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error: any) {
    logger.error('Error predicting OPD appointment no-show', { error: error.message });
    return res.status(500).json({ success: false, error: error.message });
  }
});

// 4. Bed Occupancy Surge & Shortage Forecast
advancedAnalyticsRouter.post('/predict/bed-surge', (req: Request, res: Response) => {
  try {
    const tenantId = getTenant(req);
    const { currentCensus, totalOperationalBeds, plannedAdmissionsNext24h, projectedDischargesNext24h, projectedEmergencyAdmissions } = req.body;

    if (currentCensus === undefined || totalOperationalBeds === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: currentCensus, totalOperationalBeds'
      });
    }

    const forecast = advancedAnalyticsService.predictBedSurge(
      tenantId,
      Number(currentCensus),
      Number(totalOperationalBeds),
      Number(plannedAdmissionsNext24h || 0),
      Number(projectedDischargesNext24h || 0),
      Number(projectedEmergencyAdmissions || 5)
    );

    return res.status(200).json({
      success: true,
      data: forecast
    });
  } catch (error: any) {
    logger.error('Error calculating bed surge forecast', { error: error.message });
    return res.status(500).json({ success: false, error: error.message });
  }
});

// 5. Pharmacy Drug Stockout & Consumption Velocity Predictor
advancedAnalyticsRouter.post('/predict/stockout', (req: Request, res: Response) => {
  try {
    const { itemCode, currentStock, avgDailyConsumption, supplierLeadTimeDays, safetyBufferDays } = req.body;

    if (!itemCode || currentStock === undefined || avgDailyConsumption === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: itemCode, currentStock, avgDailyConsumption'
      });
    }

    const result = advancedAnalyticsService.predictPharmacyStockout({
      itemCode,
      currentStock: Number(currentStock),
      avgDailyConsumption: Number(avgDailyConsumption),
      supplierLeadTimeDays: Number(supplierLeadTimeDays || 3),
      safetyBufferDays: Number(safetyBufferDays || 2)
    });

    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error: any) {
    logger.error('Error predicting pharmacy stockout', { error: error.message });
    return res.status(500).json({ success: false, error: error.message });
  }
});

// 6. Departmental Clinical & Operational Performance
advancedAnalyticsRouter.get('/departments/performance', (req: Request, res: Response) => {
  try {
    const tenantId = getTenant(req);
    const performance = advancedAnalyticsService.getDepartmentPerformance(tenantId);
    return res.status(200).json({
      success: true,
      data: performance
    });
  } catch (error: any) {
    logger.error('Error retrieving department performance', { error: error.message });
    return res.status(500).json({ success: false, error: error.message });
  }
});

// 7. Doctor Productivity & Relative Value Analysis
advancedAnalyticsRouter.get('/doctors/productivity', (req: Request, res: Response) => {
  try {
    const tenantId = getTenant(req);
    const productivity = advancedAnalyticsService.getDoctorProductivity(tenantId);
    return res.status(200).json({
      success: true,
      data: productivity
    });
  } catch (error: any) {
    logger.error('Error retrieving doctor productivity', { error: error.message });
    return res.status(500).json({ success: false, error: error.message });
  }
});

// 8. Ingest De-Identified Patient Dimension
advancedAnalyticsRouter.post('/dimensions/patient', (req: Request, res: Response) => {
  try {
    const tenantId = getTenant(req);
    const { patientId, gender, age, city, state } = req.body;

    if (!patientId || !gender || age === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: patientId, gender, age'
      });
    }

    const patient = advancedAnalyticsService.ingestPatientDimension(tenantId, {
      patientId,
      gender,
      age: Number(age),
      city,
      state
    });

    return res.status(201).json({
      success: true,
      data: patient
    });
  } catch (error: any) {
    logger.error('Error ingesting patient dimension', { error: error.message });
    return res.status(500).json({ success: false, error: error.message });
  }
});

