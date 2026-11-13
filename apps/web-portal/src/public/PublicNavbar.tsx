import React, { useState, useRef, useEffect } from 'react';
import {
  Building2,
  Stethoscope,
  BedDouble,
  Calendar,
  Activity,
  Layers,
  Pill,
  CreditCard,
  UserCheck,
  ClipboardList,
  Users,
  ChevronDown,
  Shield,
  Menu,
  X,
  ArrowRight,
  Lock,
  Siren,
  Scissors,
  Network,
  Sparkles,
  KeyRound,
  FileCheck2,
  HeartHandshake
} from 'lucide-react';
import { PortalType, useAuth } from '../context/AuthContext';

export interface RoleOption {
  slug: string;
  portal: PortalType;
  title: string;
  roleNumber: number;
  icon: React.ReactNode;
  description: string;
  category: 'clinical' | 'operational' | 'administrative' | 'patient';
}

export const ROLE_OPTIONS: RoleOption[] = [
  {
    slug: 'hospital-admin',
    portal: 'hospital-admin',
    title: 'Hospital Admin',
    roleNumber: 1,
    icon: <Building2 className="w-4 h-4 text-teal-600" />,
    description: 'Master governance, staff access & hospital operations',
    category: 'administrative'
  },
  {
    slug: 'doctor',
    portal: 'doctor',
    title: 'Doctor',
    roleNumber: 2,
    icon: <Stethoscope className="w-4 h-4 text-blue-600" />,
    description: 'OPD queue, SOAP notes & digital e-prescriptions',
    category: 'clinical'
  },
  {
    slug: 'nurse',
    portal: 'nursing',
    title: 'Nurse',
    roleNumber: 3,
    icon: <BedDouble className="w-4 h-4 text-emerald-600" />,
    description: 'Inpatient wards, bed census, vitals & medication administration',
    category: 'clinical'
  },
  {
    slug: 'receptionist',
    portal: 'reception',
    title: 'Receptionist',
    roleNumber: 4,
    icon: <Calendar className="w-4 h-4 text-amber-600" />,
    description: 'Token queue, patient registration & OPD appointments',
    category: 'operational'
  },
  {
    slug: 'laboratory',
    portal: 'laboratory',
    title: 'Laboratory',
    roleNumber: 5,
    icon: <Activity className="w-4 h-4 text-indigo-600" />,
    description: 'LIMS pathology tests, specimen tracking & result sign-off',
    category: 'clinical'
  },
  {
    slug: 'radiology',
    portal: 'radiology',
    title: 'Radiology',
    roleNumber: 6,
    icon: <Layers className="w-4 h-4 text-cyan-600" />,
    description: 'PACS/DICOM imaging, modalities & diagnostic reports',
    category: 'clinical'
  },
  {
    slug: 'pharmacist',
    portal: 'pharmacy',
    title: 'Pharmacist',
    roleNumber: 7,
    icon: <Pill className="w-4 h-4 text-rose-600" />,
    description: 'FEFO batch inventory, prescription dispensing & counter POS',
    category: 'operational'
  },
  {
    slug: 'finance',
    portal: 'finance',
    title: 'Finance & Accounts',
    roleNumber: 8,
    icon: <CreditCard className="w-4 h-4 text-emerald-700" />,
    description: 'Consolidated billing, payments, insurance TPA & GST',
    category: 'administrative'
  },
  {
    slug: 'hr',
    portal: 'hr',
    title: 'HR & Staff',
    roleNumber: 9,
    icon: <UserCheck className="w-4 h-4 text-teal-600" />,
    description: 'Workforce directory, duty rosters & staff attendance',
    category: 'administrative'
  },
  {
    slug: 'inventory',
    portal: 'inventory',
    title: 'Inventory & Procurement',
    roleNumber: 10,
    icon: <ClipboardList className="w-4 h-4 text-orange-600" />,
    description: 'Central hospital stores, purchase requisitions & suppliers',
    category: 'operational'
  },
  {
    slug: 'ot',
    portal: 'ot',
    title: 'Operation Theatre',
    roleNumber: 11,
    icon: <Scissors className="w-4 h-4 text-indigo-700" />,
    description: 'Surgery schedules, surgical teams & WHO safety checklists',
    category: 'clinical'
  },
  {
    slug: 'emergency',
    portal: 'emergency',
    title: 'Emergency & Trauma',
    roleNumber: 12,
    icon: <Siren className="w-4 h-4 text-red-600" />,
    description: 'Triage levels 1-5, resuscitation bays & code alerts',
    category: 'clinical'
  }
];

export interface PublicNavbarProps {
  onNavigate: (route: string) => void;
  activeRoute?: string;
}

export const PublicNavbar: React.FC<PublicNavbarProps> = ({ onNavigate, activeRoute = '/' }) => {
  const { user } = useAuth();
  const [appsDropdownOpen, setAppsDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setAppsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const enterprisePortals = [
    {
      id: 'staff',
      name: 'Hospital Staff Application',
      subdomain: 'app.asrtava.com',
      path: '/login/staff',
      icon: <Building2 className="w-5 h-5 text-teal-400" />,
      badge: 'Hospital Employees',
      badgeColor: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
      description: 'Doctors, Nurses, Reception, Pharmacy, Laboratory, Radiology, OT & Hospital Admin.',
      roles: ['Doctor', 'Nurse', 'Front Desk', 'Pharmacist', 'Lab Tech', 'Admin']
    },
    {
      id: 'patient',
      name: 'Patient Portal',
      subdomain: 'patient.asrtava.com',
      path: '/login/patient',
      icon: <Users className="w-5 h-5 text-blue-400" />,
      badge: 'Patients & Family',
      badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      description: 'Appointments, health records, lab reports, e-prescriptions, bills and follow-ups.',
      roles: ['Appointments', 'Prescriptions', 'Lab Scans', 'Invoices']
    },
    {
      id: 'network',
      name: 'Healthcare Coordination Network',
      subdomain: 'network.asrtava.com',
      path: '/login/coordination',
      icon: <Network className="w-5 h-5 text-amber-400" />,
      badge: 'Authorized Network',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      description: 'Inter-hospital emergency transfers, NOTTO organ donor matching & regional bed matrix.',
      roles: ['NOTTO Nodal', 'Transfer Dispatch', 'Bed Matrix', 'Blood Grid']
    },
    {
      id: 'admin',
      name: 'Platform Administration Console',
      subdomain: 'admin.asrtava.com',
      path: '/super-admin/login',
      icon: <Shield className="w-5 h-5 text-purple-400" />,
      badge: 'ASRTAVA Internal',
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      description: 'Customer organizations, perpetual license generation, deployment registry & zero-privilege audit.',
      roles: ['License Engine', 'Tri-Model Registry', 'JIT Support', 'Telemetry']
    }
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 text-white">
      {/* Top Banner: Ecosystem Notice */}
      <div className="bg-gradient-to-r from-teal-950 via-slate-900 to-indigo-950 border-b border-slate-800/80 px-4 py-1.5 text-[11px] text-slate-300 hidden sm:flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="font-semibold text-slate-200">ASRTAVA v1.0 Production Architecture</span>
          <span className="text-slate-500">&bull;</span>
          <span className="text-slate-400">Five Purpose-Built Applications &bull; Perpetual License &bull; Zero Cloud Lock-In</span>
        </div>
        <div className="flex items-center space-x-3 text-slate-400">
          <span className="hover:text-white transition cursor-pointer" onClick={() => onNavigate('/register-hospital')}>
            Request Deployment &rarr;
          </span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Brand */}
          <div
            onClick={() => onNavigate('/')}
            className="flex items-center space-x-3 cursor-pointer group"
          >
            <img
              src="/asrtava-logo.png"
              alt="ASRTAVA Logo"
              className="w-10 h-10 object-contain drop-shadow-md group-hover:scale-105 transition"
            />
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-black tracking-wider text-xl text-white">ASRTAVA</span>
                <span className="text-[10px] bg-teal-500/20 text-teal-300 font-bold px-2 py-0.5 rounded-full border border-teal-500/30">
                  ECOSYSTEM
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-medium tracking-wide block">
                Enterprise Hospital Management
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-7 text-xs font-semibold text-slate-300">
            <button
              onClick={() => {
                if (activeRoute !== '/') onNavigate('/');
                document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="hover:text-teal-400 transition cursor-pointer"
            >
              Clinical Modules
            </button>
            <button
              onClick={() => {
                if (activeRoute !== '/') onNavigate('/');
                document.getElementById('architecture')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="hover:text-teal-400 transition cursor-pointer"
            >
              Deployment & Security
            </button>
            <button
              onClick={() => {
                if (activeRoute !== '/') onNavigate('/');
                document.getElementById('benefits')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="hover:text-teal-400 transition cursor-pointer"
            >
              Perpetual Licensing
            </button>
            <button
              onClick={() => onNavigate('/onboarding')}
              className="hover:text-teal-400 transition cursor-pointer flex items-center space-x-1"
            >
              <FileCheck2 className="w-3.5 h-3.5 text-teal-400" />
              <span>Hospital Onboarding</span>
            </button>
            <button
              onClick={() => onNavigate('/login/coordination')}
              className="hover:text-amber-400 transition cursor-pointer flex items-center space-x-1"
            >
              <Network className="w-3.5 h-3.5 text-amber-400" />
              <span>Coordination Network</span>
            </button>
          </nav>

          {/* Right Action: Return to Workspace or Application Gateways */}
          <div className="hidden sm:flex items-center space-x-3">
            {user ? (
              <button
                onClick={() => onNavigate('portal')}
                className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-lg shadow-emerald-700/25 border border-emerald-500/30 transition transform active:scale-95 cursor-pointer"
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Return to Workspace ({user.firstName || 'User'})</span>
              </button>
            ) : null}

            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setAppsDropdownOpen(!appsDropdownOpen)}
                className="flex items-center space-x-2.5 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-lg shadow-teal-700/25 border border-teal-500/30 transition transform active:scale-95 cursor-pointer"
                aria-expanded={appsDropdownOpen}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Access Applications</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    appsDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* 4-App Gateway Dropdown Menu */}
              {appsDropdownOpen && (
                <div className="absolute right-0 mt-3 w-96 bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-800 p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-2 border-b border-slate-800 flex items-center justify-between mb-2">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-teal-400 block">
                        Select ASRTAVA Entry Point
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Dedicated secure portal for each stakeholder
                      </span>
                    </div>
                    <span className="text-[10px] bg-slate-800 font-mono font-bold text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                      4 Portals
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {enterprisePortals.map((app) => (
                      <button
                        key={app.id}
                        onClick={() => {
                          setAppsDropdownOpen(false);
                          onNavigate(app.path);
                        }}
                        className="w-full text-left p-3 rounded-xl hover:bg-slate-800/90 transition flex items-start space-x-3 group border border-transparent hover:border-slate-700"
                      >
                        <div className="p-2 rounded-xl bg-slate-800 group-hover:bg-slate-700/80 transition shrink-0 mt-0.5 border border-slate-700/60">
                          {app.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-xs font-bold text-white group-hover:text-teal-300 truncate">
                              {app.name}
                            </span>
                            <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded border ${app.badgeColor}`}>
                              {app.badge}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                            {app.subdomain}
                          </span>
                          <p className="text-[11px] text-slate-400 line-clamp-1 mt-1">
                            {app.description}
                          </p>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-teal-400 shrink-0 self-center" />
                      </button>
                    ))}
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-slate-800 px-2 flex items-center justify-between text-[11px] text-slate-400">
                    <span>New hospital deployment?</span>
                    <button
                      onClick={() => {
                        setAppsDropdownOpen(false);
                        onNavigate('/register-hospital');
                      }}
                      className="text-teal-400 hover:text-teal-300 font-bold hover:underline"
                    >
                      Onboard Facility &rarr;
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="flex lg:hidden items-center space-x-2">
            <button
              onClick={() => setAppsDropdownOpen(!appsDropdownOpen)}
              className="bg-teal-600 text-white text-xs font-bold py-2 px-3 rounded-lg flex items-center space-x-1"
            >
              <span>Portals</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-400 hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-slate-900 border-b border-slate-800 px-4 pt-3 pb-6 space-y-4">
          {user && (
            <div className="p-3 bg-teal-950/80 border border-teal-600/40 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-white">Active Session</p>
                <p className="text-[10px] text-teal-300">{user.firstName} {user.lastName}</p>
              </div>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onNavigate('portal');
                }}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition"
              >
                Return to Workspace
              </button>
            </div>
          )}

          <div className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">
            Enterprise Application Portals
          </div>
          <div className="grid grid-cols-1 gap-2">
            {enterprisePortals.map((app) => (
              <button
                key={app.id}
                onClick={() => {
                  setMobileMenuOpen(false);
                  onNavigate(app.path);
                }}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-800 text-left text-xs text-slate-200 hover:bg-slate-700"
              >
                <div className="flex items-center space-x-3">
                  {app.icon}
                  <div>
                    <div className="font-bold text-white">{app.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{app.subdomain}</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </button>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-800 flex justify-between text-xs">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onNavigate('/register-hospital');
              }}
              className="text-teal-400 font-bold"
            >
              Request Hospital Onboarding &rarr;
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default PublicNavbar;
