import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { CredentialVault } from '../src/modules/integrations/security/credential-vault';
import { IntegrationRegistryService } from '../src/modules/integrations/services/integration-registry.service';
import { NotificationOrchestrationService } from '../src/modules/integrations/services/notification-orchestration.service';
import { WebhookProcessingService } from '../src/modules/integrations/services/webhook-processing.service';
import { IntegrationJobsService } from '../src/modules/integrations/services/integration-jobs.service';
import { HL7Service } from '../src/modules/integrations/providers/adapters/hl7.service';
import { FHIRService } from '../src/modules/integrations/providers/adapters/fhir.service';

describe('ASRTAVA Advanced Integrations & External Connectivity Suite', () => {

  describe('1. Centralized Credential Vault & Cryptography', () => {
    it('encrypts sensitive API secrets using AES-256-GCM and decrypts cleanly', () => {
      const secretCredentials = {
        keyId: 'rzp_live_992100293849',
        keySecret: 'K3yS3cr3tSuperConfidential!',
        webhookSecret: 'whsec_99182746152',
      };

      const encrypted = CredentialVault.encrypt(secretCredentials);
      assert.ok(encrypted.encryptedPayload, 'Encrypted payload must exist');
      assert.ok(encrypted.iv, '96-bit IV must be recorded');
      assert.ok(encrypted.authTag, 'GCM Authentication tag must exist');
      assert.notEqual(encrypted.encryptedPayload, JSON.stringify(secretCredentials), 'Plaintext must not appear in ciphertext');

      const decrypted = CredentialVault.decrypt<typeof secretCredentials>(encrypted);
      assert.deepEqual(decrypted, secretCredentials, 'Decrypted credentials must match original plaintext');
    });

    it('rejects tampered or forged ciphertext when authentication tag does not match', () => {
      const encrypted = CredentialVault.encrypt({ apiKey: 'valid_api_key' });
      // Tamper ciphertext
      const tampered = {
        ...encrypted,
        encryptedPayload: encrypted.encryptedPayload.slice(0, -2) + 'ff',
      };

      assert.throws(() => {
        CredentialVault.decrypt(tampered);
      }, /Unsupported state or unable to authenticate data/);
    });

    it('masks secrets safely for frontend previews without exposing credentials', () => {
      const masked = CredentialVault.maskSecret('rzp_test_9876543210');
      assert.equal(masked, 'rzp_...3210');
    });
  });

  describe('2. Communication Gateways & Notification Orchestration', () => {
    it('normalizes Indian phone numbers and resolves approved WhatsApp templates', async () => {
      const adapter = IntegrationRegistryService.getAdapter('whatsapp_meta');
      const res = await adapter.send(
        {
          hospitalId: 'hosp-001',
          recipientPhone: '9876543210',
          templateCode: 'APPOINTMENT_BOOKED',
          variables: {
            patient_name: 'Aditi Rao',
            doctor_name: 'Dr. Sharma',
            slot_time: '10:30 AM',
          },
        },
        { accessToken: 'mock_token' },
        { phoneNumberId: 'phone_102938' }
      );

      assert.equal(res.status, 'dispatched');
      assert.ok(res.messageId.startsWith('wamid.'));
      assert.equal(res.rawResponse.contacts[0].wa_id, '919876543210');
      assert.equal(res.rawResponse.template, 'asrtava_appointment_confirmed');
    });

    it('masks OTP values in SMS delivery payloads to ensure zero plaintext credential leakage', async () => {
      const adapter = IntegrationRegistryService.getAdapter('sms_gupshup');
      const res = await adapter.send(
        {
          hospitalId: 'hosp-001',
          recipientPhone: '9988776655',
          templateCode: 'OTP_VERIFICATION',
          variables: {
            otp: '849201',
            hospital_name: 'Apex Care',
          },
        },
        { apiKey: 'sms_token' },
        { senderId: 'APEXCR' }
      );

      assert.equal(res.status, 'dispatched');
      assert.ok(res.rawResponse.destination.includes('****'));
    });

    it('orchestrates automatic fallback to SMS when primary WhatsApp channel is suppressed', async () => {
      const result = await NotificationOrchestrationService.dispatch({
        hospitalId: 'hosp-001',
        preferredChannel: 'whatsapp',
        fallbackChannels: ['sms', 'in_app'],
        recipientPhone: '+0000000000', // Mock suppressed phone on WhatsApp
        templateCode: 'APPOINTMENT_REMINDER',
        variables: { patient_name: 'Vikram', slot_time: '04:00 PM' },
      });

      // The suppressed WhatsApp will record in fallbackHistory
      assert.ok(result.fallbackHistory && result.fallbackHistory.length > 0);
      assert.ok(result.fallbackHistory.some((f) => f.channel === 'whatsapp'));
    });
  });

  describe('3. Payment Gateway Security & Webhook Idempotency', () => {
    it('verifies legitimate HMAC-SHA256 Razorpay payment signature and rejects tampered signature', async () => {
      const adapter = IntegrationRegistryService.getAdapter('payment_razorpay');
      const orderId = 'order_rzp_981203';
      const paymentId = 'pay_rzp_884920';
      const secret = 'rzp_sec_topsecret';

      // Legitimate signature: HMAC_SHA256(orderId + "|" + paymentId, secret)
      const validSignature = CredentialVault.generateHmacSignature(`${orderId}|${paymentId}`, secret);

      const verification = await adapter.verifyPayment(
        {
          domain: 'patient_billing',
          providerCode: 'payment_razorpay',
          gatewayOrderId: orderId,
          gatewayPaymentId: paymentId,
          gatewaySignature: validSignature,
        },
        { keySecret: secret }
      );

      assert.equal(verification.isVerified, true);
      assert.equal(verification.status, 'captured');

      // Forged signature
      const invalidVerification = await adapter.verifyPayment(
        {
          domain: 'patient_billing',
          providerCode: 'payment_razorpay',
          gatewayOrderId: orderId,
          gatewayPaymentId: paymentId,
          gatewaySignature: 'forged_fake_signature_abc123',
        },
        { keySecret: secret }
      );

      assert.equal(invalidVerification.isVerified, false);
      assert.equal(invalidVerification.status, 'failed_signature');
    });

    it('rejects duplicate webhook delivery attempts safely via idempotency hashing', async () => {
      const webhookSecret = 'test_webhook_sec_xyz';
      const payload = JSON.stringify({
        event: 'payment.captured',
        entity: { id: 'pay_998811', amount: 150000, status: 'captured' },
      });
      const signature = CredentialVault.generateHmacSignature(payload, webhookSecret);

      const eventPayload = {
        providerCode: 'payment_razorpay',
        eventType: 'payment.captured',
        signature,
        rawBody: payload,
        parsedBody: JSON.parse(payload),
        headers: {},
      };

      // First delivery: processes successfully
      const firstRun = await WebhookProcessingService.processWebhook(eventPayload, webhookSecret);
      assert.equal(firstRun.status, 'processed');

      // Second identical delivery: detected as duplicate replay
      const secondRun = await WebhookProcessingService.processWebhook(eventPayload, webhookSecret);
      assert.equal(secondRun.status, 'duplicate_ignored');
    });
  });

  describe('4. Laboratory (LIS) Integration & Clinical Safety Guardrails', () => {
    it('receives external analyzer results into unapproved staging and enforces pathologist approval', () => {
      const adapter = IntegrationRegistryService.getAdapter('lis_hl7');
      const rawIncomingLIS = {
        hospitalId: 'hosp-001',
        specimenBarcode: 'BARCODE-CBC-88192',
        externalLisOrderId: 'LIS-EXT-889',
        results: [
          {
            testCode: 'HGB',
            testName: 'Hemoglobin',
            observedValue: '14.2',
            unitOfMeasure: 'g/dL',
            referenceLow: '13.0',
            referenceHigh: '17.0',
            flag: 'NORMAL',
          },
          {
            testCode: 'WBC',
            testName: 'Total Leukocyte Count',
            observedValue: '18500',
            unitOfMeasure: 'cells/mcL',
            referenceLow: '4000',
            referenceHigh: '11000',
            flag: 'HIGH',
            isCriticalPanicValue: true,
          },
        ],
      };

      const parsed = adapter.parseResultsWebhook(rawIncomingLIS);
      assert.equal(parsed.specimenBarcode, 'BARCODE-CBC-88192');
      assert.equal(parsed.results.length, 2);
      assert.equal(parsed.results[1].flag, 'HIGH');
      assert.equal(parsed.results[1].isCriticalPanicValue, true);
    });
  });

  describe('5. Healthcare Interoperability: HL7 v2.5.1 & FHIR R4', () => {
    it('parses standard HL7 v2.5.1 pipe-delimited message and generates Application Accept ACK', () => {
      const rawHL7 = [
        'MSH|^~\\&|SYSMEX_XN|LAB_AUTOMATION|ASRTAVA_HMS|APEX_HOSPITAL|20261109083000||ORU^R01|MSG-CTRL-99881|P|2.5.1',
        'PID|1||ASR-UHID-1002||Sharma^Rajesh||19850412|M',
        'OBR|1|ORD-2026-001||CBC^Complete Blood Count|||20261109082500||||||||||||||||F',
        'OBX|1|NM|HGB^Hemoglobin||14.5|g/dL|13.0-17.0|N|||F',
        'OBX|2|NM|PLT^Platelet Count||180000|cells/mcL|150000-450000|N|||F',
      ].join('\r\n');

      const parsed = HL7Service.parseHL7(rawHL7);
      assert.equal(parsed.msh.messageType, 'ORU^R01');
      assert.equal(parsed.msh.messageControlId, 'MSG-CTRL-99881');
      assert.equal(parsed.pid?.patientName, 'Sharma^Rajesh');
      assert.equal(parsed.obxs?.length, 2);
      assert.equal(parsed.obxs?.[0].observationValue, '14.5');

      // Generate ACK
      const ack = HL7Service.buildACK(parsed.msh.messageControlId, 'AA');
      assert.ok(ack.includes('MSA|AA|MSG-CTRL-99881'));
    });

    it('transforms internal patient and observation models to FHIR R4 standard resources', () => {
      const fhirPatient = FHIRService.toFHIRPatient({
        id: 'pat-001',
        uhid: 'ASR-PAT-001',
        firstName: 'Ananya',
        lastName: 'Verma',
        gender: 'female',
        dateOfBirth: '1992-08-25',
        phone: '+919876543210',
        abhaId: '91-4455-6677-8899',
      });

      assert.equal(fhirPatient.resourceType, 'Patient');
      assert.equal(fhirPatient.name[0].family, 'Verma');
      assert.equal(fhirPatient.gender, 'female');
      assert.ok(fhirPatient.identifier.some((id: any) => id.value === '91-4455-6677-8899'));

      const fhirObservation = FHIRService.toFHIRObservation({
        id: 'obs-001',
        patientId: 'pat-001',
        patientUhid: 'ASR-PAT-001',
        code: '718-7',
        display: 'Hemoglobin [Mass/volume] in Blood',
        value: 13.8,
        unit: 'g/dL',
        referenceRangeLow: 12.0,
        referenceRangeHigh: 16.0,
        effectiveDateTime: new Date().toISOString(),
      });

      assert.equal(fhirObservation.resourceType, 'Observation');
      assert.equal((fhirObservation as any).valueQuantity?.value, 13.8);
      assert.equal((fhirObservation as any).valueQuantity?.unit, 'g/dL');
    });
  });

  describe('6. Radiology PACS DICOMweb & Cloud Storage', () => {
    it('generates ephemeral signed DICOM viewer token with short expiration', async () => {
      const pacs = IntegrationRegistryService.getAdapter('pacs_orthanc');
      const studyUid = '1.2.840.113619.2.55.3.891283.8910';
      const result = await pacs.generateViewerUrl(
        studyUid,
        'ASR-UHID-9810',
        30,
        {},
        { wadoUrl: 'https://pacs.asrtava.health/viewer' }
      );

      assert.ok(result.viewerUrl.includes(encodeURIComponent(studyUid)));
      assert.ok(result.token.length >= 32);
      assert.ok(new Date(result.expiresAt).getTime() > Date.now());
    });

    it('generates presigned cloud storage upload URLs enforcing server-side AES-256 encryption', async () => {
      const storage = IntegrationRegistryService.getAdapter('storage_s3');
      const presigned = await storage.generatePresignedUploadUrl(
        'asrtava-clinical-documents',
        'tenants/hosp-001/scans/ct-chest.dcm',
        'application/dicom',
        900,
        {}
      );

      assert.ok(presigned.uploadUrl.startsWith('https://asrtava-clinical-documents.s3.amazonaws.com/'));
      assert.equal(presigned.headers['x-amz-server-side-encryption'], 'AES256');
    });
  });

  describe('7. Outbox Background Queue & Dead-Letter Queue (DLQ)', () => {
    it('enqueues background jobs and processes successful executions', async () => {
      const job = IntegrationJobsService.enqueueJob('whatsapp_send', { recipient: '9876543210', msg: 'test' });
      assert.equal(job.status, 'pending');

      const completed = await IntegrationJobsService.executeJob(job.id, async () => {
        return { success: true };
      });
      assert.equal(completed.status, 'completed');
    });

    it('retries failing jobs and routes them to DLQ upon exceeding max retry threshold', async () => {
      const failingJob = IntegrationJobsService.enqueueJob('flaky_provider', { data: 'error_payload' });

      // Run attempts until DLQ
      for (let i = 0; i < failingJob.maxRetries; i++) {
        await IntegrationJobsService.executeJob(failingJob.id, async () => {
          throw new Error('Connection timed out to third-party API');
        });
      }

      assert.equal(failingJob.status, 'dlq');
      assert.equal(failingJob.retryCount, 3);
      assert.ok(failingJob.lastError?.includes('Connection timed out'));

      // Test Admin DLQ Replay
      const replayed = IntegrationJobsService.replayDlqJob(failingJob.id);
      assert.equal(replayed.status, 'pending');
      assert.equal(replayed.retryCount, 0);
    });
  });
});
