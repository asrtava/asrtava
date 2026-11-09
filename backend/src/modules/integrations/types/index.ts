export type IntegrationCategory =
  | 'communication_whatsapp'
  | 'communication_sms'
  | 'communication_email'
  | 'push_notification'
  | 'payment_gateway'
  | 'laboratory_lis'
  | 'radiology_pacs'
  | 'interoperability_fhir'
  | 'cloud_storage'
  | 'accounting_erp'
  | 'location_maps';

export type IntegrationEnvironment = 'sandbox' | 'production';

export type IntegrationStatus = 'unconfigured' | 'configured' | 'active' | 'error' | 'suspended';

export type HealthStatus = 'healthy' | 'degraded' | 'unreachable' | 'unknown';

export interface ProviderCatalogItem {
  id: string;
  code: string;
  name: string;
  category: IntegrationCategory;
  description: string;
  logoUrl?: string;
  websiteUrl?: string;
  supportedAuthTypes: string[];
  isActive: boolean;
  isSaasOnly: boolean;
}

export interface TenantIntegrationConfig {
  id: string;
  hospitalId: string;
  providerCode: string;
  displayName?: string;
  isEnabled: boolean;
  environment: IntegrationEnvironment;
  configMetadata: Record<string, any>;
  status: IntegrationStatus;
  lastHealthCheckAt?: string;
  lastHealthStatus: HealthStatus;
  lastErrorMessage?: string;
}

export interface EncryptedCredential {
  encryptedPayload: string;
  iv: string;
  authTag: string;
  keyVersion: number;
  maskedHint?: string;
}

export type ChannelType = 'whatsapp' | 'sms' | 'email' | 'push' | 'in_app';

export interface NotificationPayload {
  hospitalId: string;
  recipientUserId?: string;
  recipientPhone?: string;
  recipientEmail?: string;
  pushDeviceToken?: string;
  templateCode: string;
  preferredChannel?: ChannelType;
  fallbackChannels?: ChannelType[];
  variables: Record<string, string | number>;
  priority?: 'critical' | 'high' | 'normal' | 'low';
  metadata?: Record<string, any>;
}

export interface NotificationDispatchResult {
  dispatchId: string;
  primaryChannel: ChannelType;
  channelUsed: ChannelType;
  recipient: string;
  status: 'dispatched' | 'delivered' | 'failed' | 'fallback_triggered' | 'suppressed';
  providerMessageId?: string;
  fallbackHistory?: Array<{ channel: ChannelType; error: string }>;
  costInr?: number;
}

export interface PaymentOrderRequest {
  hospitalId?: string; // Empty for SaaS platform subscriptions
  domain: 'patient_billing' | 'saas_subscription';
  providerCode: 'razorpay' | 'cashfree' | 'stripe';
  internalReferenceId: string; // invoice_id or subscription_id
  amount: number;
  currency?: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  description?: string;
  idempotencyKey: string;
}

export interface PaymentVerificationRequest {
  hospitalId?: string;
  domain: 'patient_billing' | 'saas_subscription';
  providerCode: string;
  gatewayOrderId: string;
  gatewayPaymentId: string;
  gatewaySignature: string;
}

export interface PaymentRefundRequest {
  hospitalId?: string;
  domain: 'patient_billing' | 'saas_subscription';
  providerCode: string;
  gatewayPaymentId: string;
  refundAmount: number;
  reason?: string;
  idempotencyKey: string;
}

export interface WebhookEventPayload {
  providerCode: string;
  eventType: string;
  signature: string;
  rawBody: string;
  parsedBody: any;
  headers: Record<string, string | string[] | undefined>;
}

export interface LaboratoryOrderDispatch {
  hospitalId: string;
  orderId: string;
  orderNumber: string;
  patientUhid: string;
  patientName: string;
  patientAge: number;
  patientGender: string;
  specimenBarcode: string;
  tests: Array<{ testCode: string; testName: string; sampleType: string }>;
  orderingDoctor: string;
  priority: 'routine' | 'urgent' | 'stat';
}

export interface LaboratoryResultIngest {
  hospitalId: string;
  specimenBarcode: string;
  externalLisOrderId: string;
  results: Array<{
    testCode: string;
    testName: string;
    observedValue: string;
    unitOfMeasure?: string;
    referenceLow?: string;
    referenceHigh?: string;
    flag?: 'NORMAL' | 'LOW' | 'HIGH' | 'CRITICAL' | 'INDETERMINATE';
    isCriticalPanicValue?: boolean;
    instrumentModel?: string;
  }>;
  analyzedAt: string;
}

export interface PacsStudyMetadata {
  studyInstanceUid: string;
  patientUhid: string;
  modality: 'CR' | 'DX' | 'CT' | 'MR' | 'US';
  studyDescription: string;
  accessionNumber: string;
  numberOfSeries: number;
  numberOfInstances: number;
  studyDate: string;
}

