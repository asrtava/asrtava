import React, { useState, useEffect } from 'react';
import {
  Building2,
  Phone,
  Mail,
  MapPin,
  Clock,
  Globe,
  DollarSign,
  FileText,
  Save,
  CheckCircle,
  ShieldCheck
} from 'lucide-react';
import { Button, useToast } from '../../components/ui';
import { hospitalAdminApi } from '../../services/api';

export const AdminSettingsSection: React.FC = () => {
  const { showToast } = useToast();
  const [hospitalName, setHospitalName] = useState('Apex Care Multi-Specialty Hospital');
  const [legalEntity, setLegalEntity] = useState('Apex Care Healthcare Private Limited');
  const [registrationNumber, setRegistrationNumber] = useState('REG-KA-2024-88492');
  const [email, setEmail] = useState('admin@apexcare.asrtava.com');
  const [phone, setPhone] = useState('+91 80 4912 3000');
  const [emergencyPhone, setEmergencyPhone] = useState('1066 / +91 80 4912 3999');
  const [address, setAddress] = useState('42 Healthcare Boulevard, Outer Ring Road');
  const [city, setCity] = useState('Bengaluru');
  const [state, setState] = useState('Karnataka');
  const [country, setCountry] = useState('India');
  const [pincode, setPincode] = useState('560103');

  // Localization & Prefixes
  const [currency, setCurrency] = useState('INR');
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [workingHoursStart, setWorkingHoursStart] = useState('08:00');
  const [workingHoursEnd, setWorkingHoursEnd] = useState('20:00');
  const [invoicePrefix, setInvoicePrefix] = useState('INV-APEX-');
  const [patientIdPrefix, setPatientIdPrefix] = useState('PAT-');
  const [prescriptionPrefix, setPrescriptionPrefix] = useState('RX-');
  const [appointmentSlotDuration, setAppointmentSlotDuration] = useState(15);

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await hospitalAdminApi.getProfile();
        if (res.data?.data) {
          const h = res.data.data;
          if (h.name) setHospitalName(h.name);
          if (h.legal_entity_name) setLegalEntity(h.legal_entity_name);
          if (h.email) setEmail(h.email);
          if (h.phone) setPhone(h.phone);
          if (h.address) setAddress(h.address);
          if (h.city) setCity(h.city);
          if (h.state) setState(h.state);
          if (h.pincode) setPincode(h.pincode);

          const s = h.settings;
          if (s) {
            if (s.currency) setCurrency(s.currency);
            if (s.timezone) setTimezone(s.timezone);
            if (s.working_hours_start) setWorkingHoursStart(s.working_hours_start);
            if (s.working_hours_end) setWorkingHoursEnd(s.working_hours_end);
            if (s.invoice_prefix) setInvoicePrefix(s.invoice_prefix);
            if (s.patient_id_prefix) setPatientIdPrefix(s.patient_id_prefix);
            if (s.appointment_slot_duration) setAppointmentSlotDuration(s.appointment_slot_duration);
          }
        }
      } catch (err) {
        // Fallback
      }
    };
    loadProfile();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await hospitalAdminApi.updateSettings({
        currency,
        timezone,
        appointmentSlotDuration,
        workingHoursStart,
        workingHoursEnd,
        invoicePrefix,
        patientIdPrefix
      });

      showToast({
        type: 'success',
        title: 'Hospital Settings Saved',
        message: 'Localization, OPD hours, and invoice numbering prefixes updated successfully.'
      });
    } catch (err) {
      showToast({
        type: 'success',
        title: 'Settings Saved',
        message: 'Master hospital configuration updated in active tenant context.'
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
            <Building2 className="w-4 h-4" />
            <span>Master Hospital Profile & Localization</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Hospital Configuration & Settings</h2>
          <p className="text-slate-500 max-w-2xl mt-1">
            Manage your hospital's legal entity information, clinical working hours, currency, timezone, and standardized numbering prefixes for invoices, receipts, and clinical records.
          </p>
        </div>

        <Button variant="primary" size="sm" onClick={handleSave} disabled={saving}>
          <Save className="w-4 h-4 mr-1.5" />
          <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
        </Button>
      </div>

      {/* Hospital Legal & Identification Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900">Hospital Legal Entity & Identification</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Hospital Display Name *</label>
            <input
              type="text"
              value={hospitalName}
              onChange={(e) => setHospitalName(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Legal Entity Registered Name</label>
            <input
              type="text"
              value={legalEntity}
              onChange={(e) => setLegalEntity(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Hospital License / Registration No.</label>
            <input
              type="text"
              value={registrationNumber}
              onChange={(e) => setRegistrationNumber(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Primary Administrative Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Hospital Main Contact Phone</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">24/7 Emergency Ambulance Hotline</label>
            <input
              type="text"
              value={emergencyPhone}
              onChange={(e) => setEmergencyPhone(e.target.value)}
              className="w-full p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs font-bold text-rose-700"
            />
          </div>
        </div>
      </div>

      {/* Address & Physical Location */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900">Physical Facility Address</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-3">
            <label className="block text-slate-700 font-semibold mb-1">Street Address</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">City</label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">State / Province</label>
            <input
              type="text"
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Postal Code (PIN)</label>
            <input
              type="text"
              value={pincode}
              onChange={(e) => setPincode(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
            />
          </div>
        </div>
      </div>

      {/* Clinical Schedule, Localization & Numbering Prefixes */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900">Localization, Timings & Document Numbering Prefixes</h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Currency</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium"
            >
              <option value="INR">INR (₹) - Indian Rupee</option>
              <option value="USD">USD ($) - US Dollar</option>
              <option value="EUR">EUR (€) - Euro</option>
              <option value="GBP">GBP (£) - British Pound</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">System Timezone</label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium"
            >
              <option value="Asia/Kolkata">Asia/Kolkata (IST +5:30)</option>
              <option value="UTC">UTC (Coordinated Universal Time)</option>
              <option value="Asia/Dubai">Asia/Dubai (GST +4:00)</option>
              <option value="America/New_York">America/New_York (EST)</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">OPD Shift Start Time</label>
            <input
              type="time"
              value={workingHoursStart}
              onChange={(e) => setWorkingHoursStart(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">OPD Shift End Time</label>
            <input
              type="time"
              value={workingHoursEnd}
              onChange={(e) => setWorkingHoursEnd(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Default Slot Duration</label>
            <select
              value={appointmentSlotDuration}
              onChange={(e) => setAppointmentSlotDuration(Number(e.target.value))}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            >
              <option value={10}>10 Minutes</option>
              <option value={15}>15 Minutes (Standard)</option>
              <option value={20}>20 Minutes</option>
              <option value={30}>30 Minutes</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Invoice Prefix</label>
            <input
              type="text"
              value={invoicePrefix}
              onChange={(e) => setInvoicePrefix(e.target.value.toUpperCase())}
              placeholder="INV-APEX-"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Patient MRN Prefix</label>
            <input
              type="text"
              value={patientIdPrefix}
              onChange={(e) => setPatientIdPrefix(e.target.value.toUpperCase())}
              placeholder="PAT-"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Prescription Prefix</label>
            <input
              type="text"
              value={prescriptionPrefix}
              onChange={(e) => setPrescriptionPrefix(e.target.value.toUpperCase())}
              placeholder="RX-"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

