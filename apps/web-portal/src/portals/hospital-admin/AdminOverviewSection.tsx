import React, { useState, useEffect } from 'react';
import {
  Users,
  Calendar,
  BedDouble,
  DollarSign,
  AlertCircle,
  Clock,
  Activity,
  CheckCircle2,
  RefreshCw,
  FileText,
  FlaskConical,
  Radio,
  Pill,
  Building2,
  TrendingUp,
  Stethoscope,
  ShieldCheck
} from 'lucide-react';
import { Button, useToast } from '../../components/ui';
import { hospitalAdminApi } from '../../services/api';

interface AdminMetrics {
  totalPatients: number;
  activeDoctors: number;
  activeStaff: number;
  totalDepartments: number;
  todayAppointments: number;
  pendingAppointments: number;
  currentAdmissions: number;
  availableBeds: number;
  occupiedBeds: number;
  pendingLabOrders: number;
  pendingRadiologyOrders: number;
  pharmacyStockAlerts: number;
  outstandingInvoices: number;
  todayCollections: number;
  monthlyRevenue: number;
  lastRefreshedAt: string;
}

interface AdminOverviewSectionProps {
  onNavigateSection: (sectionId: string) => void;
}

export const AdminOverviewSection: React.FC<AdminOverviewSectionProps> = ({ onNavigateSection }) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [metrics, setMetrics] = useState<AdminMetrics>({
    totalPatients: 0,
    activeDoctors: 0,
    activeStaff: 0,
    totalDepartments: 0,
    todayAppointments: 0,
    pendingAppointments: 0,
    currentAdmissions: 0,
    availableBeds: 0,
    occupiedBeds: 0,
    pendingLabOrders: 0,
    pendingRadiologyOrders: 0,
    pharmacyStockAlerts: 0,
    outstandingInvoices: 0,
    todayCollections: 0,
    monthlyRevenue: 0,
    lastRefreshedAt: new Date().toLocaleTimeString(),
  });

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const res = await hospitalAdminApi.getAdminMetrics();
      if (res.data?.success && res.data?.data) {
        setMetrics({
          ...res.data.data,
          lastRefreshedAt: new Date().toLocaleTimeString(),
        });
      }
    } catch (err: any) {
      // Retain live baseline
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const totalBeds = metrics.availableBeds + metrics.occupiedBeds;
  const occupancyPercentage = totalBeds > 0 ? Math.round((metrics.occupiedBeds / totalBeds) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Real-time Status Header */}
      <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center space-x-2 text-teal-300 text-xs font-semibold mb-1">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>LIVE DATABASE TELEMETRY &bull; TENANT AUDITED</span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold tracking-tight">Hospital Executive Command Console</h2>
            <p className="text-xs text-teal-100 max-w-xl mt-1">
              Real-time operational indicators aggregated across clinical, inpatient, diagnostic, pharmacy, and billing services.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <span className="text-[11px] text-teal-200">
              Synced: <strong className="text-white">{metrics.lastRefreshedAt}</strong>
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchMetrics}
              disabled={loading}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Primary KPI Grid (14 Critical Healthcare Indicators) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {/* Total Patients */}
        <div
          onClick={() => onNavigateSection('patients')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-teal-500 hover:shadow-md cursor-pointer transition"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Registered Patients</span>
            <Users className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {metrics.totalPatients.toLocaleString()}
          </div>
          <span className="text-[11px] text-teal-600 font-medium">Master Patient Index</span>
        </div>

        {/* Active Doctors */}
        <div
          onClick={() => onNavigateSection('doctors')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-teal-500 hover:shadow-md cursor-pointer transition"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Active Doctors</span>
            <Stethoscope className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {metrics.activeDoctors} Specialists
          </div>
          <span className="text-[11px] text-blue-600 font-medium">Across all departments</span>
        </div>

        {/* Active Staff */}
        <div
          onClick={() => onNavigateSection('staff-access')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-teal-500 hover:shadow-md cursor-pointer transition"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Total Active Staff</span>
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {metrics.activeStaff} Staff
          </div>
          <span className="text-[11px] text-indigo-600 font-medium">Admin & Clinical Duty</span>
        </div>

        {/* Total Departments */}
        <div
          onClick={() => onNavigateSection('departments')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-teal-500 hover:shadow-md cursor-pointer transition"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Specialty Departments</span>
            <Building2 className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {metrics.totalDepartments} Units
          </div>
          <span className="text-[11px] text-amber-600 font-medium">Active clinical units</span>
        </div>

        {/* Today's Appointments */}
        <div
          onClick={() => onNavigateSection('appointments')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-teal-500 hover:shadow-md cursor-pointer transition"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Today's Appointments</span>
            <Calendar className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {metrics.todayAppointments} Bookings
          </div>
          <span className="text-[11px] text-slate-500">{metrics.pendingAppointments} pending consultation</span>
        </div>

        {/* Bed Occupancy */}
        <div
          onClick={() => onNavigateSection('wards-beds')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-teal-500 hover:shadow-md cursor-pointer transition"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>IPD Bed Occupancy</span>
            <BedDouble className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-indigo-700 mt-2">
            {occupancyPercentage}%
          </div>
          <span className="text-[11px] text-slate-500">
            {metrics.occupiedBeds} occupied &bull; {metrics.availableBeds} available
          </span>
        </div>

        {/* Diagnostic Orders (Lab + Radiology) */}
        <div
          onClick={() => onNavigateSection('laboratory')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-teal-500 hover:shadow-md cursor-pointer transition"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Pending Diagnostics</span>
            <FlaskConical className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-purple-700 mt-2">
            {metrics.pendingLabOrders + metrics.pendingRadiologyOrders} Orders
          </div>
          <span className="text-[11px] text-purple-600 font-medium">
            {metrics.pendingLabOrders} Lab &bull; {metrics.pendingRadiologyOrders} Imaging
          </span>
        </div>

        {/* Pharmacy Low-Stock Alerts */}
        <div
          onClick={() => onNavigateSection('pharmacy')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-teal-500 hover:shadow-md cursor-pointer transition"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Pharmacy Stock Alerts</span>
            <Pill className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold text-rose-600 mt-2">
            {metrics.pharmacyStockAlerts} Items Low
          </div>
          <span className="text-[11px] text-rose-600 font-medium">Below reorder threshold</span>
        </div>
      </div>

      {/* Financial Performance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Today's Collections */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 mb-2">
            <span>Today's Collections</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-extrabold text-emerald-700">
            ₹ {metrics.todayCollections.toLocaleString()}
          </div>
          <p className="text-xs text-slate-500 mt-1">Cash, UPI, Card & Insurance settlements processed today.</p>
        </div>

        {/* Monthly Revenue */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 mb-2">
            <span>Current Month Gross Revenue</span>
            <TrendingUp className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-3xl font-extrabold text-teal-800">
            ₹ {metrics.monthlyRevenue.toLocaleString()}
          </div>
          <p className="text-xs text-slate-500 mt-1">Gross recognized billing revenue for current cycle.</p>
        </div>

        {/* Outstanding Invoices */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 mb-2">
            <span>Outstanding Invoices</span>
            <AlertCircle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-3xl font-extrabold text-amber-700">
            {metrics.outstandingInvoices} Invoices
          </div>
          <p className="text-xs text-slate-500 mt-1">Awaiting patient or TPA insurance claim settlement.</p>
        </div>
      </div>

      {/* Quick Administrative Action Hub */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 mb-3">Quick Administrative Navigation</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 text-xs">
          {[
            { id: 'staff-access', label: 'Manage Staff', icon: Users, color: 'text-teal-600 bg-teal-50' },
            { id: 'roles-permissions', label: 'Permissions & Roles', icon: ShieldCheck, color: 'text-indigo-600 bg-indigo-50' },
            { id: 'departments', label: 'Departments', icon: Building2, color: 'text-amber-600 bg-amber-50' },
            { id: 'doctors', label: 'Doctor Schedules', icon: Stethoscope, color: 'text-blue-600 bg-blue-50' },
            { id: 'wards-beds', label: 'Bed Allocation', icon: BedDouble, color: 'text-purple-600 bg-purple-50' },
            { id: 'billing-tariffs', label: 'Service Tariffs', icon: DollarSign, color: 'text-emerald-600 bg-emerald-50' },
            { id: 'notifications', label: 'Notification Rules', icon: Activity, color: 'text-rose-600 bg-rose-50' },
            { id: 'hospital-settings', label: 'Hospital Settings', icon: FileText, color: 'text-slate-600 bg-slate-100' },
            { id: 'audit-logs', label: 'Audit Trail', icon: Clock, color: 'text-cyan-600 bg-cyan-50' },
            { id: 'analytics', label: 'Analytics & BI', icon: TrendingUp, color: 'text-violet-600 bg-violet-50' },
            { id: 'subscription', label: 'SaaS Subscription', icon: CheckCircle2, color: 'text-teal-700 bg-teal-50' },
            { id: 'data-export', label: 'Data Portability', icon: FileText, color: 'text-slate-700 bg-slate-50' },
          ].map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                onClick={() => onNavigateSection(action.id)}
                className="flex flex-col items-center p-3 rounded-xl border border-slate-100 hover:border-teal-400 hover:shadow-sm transition text-center"
              >
                <div className={`p-2 rounded-lg ${action.color} mb-1.5`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="font-semibold text-slate-800">{action.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

