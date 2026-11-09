import { WebhookEventPayload } from '../types';
import { CredentialVault } from '../security/credential-vault';

export class WebhookProcessingService {
  private static processedHashes: Set<string> = new Set();
  private static deadLetterQueue: Array<{
    eventId: string;
    providerCode: string;
    payload: any;
    error: string;
    receivedAt: string;
  }> = [];

  /**
   * Processes incoming webhook with signature verification and replay prevention
   */
  public static async processWebhook(
    event: WebhookEventPayload,
    webhookSecret: string
  ): Promise<{ status: 'processed' | 'duplicate_ignored' | 'invalid_signature' | 'dlq'; message: string; eventId?: string }> {
    // 1. Check idempotency / replay attack
    const idempotencyHash = CredentialVault.hashPayload({
      provider: event.providerCode,
      body: event.rawBody,
    });

    if (this.processedHashes.has(idempotencyHash)) {
      return {
        status: 'duplicate_ignored',
        message: 'Duplicate webhook delivery safely ignored by idempotency engine',
      };
    }

    // 2. Validate cryptographic signature
    const isValidSignature = CredentialVault.verifyHmacSignature(
      event.rawBody,
      event.signature,
      webhookSecret
    );

    if (!isValidSignature) {
      return {
        status: 'invalid_signature',
        message: 'Invalid webhook signature: rejection of untrusted third-party payload',
      };
    }

    // 3. Mark processed
    this.processedHashes.add(idempotencyHash);
    const eventId = `wh_evt_${Date.now()}`;

    // 4. Dispatch by provider
    try {
      await this.routeEvent(event.providerCode, event.eventType, event.parsedBody);
      return {
        status: 'processed',
        message: `Successfully processed ${event.providerCode} event: ${event.eventType}`,
        eventId,
      };
    } catch (err: any) {
      this.deadLetterQueue.push({
        eventId,
        providerCode: event.providerCode,
        payload: event.parsedBody,
        error: err.message,
        receivedAt: new Date().toISOString(),
      });
      return {
        status: 'dlq',
        message: `Event handler threw error; forwarded to Dead-Letter Queue: ${err.message}`,
        eventId,
      };
    }
  }

  private static async routeEvent(providerCode: string, eventType: string, payload: any) {
    // Event handlers for payment, WhatsApp delivery receipts, LIS orders
    if (providerCode.startsWith('payment_')) {
      // payment.captured or charge.succeeded
      return;
    }
    if (providerCode === 'whatsapp_meta') {
      // statuses: sent, delivered, read
      return;
    }
  }

  public static getDeadLetterQueue() {
    return this.deadLetterQueue;
  }

  public static clearDLQ() {
    this.deadLetterQueue = [];
  }
}

