import {
  NotificationPayload,
  NotificationDispatchResult,
  PaymentOrderRequest,
  PaymentVerificationRequest,
  PaymentRefundRequest,
  LaboratoryOrderDispatch,
  LaboratoryResultIngest,
  PacsStudyMetadata,
  HealthStatus,
} from '../types';

export interface IIntegrationBase {
  readonly providerCode: string;
  testConnection(credentials: Record<string, any>, config: Record<string, any>): Promise<{ status: HealthStatus; latencyMs: number; message: string }>;
}

export interface ICommunicationProvider extends IIntegrationBase {
  send(
    payload: NotificationPayload,
    credentials: Record<string, any>,
    config: Record<string, any>
  ): Promise<{ messageId: string; status: 'dispatched' | 'delivered' | 'failed'; costInr?: number; rawResponse?: any }>;
}

export interface IPaymentGatewayProvider extends IIntegrationBase {
  createOrder(
    request: PaymentOrderRequest,
    credentials: Record<string, any>
  ): Promise<{ gatewayOrderId: string; currency: string; amount: number; clientSecret?: string; checkoutUrl?: string }>;
  
  verifyPayment(
    request: PaymentVerificationRequest,
    credentials: Record<string, any>
  ): Promise<{ isVerified: boolean; gatewayPaymentId: string; status: string; rawResponse?: any }>;

  refundPayment(
    request: PaymentRefundRequest,
    credentials: Record<string, any>
  ): Promise<{ refundId: string; amount: number; status: string; rawResponse?: any }>;

  verifyWebhookSignature(
    rawBody: string,
    signature: string,
    webhookSecret: string
  ): boolean;
}

export interface ILaboratoryLISProvider extends IIntegrationBase {
  transmitOrder(
    order: LaboratoryOrderDispatch,
    credentials: Record<string, any>,
    config: Record<string, any>
  ): Promise<{ externalOrderId: string; status: 'acknowledged' | 'queued' | 'error'; trackingUrl?: string }>;

  parseResultsWebhook(rawBody: any): LaboratoryResultIngest;
}

export interface IPACSProvider extends IIntegrationBase {
  queryStudies(
    patientUhid: string,
    credentials: Record<string, any>,
    config: Record<string, any>
  ): Promise<PacsStudyMetadata[]>;

  generateViewerUrl(
    studyInstanceUid: string,
    patientUhid: string,
    expirationMinutes: number,
    credentials: Record<string, any>,
    config: Record<string, any>
  ): Promise<{ viewerUrl: string; token: string; expiresAt: string }>;
}

export interface ICloudStorageProvider extends IIntegrationBase {
  generatePresignedUploadUrl(
    bucket: string,
    key: string,
    mimeType: string,
    expirationSeconds: number,
    credentials: Record<string, any>
  ): Promise<{ uploadUrl: string; key: string; headers: Record<string, string> }>;

  generatePresignedDownloadUrl(
    bucket: string,
    key: string,
    expirationSeconds: number,
    credentials: Record<string, any>
  ): Promise<{ downloadUrl: string; expiresAt: string }>;
}

export interface IERPAccountingProvider extends IIntegrationBase {
  exportJournalVoucher(
    voucherData: {
      voucherNumber: string;
      date: string;
      narration: string;
      debitAccount: string;
      creditAccount: string;
      amount: number;
      hospitalId: string;
    },
    credentials: Record<string, any>,
    config: Record<string, any>
  ): Promise<{ externalVoucherId: string; status: 'synced' | 'failed'; message: string }>;
}

export interface IMapsLocationProvider extends IIntegrationBase {
  geocodeAddress(
    address: string,
    credentials: Record<string, any>
  ): Promise<{ latitude: number; longitude: number; formattedAddress: string }>;

  calculateDistanceKm(
    from: { latitude: number; longitude: number },
    to: { latitude: number; longitude: number }
  ): number;
}

