import crypto from 'crypto';

// ============================================================================
// ASRTAVA CENTRALIZED NOTIFICATION & COMMUNICATION ENGINE
// Powers In-App, Email, SMS, WhatsApp, and Mobile Push across all 13 Portals
// ============================================================================

export type Channel = 'in_app' | 'email' | 'sms' | 'whatsapp' | 'push';
export type NotificationPriority = 'low' | 'normal' | 'high' | 'critical';
export type DeliveryStatus = 'pending' | 'queued' | 'processing' | 'sent' | 'delivered' | 'read' | 'failed' | 'bounced' | 'cancelled';

export interface NotificationTemplate {
  id: string;
  hospitalId: string | null; // null for platform global template
  eventCode: string;
  channel: Channel;
  subjectTemplate?: string;
  bodyTemplate: string;
  requiredVariables: string[];
  isActive: boolean;
  version: number;
}

export interface NotificationRule {
  id: string;
  hospitalId: string;
  eventCode: string;
  channels: Channel[];
  priority: NotificationPriority;
  quietHoursEnabled: boolean;
  quietHoursStart?: string; // e.g. "22:00"
  quietHoursEnd?: string;   // e.g. "07:00"
  escalationTimeoutMinutes?: number;
  escalationTargetRole?: string;
  isActive: boolean;
}

export interface UserPreferences {
  userId: string;
  hospitalId: string;
  emailEnabled: boolean;
  smsEnabled: boolean;
  whatsappEnabled: boolean;
  pushEnabled: boolean;
  marketingOptIn: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
  timeZone: string;
}

export interface OutboundNotification {
  id: string;
  hospitalId: string;
  recipientUserId: string;
  recipientContact: string; // Phone, Email, Device Token
  channel: Channel;
  eventCode: string;
  title: string;
  body: string;
  priority: NotificationPriority;
  status: DeliveryStatus;
  idempotencyKey: string;
  isRead: boolean;
  metadata?: Record<string, any>;
  createdAt: Date;
  sentAt?: Date;
  deliveredAt?: Date;
  readAt?: Date;
  failureReason?: string;
}

export interface CriticalAlertRecord {
  alertId: string;
  notificationId: string;
  hospitalId: string;
  eventCode: string;
  primaryRecipientId: string;
  escalationTargetRole: string;
  escalationTimeoutMs: number;
  createdAt: Date;
  isAcknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  isEscalated: boolean;
  escalatedTo?: string;
  escalatedAt?: Date;
}

export class NotificationEngineService {
  // In-memory operational stores (backed by PostgreSQL in runtime)
  private static templates: Map<string, NotificationTemplate> = new Map();
  private static rules: Map<string, NotificationRule[]> = new Map();
  private static preferences: Map<string, UserPreferences> = new Map();
  private static outboundLogs: Map<string, OutboundNotification> = new Map();
  private static criticalAlerts: Map<string, CriticalAlertRecord> = new Map();
  private static deviceTokens: Map<string, Array<{ token: string; platform: 'android' | 'ios'; updatedAt: Date }>> = new Map();
  private static idempotencySet: Map<string, { timestamp: number; notificationId: string; channel: Channel }> = new Map();

  static {
    this.seedDefaultTemplates();
  }

  public static clearCache(): void {
    this.idempotencySet.clear();
    this.outboundLogs.clear();
    this.criticalAlerts.clear();
  }

  // --------------------------------------------------------------------------
  // 1. TEMPLATE SEEDING & RENDERING
  // --------------------------------------------------------------------------
  private static seedDefaultTemplates() {
    const defaultTemplates: NotificationTemplate[] = [
      // Appointment Confirmed (Multi-Channel)
      {
        id: 'tmpl-apt-conf-inapp',
        hospitalId: null,
        eventCode: 'appointment.confirmed',
        channel: 'in_app',
        titleTemplate: 'Appointment Confirmed - {{token_number}}',
        bodyTemplate: 'Your consultation with {{doctor_name}} is confirmed for {{appointment_date}} at {{appointment_time}} ({{department_name}}). Token #{{token_number}}.',
        requiredVariables: ['doctor_name', 'appointment_date', 'appointment_time', 'token_number'],
        isActive: true,
        version: 1
      } as any,
      {
        id: 'tmpl-apt-conf-sms',
        hospitalId: null,
        eventCode: 'appointment.confirmed',
        channel: 'sms',
        bodyTemplate: 'ASRTAVA: Appt confirmed with {{doctor_name}} on {{appointment_date}} at {{appointment_time}}. Token: #{{token_number}}. Hospital: {{hospital_name}}.',
        requiredVariables: ['doctor_name', 'appointment_date', 'appointment_time', 'token_number', 'hospital_name'],
        isActive: true,
        version: 1
      },
      {
        id: 'tmpl-apt-conf-wa',
        hospitalId: null,
        eventCode: 'appointment.confirmed',
        channel: 'whatsapp',
        bodyTemplate: '🏥 *{{hospital_name}} - Appointment Confirmation*\n\nDear {{patient_name}},\nYour consultation has been confirmed:\n• *Doctor:* {{doctor_name}}\n• *Date & Time:* {{appointment_date}} at {{appointment_time}}\n• *Queue Token:* #{{token_number}}\n\nPlease arrive 10 minutes prior for queue check-in.',
        requiredVariables: ['patient_name', 'doctor_name', 'appointment_date', 'appointment_time', 'token_number', 'hospital_name'],
        isActive: true,
        version: 1
      },
      {
        id: 'tmpl-apt-conf-email',
        hospitalId: null,
        eventCode: 'appointment.confirmed',
        channel: 'email',
        subjectTemplate: 'Appointment Confirmation - {{doctor_name}} ({{appointment_date}})',
        bodyTemplate: '<p>Dear <strong>{{patient_name}}</strong>,</p><p>Your appointment with <strong>{{doctor_name}}</strong> is scheduled for <strong>{{appointment_date}} at {{appointment_time}}</strong>.</p><p>Queue Token: <strong>#{{token_number}}</strong></p><p>Thank you,<br/>{{hospital_name}}</p>',
        requiredVariables: ['patient_name', 'doctor_name', 'appointment_date', 'appointment_time', 'token_number', 'hospital_name'],
        isActive: true,
        version: 1
      },
      // Critical Panic Lab Value (High Urgency)
      {
        id: 'tmpl-lab-panic-inapp',
        hospitalId: null,
        eventCode: 'lab.critical_panic_value',
        channel: 'in_app',
        titleTemplate: '🚨 CRITICAL PANIC LAB VALUE: {{test_name}}',
        bodyTemplate: 'CRITICAL VALUE ALERT for Patient {{patient_name}} (UHID {{uhid}}): {{test_name}} result is {{result_value}} {{unit}} (Flag: {{flag}}). Immediate clinical attention required.',
        requiredVariables: ['patient_name', 'uhid', 'test_name', 'result_value', 'unit', 'flag'],
        isActive: true,
        version: 1
      } as any,
      {
        id: 'tmpl-lab-panic-sms',
        hospitalId: null,
        eventCode: 'lab.critical_panic_value',
        channel: 'sms',
        bodyTemplate: 'URGENT ASRTAVA: Critical lab panic value for Pt {{uhid}}. {{test_name}}: {{result_value}} {{unit}}. Please acknowledge immediately in doctor portal.',
        requiredVariables: ['uhid', 'test_name', 'result_value', 'unit'],
        isActive: true,
        version: 1
      },
      // Invoice Generated
      {
        id: 'tmpl-inv-gen-inapp',
        hospitalId: null,
        eventCode: 'invoice.generated',
        channel: 'in_app',
        titleTemplate: 'Invoice {{invoice_number}} Generated',
        bodyTemplate: 'Consolidated invoice {{invoice_number}} for {{patient_name}} has been generated for ₹{{amount}}. Status: {{status}}.',
        requiredVariables: ['invoice_number', 'patient_name', 'amount', 'status'],
        isActive: true,
        version: 1
      } as any
    ];

    for (const t of defaultTemplates) {
      this.templates.set(`${t.hospitalId || 'global'}:${t.eventCode}:${t.channel}`, t);
    }
  }

  /**
   * Safely interpolates template variables with HTML entity escaping to prevent XSS/injection
   */
  public static renderTemplate(
    templateStr: string,
    variables: Record<string, any>,
    requiredVars: string[] = []
  ): string {
    // 1. Validate required variables
    for (const v of requiredVars) {
      if (variables[v] === undefined || variables[v] === null || variables[v] === '') {
        throw new Error(`MISSING_REQUIRED_TEMPLATE_VARIABLE: '${v}' is required for this template.`);
      }
    }

    // 2. Escape HTML entities in string variables
    const escapeHtml = (val: any): string => {
      if (typeof val !== 'string') return String(val);
      return val
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    };

    // 3. Replace {{variable_name}}
    return templateStr.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) => {
      if (variables[key] !== undefined && variables[key] !== null) {
        return escapeHtml(variables[key]);
      }
      return '';
    });
  }

  // --------------------------------------------------------------------------
  // 2. DISPATCH ORCHESTRATION WITH PREFERENCES & IDEMPOTENCY
  // --------------------------------------------------------------------------
  public static async dispatchEvent(params: {
    hospitalId: string;
    eventCode: string;
    recipientUserId: string;
    recipientContact?: { phone?: string; email?: string };
    variables: Record<string, any>;
    priority?: NotificationPriority;
    forcedChannel?: Channel;
    idempotencyKey?: string;
    currentTime?: Date;
  }): Promise<{ success: boolean; notificationId: string; channel: Channel; isDuplicate?: boolean; isSuppressedByQuietHours?: boolean }> {
    const {
      hospitalId,
      eventCode,
      recipientUserId,
      recipientContact = {},
      variables,
      priority = 'normal',
      forcedChannel,
      idempotencyKey,
      currentTime = new Date()
    } = params;

    // A. Idempotency Check (Duplicate Send Prevention)
    const key = idempotencyKey || `${hospitalId}:${eventCode}:${recipientUserId}:${forcedChannel || 'auto'}:${JSON.stringify(variables)}`;
    const existing = this.idempotencySet.get(key);
    const DEDUP_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

    if (existing && (currentTime.getTime() - existing.timestamp) < DEDUP_WINDOW_MS) {
      return {
        success: true,
        notificationId: existing.notificationId,
        channel: existing.channel,
        isDuplicate: true
      };
    }

    // B. Resolve Notification Channel & Preferences
    const userPref = this.preferences.get(`${hospitalId}:${recipientUserId}`) || {
      userId: recipientUserId,
      hospitalId,
      emailEnabled: true,
      smsEnabled: true,
      whatsappEnabled: true,
      pushEnabled: true,
      marketingOptIn: false,
      timeZone: 'Asia/Kolkata'
    };

    let selectedChannel: Channel = forcedChannel || this.determineOptimalChannel(eventCode, userPref);

    // C. Quiet Hours Evaluation
    const isCritical = priority === 'critical';
    let isSuppressed = false;

    if (!isCritical && userPref.quietHoursStart && userPref.quietHoursEnd) {
      isSuppressed = this.isWithinQuietHours(currentTime, userPref.quietHoursStart, userPref.quietHoursEnd);
      if (isSuppressed) {
        // Fallback to silent in-app notification during quiet hours
        selectedChannel = 'in_app';
      }
    }

    // D. Resolve Template
    const template = this.resolveTemplate(hospitalId, eventCode, selectedChannel);
    if (!template) {
      throw new Error(`TEMPLATE_NOT_FOUND: No template configured for ${eventCode} on ${selectedChannel}`);
    }

    const title = (template as any).titleTemplate
      ? this.renderTemplate((template as any).titleTemplate, variables, [])
      : `Notification: ${eventCode}`;
    const body = this.renderTemplate(template.bodyTemplate, variables, template.requiredVariables);

    // E. Create Outbound Notification Record
    const notificationId = `NOTIF-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const contact = selectedChannel === 'sms' || selectedChannel === 'whatsapp'
      ? (recipientContact.phone || '+919999999999')
      : selectedChannel === 'email'
      ? (recipientContact.email || 'user@hospital.com')
      : recipientUserId;

    const notif: OutboundNotification = {
      id: notificationId,
      hospitalId,
      recipientUserId,
      recipientContact: contact,
      channel: selectedChannel,
      eventCode,
      title,
      body,
      priority,
      status: 'delivered', // Mock provider immediate delivery confirmation
      idempotencyKey: key,
      isRead: false,
      metadata: variables,
      createdAt: currentTime,
      sentAt: currentTime,
      deliveredAt: currentTime
    };

    this.outboundLogs.set(notificationId, notif);
    this.idempotencySet.set(key, { timestamp: currentTime.getTime(), notificationId, channel: selectedChannel });

    // F. Critical Alert Escalation Registration
    if (isCritical) {
      const alertId = `ALERT-${Date.now()}`;
      this.criticalAlerts.set(alertId, {
        alertId,
        notificationId,
        hospitalId,
        eventCode,
        primaryRecipientId: recipientUserId,
        escalationTargetRole: 'department_head',
        escalationTimeoutMs: 15 * 60 * 1000, // 15 mins
        createdAt: currentTime,
        isAcknowledged: false,
        isEscalated: false
      });
    }

    return {
      success: true,
      notificationId,
      channel: selectedChannel,
      isSuppressedByQuietHours: isSuppressed
    };
  }

  // --------------------------------------------------------------------------
  // 3. CRITICAL ALERT ACKNOWLEDGEMENT & ESCALATION
  // --------------------------------------------------------------------------
  public static acknowledgeCriticalAlert(alertId: string, acknowledgedByUserId: string, now = new Date()): { success: boolean; alert: CriticalAlertRecord } {
    const alert = this.criticalAlerts.get(alertId);
    if (!alert) {
      throw new Error('CRITICAL_ALERT_NOT_FOUND');
    }

    if (alert.isAcknowledged) {
      return { success: true, alert };
    }

    alert.isAcknowledged = true;
    alert.acknowledgedBy = acknowledgedByUserId;
    alert.acknowledgedAt = now;

    return { success: true, alert };
  }

  public static evaluateEscalations(currentTime = new Date()): CriticalAlertRecord[] {
    const escalatedList: CriticalAlertRecord[] = [];

    for (const alert of this.criticalAlerts.values()) {
      if (!alert.isAcknowledged && !alert.isEscalated) {
        const elapsed = currentTime.getTime() - alert.createdAt.getTime();
        if (elapsed >= alert.escalationTimeoutMs) {
          alert.isEscalated = true;
          alert.escalatedTo = `usr-${alert.escalationTargetRole}-duty`;
          alert.escalatedAt = currentTime;
          escalatedList.push(alert);
        }
      }
    }

    return escalatedList;
  }

  // --------------------------------------------------------------------------
  // 4. PREFERENCES & QUIET HOURS LOGIC
  // --------------------------------------------------------------------------
  public static setPreferences(pref: UserPreferences) {
    this.preferences.set(`${pref.hospitalId}:${pref.userId}`, pref);
  }

  public static getPreferences(hospitalId: string, userId: string): UserPreferences {
    return this.preferences.get(`${hospitalId}:${userId}`) || {
      userId,
      hospitalId,
      emailEnabled: true,
      smsEnabled: true,
      whatsappEnabled: true,
      pushEnabled: true,
      marketingOptIn: false,
      timeZone: 'Asia/Kolkata'
    };
  }

  private static isWithinQuietHours(current: Date, startStr: string, endStr: string): boolean {
    const [startH, startM] = startStr.split(':').map(Number);
    const [endH, endM] = endStr.split(':').map(Number);

    const currentMinutes = current.getHours() * 60 + current.getMinutes();
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    if (startMinutes > endMinutes) {
      // Over midnight (e.g. 22:00 to 07:00)
      return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
    }
    return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
  }

  private static determineOptimalChannel(eventCode: string, pref: UserPreferences): Channel {
    if (eventCode.startsWith('lab.critical')) return 'in_app'; // Doctor portal banner
    if (eventCode.includes('confirmed') || eventCode.includes('reminder')) {
      if (pref.whatsappEnabled) return 'whatsapp';
      if (pref.smsEnabled) return 'sms';
      if (pref.emailEnabled) return 'email';
    }
    if (eventCode.includes('invoice') && pref.emailEnabled) return 'email';
    return 'in_app';
  }

  private static resolveTemplate(hospitalId: string, eventCode: string, channel: Channel): NotificationTemplate | undefined {
    // 1. Check hospital tenant override
    const tenantKey = `${hospitalId}:${eventCode}:${channel}`;
    if (this.templates.has(tenantKey)) return this.templates.get(tenantKey);

    // 2. Check global template
    const globalKey = `global:${eventCode}:${channel}`;
    return this.templates.get(globalKey);
  }

  // --------------------------------------------------------------------------
  // 5. DEVICE TOKEN REGISTRY (PUSH NOTIFICATIONS)
  // --------------------------------------------------------------------------
  public static registerDeviceToken(userId: string, token: string, platform: 'android' | 'ios') {
    const list = this.deviceTokens.get(userId) || [];
    const filtered = list.filter(d => d.token !== token);
    filtered.push({ token, platform, updatedAt: new Date() });
    this.deviceTokens.set(userId, filtered);
  }

  public static getDeviceTokens(userId: string) {
    return this.deviceTokens.get(userId) || [];
  }

  // --------------------------------------------------------------------------
  // 6. IN-APP NOTIFICATION RETRIEVAL & MUTATION
  // --------------------------------------------------------------------------
  public static getMyNotifications(hospitalId: string, userId: string, limit = 20) {
    const userNotifs = Array.from(this.outboundLogs.values())
      .filter(n => n.hospitalId === hospitalId && n.recipientUserId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const unreadCount = userNotifs.filter(n => !n.isRead).length;
    return {
      unreadCount,
      notifications: userNotifs.slice(0, limit)
    };
  }

  public static markAsRead(notificationId: string, userId: string): boolean {
    const notif = this.outboundLogs.get(notificationId);
    if (notif && notif.recipientUserId === userId) {
      notif.isRead = true;
      notif.readAt = new Date();
      return true;
    }
    return false;
  }

  public static markAllAsRead(hospitalId: string, userId: string): number {
    let count = 0;
    for (const notif of this.outboundLogs.values()) {
      if (notif.hospitalId === hospitalId && notif.recipientUserId === userId && !notif.isRead) {
        notif.isRead = true;
        notif.readAt = new Date();
        count++;
      }
    }
    return count;
  }

  // --------------------------------------------------------------------------
  // 7. PII DATA REDACTION FOR AUDIT LOGGING
  // --------------------------------------------------------------------------
  public static maskRecipientContact(contact: string): string {
    if (contact.includes('@')) {
      // Email
      const [local, domain] = contact.split('@');
      return `${local[0]}***${local.slice(-1)}@${domain}`;
    }
    if (contact.startsWith('+') || /^\d+$/.test(contact)) {
      // Phone
      return contact.replace(/(\d{3})\d{4,6}(\d{2})/, '$1******$2');
    }
    return `${contact.substring(0, 4)}...`;
  }
}
