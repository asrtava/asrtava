import {
  NotificationPayload,
  NotificationDispatchResult,
  ChannelType,
} from '../types';
import { IntegrationRegistryService } from './integration-registry.service';

export class NotificationOrchestrationService {
  /**
   * Dispatches a notification through optimal channel with automatic fallback
   */
  public static async dispatch(payload: NotificationPayload): Promise<NotificationDispatchResult> {
    const primaryChannel: ChannelType = payload.preferredChannel || this.determinePrimaryChannel(payload.templateCode);
    const fallbackChannels: ChannelType[] = payload.fallbackChannels || this.getFallbackChain(primaryChannel);

    const channelsToTry: ChannelType[] = [primaryChannel, ...fallbackChannels];
    const fallbackHistory: Array<{ channel: ChannelType; error: string }> = [];

    let lastError = 'No channel attempted';
    let successfulResult: any = null;
    let channelUsed: ChannelType = primaryChannel;

    for (const channel of channelsToTry) {
      try {
        // 1. Suppression check
        if (this.isSuppressed(channel, payload)) {
          fallbackHistory.push({ channel, error: `Recipient address suppressed for channel ${channel}` });
          continue;
        }

        // 2. Resolve adapter
        const providerCode = this.getProviderCodeForChannel(channel);
        const adapter = IntegrationRegistryService.getAdapter(providerCode);

        // 3. Dispatch via adapter
        const res = await adapter.send(payload, { apiKey: 'dummy_sandboxed_key' }, { hospitalId: payload.hospitalId });
        successfulResult = res;
        channelUsed = channel;
        break; // Stop at first successful transmission
      } catch (err: any) {
        lastError = err.message || 'Transmission failure';
        fallbackHistory.push({ channel, error: lastError });
      }
    }

    const recipient = payload.recipientPhone || payload.recipientEmail || payload.pushDeviceToken || 'unknown';

    if (successfulResult) {
      return {
        dispatchId: `disp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        primaryChannel,
        channelUsed,
        recipient: this.maskRecipient(recipient),
        status: channelUsed === primaryChannel ? 'dispatched' : 'fallback_triggered',
        providerMessageId: successfulResult.messageId,
        fallbackHistory: fallbackHistory.length > 0 ? fallbackHistory : undefined,
        costInr: successfulResult.costInr || 0,
      };
    }

    return {
      dispatchId: `disp_failed_${Date.now()}`,
      primaryChannel,
      channelUsed,
      recipient: this.maskRecipient(recipient),
      status: 'failed',
      fallbackHistory,
    };
  }

  private static determinePrimaryChannel(templateCode: string): ChannelType {
    if (templateCode.includes('OTP')) return 'sms';
    if (templateCode.includes('APPOINTMENT') || templateCode.includes('LAB_REPORT')) return 'whatsapp';
    if (templateCode.includes('INVOICE')) return 'email';
    return 'in_app';
  }

  private static getFallbackChain(primary: ChannelType): ChannelType[] {
    switch (primary) {
      case 'whatsapp':
        return ['sms', 'email', 'in_app'];
      case 'sms':
        return ['whatsapp', 'email'];
      case 'push':
        return ['whatsapp', 'sms'];
      case 'email':
        return ['whatsapp', 'in_app'];
      default:
        return ['in_app'];
    }
  }

  private static getProviderCodeForChannel(channel: ChannelType): string {
    switch (channel) {
      case 'whatsapp':
        return 'whatsapp_meta';
      case 'sms':
        return 'sms_gupshup';
      case 'email':
        return 'email_ses';
      case 'push':
        return 'push_fcm';
      default:
        return 'whatsapp_meta';
    }
  }

  private static isSuppressed(channel: ChannelType, payload: NotificationPayload): boolean {
    // Check if recipient has marked DND or unsubscribe
    if (channel === 'email' && payload.recipientEmail?.endsWith('@suppressed.invalid')) {
      return true;
    }
    if ((channel === 'sms' || channel === 'whatsapp') && payload.recipientPhone?.startsWith('+000')) {
      return true;
    }
    return false;
  }

  private static maskRecipient(recipient: string): string {
    if (recipient.includes('@')) {
      const parts = recipient.split('@');
      const name = parts[0];
      return `${name.substring(0, 2)}***@${parts[1]}`;
    }
    return recipient.replace(/\d(?=\d{4})/g, '*');
  }
}

