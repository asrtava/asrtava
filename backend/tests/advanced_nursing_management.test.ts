import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { nursingAdvancedService } from '../src/modules/nursing/nursing-advanced.service';

describe('ASRTAVA Advanced Nursing Management, Patient Monitoring & eMAR (Milestone v1.9.0)', () => {
  const hospitalId = 'hosp-delhi-01';
  const nurseAlphaId = 'nurse-alpha-001';
  const nurseBetaId = 'nurse-beta-002';
  const supervisorId = 'nurse-sup-010';
  const patientId = 'pat-icu-900';
  const admissionId = 'adm-cardiac-101';

  let createdAssignmentId = '';
  let activeAlertId = '';
  let activeOrderId = 'dr-ord-505';
  let activeSbarId = '';

  it('Scenario 1: Assigns nurse to patient and calculates nurse workload acuity score', async () => {
    const assignment = await nursingAdvancedService.assignNurseToPatient({
      hospitalId,
      wardId: 'ward-icu-01',
      bedId: 'bed-icu-04',
      admissionId,
      patientId,
      nurseUserId: nurseAlphaId,
      assignedByUserId: supervisorId,
      assignmentRole: 'PRIMARY',
      acuityLevel: 'CRITICAL',
    });

    assert.ok(assignment.id);
    assert.equal(assignment.nurseUserId, nurseAlphaId);
    assert.equal(assignment.acuityLevel, 'CRITICAL');
    assert.equal(assignment.isActive, true);
    createdAssignmentId = assignment.id;

    // Verify workload calculation
    const workload = await nursingAdvancedService.getAssignedWorkload(hospitalId, nurseAlphaId);
    assert.equal(workload.assignedPatientCount, 1);
    assert.equal(workload.totalAcuityScore, 5); // CRITICAL has weight 5
  });

  it('Scenario 2: Reassigns patient and archives previous assignment with documented reason', async () => {
    const result = await nursingAdvancedService.reassignPatient(
      createdAssignmentId,
      nurseBetaId,
      'Staff rotation for emergency trauma resuscitation'
    );

    assert.equal(result.previousAssignment.isActive, false);
    assert.equal(result.previousAssignment.reassignmentReason, 'Staff rotation for emergency trauma resuscitation');
    assert.equal(result.newAssignment.nurseUserId, nurseBetaId);
    assert.equal(result.newAssignment.isActive, true);
  });

  it('Scenario 3: Calculates NEWS2 score correctly for normal parameters (Score 0, LOW risk)', () => {
    const normalVitals = {
      hospitalId,
      admissionId,
      patientId,
      recordedByNurseId: nurseBetaId,
      systolicBp: 120,
      diastolicBp: 80,
      heartRate: 72,
      respiratoryRate: 16,
      temperatureCelsius: 36.8,
      spo2Percent: 98,
      isSupplementalO2: false,
      consciousnessLevel: 'ALERT' as const,
    };

    const result = nursingAdvancedService.calculateNEWS2Score(normalVitals);
    assert.equal(result.score, 0);
    assert.equal(result.risk, 'LOW');
  });

  it('Scenario 4: Calculates NEWS2 score for severe physiological deterioration (Score >= 7, HIGH risk) and triggers emergency alert', async () => {
    const severeVitals = {
      hospitalId,
      admissionId,
      patientId,
      recordedByNurseId: nurseBetaId,
      systolicBp: 85, // Score 3
      diastolicBp: 50,
      heartRate: 135, // Score 3
      respiratoryRate: 26, // Score 3
      temperatureCelsius: 39.2, // Score 2
      spo2Percent: 89, // Score 3
      isSupplementalO2: true, // Score 2
      consciousnessLevel: 'VOICE' as const, // Score 3
    };

    const res = await nursingAdvancedService.recordVitalSigns(severeVitals);
    assert.ok(res.vitalRecord.news2Score >= 7);
    assert.equal(res.vitalRecord.news2RiskCategory, 'HIGH');
    assert.equal(res.vitalRecord.monitoringFrequencyMinutes, 15); // Q15M frequency
    assert.ok(res.alert);
    assert.equal(res.alert.alertSeverity, 'EMERGENCY_MET');
    activeAlertId = res.alert.id;
  });

  it('Scenario 5: Acknowledges vital observation alert with nurse action notes', async () => {
    const ack = await nursingAdvancedService.acknowledgeVitalAlert(
      activeAlertId,
      nurseBetaId,
      'MET team activated; 100% Non-rebreather mask applied, IV fluid bolus running'
    );
    assert.equal(ack.acknowledgedByUserId, nurseBetaId);
    assert.ok(ack.acknowledgedAt);
    assert.ok(ack.actionTakenNotes.includes('MET team activated'));
  });

  it('Scenario 6: Records Braden scale assessment, categorizes pressure injury risk, and auto-generates care interventions', async () => {
    const assessment = await nursingAdvancedService.recordStructuredAssessment({
      hospitalId,
      admissionId,
      patientId,
      templateCode: 'BRADEN_SCALE',
      assessedByNurseId: nurseBetaId,
      assessmentData: {
        sensory: 2,
        moisture: 2,
        activity: 1,
        mobility: 2,
        nutrition: 2,
        friction: 1,
      }, // Total = 10 (High Risk <= 12)
    });

    assert.equal(assessment.calculatedScore, 10);
    assert.equal(assessment.riskTier, 'HIGH');
    assert.ok(assessment.recommendedInterventions.length >= 2);
    assert.ok(assessment.recommendedInterventions.includes('Q2H turning schedule'));
  });

  it('Scenario 7: Records Morse Fall Scale assessment and flags high fall-risk (Score >= 45)', async () => {
    const assessment = await nursingAdvancedService.recordStructuredAssessment({
      hospitalId,
      admissionId,
      patientId,
      templateCode: 'MORSE_FALL',
      assessedByNurseId: nurseBetaId,
      assessmentData: {
        fallHistory: 25,
        secondaryDiagnosis: 15,
        ambulatoryAid: 15,
        ivTherapy: 20,
        gait: 10,
        mentalStatus: 0,
      }, // Total = 85 (High Risk >= 45)
    });

    assert.equal(assessment.calculatedScore, 85);
    assert.equal(assessment.riskTier, 'HIGH');
    assert.ok(assessment.recommendedInterventions.includes('Yellow fall-risk wristband'));
  });

  it('Scenario 8: Bedside eMAR administration validates standard medication pass', async () => {
    const record = await nursingAdvancedService.administerMedicationEMAR({
      hospitalId,
      admissionId,
      patientId,
      drugId: 'drug-amox-500',
      scheduledTime: new Date().toISOString(),
      administrationStatus: 'ADMINISTERED',
      administeringNurseId: nurseBetaId,
      doseAdministered: '500 mg',
      routeUsed: 'ORAL',
      siteOfAdministration: 'Oral with water',
      isHighAlertOrNarcotic: false,
    });

    assert.ok(record.id);
    assert.equal(record.administrationStatus, 'ADMINISTERED');
    assert.ok(record.actualAdminTime);
  });

  it('Scenario 9: Strictly blocks single-nurse administration of High-Alert / Narcotic medication without cosign', async () => {
    await assert.rejects(
      async () => {
        await nursingAdvancedService.administerMedicationEMAR({
          hospitalId,
          admissionId,
          patientId,
          drugId: 'drug-insulin-regular',
          scheduledTime: new Date().toISOString(),
          administrationStatus: 'ADMINISTERED',
          administeringNurseId: nurseBetaId,
          doseAdministered: '10 Units',
          routeUsed: 'SUBCUTANEOUS',
          isHighAlertOrNarcotic: true,
          // Missing cosigningNurseId
        });
      },
      (err: any) => {
        assert.ok(err.message.includes('DUAL_COSIGN_REQUIRED'));
        return true;
      }
    );
  });

  it('Scenario 10: Rejects self-cosigning on High-Alert medication (administeringNurseId === cosigningNurseId)', async () => {
    await assert.rejects(
      async () => {
        await nursingAdvancedService.administerMedicationEMAR({
          hospitalId,
          admissionId,
          patientId,
          drugId: 'drug-fentanyl-amp',
          scheduledTime: new Date().toISOString(),
          administrationStatus: 'ADMINISTERED',
          administeringNurseId: nurseBetaId,
          cosigningNurseId: nurseBetaId, // Self-cosign violation!
          doseAdministered: '50 mcg',
          routeUsed: 'INTRAVENOUS',
          isHighAlertOrNarcotic: true,
        });
      },
      (err: any) => {
        assert.ok(err.message.includes('CO_SIGN_IDENTITY_ERROR'));
        return true;
      }
    );
  });

  it('Scenario 11: Requires documented omission reason when medication is Omitted or Refused', async () => {
    await assert.rejects(
      async () => {
        await nursingAdvancedService.administerMedicationEMAR({
          hospitalId,
          admissionId,
          patientId,
          drugId: 'drug-metoprolol-50',
          scheduledTime: new Date().toISOString(),
          administrationStatus: 'HELD',
          administeringNurseId: nurseBetaId,
          doseAdministered: '50 mg',
          routeUsed: 'ORAL',
          // Missing omissionReason
        });
      },
      (err: any) => {
        assert.ok(err.message.includes('OMISSION_REASON_REQUIRED'));
        return true;
      }
    );

    // Should succeed with documented clinical reason
    const validHold = await nursingAdvancedService.administerMedicationEMAR({
      hospitalId,
      admissionId,
      patientId,
      drugId: 'drug-metoprolol-50',
      scheduledTime: new Date().toISOString(),
      administrationStatus: 'HELD',
      omissionReason: 'Heart rate 48 bpm (Hold if HR < 55 per doctor order)',
      administeringNurseId: nurseBetaId,
      doseAdministered: '50 mg',
      routeUsed: 'ORAL',
    });
    assert.equal(validHold.administrationStatus, 'HELD');
    assert.ok(validHold.omissionReason.includes('Heart rate 48 bpm'));
  });

  it('Scenario 12: Acknowledges and completes doctor order execution', async () => {
    const ack = await nursingAdvancedService.acknowledgeDoctorOrder(activeOrderId, nurseBetaId, 'Reviewed order for bedside 12-lead ECG');
    assert.equal(ack.executionStatus, 'ACKNOWLEDGED');

    const completed = await nursingAdvancedService.completeDoctorOrder(activeOrderId, nurseBetaId, '12-lead ECG completed, normal sinus rhythm with ST elevation in V1-V3, shown to Dr. Anand');
    assert.equal(completed.executionStatus, 'COMPLETED');
    assert.ok(completed.completedAt);
  });

  it('Scenario 13: Creates individualized nursing care plan with measurable goals and interventions', async () => {
    const carePlan = await nursingAdvancedService.createCarePlan({
      hospitalId,
      admissionId,
      patientId,
      nursingDiagnosis: 'Impaired Gas Exchange r/t alveolar-capillary membrane changes',
      measurableGoals: 'Patient will maintain SpO2 >= 95% on room air within 48 hours',
      plannedInterventions: [
        'Maintain semi-Fowlers positioning',
        'Administer supplemental oxygen via nasal cannula at 2L/min',
        'Continuous pulse oximetry monitoring',
        'Encourage deep breathing and incentive spirometry Q2H',
      ],
      createdByNurseId: nurseBetaId,
    });

    assert.ok(carePlan.id);
    assert.equal(carePlan.status, 'ACTIVE');
    assert.equal(carePlan.plannedInterventions.length, 4);
  });

  it('Scenario 14: Calculates shift fluid balance (Net = Intake - Output)', async () => {
    const balance = await nursingAdvancedService.recordFluidBalance({
      hospitalId,
      admissionId,
      patientId,
      recordedByNurseId: nurseBetaId,
      oralIntakeMl: 500,
      ivFluidIntakeMl: 1000,
      enteralIntakeMl: 250,
      bloodProductsIntakeMl: 0, // Total Intake = 1750
      urineOutputMl: 1200,
      surgicalDrainOutputMl: 150,
      vomitusOutputMl: 50,
      bloodLossOutputMl: 0, // Total Output = 1400
    });

    assert.equal(balance.totalIntakeMl, 1750);
    assert.equal(balance.totalOutputMl, 1400);
    assert.equal(balance.netBalanceMl, 350); // Net positive 350 mL
  });

  it('Scenario 15: Records wound care assessment, staging, dimensions, and dressing regimen', async () => {
    const wound = await nursingAdvancedService.recordWoundAssessment({
      hospitalId,
      admissionId,
      patientId,
      assessedByNurseId: nurseBetaId,
      woundIdentifier: 'WOUND-01-SACRUM',
      anatomicalLocation: 'Sacrum / Coccyx',
      woundStaging: 'STAGE_II',
      lengthCm: 3.5,
      widthCm: 2.0,
      depthCm: 0.3,
      granulationPercent: 70,
      sloughPercent: 30,
      dressingTypeApplied: 'Hydrocolloid border dressing',
      nextChangeDueHours: 48,
    });

    assert.ok(wound.id);
    assert.equal(wound.surfaceAreaSqCm, 7.0);
    assert.equal(wound.woundStaging, 'STAGE_II');
    assert.ok(wound.nextChangeDue);
  });

  it('Scenario 16: Submits SBAR handover and enforces recipient countersignature', async () => {
    const handover = await nursingAdvancedService.submitSBARHandover({
      hospitalId,
      wardId: 'ward-icu-01',
      outgoingNurseId: nurseBetaId,
      incomingNurseId: nurseAlphaId,
      censusOccupiedBeds: 12,
      censusVacantBeds: 2,
      situationSummary: 'Bed 4: Post-PCI Stent day 1, chest pain free, vitals stable',
      backgroundSummary: 'History of CAD, NIDDM, HTN, admitted through Emergency',
      assessmentSummary: 'NEWS2 score 2, puncture site soft and dry, bilateral pedal pulses palpable',
      recommendationsSummary: 'Repeat lipid panel in AM, mobilize to bedside chair in evening',
    });

    assert.ok(handover.id);
    assert.equal(handover.status, 'SUBMITTED');
    activeSbarId = handover.id;

    // Incoming nurse countersigns
    const acknowledged = await nursingAdvancedService.acknowledgeSBARHandover(activeSbarId, nurseAlphaId);
    assert.equal(acknowledged.status, 'ACKNOWLEDGED_SIGNED');
    assert.ok(acknowledged.incomingAcknowledgedAt);
  });
});

