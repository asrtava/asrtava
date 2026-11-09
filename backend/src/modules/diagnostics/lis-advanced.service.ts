import { logger } from '../../utils/logger';

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
    return dept;
  }

  public async registerTestParameter(input: ParameterInput): Promise<any> {
    const id = `param-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const param = { id, ...input, isActive: true, createdAt: new Date().toISOString() };
    this.parameters.set(id, param);
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

    return { result, criticalAlert };
  }

  public async validateResultTechnologist(resultId: string, technologistId: string): Promise<any> {
    const res = this.results.get(resultId);
    if (!res) throw new Error('Result not found');
    res.validationStatus = 'TECHNICALLY_VALIDATED';
    res.technologistUserId = technologistId;
    return res;
  }

  public async authorizeReportPathologist(resultId: string, pathologistId: string): Promise<any> {
    const res = this.results.get(resultId);
    if (!res) throw new Error('Result not found');
    res.validationStatus = 'PATHOLOGIST_AUTHORIZED';
    res.pathologistUserId = pathologistId;
    res.authorizedAt = new Date().toISOString();
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
    logger.info('IQC Measurement recorded', { qcId: id, zScore, runStatus });
    return qc;
  }
}

export const lisAdvancedService = new LISAdvancedService();

