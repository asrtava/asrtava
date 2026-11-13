import React, { useState } from 'react';
import { useAuth, PortalType } from '../../context/AuthContext';
import {
  Activity,
  Calendar,
  Users,
  Shield,
  Stethoscope,
  Pill,
  CreditCard,
  Building2,
  ChevronDown,
  LogOut,
  Bell,
  Search,
  ClipboardList,
  Layers,
  BedDouble,
  UserCheck,
  Truck,
  Eye,
  FileText,
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  X,
  Menu,
  PhoneCall,
  ChevronRight,
  ExternalLink,
  Network,
  Scissors,
  Siren,
  HeartPulse,
  ShieldAlert,
  Lock,
  Megaphone,
  Sparkles,
  ArrowRightLeft,
  BarChart2,
  Radio,
  Scale,
  Package,
  Home,
  Mail,
} from 'lucide-react';
import { Modal } from '../ui/Modal';

interface AppShellProps {
  children: React.ReactNode;
}

interface PortalNavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: string;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const { user, activePortal, activePortalTab, setActivePortalTab, switchWorkspace, logout, setCurrentAuthView } = useAuth();
  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const portalLabels: Record<PortalType, { title: string; subtitle: string; icon: React.ReactNode; color: string; badgeColor: string }> = {
    'super-admin': { title: 'Super Admin Portal', subtitle: 'Platform Infrastructure & Tenants', icon: <Shield className="w-4 h-4" />, color: 'bg-purple-600', badgeColor: 'bg-purple-50 text-purple-700 border-purple-200' },
    'group-admin': { title: 'Group Admin Portal', subtitle: 'Centralized Multi-Hospital Operations', icon: <Network className="w-4 h-4" />, color: 'bg-indigo-700', badgeColor: 'bg-indigo-50 text-indigo-800 border-indigo-200' },
    'hospital-admin': { title: 'Hospital Admin Portal', subtitle: 'Executive Control & Governance', icon: <Building2 className="w-4 h-4" />, color: 'bg-brand-700', badgeColor: 'bg-teal-50 text-teal-800 border-teal-200' },
    'doctor': { title: 'Doctor Workspace', subtitle: 'Outpatient Clinic & EMR', icon: <Stethoscope className="w-4 h-4" />, color: 'bg-blue-600', badgeColor: 'bg-blue-50 text-blue-700 border-blue-200' },
    'nursing': { title: 'Nursing & Inpatient Ward', subtitle: 'e-MAR & Bedside Care', icon: <BedDouble className="w-4 h-4" />, color: 'bg-emerald-600', badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    'reception': { title: 'Reception & Registration', subtitle: 'Front Desk & Token Queue', icon: <Calendar className="w-4 h-4" />, color: 'bg-amber-600', badgeColor: 'bg-amber-50 text-amber-700 border-amber-200' },
    'laboratory': { title: 'Laboratory Diagnostics', subtitle: 'LIS & Specimen Accessioning', icon: <Activity className="w-4 h-4" />, color: 'bg-indigo-600', badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    'radiology': { title: 'Radiology & PACS', subtitle: 'Imaging Modalities & RIS', icon: <Layers className="w-4 h-4" />, color: 'bg-cyan-600', badgeColor: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
    'pharmacy': { title: 'Pharmacy & Dispensary', subtitle: 'FEFO Inventory & POS', icon: <Pill className="w-4 h-4" />, color: 'bg-rose-600', badgeColor: 'bg-rose-50 text-rose-700 border-rose-200' },
    'finance': { title: 'Finance & Accounts', subtitle: 'Invoices, Payments & TPA', icon: <CreditCard className="w-4 h-4" />, color: 'bg-emerald-700', badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
    'hr': { title: 'HR & Staff Roster', subtitle: 'Staff Directory & Duty Shifts', icon: <UserCheck className="w-4 h-4" />, color: 'bg-teal-600', badgeColor: 'bg-teal-50 text-teal-800 border-teal-200' },
    'inventory': { title: 'Central Inventory', subtitle: 'Purchase Orders & Warehouse', icon: <ClipboardList className="w-4 h-4" />, color: 'bg-orange-600', badgeColor: 'bg-orange-50 text-orange-700 border-orange-200' },
    'ot': { title: 'Operation Theatre', subtitle: 'Surgery Suites & Perioperative Care', icon: <Scissors className="w-4 h-4" />, color: 'bg-indigo-700', badgeColor: 'bg-indigo-50 text-indigo-800 border-indigo-200' },
    'emergency': { title: 'Emergency & Trauma', subtitle: 'ESI Triage, Resuscitation & Ambulance', icon: <Siren className="w-4 h-4" />, color: 'bg-rose-700', badgeColor: 'bg-rose-50 text-rose-800 border-rose-200' },
    'patient': { title: 'Patient Self-Service', subtitle: 'Personal Health Records & Bills', icon: <Users className="w-4 h-4" />, color: 'bg-sky-600', badgeColor: 'bg-sky-50 text-sky-700 border-sky-200' },
  };

  const portalNavs: Record<PortalType, PortalNavItem[]> = {
    'super-admin': [
      { id: 'telemetry', label: 'Platform Telemetry', icon: <Activity className="w-4 h-4" /> },
      { id: 'tenants', label: 'Hospital Tenants', icon: <Building2 className="w-4 h-4" />, badge: 'Active' },
      { id: 'invoices', label: 'SaaS Subscriptions', icon: <CreditCard className="w-4 h-4" /> },
      { id: 'plans', label: 'Subscription Plans', icon: <Shield className="w-4 h-4" /> },
      { id: 'jit-access', label: 'Security & JIT Approvals', icon: <Lock className="w-4 h-4" /> },
      { id: 'announcements', label: 'Platform Broadcasts', icon: <Megaphone className="w-4 h-4" /> },
      { id: 'onboarding', label: 'Customer Onboarding', icon: <Sparkles className="w-4 h-4" /> },
    ],
    'group-admin': [
      { id: 'overview', label: 'Group Operations', icon: <Activity className="w-4 h-4" /> },
      { id: 'hierarchy', label: 'Organizational Hierarchy', icon: <Layers className="w-4 h-4" /> },
      { id: 'transfers', label: 'Cross-Hospital Transfers', icon: <Truck className="w-4 h-4" /> },
      { id: 'stock', label: 'Inter-Branch Stock', icon: <ArrowRightLeft className="w-4 h-4" /> },
      { id: 'finance', label: 'Consolidated Finance', icon: <CreditCard className="w-4 h-4" /> },
      { id: 'doctors', label: 'Shared Doctor Schedules', icon: <Clock className="w-4 h-4" /> },
      { id: 'licensing', label: 'Enterprise Licensing', icon: <ShieldCheck className="w-4 h-4" /> },
    ],
    'hospital-admin': [
      { id: 'overview', label: 'Executive Overview', icon: <Activity className="w-4 h-4" /> },
      { id: 'staff-access', label: 'Staff Identity & Roles', icon: <Users className="w-4 h-4" /> },
      { id: 'roles-permissions', label: 'Roles & Permissions', icon: <Shield className="w-4 h-4" /> },
      { id: 'departments', label: 'Departments & Wings', icon: <Layers className="w-4 h-4" /> },
      { id: 'doctors', label: 'Doctors & Specialists', icon: <Stethoscope className="w-4 h-4" /> },
      { id: 'patients', label: 'Patients Directory', icon: <Users className="w-4 h-4" /> },
      { id: 'appointments', label: 'Appointments & Rules', icon: <Calendar className="w-4 h-4" /> },
      { id: 'wards-beds', label: 'Wards & Beds Census', icon: <BedDouble className="w-4 h-4" /> },
      { id: 'billing-tariffs', label: 'Tariffs & Pricing', icon: <CreditCard className="w-4 h-4" /> },
      { id: 'quality-accreditation', label: 'Quality & Accreditation', icon: <ShieldCheck className="w-4 h-4" /> },
      { id: 'analytics', label: 'Enterprise Analytics & BI', icon: <BarChart2 className="w-4 h-4" /> },
      { id: 'notifications', label: 'Notification Settings', icon: <Bell className="w-4 h-4" /> },
      { id: 'hospital-settings', label: 'Hospital Settings', icon: <FileText className="w-4 h-4" /> },
      { id: 'audit-logs', label: 'System Audit Logs', icon: <Clock className="w-4 h-4" /> },
    ],
    'doctor': [
      { id: 'opd', label: 'OPD Patient Queue', icon: <Users className="w-4 h-4" />, badge: 'Live' },
      { id: 'emr', label: 'Clinical EMR (SOAP)', icon: <ClipboardList className="w-4 h-4" /> },
      { id: 'prescriptions', label: 'e-Prescriptions', icon: <Pill className="w-4 h-4" /> },
      { id: 'diagnostics', label: 'Diagnostic Orders', icon: <Activity className="w-4 h-4" /> },
      { id: 'ipd-rounds', label: 'IPD Daily Rounds', icon: <BedDouble className="w-4 h-4" /> },
    ],
    'nursing': [
      { id: 'beds', label: 'Ward Census & Beds', icon: <BedDouble className="w-4 h-4" /> },
      { id: 'mar', label: 'e-MAR Administration', icon: <Pill className="w-4 h-4" /> },
      { id: 'care-plans', label: 'Nursing Care Plans', icon: <ClipboardList className="w-4 h-4" /> },
      { id: 'handover', label: 'SBAR Shift Handover', icon: <ArrowRightLeft className="w-4 h-4" /> },
      { id: 'advanced-hub', label: 'Advanced Nursing Hub', icon: <Activity className="w-4 h-4" /> },
      { id: 'ward-operations', label: 'Ward Operations', icon: <Layers className="w-4 h-4" /> },
    ],
    'reception': [
      { id: 'queue', label: 'Live Token Queue', icon: <Calendar className="w-4 h-4" />, badge: 'OPD' },
      { id: 'register', label: 'Patient Registration', icon: <Users className="w-4 h-4" /> },
      { id: 'admit', label: 'Inpatient Bed Admission', icon: <BedDouble className="w-4 h-4" /> },
      { id: 'schedule-appointment', label: 'Schedule Appointment', icon: <Clock className="w-4 h-4" /> },
      { id: 'quick-billing', label: 'Quick Consultation Billing', icon: <DollarSign className="w-4 h-4" /> },
    ],
    'pharmacy': [
      { id: 'queue', label: 'Prescription Queue', icon: <Pill className="w-4 h-4" />, badge: 'FEFO' },
      { id: 'inventory', label: 'Batch Stock Directory', icon: <ClipboardList className="w-4 h-4" /> },
      { id: 'advanced', label: 'Advanced Pharmacy Hub', icon: <Layers className="w-4 h-4" /> },
    ],
    'laboratory': [
      { id: 'advanced-hub', label: 'Advanced LIS Hub', icon: <Activity className="w-4 h-4" /> },
      { id: 'pending', label: 'Order Accessioning', icon: <ClipboardList className="w-4 h-4" /> },
      { id: 'verified', label: 'Pathologist Verification', icon: <CheckCircle2 className="w-4 h-4" /> },
    ],
    'radiology': [
      { id: 'worklist', label: 'Imaging Worklist', icon: <Layers className="w-4 h-4" /> },
      { id: 'reported', label: 'Reported & Signed', icon: <FileText className="w-4 h-4" /> },
      { id: 'advanced-hub', label: 'Advanced RIS Hub', icon: <Radio className="w-4 h-4" /> },
    ],
    'finance': [
      { id: 'invoices', label: 'Consolidated Billing', icon: <CreditCard className="w-4 h-4" /> },
      { id: 'insurance', label: 'TPA Insurance Desk', icon: <Building2 className="w-4 h-4" /> },
      { id: 'rcm', label: 'Revenue Cycle (RCM)', icon: <Scale className="w-4 h-4" /> },
    ],
    'hr': [
      { id: 'advanced_hrms', label: 'Advanced HRMS Hub', icon: <Users className="w-4 h-4" /> },
      { id: 'directory', label: 'Employee Directory', icon: <UserCheck className="w-4 h-4" /> },
      { id: 'roster', label: '3-Shift Duty Roster', icon: <Calendar className="w-4 h-4" /> },
      { id: 'leaves', label: 'Leave Authorizations', icon: <CheckCircle2 className="w-4 h-4" /> },
    ],
    'inventory': [
      { id: 'advanced_procurement', label: 'Advanced Procurement', icon: <Package className="w-4 h-4" /> },
      { id: 'orders', label: 'Purchase Orders (PO)', icon: <CreditCard className="w-4 h-4" /> },
      { id: 'catalog', label: 'Item Catalog & Buffers', icon: <ClipboardList className="w-4 h-4" /> },
      { id: 'alerts', label: 'Critical Stock Alerts', icon: <AlertTriangle className="w-4 h-4" /> },
    ],
    'ot': [
      { id: 'theatres', label: 'OT Room Status', icon: <Layers className="w-4 h-4" /> },
      { id: 'schedules', label: 'Surgical Schedules', icon: <Clock className="w-4 h-4" /> },
      { id: 'who_checklist', label: 'WHO Safety Checklist', icon: <ShieldCheck className="w-4 h-4" /> },
      { id: 'anaesthesia', label: 'Anaesthesia Charts', icon: <Activity className="w-4 h-4" /> },
      { id: 'counts', label: 'Surgical Counts', icon: <CheckCircle2 className="w-4 h-4" /> },
      { id: 'pacu', label: 'PACU Recovery', icon: <UserCheck className="w-4 h-4" /> },
    ],
    'emergency': [
      { id: 'triage_board', label: 'ESI Triage Board', icon: <Activity className="w-4 h-4" /> },
      { id: 'trauma_resus', label: 'ATLS Resuscitation', icon: <HeartPulse className="w-4 h-4" /> },
      { id: 'ambulance', label: 'Ambulance & PCR', icon: <Truck className="w-4 h-4" /> },
      { id: 'stat_orders', label: 'STAT Overrides', icon: <CheckCircle2 className="w-4 h-4" /> },
      { id: 'mlc', label: 'Medico-Legal (MLC)', icon: <ShieldAlert className="w-4 h-4" /> },
    ],
    'patient': [
      { id: 'overview', label: 'Health Timeline', icon: <Activity className="w-4 h-4" /> },
      { id: 'prescriptions', label: 'Digital Prescriptions', icon: <Pill className="w-4 h-4" /> },
      { id: 'reports', label: 'Diagnostic Reports', icon: <FileText className="w-4 h-4" /> },
      { id: 'bills', label: 'Invoices & Receipts', icon: <CreditCard className="w-4 h-4" /> },
      { id: 'telemedicine', label: 'Telemedicine Consult', icon: <Radio className="w-4 h-4" /> },
    ],
  };

  const userInitials = user ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() || 'U' : 'U';

  return (
    <div className="h-screen flex flex-col bg-slate-50 font-sans text-slate-900 overflow-hidden">
      {/* Enterprise Top Navigation Bar */}
      <header className="h-16 shrink-0 bg-navy-900 text-white flex items-center justify-between px-4 md:px-6 border-b border-navy-800 shadow-md z-50 relative top-0">
        {/* Left: Mobile Toggle + Brand Logo + Tenant Badge */}
        <div className="flex items-center space-x-3 md:space-x-5">
          <button
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            aria-label="Toggle Navigation Drawer"
            className="md:hidden p-1.5 text-slate-300 hover:text-white hover:bg-navy-800 rounded-lg transition"
          >
            <Menu className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={() => setCurrentAuthView('public-home')}
            className="flex items-center space-x-2.5 group cursor-pointer text-left focus:outline-none"
            title="Back to Home page"
          >
            <img
              src="/asrtava-logo.png"
              alt="ASRTAVA Logo"
              className="w-8 h-8 object-contain shrink-0 group-hover:scale-105 transition"
            />
            <div className="flex flex-col">
              <span className="font-bold tracking-wider text-sm md:text-base text-white leading-tight">ASRTAVA</span>
              <span className="text-[10px] text-teal-400 font-semibold tracking-widest uppercase">Healthcare HMS</span>
            </div>
          </button>

          {/* Hospital Tenant Indicator */}
          {user?.hospitalName && (
            <div className="hidden lg:flex items-center space-x-2 text-xs bg-navy-800 text-slate-200 py-1 px-3 rounded-full border border-navy-700">
              <Building2 className="w-3.5 h-3.5 text-brand-400 shrink-0" />
              <span className="font-medium truncate max-w-[200px]">{user.hospitalName}</span>
            </div>
          )}
        </div>

        {/* Center: Breadcrumbs & Current Portal Badge */}
        <div className="hidden xl:flex items-center space-x-2 text-xs text-slate-300">
          <span className="text-slate-400">Workspace</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
          <span className="font-semibold text-white">{portalLabels[activePortal]?.title}</span>
        </div>

        {/* Right: Quick Search + Multi-Role Switcher + Home + My Profile + Notifications + User Avatar */}
        <div className="flex items-center space-x-2 md:space-x-2.5">
          {/* Quick Home Navigation */}
          <button
            type="button"
            onClick={() => setCurrentAuthView('public-home')}
            className="flex items-center space-x-1.5 bg-navy-800 hover:bg-navy-700 text-slate-200 hover:text-white text-xs py-1.5 px-2.5 rounded-lg border border-navy-700 transition cursor-pointer"
            title="Back to Public Homepage"
          >
            <Home className="w-3.5 h-3.5 text-brand-400" />
            <span className="hidden md:inline font-medium">Home</span>
          </button>

          {/* Direct My Profile Button */}
          <button
            type="button"
            onClick={() => setProfileModalOpen(true)}
            className="flex items-center space-x-1.5 bg-navy-800 hover:bg-navy-700 text-slate-200 hover:text-white text-xs py-1.5 px-2.5 rounded-lg border border-navy-700 transition cursor-pointer"
            title="My Profile & System Credentials"
          >
            <Users className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden md:inline font-medium">My Profile</span>
          </button>

          {/* Quick Search Shortcut */}
          <button
            onClick={() => setSearchModalOpen(true)}
            className="hidden sm:flex items-center space-x-2 bg-navy-800 hover:bg-navy-700 text-slate-300 hover:text-white text-xs py-1.5 px-3 rounded-lg border border-navy-700 transition"
          >
            <Search className="w-3.5 h-3.5 text-brand-400" />
            <span className="text-slate-300">Search UHID, Doctor, Rx...</span>
            <kbd className="bg-navy-900 text-[10px] px-1.5 py-0.5 rounded text-slate-400 border border-navy-700 font-mono">⌘K</kbd>
          </button>

          {/* Workspace Switcher (Multi-Role Users) */}
          {user && user.authorizedPortals && user.authorizedPortals.length > 1 && (
            <div className="relative">
              <button
                onClick={() => setWorkspaceMenuOpen(!workspaceMenuOpen)}
                className="flex items-center space-x-2 bg-navy-800 hover:bg-navy-700 text-slate-200 text-xs py-1.5 px-2.5 rounded-lg border border-navy-700 transition"
              >
                <span className={`w-2 h-2 rounded-full ${portalLabels[activePortal]?.color || 'bg-brand-500'}`} />
                <span className="hidden md:inline font-medium">{portalLabels[activePortal]?.title}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {workspaceMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-navy-900 border border-navy-700 rounded-xl shadow-2xl py-2 z-50 divide-y divide-navy-800">
                  <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Switch Authorized Role
                  </div>
                  <div className="py-1">
                    {user.authorizedPortals.map((p) => (
                      <button
                        key={p}
                        onClick={() => {
                          switchWorkspace(p);
                          setWorkspaceMenuOpen(false);
                        }}
                        className={`w-full flex items-center space-x-3 px-3 py-2 text-xs text-left transition ${
                          activePortal === p
                            ? 'bg-brand-600/20 text-brand-400 font-semibold'
                            : 'text-slate-300 hover:bg-navy-800'
                        }`}
                      >
                        {portalLabels[p]?.icon}
                        <span>{portalLabels[p]?.title}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Notifications Center */}
          <div className="relative">
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              aria-label="Open Notifications"
              className="p-2 text-slate-300 hover:text-white hover:bg-navy-800 rounded-lg relative transition"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-navy-900" />
            </button>

            {notificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-elevated py-2.5 z-50 text-slate-900 text-xs">
                <div className="flex items-center justify-between px-4 pb-2 border-b border-slate-100 font-bold">
                  <span className="text-slate-900">Clinical & System Alerts</span>
                  <span className="text-[10px] text-brand-700 hover:underline cursor-pointer">Mark all read</span>
                </div>
                <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                  <div className="p-3 hover:bg-slate-50 transition cursor-pointer">
                    <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                      Critical Panic Lab Value
                    </div>
                    <div className="text-[11px] text-slate-600 mt-0.5">Potassium 6.8 mEq/L for Rajesh Patel (UHID SIM-PT-00100).</div>
                    <div className="text-[10px] text-slate-400 mt-1">2 mins ago • Dr. Sharma notified</div>
                  </div>
                  <div className="p-3 hover:bg-slate-50 transition cursor-pointer">
                    <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
                      e-Prescription Dispense Ready
                    </div>
                    <div className="text-[11px] text-slate-600 mt-0.5">RX-2026-0091 dispensed via FEFO batch BAT-2026-B.</div>
                    <div className="text-[10px] text-slate-400 mt-1">8 mins ago • Central Pharmacy</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Avatar & Dropdown */}
          <div className="relative border-l border-navy-800 pl-2.5 md:pl-3.5">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center space-x-2 text-left focus:outline-none"
            >
              <div className="w-8 h-8 rounded-full bg-brand-700 border border-brand-500 flex items-center justify-center text-xs font-bold text-white shadow-xs">
                {userInitials}
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-semibold text-white leading-tight truncate max-w-[120px]">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-[10px] text-slate-400 capitalize">
                  {user?.userType ? user.userType.replace('_', ' ') : 'Staff'}
                </p>
              </div>
              <ChevronDown className="w-3 h-3 text-slate-400 hidden sm:block" />
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-white border border-slate-200 rounded-xl shadow-elevated py-1.5 z-50 text-xs">
                <div className="px-3.5 py-2 border-b border-slate-100">
                  <p className="font-bold text-slate-900">{user?.firstName} {user?.lastName}</p>
                  <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                  <div className="mt-1">
                    <span className="inline-block text-[9px] font-bold px-2 py-0.5 rounded-full bg-brand-50 text-brand-800 border border-brand-200">
                      Active: {portalLabels[activePortal]?.title}
                    </span>
                  </div>
                </div>
                <div className="py-1">
                  <button
                    type="button"
                    onClick={() => {
                      setUserMenuOpen(false);
                      setProfileModalOpen(true);
                    }}
                    className="w-full flex items-center gap-2 px-3.5 py-2 text-slate-700 hover:bg-slate-50 transition text-left cursor-pointer"
                  >
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span>My Profile</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setUserMenuOpen(false);
                      setCurrentAuthView('public-home');
                    }}
                    className="w-full flex items-center gap-2 px-3.5 py-2 text-slate-700 hover:bg-slate-50 transition text-left cursor-pointer"
                  >
                    <Home className="w-3.5 h-3.5 text-slate-400" />
                    <span>Back to Home page</span>
                  </button>
                </div>
                <div className="border-t border-slate-100 pt-1">
                  <button
                    onClick={logout}
                    className="w-full flex items-center gap-2 px-3.5 py-2 text-rose-600 hover:bg-rose-50 transition font-semibold"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Secure Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Global Quick Search Modal */}
      {searchModalOpen && (
        <div className="fixed inset-0 z-[70] bg-navy-950/70 backdrop-blur-xs flex items-start justify-center pt-20 p-4">
          <div className="w-full max-w-xl bg-white rounded-2xl shadow-modal border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-200 flex items-center space-x-3">
              <Search className="w-5 h-5 text-brand-600" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Type patient name, UHID (e.g. SIM-PT-00100), Doctor, Rx..."
                className="w-full text-xs text-slate-900 placeholder-slate-400 focus:outline-none"
              />
              <button
                onClick={() => setSearchModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
                aria-label="Close search"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 bg-slate-50 text-[11px] text-slate-500 flex justify-between items-center">
              <span>Press <kbd className="bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-700">ESC</kbd> to close</span>
              <span className="font-semibold text-brand-700">Scoped strictly to active tenant</span>
            </div>
          </div>
        </div>
      )}

      {/* User Profile Modal */}
      <Modal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        title="My Profile & System Identity"
        description="Active account credentials, multi-role workspaces, and tenant security status."
        maxWidth="lg"
        footer={
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center space-x-1.5 text-[11px] text-slate-500">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Argon2id + JWT Session Verified</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => {
                  setProfileModalOpen(false);
                  logout();
                }}
                className="px-3.5 py-2 text-rose-600 hover:bg-rose-50 text-xs font-semibold rounded-xl border border-rose-200 transition cursor-pointer flex items-center space-x-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
              <button
                type="button"
                onClick={() => setProfileModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-xl shadow-xs transition cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        }
      >
        {user && (
          <div className="space-y-4">
            {/* Header Avatar & Identity */}
            <div className="flex items-center space-x-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-brand-700 to-brand-500 text-white font-bold text-lg flex items-center justify-center shadow-md shrink-0">
                {userInitials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <h4 className="text-base font-bold text-slate-900 truncate">
                    {user.firstName} {user.lastName}
                  </h4>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-brand-100 text-brand-800 border border-brand-200">
                    {user.userType ? user.userType.replace('_', ' ') : 'Staff'}
                  </span>
                </div>
                <p className="text-xs text-slate-600 flex items-center gap-1.5 mt-0.5 truncate">
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{user.email}</span>
                </p>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                  UID: {user.id}
                </p>
              </div>
            </div>

            {/* Grid of Hospital Organization & Active Portal */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Hospital Organization</span>
                <div className="flex items-center space-x-2 mt-1">
                  <Building2 className="w-4 h-4 text-brand-600 shrink-0" />
                  <span className="font-semibold text-slate-900 truncate">{user.hospitalName || 'ASRTAVA Healthcare Network'}</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono block mt-1">
                  Tenant: {user.hospitalId || 'GLOBAL_ROOT'}
                </span>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Active Workspace</span>
                <div className="flex items-center space-x-2 mt-1">
                  <div className={`p-1 rounded-md text-white ${portalLabels[activePortal]?.color || 'bg-brand-600'}`}>
                    {portalLabels[activePortal]?.icon}
                  </div>
                  <span className="font-semibold text-slate-900 truncate">{portalLabels[activePortal]?.title}</span>
                </div>
                <span className="text-[10px] text-teal-700 font-medium block mt-1">
                  PostgreSQL RLS Context Enforced
                </span>
              </div>
            </div>

            {/* Authorized Workspaces Quick Switcher */}
            <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Authorized Workspaces ({user.authorizedPortals?.length || 0})
                </span>
                <span className="text-[10px] text-slate-400">Click to switch workspace</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {user.authorizedPortals?.map((portalKey) => {
                  const meta = portalLabels[portalKey];
                  const isCurrent = portalKey === activePortal;
                  return (
                    <button
                      key={portalKey}
                      type="button"
                      onClick={() => {
                        switchWorkspace(portalKey);
                        setProfileModalOpen(false);
                      }}
                      className={`flex items-center justify-between p-2 rounded-lg border text-left transition cursor-pointer ${
                        isCurrent
                          ? 'bg-teal-50 border-teal-300 text-teal-900 shadow-xs ring-1 ring-teal-200'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center space-x-2 truncate">
                        <span className={`p-1 rounded text-white ${meta?.color || 'bg-slate-600'}`}>
                          {meta?.icon}
                        </span>
                        <span className="text-xs font-semibold truncate">{meta?.title || portalKey}</span>
                      </div>
                      {isCurrent && (
                        <span className="text-[9px] font-bold uppercase tracking-wider text-teal-700 bg-teal-100 px-1.5 py-0.5 rounded">
                          Active
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Security, Permissions & Compliance Meta */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Security & Access Governance</span>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500">Assigned System Roles:</span>
                <span className="font-semibold text-slate-800">{user.assignedRoles?.join(', ') || 'Standard User'}</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500">Identity & Crypto:</span>
                <span className="font-semibold text-slate-800">Argon2id + RS256 Bearer Token</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500">Data Isolation:</span>
                <span className="font-semibold text-emerald-700">DPDP & ABDM M1/M2/M3 Tenant Partitioning</span>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Main Layout Container */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Mobile Navigation Drawer Backdrop */}
        {mobileSidebarOpen && (
          <div
            className="fixed inset-0 top-16 bg-navy-950/60 z-30 md:hidden backdrop-blur-xs"
            onClick={() => setMobileSidebarOpen(false)}
          />
        )}

        {/* Sidebar Navigation */}
        <aside
          className={`fixed top-16 bottom-0 left-0 z-30 w-64 bg-white border-r border-slate-200 p-4 flex flex-col justify-between overflow-y-auto shrink-0 transform transition-transform duration-200 ease-in-out md:static md:top-auto md:bottom-auto md:h-full md:translate-x-0 ${
            mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="space-y-6">
            {/* Active Workspace Tag */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Workspace</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${portalLabels[activePortal]?.badgeColor}`}>
                  Active
                </span>
              </div>
              <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                {portalLabels[activePortal]?.icon}
                <span>{portalLabels[activePortal]?.title}</span>
              </h3>
              <p className="text-[10px] text-slate-500">{portalLabels[activePortal]?.subtitle}</p>
            </div>

            {/* Navigation Menu */}
            <nav className="space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-2">
                Operational Modules
              </div>
              {(portalNavs[activePortal] || []).map((item) => {
                const isActive = activePortalTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActivePortalTab(item.id);
                      window.dispatchEvent(
                        new CustomEvent('asrtava:navigate-tab', {
                          detail: { tab: item.id, portal: activePortal }
                        })
                      );
                      setMobileSidebarOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition cursor-pointer text-left ${
                      isActive
                        ? 'text-teal-900 bg-teal-50/90 font-bold border-l-4 border-teal-600 pl-2 shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <span className={isActive ? 'text-teal-700 font-bold' : 'text-slate-400'}>{item.icon}</span>
                      <span className={isActive ? 'font-bold text-slate-900' : ''}>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                        isActive ? 'bg-teal-200 text-teal-800' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Sidebar Footer: Emergency Dispatch + Architecture Status */}
          <div className="border-t border-slate-200 pt-4 space-y-2.5">
            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-between text-rose-800">
              <div className="flex items-center gap-2 text-xs font-bold">
                <PhoneCall className="w-3.5 h-3.5 text-rose-600" />
                <span>Cas Triage Hotline</span>
              </div>
              <span className="text-[10px] font-bold bg-rose-200/60 px-1.5 py-0.5 rounded">Ext 108</span>
            </div>

            <div className="text-center">
              <span className="text-[10px] text-slate-400 block font-medium">ASRTAVA v1.0.0 Enterprise HMS</span>
              <span className="text-[9px] text-emerald-600 font-semibold flex items-center justify-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Kernel RLS Enforced
              </span>
            </div>
          </div>
        </aside>

        {/* Content View Container */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
