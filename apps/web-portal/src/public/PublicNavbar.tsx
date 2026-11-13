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
  Lock
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
    icon: <Building2 className="w-4 h-4 text-brand-600" />,
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
    description: 'Central store, purchase orders (PO) & GRN intake',
    category: 'operational'
  },
  {
    slug: 'patient',
    portal: 'patient',
    title: 'Patient',
    roleNumber: 11,
    icon: <Users className="w-4 h-4 text-sky-600" />,
    description: 'Self-service appointments, reports, e-prescriptions & bills',
    category: 'patient'
  }
];

interface PublicNavbarProps {
  onNavigate: (route: string) => void;
  activeRoute?: string;
}

export const PublicNavbar: React.FC<PublicNavbarProps> = ({ onNavigate, activeRoute = '/' }) => {
  const { user } = useAuth();
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setRoleDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectRole = (slug: string) => {
    setRoleDropdownOpen(false);
    setMobileMenuOpen(false);
    onNavigate(`/login/${slug}`);
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white">
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
                <span className="font-extrabold tracking-wider text-xl text-white">ASRTAVA</span>
                <span className="text-[10px] bg-teal-500/20 text-teal-300 font-bold px-2 py-0.5 rounded-full border border-teal-500/30">
                  ENTERPRISE
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-medium tracking-wide block">
                Hospital Management System
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-8 text-xs font-semibold text-slate-300">
            <button
              onClick={() => {
                if (activeRoute !== '/') onNavigate('/');
                const el = document.getElementById('features');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="hover:text-teal-400 transition"
            >
              Clinical Modules
            </button>
            <button
              onClick={() => {
                if (activeRoute !== '/') onNavigate('/');
                const el = document.getElementById('architecture');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="hover:text-teal-400 transition"
            >
              Enterprise Security
            </button>
            <button
              onClick={() => {
                if (activeRoute !== '/') onNavigate('/');
                const el = document.getElementById('benefits');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="hover:text-teal-400 transition"
            >
              Platform Benefits
            </button>
            <button
              onClick={() => {
                if (activeRoute !== '/') onNavigate('/');
                const el = document.getElementById('about');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="hover:text-teal-400 transition"
            >
              About ASRTAVA
            </button>
            <button
              onClick={() => {
                if (activeRoute !== '/') onNavigate('/');
                const el = document.getElementById('contact');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="hover:text-teal-400 transition"
            >
              Contact Support
            </button>
          </nav>

          {/* Right Action: Return to Workspace or ROLE SELECTOR DROPDOWN */}
          <div className="hidden sm:flex items-center space-x-3">
            {user && (
              <button
                onClick={() => onNavigate('portal')}
                className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-lg shadow-emerald-700/25 border border-emerald-500/30 transition transform active:scale-95 cursor-pointer"
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Return to Workspace ({user.firstName})</span>
              </button>
            )}

            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                className="flex items-center space-x-2 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-lg shadow-teal-700/25 border border-teal-500/30 transition transform active:scale-95 cursor-pointer"
                aria-expanded={roleDropdownOpen}
                aria-haspopup="true"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>{user ? 'Switch Role' : 'Login / Select Role'}</span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 ${
                    roleDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Role Dropdown Menu */}
              {roleDropdownOpen && (
                <div className="absolute right-0 mt-3 w-84 bg-white text-slate-900 rounded-2xl shadow-2xl border border-slate-200 py-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-teal-800 block">
                        Select Authorized Role
                      </span>
                      <span className="text-[10px] text-slate-500">
                        Redirects to dedicated login experience
                      </span>
                    </div>
                    <span className="text-[10px] bg-slate-100 font-mono font-bold text-slate-600 px-2 py-0.5 rounded">
                      11 Roles
                    </span>
                  </div>

                  <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 py-1">
                    {ROLE_OPTIONS.map((role) => (
                      <button
                        key={role.slug}
                        onClick={() => handleSelectRole(role.slug)}
                        className="w-full text-left px-4 py-2.5 hover:bg-teal-50/70 transition flex items-start space-x-3 group"
                      >
                        <div className="p-2 rounded-lg bg-slate-100 group-hover:bg-teal-100 transition shrink-0 mt-0.5">
                          {role.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-900 group-hover:text-teal-900 truncate">
                              {role.roleNumber}. {role.title}
                            </span>
                            <span className="text-[9px] uppercase font-semibold text-slate-400 group-hover:text-teal-700">
                              {role.category}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                            {role.description}
                          </p>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-teal-700 shrink-0 self-center" />
                      </button>
                    ))}
                  </div>

                  <div className="px-4 pt-2.5 pb-1 border-t border-slate-100 bg-slate-50 rounded-b-xl flex items-center justify-between text-[10px] text-slate-500">
                    <span>Platform Admin?</span>
                    <button
                      onClick={() => {
                        setRoleDropdownOpen(false);
                        onNavigate('/super-admin/login');
                      }}
                      className="text-purple-700 hover:text-purple-900 font-bold hover:underline"
                    >
                      Super Admin Login →
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="flex sm:hidden items-center space-x-2">
            <button
              onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
              className="bg-teal-600 text-white text-xs font-bold py-2 px-3 rounded-lg flex items-center space-x-1"
            >
              <span>Login</span>
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
        <div className="sm:hidden bg-slate-900 border-b border-slate-800 px-4 pt-3 pb-6 space-y-3">
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
            All Login Gateways
          </div>
          <div className="grid grid-cols-2 gap-2">
            {ROLE_OPTIONS.map((role) => (
              <button
                key={role.slug}
                onClick={() => handleSelectRole(role.slug)}
                className="flex items-center space-x-2 p-2 rounded-lg bg-slate-800 text-left text-xs text-slate-200 hover:bg-slate-700"
              >
                <span>{role.icon}</span>
                <span className="truncate">{role.title}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </header>
  );
};

