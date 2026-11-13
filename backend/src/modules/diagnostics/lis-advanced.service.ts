import { logger } from '../../utils/logger';
import { db } from '../../database';

export interface ParameterInput {
  hospitalId: string;
  departmentId: string;
  parameterCode: string;
  parameterName: string;
  unitOfMeasure: string;
  loincCode?: string;
  methodology?: string;
  refRangeMaleMin?: number;
  refRangeMaleMax?: number;
  refRangeFemaleMin?: number;
  refRangeFemaleMax?: number;
  criticalLow?: number;
  criticalHigh?: number;
  turnaroundTargetMins?: number;
}

export interface SpecimenAccessionInput {
  hospitalId: string;
  patientId: string;
  orderId?: string;
  specimenType: string;
  containerType: string;
  collectedByUserId?: string;
}

export interface ResultEntryInput {
  hospitalId: string;
  specimenId: string;
  parameterId: string;
  numericValue?: number;
  textValue?: string;
  technologistUserId: string;
  patientSex?: 'MALE' | 'FEMALE';
}

export interface QCMeasurementInput {
  hospitalId: string;
  controlLotNumber: string;
  parameterId: string;
  targetMean: number;
  standardDeviation: number;
  measuredValue: number;
}

export class LISAdvancedService {
  private departments: Map<string, any> = new Map();
  private parameters: Map<string, any> = new Map();
  private profiles: Map<string, any> = new Map();
  private specimens: Map<string, any> = new Map();
  private rejections: Map<string, any> = new Map();
  private results: Map<string, any> = new Map();
  private criticalAlerts: Map<string, any> = new Map();
  private microbiologyCultures: Map<string, any> = new Map();
  private histopathologyCases: Map<string, any> = new Map();
  private qcMeasurements: Map<string, any> = new Map();

  // 1. Departments & Test Catalog
  public async createDepartment(input: { hospitalId: string; code: string; name: string; headOfDepartmentId?: string; locationRoom?: string }): Promise<any> {
    const id = `dept-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const dept = { id, ...input, isActive: true, createdAt: new Date().toISOString() };
    this.departments.set(id, dept);

    try {
      await db.transaction(async (trx) => {
        await trx('lis_departments').insert({
          id: dept.id,
          hospital_id: dept.hospitalId,
          code: dept.code,
          name: dept.name,
          head_of_department_id: dept.headOfDepartmentId || null,
          location_room: dept.locationRoom || null,
          is_active: dept.isActive,
          created_at: dept.createdAt,
        });
      });
    } catch (err: any) {
      logger.warn('[LISAdvancedService] lis_departments DB persistence fallback', { error: err.message });
    }

    return dept;
  }

  public async registerTestParameter(input: ParameterInput): Promise<any> {
    const id = `param-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const param = { id, ...input, isActive: true, createdAt: new Date().toISOString() };
    this.parameters.set(id, param);

    try {
      await db.transaction(async (trx) => {
        await trx('lis_test_parameters').insert({
          id: param.id,
          hospital_id: param.hospitalId,
          department_id: param.departmentId,
          parameter_code: param.parameterCode,
          parameter_name: param.parameterName,
          unit_of_measure: param.unitOfMeasure,
          loinc_code: param.loincCode || null,
          methodology: param.methodology || null,
          ref_range_male_min: param.refRangeMaleMin || null,
          ref_range_male_max: param.refRangeMaleMax || null,
          ref_range_female_min: param.refRangeFemaleMin || null,
          ref_range_female_max: param.refRangeFemaleMax || null,
          critical_low: param.criticalLow || null,
          critical_high: param.criticalHigh || null,
          turnaround_target_mins: param.turnaroundTargetMins || 60,
          is_active: param.isActive,
          created_at: param.createdAt,
        });
      });
    } catch (err: any) {
      logger.warn('[LISAdvancedService] lis_test_parameters DB persistence fallback', { error: err.message });
    }

    logger.info('LIS test parameter registered', { paramId: id, code: input.parameterCode });
    return param;
  }

  // 2. Specimen Accessioning & Barcode
  public async accessionSpecimen(input: SpecimenAccessionInput): Promise<any> {
    const id = `spec-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const accessionNumber = `ACC-2026-${Math.floor(10000 + Math.random() * 90000)}`;
    const barcodeString = `*${accessionNumber}*`;

    const specimen = {
      id,
      accessionNumber,
      barcodeString,
      ...input,
      collectionTime: new Date().toISOString(),
      specimenCondition: 'ACCEPTABLE',
      processingStatus: 'COLLECTED',
      createdAt: new Date().toISOString(),
    };
    this.specimens.set(id, specimen);

    try {
      await db.transaction(async (trx) => {
        await trx('lis_specimens').insert({
          id: specimen.id,
          hospital_id: specimen.hospitalId,
          patient_id: specimen.patientId,
          order_id: specimen.orderId || null,
          accession_number: specimen.accessionNumber,
          barcode: specimen.barcodeString,
          specimen_type: specimen.specimenType,
          container_type: specimen.containerType,
          specimen_condition: specimen.specimenCondition,
          collection_time: specimen.collectionTime,
          processing_status: specimen.processingStatus,
          collected_by_user_id: specimen.collectedByUserId || null,
          created_at: specimen.createdAt,
        });
      });
    } catch (err: any) {
      logger.warn('[LISAdvancedService] lis_specimens DB persistence fallback', { error: err.message });
    }

    logger.info('Specimen accessioned', { accessionNumber, specimenType: input.specimenType });
    return specimen;
  }

  public async rejectSpecimen(specimenId: string, rejectedByUserId: string, reason: string, notes?: string): Promise<any> {
    const spec = this.specimens.get(specimenId);
    if (!spec) throw new Error('Specimen not found');
    spec.processingStatus = 'REJECTED';
    spec.specimenCondition = reason.includes('Hemolyzed') ? 'HEMOLYZED' : 'INSUFFICIENT_VOLUME';

    const rejectionId = `rej-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const rejection = {
      id: rejectionId,
      hospitalId: spec.hospitalId,
      specimenId,
      rejectionReason: reason,
      rejectedByUserId,
      recollectionRequested: true,
      notes: notes || null,
      createdAt: new Date().toISOString(),
    };
    this.rejections.set(rejectionId, rejection);

    try {
      await db.transaction(async (trx) => {
        await trx('lis_specimens').where({ id: specimenId }).update({
          processing_status: 'REJECTED',
          specimen_condition: spec.specimenCondition,
        });
        await trx('lis_specimen_rejections').insert({
          id: rejection.id,
          hospital_id: rejection.hospitalId,
          specimen_id: rejection.specimenId,
          rejection_reason: rejection.rejectionReason,
          rejected_by_user_id: rejection.rejectedByUserId,
          recollection_requested: rejection.recollectionRequested,
          notes: rejection.notes,
          created_at: rejection.createdAt,
        });
      });
    } catch (err: any) {
      logger.warn('[LISAdvancedService] lis_specimen_rejections DB persistence fallback', { error: err.message });
    }

    logger.warn('Specimen rejected, recollection requested', { specimenId, reason });
    return { specimen: spec, rejection };
  }

  // 3. Result Entry & Validation
  public async recordTestResult(input: ResultEntryInput): Promise<any> {
    const param = this.parameters.get(input.parameterId);
    if (!param) throw new Error('Test parameter not found');

    let abnormalityFlag: 'NORMAL' | 'ABNORMAL_HIGH' | 'ABNORMAL_LOW' | 'CRITICAL_PANIC' = 'NORMAL';

    if (input.numericValue !== undefined) {
      const val = Number(input.numericValue);
      // Check critical panic limits
      if (param.criticalLow !== undefined && val <= param.criticalLow) {
        abnormalityFlag = 'CRITICAL_PANIC';
      } else if (param.criticalHigh !== undefined && val >= param.criticalHigh) {
        abnormalityFlag = 'CRITICAL_PANIC';
      } else {
        // Check normal biological reference range
        const minRef = input.patientSex === 'FEMALE' && param.refRangeFemaleMin !== undefined ? param.refRangeFemaleMin : param.refRangeMaleMin;
        const maxRef = input.patientSex === 'FEMALE' && param.refRangeFemaleMax !== undefined ? param.refRangeFemaleMax : param.refRangeMaleMax;

        if (minRef !== undefined && val < minRef) abnormalityFlag = 'ABNORMAL_LOW';
        else if (maxRef !== undefined && val > maxRef) abnormalityFlag = 'ABNORMAL_HIGH';
      }
    }

    const id = `res-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const result = {
      id,
      ...input,
      abnormalityFlag,
      validationStatus: 'ENTERED',
      deltaCheckFlag: 'STABLE',
      createdAt: new Date().toISOString(),
    };
    this.results.set(id, result);

    let criticalAlert = null;
    if (abnormalityFlag === 'CRITICAL_PANIC') {
      const alertId = `crit-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      criticalAlert = {
        id: alertId,
        hospitalId: input.hospitalId,
        resultId: id,
        clinicianNotifiedId: null,
        notificationChannel: 'TELEPHONE_READ_BACK',
        notifiedAt: new Date().toISOString(),
        acknowledgedAt: null,
        clinicalActionTaken: null,
      };
      this.criticalAlerts.set(alertId, criticalAlert);
      logger.error('CRITICAL PANIC VALUE DETECTED IN LAB RESULT', { resultId: id, parameter: param.parameterName, value: input.numericValue });
    }

    try {
      await db.transaction(async (trx) => {
        await trx('lis_test_results').insert({
          id: result.id,
          hospital_id: result.hospitalId,
          specimen_id: result.specimenId,
          parameter_id: result.parameterId,
          numeric_value: result.numericValue || null,
          text_value: result.textValue || null,
          abnormality_flag: result.abnormalityFlag,
          validation_status: result.validationStatus,
          delta_check_flag: result.deltaCheckFlag,
          technologist_user_id: result.technologistUserId,
          created_at: result.createdAt,
        });

        if (criticalAlert) {
          await trx('lis_critical_alerts').insert({
            id: criticalAlert.id,
            hospital_id: criticalAlert.hospitalId,
            test_result_id: criticalAlert.resultId,
            parameter_id: input.parameterId,
            critical_value: String(input.numericValue || input.textValue || 'PANIC'),
            alert_status: 'TRIGGERED',
            notification_channel: criticalAlert.notificationChannel,
            notified_at: criticalAlert.notifiedAt,
          });
        }
      });
    } catch (err: any) {
      logger.warn('[LISAdvancedService] lis_test_results DB persistence fallback', { error: err.message });
    }

    return { result, criticalAlert };
  }

  public async validateResultTechnologist(resultId: string, technologistId: string): Promise<any> {
    const res = this.results.get(resultId);
    if (!res) throw new Error('Result not found');
    res.validationStatus = 'TECHNICALLY_VALIDATED';
    res.technologistUserId = technologistId;

    try {
      await db.transaction(async (trx) => {
        await trx('lis_test_results').where({ id: resultId }).update({
          validation_status: 'TECHNICALLY_VALIDATED',
          technologist_user_id: technologistId,
        });
      });
    } catch (err: any) {
      logger.warn('[LISAdvancedService] validateResultTechnologist DB fallback', { error: err.message });
    }

    return res;
  }

  public async authorizeReportPathologist(resultId: string, pathologistId: string): Promise<any> {
    const res = this.results.get(resultId);
    if (!res) throw new Error('Result not found');
    res.validationStatus = 'PATHOLOGIST_AUTHORIZED';
    res.pathologistUserId = pathologistId;
    res.authorizedAt = new Date().toISOString();

    try {
      await db.transaction(async (trx) => {
        await trx('lis_test_results').where({ id: resultId }).update({
          validation_status: 'PATHOLOGIST_AUTHORIZED',
          pathologist_user_id: pathologistId,
          authorized_at: res.authorizedAt,
        });
      });
    } catch (err: any) {
      logger.warn('[LISAdvancedService] authorizeReportPathologist DB fallback', { error: err.message });
    }

    logger.info('Lab report medically authorized by Pathologist', { resultId, pathologistId });
    return res;
  }

  public async amendAuthorizedResult(resultId: string, pathologistId: string, newValue: number, reason: string): Promise<any> {
    const res = this.results.get(resultId);
    if (!res) throw new Error('Result not found');
    res.isAmended = true;
    res.amendmentReason = reason;
    res.numericValue = newValue;
    res.validationStatus = 'AMENDED';
    res.authorizedAt = new Date().toISOString();

    try {
      await db.transaction(async (trx) => {
        await trx('lis_test_results').where({ id: resultId }).update({
          numeric_value: newValue,
          is_amended: true,
          amendment_reason: reason,
          validation_status: 'AMENDED',
          authorized_at: res.authorizedAt,
        });
      });
    } catch (err: any) {
      logger.warn('[LISAdvancedService] amendAuthorizedResult DB fallback', { error: err.message });
    }

    logger.warn('Authorized lab result amended', { resultId, pathologistId, reason });
    return res;
  }

  // 4. Microbiology & AST
  public async recordMicrobiologyCulture(input: {
    hospitalId: string;
    specimenId: string;
    organismIsolated: string;
    colonyCountCfuMl: string;
    growthStatus: 'NO_GROWTH' | 'GROWTH_OBSERVED' | 'CONTAMINATED';
    gramStainResult?: string;
  }): Promise<any> {
    const id = `micro-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const culture = {
      id,
      ...input,
      finalReportReleasedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    this.microbiologyCultures.set(id, culture);

    try {
      await db.transaction(async (trx) => {
        await trx('lis_microbiology_cultures').insert({
          id: culture.id,
          hospital_id: culture.hospitalId,
          specimen_id: culture.specimenId,
          organism_isolated: culture.organismIsolated,
          colony_count_cfu_ml: culture.colonyCountCfuMl,
          growth_status: culture.growthStatus,
          gram_stain_result: culture.gramStainResult || null,
          final_report_released_at: culture.finalReportReleasedAt,
          created_at: culture.createdAt,
        });
      });
    } catch (err: any) {
      logger.warn('[LISAdvancedService] lis_microbiology_cultures DB persistence fallback', { error: err.message });
    }

    logger.info('Microbiology culture finding recorded', { cultureId: id, organism: input.organismIsolated });
    return culture;
  }

  // 5. Histopathology
  public async recordHistopathologyCase(input: {
    hospitalId: string;
    biopsyNumber: string;
    specimenId: string;
    tissueSite: string;
    grossDescription: string;
    cassetteCount: number;
    microscopicFindings: string;
    pathologicDiagnosis: string;
    reportingPathologistId: string;
  }): Promise<any> {
    const id = `histo-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const histoCase = {
      id,
      ...input,
      authorizedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    this.histopathologyCases.set(id, histoCase);

    try {
      await db.transaction(async (trx) => {
        await trx('lis_histopathology_cases').insert({
          id: histoCase.id,
          hospital_id: histoCase.hospitalId,
          biopsy_number: histoCase.biopsyNumber,
          specimen_id: histoCase.specimenId,
          tissue_site: histoCase.tissueSite,
          gross_description: histoCase.grossDescription,
          cassette_count: histoCase.cassetteCount,
          microscopic_findings: histoCase.microscopicFindings,
          pathologic_diagnosis: histoCase.pathologicDiagnosis,
          reporting_pathologist_id: histoCase.reportingPathologistId,
          authorized_at: histoCase.authorizedAt,
          created_at: histoCase.createdAt,
        });
      });
    } catch (err: any) {
      logger.warn('[LISAdvancedService] lis_histopathology_cases DB persistence fallback', { error: err.message });
    }

    logger.info('Histopathology case authorized', { biopsyNumber: input.biopsyNumber });
    return histoCase;
  }

  // 6. Internal Quality Control (IQC) & Westgard
  public async recordQCMeasurement(input: QCMeasurementInput): Promise<any> {
    const zScore = Number(((input.measuredValue - input.targetMean) / input.standardDeviation).toFixed(2));
    let westgardViolation: string | null = null;
    let runStatus: 'IN_CONTROL' | 'WARNING' | 'OUT_OF_CONTROL_REJECT' = 'IN_CONTROL';

    const absZ = Math.abs(zScore);
    if (absZ > 3.0) {
      westgardViolation = '1_3S';
      runStatus = 'OUT_OF_CONTROL_REJECT';
    } else if (absZ > 2.0) {
      westgardViolation = '1_2S';
      runStatus = 'WARNING';
    }

    const id = `qc-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const qc = {
      id,
      ...input,
      zScore,
      westgardViolation,
      runStatus,
      runAt: new Date().toISOString(),
    };
    this.qcMeasurements.set(id, qc);

    try {
      await db.transaction(async (trx) => {
        await trx('lis_qc_measurements').insert({
          id: qc.id,
          hospital_id: qc.hospitalId,
          parameter_id: qc.parameterId,
          control_lot_number: qc.controlLotNumber,
          target_mean: qc.targetMean,
          standard_deviation: qc.standardDeviation,
          measured_value: qc.measuredValue,
          z_score: qc.zScore,
          westgard_violation: qc.westgardViolation || null,
          run_status: qc.runStatus,
          run_at: qc.runAt,
        });
      });
    } catch (err: any) {
      logger.warn('[LISAdvancedService] lis_qc_measurements DB persistence fallback', { error: err.message });
    }

    logger.info('IQC Measurement recorded', { qcId: id, zScore, runStatus });
    return qc;
  }
}

export const lisAdvancedService = new LISAdvancedService();
