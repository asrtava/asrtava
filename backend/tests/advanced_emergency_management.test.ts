import { describe, it } from 'node:test';
import assert from 'node:assert';
import { emergencyAdvancedService } from '../src/modules/emergency/emergency-advanced.service';

describe('ASRTAVA Advanced Emergency Department, Triage & Ambulance Test Suite', () => {
  const tenantHospitalId = 'hosp-apex-001';
  let testKnownEncounterId: string;
  let testUnknownEncounterId: string;
  let testAmbulanceId: string;
  let testTripId: string;

  // Scenario 1: Standard Emergency Registration
  it('1. Registers identified walk-in emergency encounter with presenting complaint', async () => {
    const enc = await emergencyAdvancedService.registerEmergencyEncounter({
      hospitalId: tenantHospitalId,
      patientId: 'pat-101',
      patientName: 'Kavita Sundaram',
      arrivalMode: 'WALK_IN',
      presentingComplaint: 'Acute retrosternal chest pain radiating to left jaw',
      isMedicoLegal: false,
    });

    assert.ok(enc.id);
    assert.strictEqual(enc.isUnknownIdentity, false);
    assert.strictEqual(enc.status, 'TRIAGING');
    testKnownEncounterId = enc.id;
  });

  // Scenario 2: Unidentified Patient ("John Doe") Temporary UHID
  it('2. Ingests unconscious / unidentified emergency arrival with auto-generated temporary UHID', async () => {
    const unknownEnc = await emergencyAdvancedService.registerEmergencyEncounter({
      hospitalId: tenantHospitalId,
      isUnknownIdentity: true,
      arrivalMode: 'AMBULANCE',
      presentingComplaint: 'High-speed motor vehicle accident polytrauma, unresponsive at scene',
      isMedicoLegal: true,
    });

    assert.ok(unknownEnc.id);
    assert.strictEqual(unknownEnc.isUnknownIdentity, true);
    assert.ok(unknownEnc.temporaryUhid?.startsWith('TEMP-UHID-ED-'));
    assert.strictEqual(unknownEnc.isMedicoLegal, true);
    testUnknownEncounterId = unknownEnc.id;
  });

  // Scenario 3: ESI Level 1 (Red Zone Resuscitation)
  it('3. Automatically calculates ESI Level 1 (Red Zone) for severe coma (GCS 6) and hypoxemia', async () => {
    const triage = await emergencyAdvancedService.performTriage({
      hospitalId: tenantHospitalId,
      encounterId: testUnknownEncounterId,
      triagedByUserId: 'nurse-triage-senior',
      heartRate: 138,
      systolicBp: 78,
      diastolicBp: 42,
      respiratoryRate: 32,
      spo2Percent: 84, // Severe hypoxemia
      gcsScore: 6, // Severe coma
    });

    assert.strictEqual(triage.esiLevel, 1);
    assert.strictEqual(triage.assignedZone, 'RED_RESUS');
  });

  // Scenario 4: ESI Level 2 (Yellow Zone Emergent)
  it('4. Calculates ESI Level 2 (Yellow Zone Emergent) for severe cardiac chest pain and diaphoresis', async () => {
    const triage = await emergencyAdvancedService.performTriage({
      hospitalId: tenantHospitalId,
      encounterId: testKnownEncounterId,
      triagedByUserId: 'nurse-triage-senior',
      heartRate: 96,
      systolicBp: 154,
      diastolicBp: 92,
      respiratoryRate: 20,
      spo2Percent: 95,
      gcsScore: 15,
      painScore: 9, // Severe 9/10 chest pain
    });

    assert.strictEqual(triage.esiLevel, 2);
    assert.strictEqual(triage.assignedZone, 'YELLOW_ACUTE');
  });

  // Scenario 5: ESI Level 4 (Green Zone Fast-Track)
  it('5. Assigns ESI Level 4 (Green Zone) for hemodynamically stable minor extremity trauma', async () => {
    const minorEnc = await emergencyAdvancedService.registerEmergencyEncounter({
      hospitalId: tenantHospitalId,
      patientId: 'pat-105',
      patientName: 'Arjun Mehta',
      arrivalMode: 'WALK_IN',
      presentingComplaint: 'Closed Colles wrist fracture, neurovascularly intact',
    });

    const triage = await emergencyAdvancedService.performTriage({
      hospitalId: tenantHospitalId,
      encounterId: minorEnc.id,
      triagedByUserId: 'nurse-triage-fasttrack',
      esiLevel: 4,
      heartRate: 78,
      systolicBp: 122,
      diastolicBp: 80,
      respiratoryRate: 16,
      spo2Percent: 99,
      gcsScore: 15,
      painScore: 4,
    });

    assert.strictEqual(triage.esiLevel, 4);
    assert.strictEqual(triage.assignedZone, 'GREEN_FAST_TRACK');
  });

  // Scenario 6: Trauma Team Activation Broadcast (Code Red)
  it('6. Broadcasts Code Red Trauma Team activation with rapid emergency team assembly', async () => {
    const activation = await emergencyAdvancedService.activateTraumaTeam({
      hospitalId: tenantHospitalId,
      encounterId: testUnknownEncounterId,
      activationType: 'TRAUMA_TEAM_CODE_RED',
      teamLeaderId: 'doc-trauma-leader-sethi',
    });

    assert.ok(activation.id);
    assert.strictEqual(activation.activationType, 'TRAUMA_TEAM_CODE_RED');
    assert.ok(activation.responseTimeSeconds <= 60);
  });

  // Scenario 7: ATLS Primary Survey Checklist
  it('7. Documents ATLS primary survey (Airway, Breathing, Circulation, Disability, Exposure)', async () => {
    const survey = await emergencyAdvancedService.recordResuscitationChecklist({
      hospitalId: tenantHospitalId,
      encounterId: testUnknownEncounterId,
      airwayStatus: 'INTUBATED_ETT',
      cSpineImmobilized: true,
      breathingStatus: 'TACHYPNEIC',
      bilateralBreathSounds: false, // Right hemithorax dull
      circulationPulse: 'WEAK_THREADY',
      ivAccessGauge: 'TWO_LARGE_BORE_16G',
      disabilityGcs: 6,
      fastScanPositive: true,
      massiveTransfusionActivated: true,
    });

    assert.ok(survey.id);
    assert.strictEqual(survey.airwayStatus, 'INTUBATED_ETT');
    assert.strictEqual(survey.fastScanPositive, true);
    assert.strictEqual(survey.massiveTransfusionActivated, true);
  });

  // Scenario 8: Massive Transfusion Protocol (MTP) Activation
  it('8. Activates Massive Transfusion Protocol (MTP) with emergency uncrossmatched blood release', async () => {
    const bloodOrder = await emergencyAdvancedService.placeStatEmergencyOrder({
      hospitalId: tenantHospitalId,
      encounterId: testUnknownEncounterId,
      orderType: 'BLOOD_CROSSMATCH_STAT',
      orderDetails: 'MTP Pack 1: 4 Units O-Negative Uncrossmatched PRBCs + 4 Units FFP',
      orderedByUserId: 'doc-trauma-leader-sethi',
      clinicalOverrideReason: 'Severe Exsanguinating Hemorrhagic Shock - Immediate Life Threat',
    });

    assert.ok(bloodOrder.id);
    assert.strictEqual(bloodOrder.isStatOverride, true);
    assert.strictEqual(bloodOrder.orderStatus, 'DISPATCHED_TO_DEPARTMENT');
  });

  // Scenario 9: STAT Diagnostic Imaging Emergency Override
  it('9. Places STAT CT Polytrauma imaging order bypassing cashier billing gate', async () => {
    const imagingOrder = await emergencyAdvancedService.placeStatEmergencyOrder({
      hospitalId: tenantHospitalId,
      encounterId: testUnknownEncounterId,
      orderType: 'IMAGING_STAT',
      orderDetails: 'STAT Whole Body Polytrauma CT: Head, C-Spine, Chest, Abdomen & Pelvis',
      orderedByUserId: 'doc-trauma-leader-sethi',
    });

    assert.ok(imagingOrder.id);
    assert.strictEqual(imagingOrder.isStatOverride, true);
    assert.ok(imagingOrder.clinicalOverrideReason.includes('Cashier Clearance Bypassed'));
  });

  // Scenario 10: STAT Laboratory Emergency Override
  it('10. Places STAT Emergency ABG, Troponin, and Coagulation profile bypassing billing', async () => {
    const labOrder = await emergencyAdvancedService.placeStatEmergencyOrder({
      hospitalId: tenantHospitalId,
      encounterId: testKnownEncounterId,
      orderType: 'LAB_STAT',
      orderDetails: 'STAT Arterial Blood Gas (ABG), High-Sensitivity Troponin-I, Lactate, CBC, PT/INR',
      orderedByUserId: 'doc-emergency-physician',
    });

    assert.ok(labOrder.id);
    assert.strictEqual(labOrder.isStatOverride, true);
  });

  // Scenario 11: STAT Resuscitation Pharmacy Override
  it('11. Dispenses emergency inotropes and Tranexamic Acid (TXA) without billing holds', async () => {
    const pharmacyOrder = await emergencyAdvancedService.placeStatEmergencyOrder({
      hospitalId: tenantHospitalId,
      encounterId: testUnknownEncounterId,
      orderType: 'PHARMACY_STAT',
      orderDetails: 'Tranexamic Acid (TXA) 1g IV bolus + Norepinephrine infusion 0.1 mcg/kg/min',
      orderedByUserId: 'doc-trauma-leader-sethi',
    });

    assert.ok(pharmacyOrder.id);
    assert.strictEqual(pharmacyOrder.isStatOverride, true);
  });

  // Scenario 12: Medico-Legal Case (MLC) Registration & Police Intimation
  it('12. Documents Medico-Legal Case (MLC) with injury description and police intimation details', async () => {
    const mlc = await emergencyAdvancedService.registerMedicoLegalCase({
      hospitalId: tenantHospitalId,
      encounterId: testUnknownEncounterId,
      incidentType: 'RTA_ROAD_TRAFFIC_ACCIDENT',
      injuryDescription: 'Blunt thoracic trauma, open femur fracture, multiple lacerations secondary to two-wheeler vs truck collision',
      policeStationName: 'Shivaji Nagar Police Station',
      policeIntimationNumber: 'INTIM-2026-8812',
      policeConstableName: 'HC S. Jadhav (Badge #4812)',
    });

    assert.ok(mlc.id);
    assert.ok(mlc.mlcNumber.startsWith('MLC-2026-'));
    assert.strictEqual(mlc.incidentType, 'RTA_ROAD_TRAFFIC_ACCIDENT');
  });

  // Scenario 13: Ambulance Fleet Registration
  it('13. Registers Advanced Life Support (ALS) emergency ambulance unit with telemetry', async () => {
    const amb = await emergencyAdvancedService.registerAmbulance({
      hospitalId: tenantHospitalId,
      vehicleNumber: 'MH-12-ED-1081',
      ambulanceType: 'ALS_ADVANCED_LIFE_SUPPORT',
      driverName: 'Mahesh Patil',
      paramedicName: 'Paramedic Rahul Sharma',
    });

    assert.ok(amb.id);
    assert.strictEqual(amb.status, 'AVAILABLE');
    assert.ok(amb.gpsLatitude);
    testAmbulanceId = amb.id;
  });

  // Scenario 14: Emergency Ambulance Dispatch
  it('14. Dispatches emergency ambulance in response to 108/911 emergency call', async () => {
    const dispatch = await emergencyAdvancedService.dispatchAmbulance({
      hospitalId: tenantHospitalId,
      ambulanceId: testAmbulanceId,
      callerName: 'Sunil Gavaskar (Eyewitness)',
      callerPhone: '+91 98220 11223',
      pickupLocation: 'Western Express Highway Mile Marker 42, Pune',
      patientName: 'Pedestrian Hit-and-Run Victim',
    });

    assert.ok(dispatch.trip.id);
    assert.strictEqual(dispatch.ambulance.status, 'DISPATCHED');
    testTripId = dispatch.trip.id;
  });

  // Scenario 15: Mobile Pre-Hospital Care Report (Mobile PCR) Handover
  it('15. Transmits mobile paramedic pre-hospital care report (PCR) to emergency receiving room', async () => {
    const pcr = await emergencyAdvancedService.transmitMobilePcr({
      hospitalId: tenantHospitalId,
      tripId: testTripId,
      paramedicUserId: 'paramedic-rahul-sharma',
      chiefComplaint: 'Pedestrian struck by heavy vehicle, bilateral lower limb deformities, pale & clammy',
      initialVitals: {
        heartRate: 124,
        bloodPressure: '88/54',
        spo2Percent: 91,
        gcs: 11,
      },
      administeredPrehospitalDrugs: [
        { drug: 'Normal Saline IV 0.9%', dose: '1000 mL bolus', time: '10:18 AM' },
        { drug: 'Fentanyl IV', dose: '50 mcg', time: '10:22 AM' },
      ],
    });

    assert.ok(pcr.id);
    assert.strictEqual(pcr.chiefComplaint.includes('Pedestrian struck'), true);
    assert.ok(pcr.transmissionToEdTimestamp);
  });

  // Scenario 16: Emergency Final Disposition
  it('16. Finalizes acute emergency disposition and coordinates immediate transfer to Emergency OT', async () => {
    const disp = await emergencyAdvancedService.recordDisposition({
      hospitalId: tenantHospitalId,
      encounterId: testUnknownEncounterId,
      dispositionType: 'EMERGENCY_OT',
      destinationUnit: 'OT-Suite 4 (Emergency)',
      authorizedByDoctorId: 'doc-trauma-leader-sethi',
      dischargeSummary: 'Emergency exploratory laparotomy for splenic laceration & hemothorax with intercostal drain',
    });

    assert.ok(disp.id);
    assert.strictEqual(disp.dispositionType, 'EMERGENCY_OT');
    assert.strictEqual(disp.destinationUnit, 'OT-Suite 4 (Emergency)');
  });
});

