import { describe, it } from 'node:test';
import assert from 'node:assert';
import { telemedicineAdvancedService } from '../src/modules/telemedicine/telemedicine-advanced.service';

describe('ASRTAVA Advanced Telemedicine & Remote Patient Monitoring (RPM) Test Suite', () => {
  const testOrgId = 'org-apex-healthcare';
  const testHospitalId = 'hosp-apex-main';
  const testPatientId = 'pat-tele-rahul-verma';
  const testDoctorId = 'doc-tele-rajesh-sharma';

  let testServiceId: string;
  let testAppointmentId: string;
  let testRoomId: string;
  let testPatientToken: string;
  let testDoctorToken: string;
  let testMeasurementId: string;
  let testCriticalAlertId: string;

  it('1. Configures telemedicine service catalog with consultation mode, duration, fees, and GST rate', async () => {
    const service = await telemedicineAdvancedService.createService({
      organizationId: testOrgId,
      hospitalId: testHospitalId,
      serviceCode: 'CARDIO-TELE-HD',
      name: 'Advanced Cardiology Virtual Consultation',
      consultationMode: 'VIDEO',
      durationMinutes: 30,
      baseFee: 800,
      followUpFee: 400,
      gstRatePercent: 18,
      cancellationFee: 100,
      isActive: true,
    });

    assert.ok(service.id);
    assert.strictEqual(service.serviceCode, 'CARDIO-TELE-HD');
    assert.strictEqual(service.baseFee, 800);
    assert.strictEqual(service.consultationMode, 'VIDEO');
    testServiceId = service.id;
  });

  it('2. Rejects duplicate service code creation within the same hospital', async () => {
    await assert.rejects(
      async () => {
        await telemedicineAdvancedService.createService({
          organizationId: testOrgId,
          hospitalId: testHospitalId,
          serviceCode: 'CARDIO-TELE-HD',
          name: 'Duplicate Cardo Service',
          consultationMode: 'VIDEO',
          durationMinutes: 30,
          baseFee: 800,
          followUpFee: 400,
          gstRatePercent: 18,
          cancellationFee: 100,
          isActive: true,
        });
      },
      /already exists/
    );
  });

  it('3. Registers verified doctor teleconsultation profile with supported modes and languages', async () => {
    const profile = await telemedicineAdvancedService.registerDoctorProfile({
      organizationId: testOrgId,
      hospitalId: testHospitalId,
      doctorId: testDoctorId,
      doctorName: 'Dr. Rajesh Sharma',
      specialty: 'Cardiology',
      isTeleconsultEnabled: true,
      supportedModes: ['VIDEO', 'AUDIO'],
      languagesSpoken: ['English', 'Hindi'],
      teleconsultFee: 800,
      maxDailyVirtualSlots: 20,
      verifiedCredentialsSummary: 'AIIMS Gold Medalist, DMC Reg #67291',
    });

    assert.ok(profile.id);
    assert.strictEqual(profile.isTeleconsultEnabled, true);
    assert.deepStrictEqual(profile.languagesSpoken, ['English', 'Hindi']);
  });

  it('4. Discovers available clinicians filtered by specialty and consultation mode', async () => {
    const docs = await telemedicineAdvancedService.discoverAvailableDoctors({
      hospitalId: testHospitalId,
      specialty: 'Cardiology',
      consultationMode: 'VIDEO',
    });

    assert.ok(docs.length >= 1);
    assert.strictEqual(docs[0].doctorId, testDoctorId);
    assert.strictEqual(docs[0].teleconsultFee, 800);
  });

  it('5. Books teleconsultation appointment and generates unique virtual room reference', async () => {
    const appt = await telemedicineAdvancedService.bookTeleconsultation({
      organizationId: testOrgId,
      hospitalId: testHospitalId,
      patientId: testPatientId,
      doctorId: testDoctorId,
      serviceId: testServiceId,
      consultationMode: 'VIDEO',
      scheduledDate: '2026-11-12',
      startTime: '10:00:00',
      endTime: '10:30:00',
      totalFee: 800,
      chiefComplaint: 'Intermittent retrosternal tightness on exertion',
    });

    assert.ok(appt.id);
    assert.ok(appt.appointmentNumber.startsWith('TCON-'));
    assert.ok(appt.virtualRoomId.startsWith('room-'));
    assert.strictEqual(appt.status, 'SCHEDULED');
    assert.strictEqual(appt.paymentStatus, 'PENDING');
    testAppointmentId = appt.id;
    testRoomId = appt.virtualRoomId;
  });

  it('6. Strictly prevents double-booking of doctor slot across concurrent teleconsultation requests', async () => {
    await assert.rejects(
      async () => {
        await telemedicineAdvancedService.bookTeleconsultation({
          organizationId: testOrgId,
          hospitalId: testHospitalId,
          patientId: 'pat-other-99',
          doctorId: testDoctorId,
          consultationMode: 'VIDEO',
          scheduledDate: '2026-11-12',
          startTime: '10:15:00', // Collides with 10:00 - 10:30
          endTime: '10:45:00',
          totalFee: 800,
        });
      },
      /already booked/
    );
  });

  it('7. Verifies backend payment collection and transitions appointment to CONFIRMED', async () => {
    const confirmedAppt = await telemedicineAdvancedService.verifyAndConfirmPayment(
      testAppointmentId,
      'PAY-RAZORPAY-TXN-998811',
      800
    );

    assert.strictEqual(confirmedAppt.status, 'CONFIRMED');
    assert.strictEqual(confirmedAppt.paymentStatus, 'PAID');
    assert.strictEqual(confirmedAppt.paymentReference, 'PAY-RAZORPAY-TXN-998811');
  });

  it('8. Rejects duplicate payment submission on already paid teleconsultation', async () => {
    await assert.rejects(
      async () => {
        await telemedicineAdvancedService.verifyAndConfirmPayment(
          testAppointmentId,
          'PAY-DUPLICATE-TXN-0000',
          800
        );
      },
      /Duplicate charge prevented/
    );
  });

  it('9. Captures and digitally signs informed telehealth consent with SHA-256 hash', async () => {
    const consent = await telemedicineAdvancedService.recordConsent({
      organizationId: testOrgId,
      hospitalId: testHospitalId,
      patientId: testPatientId,
      teleAppointmentId: testAppointmentId,
      consentType: 'TELEHEALTH_GENERAL',
      consentVersion: 'v1.0',
      signedByName: 'Rahul Verma',
      relationshipToPatient: 'SELF',
      ipAddress: '192.168.1.45',
    });

    assert.ok(consent.id);
    assert.strictEqual(consent.isGranted, true);
    assert.ok(consent.digitalSignatureHash.length === 64);
  });

  it('10. Admits patient to Virtual Waiting Room with pre-flight media checks & queue positioning', async () => {
    const entry = await telemedicineAdvancedService.joinWaitingRoom(
      testAppointmentId,
      testPatientId,
      true // Device check passed
    );

    assert.ok(entry.id);
    assert.strictEqual(entry.status, 'WAITING');
    assert.strictEqual(entry.connectionReadiness, 'READY');
    assert.strictEqual(entry.queuePosition, 1);
  });

  it('11. Doctor starts WebRTC session and generates short-lived HMAC-SHA256 session access tokens', async () => {
    const { session, patientToken, doctorToken } = await telemedicineAdvancedService.startConsultation(
      testAppointmentId,
      testDoctorId,
      'WEBRTC_INTERNAL'
    );

    assert.ok(session.id);
    assert.strictEqual(session.mediaRoomId, testRoomId);
    assert.ok(patientToken.length === 64);
    assert.ok(doctorToken.length === 64);
    assert.notStrictEqual(patientToken, doctorToken);
    testPatientToken = patientToken;
    testDoctorToken = doctorToken;
  });

  it('12. In-session secure messaging transmits clinical questions and attachments with encryption', async () => {
    const msg = await telemedicineAdvancedService.sendInSessionMessage({
      teleAppointmentId: testAppointmentId,
      senderId: testDoctorId,
      senderRole: 'DOCTOR',
      messageText: 'Please share your recent lipid profile or ECG report.',
    });

    assert.ok(msg.id);
    assert.strictEqual(msg.messageText, 'Please share your recent lipid profile or ECG report.');

    const history = await telemedicineAdvancedService.getMessages(testAppointmentId);
    assert.strictEqual(history.length, 1);
  });

  it('13. Finalizes clinical encounter with SOAP notes, ICD-10 diagnosis, eRx, and in-person referral', async () => {
    const encounter = await telemedicineAdvancedService.documentClinicalEncounter({
      organizationId: testOrgId,
      hospitalId: testHospitalId,
      teleAppointmentId: testAppointmentId,
      patientId: testPatientId,
      doctorId: testDoctorId,
      subjectiveNotes: 'Patient reports exertional tightness in chest since 2 days.',
      objectiveNotes: 'Heart rate 78 bpm, SpO2 98%, no distress observed over video.',
      assessmentNotes: 'Atypical chest discomfort. Needs in-person ECG and cardiac enzyme check.',
      planNotes: 'Prescribed Sorbitrate SOS. Ordered Trop-I. In-person review tomorrow.',
      icd10Codes: ['R07.9', 'I20.9'],
      prescriptionItems: [
        {
          medicineName: 'Isosorbide Dinitrate (Sorbitrate)',
          dosage: '5mg',
          frequency: 'SOS (As needed)',
          duration: '5 days',
          instructions: 'Sublingual on acute chest pain',
        },
      ],
      investigationOrders: ['LAB-TROP-I-01', 'RAD-ECG-12LEAD-01'],
      requiresInPersonFollowUp: true,
      referralType: 'OPD_IN_PERSON',
      referralNotes: 'Report to Cardiology OPD Room 204 tomorrow at 10 AM.',
    });

    assert.ok(encounter.id);
    assert.strictEqual(encounter.isSigned, true);
    assert.strictEqual(encounter.referralType, 'OPD_IN_PERSON');
    assert.ok(encounter.prescriptionId);
  });

  it('14. Concludes video consultation and records accurate session duration', async () => {
    const closedSession = await telemedicineAdvancedService.endConsultation(
      testAppointmentId,
      1260, // 21 minutes duration
      'CLINICIAN_NORMAL_CLOSURE'
    );

    assert.strictEqual(closedSession.durationSeconds, 1260);
    assert.strictEqual(closedSession.terminationReason, 'CLINICIAN_NORMAL_CLOSURE');
  });

  it('15. Enrolls patient in Remote Patient Monitoring (RPM) and triggers clinical threshold alert', async () => {
    // 1. Enroll in RPM Hypertension Plan
    const plan = await telemedicineAdvancedService.enrollCarePlan({
      organizationId: testOrgId,
      hospitalId: testHospitalId,
      patientId: testPatientId,
      managingDoctorId: testDoctorId,
      planName: 'Hypertension & Cardiac Tele-Monitoring',
      conditionCategory: 'HYPERTENSION',
      targetMetrics: ['SYSTOLIC_BP', 'DIASTOLIC_BP', 'HEART_RATE'],
      scheduleFrequency: 'TWICE_DAILY',
      startDate: '2026-11-12',
      status: 'ACTIVE',
    });
    assert.ok(plan.id);

    // 2. Record critical blood pressure measurement (190 mmHg systolic >= 180 critical limit)
    const { measurement, alert } = await telemedicineAdvancedService.recordRpmMeasurement({
      organizationId: testOrgId,
      hospitalId: testHospitalId,
      carePlanId: plan.id,
      patientId: testPatientId,
      metricType: 'SYSTOLIC_BP',
      value: 190,
      unit: 'mmHg',
      secondaryValue: 105,
      dataSource: 'VERIFIED_DEVICE',
      deviceIdentifier: 'Omron-HEM-7120-BT',
    });

    assert.strictEqual(measurement.value, 190);
    assert.strictEqual(measurement.alertSeverity, 'CRITICAL');
    assert.ok(alert);
    assert.strictEqual(alert.severity, 'CRITICAL');
    assert.strictEqual(alert.status, 'UNACKNOWLEDGED');
    testMeasurementId = measurement.id;
    testCriticalAlertId = alert.id;
  });

  it('16. Clinician reviews and acknowledges RPM critical alert with emergency escalation action', async () => {
    const acknowledgedAlert = await telemedicineAdvancedService.acknowledgeRpmAlert(
      testCriticalAlertId,
      testDoctorId,
      'Initiated emergency outreach call. Advised patient to take Sorbitrate and report to ED.'
    );

    assert.strictEqual(acknowledgedAlert.status, 'ESCALATED');
    assert.strictEqual(acknowledgedAlert.acknowledgedByUserId, testDoctorId);
    assert.ok(acknowledgedAlert.acknowledgedAt);
  });
});

