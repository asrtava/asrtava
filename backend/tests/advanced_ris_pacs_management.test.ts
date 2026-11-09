import { describe, it } from 'node:test';
import assert from 'node:assert';
import { risAdvancedService } from '../src/modules/diagnostics/ris-advanced.service';

describe('ASRTAVA Advanced RIS / PACS & DICOM Imaging Test Suite', () => {
  const tenantHospitalId = 'hosp-apex-001';
  let registeredModalityId: string;
  let testProcedureId: string;
  let testOrderId: string;
  let testApptId: string;
  let testStudyId: string;
  let testReportId: string;
  let testCriticalFindingId: string;

  // Scenario 1: Modality Registration & C-ECHO
  it('1. Registers imaging modalities with DICOM AE Title, IP, and DICOM Port', async () => {
    const modality = await risAdvancedService.registerModality({
      hospitalId: tenantHospitalId,
      modalityCode: 'MOD-CT-01',
      modalityType: 'CT',
      name: 'Siemens Somatom Force 128-Slice',
      aeTitle: 'SOMATOM_CT1',
      ipAddress: '192.168.10.45',
      portNumber: 104,
      locationRoom: 'Rad-Suite 101',
    });

    assert.ok(modality.id, 'Modality ID generated');
    assert.strictEqual(modality.aeTitle, 'SOMATOM_CT1');
    assert.strictEqual(modality.isActive, true);
    registeredModalityId = modality.id;
  });

  // Scenario 2: Modality Conflict Check
  it('2. Prevents scheduling conflicts on identical modality room and overlapping time slot', async () => {
    const slot1 = await risAdvancedService.scheduleAppointment({
      hospitalId: tenantHospitalId,
      modalityId: registeredModalityId,
      orderId: 'temp-order-1',
      scheduledStart: '2026-11-10T10:00:00Z',
      scheduledEnd: '2026-11-10T10:30:00Z',
      radiographerUserId: 'rad-tech-anil',
    });
    assert.ok(slot1.id, 'First slot booked successfully');
    testApptId = slot1.id;

    await assert.rejects(
      async () => {
        await risAdvancedService.scheduleAppointment({
          hospitalId: tenantHospitalId,
          modalityId: registeredModalityId,
          orderId: 'temp-order-2',
          scheduledStart: '2026-11-10T10:15:00Z',
          scheduledEnd: '2026-11-10T10:45:00Z',
          radiographerUserId: 'rad-tech-meera',
        });
      },
      (err: any) => {
        assert.ok(err.message.includes('MODALITY_SCHEDULE_COLLISION') || err.message.includes('overlaps'), 'Slot collision detected');
        return true;
      }
    );
  });

  // Scenario 3: Radiology Procedure & Order Ingestion
  it('3. Ingests doctor imaging orders with accession number and clinical priority', async () => {
    const procedure = await risAdvancedService.registerProcedure({
      hospitalId: tenantHospitalId,
      procedureCode: 'CT_THORAX_HRCT',
      procedureName: 'High Resolution CT Thorax',
      modalityType: 'CT',
      bodyRegion: 'CHEST',
      contrastRequirement: 'IV_IODINATED',
      expectedDurationMins: 30,
    });
    assert.ok(procedure.id);
    testProcedureId = procedure.id;

    const order = await risAdvancedService.createImagingOrder({
      hospitalId: tenantHospitalId,
      patientId: 'pat-101',
      procedureId: testProcedureId,
      orderingDoctorId: 'doc-sethi-01',
      clinicalIndication: 'Persistent dry cough and dyspnea on exertion for 3 weeks',
      priority: 'STAT',
      requiresContrast: true,
    });

    assert.ok(order.id);
    assert.ok(order.orderNumber.startsWith('RAD-2026-'));
    assert.strictEqual(order.priority, 'STAT');
    testOrderId = order.id;
  });

  // Scenario 4: Safety Screening - eGFR Cleared
  it('4. Records patient pre-procedure renal and contrast safety screening (eGFR Cleared)', async () => {
    const screening = await risAdvancedService.recordPatientScreening({
      hospitalId: tenantHospitalId,
      appointmentId: testApptId,
      patientId: 'pat-101',
      egfrValue: 78,
      isContrastAllergyHistory: false,
      isPacemakerOrFerrousImplant: false,
      isPregnant: false,
      screenedByUserId: 'doc-sethi-01',
    });

    assert.strictEqual(screening.clearanceStatus, 'CLEARED');
    assert.strictEqual(screening.clearedForScan, true);
  });

  // Scenario 5: Renal Impairment Contraindication
  it('5. Flags contraindication and requires nephrology clearance when eGFR < 30 for contrast study', async () => {
    const renalImpairedScreening = await risAdvancedService.recordPatientScreening({
      hospitalId: tenantHospitalId,
      appointmentId: 'temp-appt-renal',
      patientId: 'pat-renal-risk',
      egfrValue: 24, // High risk of Contrast-Induced Nephropathy (CIN)
      isContrastAllergyHistory: false,
      isPacemakerOrFerrousImplant: false,
      isPregnant: false,
      screenedByUserId: 'doc-suresh-01',
    });

    assert.strictEqual(renalImpairedScreening.clearanceStatus, 'REQUIRES_NEPHROLOGY_CLEARANCE');
    assert.strictEqual(renalImpairedScreening.clearedForScan, false);
  });

  // Scenario 6: Pregnancy Protection in Ionizing Radiation
  it('6. Blocks or contraindicates non-emergency ionizing radiation for confirmed pregnancy', async () => {
    const pregnantScreening = await risAdvancedService.recordPatientScreening({
      hospitalId: tenantHospitalId,
      appointmentId: 'temp-appt-pregnant',
      patientId: 'pat-pregnant-01',
      egfrValue: 90,
      isContrastAllergyHistory: false,
      isPacemakerOrFerrousImplant: false,
      isPregnant: true,
      screenedByUserId: 'doc-ananya-01',
    });

    assert.strictEqual(pregnantScreening.clearanceStatus, 'CONTRAINDICATED');
    assert.strictEqual(pregnantScreening.clearedForScan, false);
    assert.ok(pregnantScreening.warnings.some((w: string) => w.includes('Fetal radiation hazard')));
  });

  // Scenario 7: MRI Ferromagnetic Metal Detection
  it('7. Identifies cardiac pacemaker and implant metal as strict MRI hazard', async () => {
    const mriScreening = await risAdvancedService.recordPatientScreening({
      hospitalId: tenantHospitalId,
      appointmentId: 'temp-appt-mri-implant',
      patientId: 'pat-cardiac-implant',
      isPacemakerOrFerrousImplant: true,
      isContrastAllergyHistory: false,
      isPregnant: false,
      screenedByUserId: 'doc-suresh-01',
    });

    assert.strictEqual(mriScreening.clearanceStatus, 'CONTRAINDICATED');
    assert.strictEqual(mriScreening.clearedForScan, false);
  });

  // Scenario 8: DICOM Modality Worklist (MWL) Query
  it('8. Serves DICOM Modality Worklist (MWL) query for scheduled scanner procedures', async () => {
    const mwlEntries = await risAdvancedService.queryModalityWorklist({
      hospitalId: tenantHospitalId,
      modalityAeTitle: 'SOMATOM_CT1',
    });

    assert.ok(Array.isArray(mwlEntries));
    assert.ok(mwlEntries.length >= 1);
    assert.strictEqual(mwlEntries[0].scheduledStationAETitle, 'SOMATOM_CT1');
  });

  // Scenario 9: PACS Study Relational Metadata Indexing
  it('9. Indexes acquired DICOM Study, UID, and links to object store URI without storing raw binary blobs in SQL', async () => {
    const study = await risAdvancedService.indexPACSStudy({
      hospitalId: tenantHospitalId,
      accessionNumber: 'ACC-2026-9041',
      patientId: 'pat-101',
      orderId: testOrderId,
      studyInstanceUid: '1.2.840.113619.2.55.3.2831154.99120',
      studyDate: '2026-11-09',
      studyTime: '10:15:00',
      studyDescription: 'CT Thorax High-Resolution (HRCT)',
      modality: 'CT',
      totalSeries: 4,
      totalInstances: 684,
      storageUri: 'dicom-archive://pacs/ct/2026/11/09/ACC-2026-9041.tar',
    });

    assert.ok(study.id);
    assert.strictEqual(study.studyInstanceUid, '1.2.840.113619.2.55.3.2831154.99120');
    testStudyId = study.id;
  });

  // Scenario 10: Multi-Series and Instance Counting
  it('10. Tracks series count, SOP instance counts, and window/level metadata', async () => {
    const series = await risAdvancedService.recordSeriesAndInstances({
      hospitalId: tenantHospitalId,
      studyId: testStudyId,
      seriesInstanceUid: '1.2.840.113619.2.55.3.2831154.99120.1',
      seriesNumber: 1,
      seriesDescription: 'Axial 1.0mm Lung Window',
      bodyPartExamined: 'CHEST',
      sliceThicknessMm: 1.0,
      windowCenter: -600,
      windowWidth: 1500,
      numberOfInstances: 340,
    });

    assert.ok(series.id);
    assert.strictEqual(series.numberOfInstances, 340);
  });

  // Scenario 11: Structured Report Drafting
  it('11. Radiologist drafts structured radiology report with RadLex categorization', async () => {
    const { report } = await risAdvancedService.createRadiologyReport({
      hospitalId: tenantHospitalId,
      studyId: testStudyId,
      reportingRadiologistId: 'rad-sethi-01',
      techniqueNotes: 'Helical volumetric acquisition without IV contrast from lung apices to bases at 1.0mm slice thickness',
      findings: 'Axial thin-section CT reveals clear bilateral lung parenchyma. No focal consolidation, ground-glass opacities, or pleural effusion. Tracheobronchial tree is patent.',
      impression: 'Normal HRCT study of the thorax. No acute pulmonary parenchymal abnormality.',
    });

    assert.ok(report.id);
    assert.strictEqual(report.reportStatus, 'DRAFT');
    testReportId = report.id;
  });

  // Scenario 12: Digital Signature & Release
  it('12. Digitally signs report, locks content, and releases to ordering doctor EMR', async () => {
    const signed = await risAdvancedService.authorizeReport(testReportId, 'rad-sethi-01');

    assert.strictEqual(signed.reportStatus, 'AUTHORIZED');
    assert.ok(signed.authorizedAt);
    assert.ok(signed.digitalSignatureHash.startsWith('SHA256-RAD-'));
  });

  // Scenario 13: Immutable Audit Trail Protection
  it('13. Blocks direct modification of an authorized radiology report directly', async () => {
    await assert.rejects(
      async () => {
        await risAdvancedService.updateRadiologyReportContent({
          hospitalId: tenantHospitalId,
          reportId: testReportId,
          findings: 'Attempted unauthorized overwrite of finalized report',
        });
      },
      (err: any) => {
        assert.ok(err.message.includes('IMMUTABLE_REPORT_LOCK'), 'Immutable lock verified');
        return true;
      }
    );
  });

  // Scenario 14: Signed Addendum Workflow
  it('14. Appends versioned legal addendum to finalized report with audit trail', async () => {
    const addendum = await risAdvancedService.amendReport(
      testReportId,
      'rad-sethi-01',
      'Comparison performed with prior CT chest from 2024. Stable appearance without interval change.'
    );

    assert.strictEqual(addendum.isAmended, true);
    assert.strictEqual(addendum.reportStatus, 'AMENDED');
    assert.ok(addendum.amendmentReason.includes('Comparison performed'));
  });

  // Scenario 15: Critical Finding Panic Escalation
  it('15. Escalates critical emergency finding with mandatory telephone read-back confirmation', async () => {
    const { criticalAlert } = await risAdvancedService.createRadiologyReport({
      hospitalId: tenantHospitalId,
      studyId: testStudyId,
      reportingRadiologistId: 'rad-sethi-01',
      techniqueNotes: 'STAT Pulmonary Angiography',
      findings: 'Filling defect in right main pulmonary artery.',
      impression: 'Acute massive pulmonary embolism requiring immediate thrombolytic consideration.',
      isCriticalFinding: true,
      criticalCondition: 'Acute massive pulmonary embolism',
    });

    assert.ok(criticalAlert);
    assert.strictEqual(criticalAlert.criticalCondition, 'Acute massive pulmonary embolism');
    assert.strictEqual(criticalAlert.readBackConfirmed, false);
    testCriticalFindingId = criticalAlert.id;

    // Confirm telephone read-back
    const confirmed = await risAdvancedService.confirmCriticalFindingReadBack(testCriticalFindingId, 'Sister Sunita (RN ICU)');
    assert.strictEqual(confirmed.readBackConfirmed, true);
    assert.strictEqual(confirmed.readBackVerifiedBy, 'Sister Sunita (RN ICU)');
  });

  // Scenario 16: Contrast Media Safety Ledger
  it('16. Records contrast media agent, lot number, volume, flow rate, and injection site', async () => {
    const contrastLog = await risAdvancedService.recordContrastAdministration({
      hospitalId: tenantHospitalId,
      appointmentId: testApptId,
      contrastName: 'Iopamidol 370 mg/mL (Isovue-370)',
      batchLotNumber: 'ISO-2026-99201',
      volumeAdministeredMl: 80,
      flowRateMlSec: 4.5,
      injectionSite: 'Right Antecubital Vein 18G',
      administeredByUserId: 'rad-tech-anil',
      adverseReactionObserved: false,
    });

    assert.ok(contrastLog.id);
    assert.strictEqual(contrastLog.contrastName, 'Iopamidol 370 mg/mL (Isovue-370)');
    assert.strictEqual(contrastLog.volumeAdministeredMl, 80);
    assert.strictEqual(contrastLog.adverseReactionObserved, false);
  });
});
