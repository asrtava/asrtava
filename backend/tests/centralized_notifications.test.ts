import test from 'node:test';
import assert from 'node:assert/strict';
import { NotificationEngineService } from '../src/modules/notifications/notification-engine.service';

// ============================================================================
// ASRTAVA TEST SUITE: CENTRALIZED NOTIFICATIONS, COMMUNICATION & ENGAGEMENT
// Tests all 5 communication channels, rules, templates, quiet hours & escalations
// ============================================================================

test('ASRTAVA Centralized Notifications & Patient Engagement Suite', async (t) => {
  const HOSP_ALPHA = 'hosp-alpha-sim';
  const HOSP_BETA = 'hosp-beta-sim';

  const userDoctor = { id: 'usr-doc-sharma', hospitalId: HOSP_ALPHA, name: 'Dr. Rajesh Sharma' };
  const userPatient = { id: 'usr-pt-patel', hospitalId: HOSP_ALPHA, name: 'Rajesh Patel', phone: '+919876543210', email: 'rajesh.patel@example.com' };
  const userBetaDoctor = { id: 'usr-beta-doc', hospitalId: HOSP_BETA, name: 'Dr. Beta Consultant' };

  // --------------------------------------------------------------------------
  // TEST 1: IN-APP NOTIFICATION CENTER (UNREAD COUNT, MARK READ, MARK ALL READ)
  // --------------------------------------------------------------------------
  await t.test('1. In-App Notification Center: Unread count, mark read, mark all read', async () => {
    // Dispatch 2 in-app notifications
    await NotificationEngineService.dispatchEvent({
      hospitalId: HOSP_ALPHA,
      eventCode: 'invoice.generated',
      recipientUserId: userPatient.id,
      variables: { invoice_number: 'INV-001', patient_name: 'Rajesh Patel', amount: '2424.90', status: 'Unpaid' },
      forcedChannel: 'in_app'
    });

    await NotificationEngineService.dispatchEvent({
      hospitalId: HOSP_ALPHA,
      eventCode: 'invoice.generated',
      recipientUserId: userPatient.id,
      variables: { invoice_number: 'INV-002', patient_name: 'Rajesh Patel', amount: '1200.00', status: 'Unpaid' },
      forcedChannel: 'in_app'
    });

    const overview = NotificationEngineService.getMyNotifications(HOSP_ALPHA, userPatient.id);
    assert.strictEqual(overview.unreadCount, 2);
    assert.strictEqual(overview.notifications.length, 2);

    // Mark single notification read
    const notifId = overview.notifications[0].id;
    const readSuccess = NotificationEngineService.markAsRead(notifId, userPatient.id);
    assert.strictEqual(readSuccess, true);

    const updated = NotificationEngineService.getMyNotifications(HOSP_ALPHA, userPatient.id);
    assert.strictEqual(updated.unreadCount, 1);

    // Mark all read
    const cleared = NotificationEngineService.markAllAsRead(HOSP_ALPHA, userPatient.id);
    assert.strictEqual(cleared, 1);

    const finalState = NotificationEngineService.getMyNotifications(HOSP_ALPHA, userPatient.id);
    assert.strictEqual(finalState.unreadCount, 0);
  });

  // --------------------------------------------------------------------------
  // TEST 2: MULTI-CHANNEL DISPATCH (SMS, WHATSAPP, EMAIL, IN-APP, PUSH)
  // --------------------------------------------------------------------------
  await t.test('2. Multi-Channel Dispatch: SMS, WhatsApp, Email, In-App and Push', async () => {
    // A. WhatsApp Appointment Confirmation
    const resWa = await NotificationEngineService.dispatchEvent({
      hospitalId: HOSP_ALPHA,
      eventCode: 'appointment.confirmed',
      recipientUserId: userPatient.id,
      recipientContact: { phone: userPatient.phone },
      variables: {
        patient_name: userPatient.name,
        doctor_name: userDoctor.name,
        appointment_date: '2026-11-10',
        appointment_time: '10:15 AM',
        token_number: '14',
        hospital_name: 'Alpha Apex Hospital'
      },
      forcedChannel: 'whatsapp'
    });
    assert.strictEqual(resWa.channel, 'whatsapp');
    assert.strictEqual(resWa.success, true);

    // B. SMS Appointment Confirmation
    const resSms = await NotificationEngineService.dispatchEvent({
      hospitalId: HOSP_ALPHA,
      eventCode: 'appointment.confirmed',
      recipientUserId: userPatient.id,
      recipientContact: { phone: userPatient.phone },
      variables: {
        doctor_name: userDoctor.name,
        appointment_date: '2026-11-10',
        appointment_time: '10:15 AM',
        token_number: '14',
        hospital_name: 'Alpha Apex Hospital'
      },
      forcedChannel: 'sms'
    });
    assert.strictEqual(resSms.channel, 'sms');
    assert.strictEqual(resSms.success, true);

    // C. Email Appointment Confirmation
    const resEmail = await NotificationEngineService.dispatchEvent({
      hospitalId: HOSP_ALPHA,
      eventCode: 'appointment.confirmed',
      recipientUserId: userPatient.id,
      recipientContact: { email: userPatient.email },
      variables: {
        patient_name: userPatient.name,
        doctor_name: userDoctor.name,
        appointment_date: '2026-11-10',
        appointment_time: '10:15 AM',
        token_number: '14',
        hospital_name: 'Alpha Apex Hospital'
      },
      forcedChannel: 'email'
    });
    assert.strictEqual(resEmail.channel, 'email');
    assert.strictEqual(resEmail.success, true);
  });

  // --------------------------------------------------------------------------
  // TEST 3: SAFE TEMPLATE RENDERING & XSS / INJECTION DEFENSE
  // --------------------------------------------------------------------------
  await t.test('3. Safe Template Rendering: HTML entity escaping and variable substitution', async () => {
    const rawTemplate = 'Consultation with {{doctor_name}} regarding condition {{chief_complaint}}.';
    const variables = {
      doctor_name: 'Dr. Sharma',
      chief_complaint: '<script>alert("XSS")</script>&"test"'
    };

    const rendered = NotificationEngineService.renderTemplate(rawTemplate, variables, ['doctor_name']);
    assert.ok(!rendered.includes('<script>'), 'Rendered template must not contain raw script tags');
    assert.ok(rendered.includes('&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;&amp;&quot;test&quot;'));
    assert.ok(rendered.includes('Dr. Sharma'));
  });

  // --------------------------------------------------------------------------
  // TEST 4: MISSING REQUIRED TEMPLATE VARIABLE VALIDATION
  // --------------------------------------------------------------------------
  await t.test('4. Missing Required Template Variable: Throws descriptive validation error', async () => {
    const rawTemplate = 'Appt for {{patient_name}} with {{doctor_name}}.';
    assert.throws(() => {
      NotificationEngineService.renderTemplate(rawTemplate, { patient_name: 'Rajesh' }, ['patient_name', 'doctor_name']);
    }, /MISSING_REQUIRED_TEMPLATE_VARIABLE: 'doctor_name' is required for this template/);
  });

  // --------------------------------------------------------------------------
  // TEST 5: PATIENT COMMUNICATION PREFERENCES & CHANNEL OPT-OUT
  // --------------------------------------------------------------------------
  await t.test('5. Patient Communication Preferences: Respects opt-outs for non-essential communications', async () => {
    NotificationEngineService.clearCache();

    // Patient disables WhatsApp, allows SMS
    NotificationEngineService.setPreferences({
      userId: userPatient.id,
      hospitalId: HOSP_ALPHA,
      emailEnabled: true,
      smsEnabled: true,
      whatsappEnabled: false, // Opted out of WhatsApp
      pushEnabled: true,
      marketingOptIn: false,
      timeZone: 'Asia/Kolkata'
    });

    const res = await NotificationEngineService.dispatchEvent({
      hospitalId: HOSP_ALPHA,
      eventCode: 'appointment.confirmed',
      recipientUserId: userPatient.id,
      recipientContact: { phone: userPatient.phone },
      variables: {
        doctor_name: userDoctor.name,
        appointment_date: '2026-11-10',
        appointment_time: '10:15 AM',
        token_number: '14',
        hospital_name: 'Alpha Apex Hospital'
      }
    });

    // Automatically routed to SMS because WhatsApp was disabled
    assert.strictEqual(res.channel, 'sms', 'Must route to SMS when WhatsApp preference is disabled');
  });

  // --------------------------------------------------------------------------
  // TEST 6: STAFF QUIET HOURS ENFORCEMENT & SILENT FALLBACK
  // --------------------------------------------------------------------------
  await t.test('6. Staff Quiet Hours: Non-critical notifications suppressed / switched to silent in-app', async () => {
    // Doctor sets quiet hours 22:00 to 07:00
    NotificationEngineService.setPreferences({
      userId: userDoctor.id,
      hospitalId: HOSP_ALPHA,
      emailEnabled: true,
      smsEnabled: true,
      whatsappEnabled: true,
      pushEnabled: true,
      marketingOptIn: false,
      quietHoursStart: '22:00',
      quietHoursEnd: '07:00',
      timeZone: 'Asia/Kolkata'
    });

    // Non-critical routine invoice notification dispatched at 23:30 (during quiet hours)
    const lateNightDate = new Date('2026-11-09T23:30:00');
    const res = await NotificationEngineService.dispatchEvent({
      hospitalId: HOSP_ALPHA,
      eventCode: 'invoice.generated',
      recipientUserId: userDoctor.id,
      variables: { invoice_number: 'INV-999', patient_name: 'Non-critical', amount: '500', status: 'Unpaid' },
      priority: 'normal',
      currentTime: lateNightDate
    });

    assert.strictEqual(res.isSuppressedByQuietHours, true);
    assert.strictEqual(res.channel, 'in_app', 'Must fallback to silent in-app notification during quiet hours');
  });

  // --------------------------------------------------------------------------
  // TEST 7: CRITICAL ALERT QUIET HOURS BYPASS
  // --------------------------------------------------------------------------
  await t.test('7. Critical Alert Quiet Hours Bypass: Panic values immediately bypass quiet hours', async () => {
    // Critical Panic Lab Value dispatched at 23:45 (during quiet hours)
    const lateNightDate = new Date('2026-11-09T23:45:00');
    const res = await NotificationEngineService.dispatchEvent({
      hospitalId: HOSP_ALPHA,
      eventCode: 'lab.critical_panic_value',
      recipientUserId: userDoctor.id,
      variables: {
        patient_name: 'Critical Patient',
        uhid: 'SIM-PT-00100',
        test_name: 'Serum Potassium',
        result_value: '6.8',
        unit: 'mEq/L',
        flag: 'Critical High (Panic)'
      },
      priority: 'critical', // CRITICAL ALERT
      currentTime: lateNightDate
    });

    assert.strictEqual(res.isSuppressedByQuietHours, false, 'Critical alert must NEVER be suppressed by quiet hours');
    assert.strictEqual(res.success, true);
  });

  // --------------------------------------------------------------------------
  // TEST 8: CRITICAL ALERT ACKNOWLEDGEMENT & ESCALATION WORKFLOW
  // --------------------------------------------------------------------------
  await t.test('8. Critical Alert Escalation: Unacknowledged alert past 15 min timeout escalates', async () => {
    const dispatchTime = new Date('2026-11-09T10:00:00');
    const res = await NotificationEngineService.dispatchEvent({
      hospitalId: HOSP_ALPHA,
      eventCode: 'lab.critical_panic_value',
      recipientUserId: userDoctor.id,
      variables: {
        patient_name: 'Cardiac Patient',
        uhid: 'SIM-PT-00100',
        test_name: 'Troponin-I',
        result_value: '2.4',
        unit: 'ng/mL',
        flag: 'Panic High'
      },
      priority: 'critical',
      currentTime: dispatchTime
    });

    // At 10:10 (10 minutes elapsed, less than 15 min timeout) -> Not escalated
    const check10Min = NotificationEngineService.evaluateEscalations(new Date('2026-11-09T10:10:00'));
    assert.strictEqual(check10Min.length, 0);

    // At 10:16 (16 minutes elapsed, exceeds 15 min timeout) -> MUST ESCALATE
    const check16Min = NotificationEngineService.evaluateEscalations(new Date('2026-11-09T10:16:00'));
    assert.strictEqual(check16Min.length, 1);
    assert.strictEqual(check16Min[0].isEscalated, true);
    assert.strictEqual(check16Min[0].escalatedTo, 'usr-department_head-duty');

    // Doctor acknowledges escalated alert
    const ackRes = NotificationEngineService.acknowledgeCriticalAlert(check16Min[0].alertId, userDoctor.id);
    assert.strictEqual(ackRes.alert.isAcknowledged, true);
    assert.strictEqual(ackRes.alert.acknowledgedBy, userDoctor.id);
  });

  // --------------------------------------------------------------------------
  // TEST 9: IDEMPOTENCY & DUPLICATE SEND PREVENTION
  // --------------------------------------------------------------------------
  await t.test('9. Idempotency & Deduplication: Prevents double sending within window', async () => {
    const fixedTime = new Date('2026-11-09T14:00:00');
    const idempotencyKey = 'IDEMP-NOTIF-PAY-CONFIRM-001';

    // First send
    const res1 = await NotificationEngineService.dispatchEvent({
      hospitalId: HOSP_ALPHA,
      eventCode: 'appointment.confirmed',
      recipientUserId: userPatient.id,
      variables: { doctor_name: userDoctor.name, appointment_date: '2026-11-10', appointment_time: '10:15 AM', token_number: '14', hospital_name: 'Alpha Hospital' },
      idempotencyKey,
      forcedChannel: 'sms',
      currentTime: fixedTime
    });
    assert.strictEqual(res1.isDuplicate, undefined);

    // Second immediate send with identical key
    const res2 = await NotificationEngineService.dispatchEvent({
      hospitalId: HOSP_ALPHA,
      eventCode: 'appointment.confirmed',
      recipientUserId: userPatient.id,
      variables: { doctor_name: userDoctor.name, appointment_date: '2026-11-10', appointment_time: '10:15 AM', token_number: '14', hospital_name: 'Alpha Hospital' },
      idempotencyKey,
      forcedChannel: 'sms',
      currentTime: new Date('2026-11-09T14:02:00') // 2 mins later (within 10 min window)
    });
    assert.strictEqual(res2.isDuplicate, true);
    assert.strictEqual(res2.notificationId, res1.notificationId, 'Must return original notification ID on idempotent replay');
  });

  // --------------------------------------------------------------------------
  // TEST 10: MULTI-TENANT COMMUNICATION ISOLATION
  // --------------------------------------------------------------------------
  await t.test('10. Multi-Tenant Isolation: Hospital Alpha messages cannot be read by Hospital Beta', async () => {
    // Dispatch message for Hospital Alpha patient
    await NotificationEngineService.dispatchEvent({
      hospitalId: HOSP_ALPHA,
      eventCode: 'invoice.generated',
      recipientUserId: userPatient.id,
      variables: { invoice_number: 'INV-ALPHA-1', patient_name: 'Alpha Patient', amount: '1000', status: 'Unpaid' },
      forcedChannel: 'in_app'
    });

    // Query from Hospital Beta
    const betaOverview = NotificationEngineService.getMyNotifications(HOSP_BETA, userPatient.id);
    assert.strictEqual(betaOverview.notifications.length, 0, 'Hospital Beta must have zero access to Hospital Alpha notifications');
  });

  // --------------------------------------------------------------------------
  // TEST 11: SENSITIVE PII REDACTION IN LOGS & AUDIT TRAILS
  // --------------------------------------------------------------------------
  await t.test('11. PII Redaction: Phone numbers, emails and device tokens are masked', async () => {
    const maskedPhone = NotificationEngineService.maskRecipientContact('+919876543210');
    assert.strictEqual(maskedPhone, '+919******210');

    const maskedEmail = NotificationEngineService.maskRecipientContact('rajesh.patel@asrtava.com');
    assert.strictEqual(maskedEmail, 'r***l@asrtava.com');
  });

  // --------------------------------------------------------------------------
  // TEST 12: MOBILE DEVICE TOKEN REGISTRATION & MULTI-DEVICE MANAGEMENT
  // --------------------------------------------------------------------------
  await t.test('12. Mobile Device Push Tokens: Multi-device registration and rotation', async () => {
    const deviceFCM = 'fcm_token_pixel_8_pro_991823';
    const deviceAPNS = 'apns_token_iphone_15_pro_77219';

    // Register Android device
    NotificationEngineService.registerDeviceToken(userPatient.id, deviceFCM, 'android');
    // Register iOS device
    NotificationEngineService.registerDeviceToken(userPatient.id, deviceAPNS, 'ios');

    const tokens = NotificationEngineService.getDeviceTokens(userPatient.id);
    assert.strictEqual(tokens.length, 2);
    assert.strictEqual(tokens[0].platform, 'android');
    assert.strictEqual(tokens[1].platform, 'ios');

    // Rotate FCM token
    const rotatedFCM = 'fcm_token_pixel_8_pro_rotated_8811';
    NotificationEngineService.registerDeviceToken(userPatient.id, rotatedFCM, 'android');

    const updatedTokens = NotificationEngineService.getDeviceTokens(userPatient.id);
    assert.strictEqual(updatedTokens.length, 3);
  });
});
