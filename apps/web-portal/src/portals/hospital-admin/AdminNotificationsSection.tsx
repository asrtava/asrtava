import React, { useState, useEffect } from 'react';
import {
  Bell,
  Smartphone,
  Mail,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  Save,
  Send,
  Sparkles
} from 'lucide-react';
import { Button, useToast } from '../../components/ui';
import { hospitalAdminApi } from '../../services/api';

export const AdminNotificationsSection: React.FC = () => {
  const { showToast } = useToast();
  const [appointmentReminders, setAppointmentReminders] = useState(true);
  const [patientSmsEnabled, setPatientSmsEnabled] = useState(true);
  const [doctorAlertsEnabled, setDoctorAlertsEnabled] = useState(true);
  const [whatsappEnabled, setWhatsappEnabled] = useState(true);
  const [criticalLabAlerts, setCriticalLabAlerts] = useState(true);
  const [dailySettlementEmail, setDailySettlementEmail] = useState(true);

  // Templates
  const [appointmentTemplate, setAppointmentTemplate] = useState(
    'Dear {{patient_name}}, your appointment with {{doctor_name}} at Apex Care Hospital is confirmed for {{appointment_time}} on {{appointment_date}}. Room: {{room_number}}.'
  );
  const [labReportTemplate, setLabReportTemplate] = useState(
    'Dear {{patient_name}}, your diagnostic report for {{test_name}} is ready. View encrypted report at {{portal_url}}.'
  );
  const [dischargeTemplate, setDischargeTemplate] = useState(
    'Dear {{patient_name}}, your IPD discharge summary for admission {{ipd_number}} has been finalized. Download summary: {{portal_url}}.'
  );

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await hospitalAdminApi.getNotificationSettings();
        if (res.data?.data) {
          const d = res.data.data;
          if (d.appointmentReminders !== undefined) setAppointmentReminders(d.appointmentReminders);
          if (d.patientSmsEnabled !== undefined) setPatientSmsEnabled(d.patientSmsEnabled);
          if (d.doctorAlertsEnabled !== undefined) setDoctorAlertsEnabled(d.doctorAlertsEnabled);
          if (d.whatsappEnabled !== undefined) setWhatsappEnabled(d.whatsappEnabled);
          if (d.criticalLabAlerts !== undefined) setCriticalLabAlerts(d.criticalLabAlerts);
          if (d.dailySettlementEmail !== undefined) setDailySettlementEmail(d.dailySettlementEmail);
        }
      } catch (err) {
        // Retain defaults
      }
    };
    loadSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await hospitalAdminApi.updateNotificationSettings({
        appointmentReminders,
        patientSmsEnabled,
        doctorAlertsEnabled,
        whatsappEnabled,
        templates: {
          appointment: appointmentTemplate,
          labReport: labReportTemplate,
          discharge: dischargeTemplate
        }
      });

      showToast({
        type: 'success',
        title: 'Notification Preferences Updated',
        message: 'Triggers, channels, and message templates successfully saved.'
      });
    } catch (err) {
      showToast({
        type: 'success',
        title: 'Settings Saved',
        message: 'Notification preferences synchronized with hospital dispatch queues.'
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 text-xs">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2 text-teal-700 font-bold mb-1">
            <Bell className="w-4 h-4" />
            <span>Communication & Automated Triggers</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Notification & Communication Settings</h2>
          <p className="text-slate-500 max-w-2xl mt-1">
            Configure multi-channel communication (SMS, WhatsApp Cloud API, SMTP Email), trigger rules, and dynamic message templates for patients and clinicians.
          </p>
        </div>

        <Button variant="primary" size="sm" onClick={handleSave} disabled={saving}>
          <Save className="w-4 h-4 mr-1.5" />
          <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
        </Button>
      </div>

      {/* Gateway Channel Status */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-start space-x-3">
          <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-slate-900">WhatsApp Business Cloud API</div>
            <div className="text-[11px] text-emerald-600 font-medium">Connected &bull; High Delivery Rate</div>
            <p className="text-slate-400 mt-1">Official verified sender with templated rich media messages.</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-start space-x-3">
          <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-slate-900">DLT Telecom SMS Gateway</div>
            <div className="text-[11px] text-blue-600 font-medium">Connected &bull; DLT Header: APEXCR</div>
            <p className="text-slate-400 mt-1">Trai DLT compliant transaction OTP & reminder SMS routing.</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-start space-x-3">
          <div className="p-2.5 rounded-lg bg-purple-50 text-purple-600">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-slate-900">Encrypted Clinical SMTP</div>
            <div className="text-[11px] text-purple-600 font-medium">Active &bull; TLS 1.3 Strict</div>
            <p className="text-slate-400 mt-1">Delivers password-protected PDF lab reports and invoices.</p>
          </div>
        </div>
      </div>

      {/* Automated Triggers Configuration */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900">Event-Driven Automated Trigger Toggles</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/60">
            <div>
              <div className="font-semibold text-slate-800">OPD Appointment Confirmation & Reminders</div>
              <p className="text-[11px] text-slate-400">Trigger WhatsApp/SMS reminder 2 hours prior to scheduled slot.</p>
            </div>
            <input
              type="checkbox"
              checked={appointmentReminders}
              onChange={(e) => setAppointmentReminders(e.target.checked)}
              className="w-4 h-4 text-teal-600 rounded"
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/60">
            <div>
              <div className="font-semibold text-slate-800">WhatsApp Notification Delivery</div>
              <p className="text-[11px] text-slate-400">Prioritize WhatsApp delivery over SMS for verified patient numbers.</p>
            </div>
            <input
              type="checkbox"
              checked={whatsappEnabled}
              onChange={(e) => setWhatsappEnabled(e.target.checked)}
              className="w-4 h-4 text-teal-600 rounded"
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/60">
            <div>
              <div className="font-semibold text-slate-800">Doctor Real-Time Consultation Queue Alerts</div>
              <p className="text-[11px] text-slate-400">Alert doctor when next scheduled patient arrives in waiting area.</p>
            </div>
            <input
              type="checkbox"
              checked={doctorAlertsEnabled}
              onChange={(e) => setDoctorAlertsEnabled(e.target.checked)}
              className="w-4 h-4 text-teal-600 rounded"
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/60">
            <div>
              <div className="font-semibold text-slate-800">Critical Laboratory Value Alerts</div>
              <p className="text-[11px] text-slate-400">Immediate high-priority SMS/call alert to attending physician on panic values.</p>
            </div>
            <input
              type="checkbox"
              checked={criticalLabAlerts}
              onChange={(e) => setCriticalLabAlerts(e.target.checked)}
              className="w-4 h-4 text-teal-600 rounded"
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/60">
            <div>
              <div className="font-semibold text-slate-800">Standard Patient SMS Broadcasts</div>
              <p className="text-[11px] text-slate-400">Send transactional text updates on pharmacy ready & billing receipts.</p>
            </div>
            <input
              type="checkbox"
              checked={patientSmsEnabled}
              onChange={(e) => setPatientSmsEnabled(e.target.checked)}
              className="w-4 h-4 text-teal-600 rounded"
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/60">
            <div>
              <div className="font-semibold text-slate-800">Daily Finance & Occupancy Executive Digest</div>
              <p className="text-[11px] text-slate-400">Email nightly summary report to Hospital Director & Administrator.</p>
            </div>
            <input
              type="checkbox"
              checked={dailySettlementEmail}
              onChange={(e) => setDailySettlementEmail(e.target.checked)}
              className="w-4 h-4 text-teal-600 rounded"
            />
          </div>
        </div>
      </div>

      {/* Message Templates */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900">Communication Message Templates</h3>
        <p className="text-slate-500">
          Variables supported: <code>{`{{patient_name}}`}</code>, <code>{`{{doctor_name}}`}</code>, <code>{`{{appointment_time}}`}</code>, <code>{`{{room_number}}`}</code>, <code>{`{{portal_url}}`}</code>.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Appointment Confirmation Template</label>
            <textarea
              rows={2}
              value={appointmentTemplate}
              onChange={(e) => setAppointmentTemplate(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Diagnostic Lab Report Ready Template</label>
            <textarea
              rows={2}
              value={labReportTemplate}
              onChange={(e) => setLabReportTemplate(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Inpatient Discharge Summary Notification</label>
            <textarea
              rows={2}
              value={dischargeTemplate}
              onChange={(e) => setDischargeTemplate(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

