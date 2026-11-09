import React from 'react';
import {
  Shield,
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
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Lock,
  Server,
  Zap,
  Phone,
  Mail,
  MapPin,
  Clock,
  HeartPulse,
  Database
} from 'lucide-react';
import { PublicNavbar, ROLE_OPTIONS } from './PublicNavbar';

interface PublicHomePageProps {
  onNavigate: (route: string) => void;
}

export const PublicHomePage: React.FC<PublicHomePageProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-teal-100 selection:text-teal-900">
      {/* 1. Main Navigation Bar with Role Dropdown */}
      <PublicNavbar onNavigate={onNavigate} activeRoute="/" />

      {/* 2. Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white pt-16 pb-24 md:pt-24 md:pb-32">
        {/* Subtle Background Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-teal-500/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto space-y-6">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-semibold animate-pulse">
              <ShieldCheck className="w-4 h-4 text-teal-400" />
              <span>Production-Ready Multi-Tenant Healthcare Technology Platform</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white leading-tight">
              Enterprise Hospital Management System with{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400">
                Zero Hardcoded Business Data
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
              ASRTAVA empowers healthcare systems with 12 unified role-based workspaces, strict PostgreSQL Row-Level Security, FEFO pharmacy automation, and end-to-end clinical compliance.
            </p>

            {/* Call to Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <button
                onClick={() => onNavigate('/login/hospital-admin')}
                className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white font-bold rounded-xl shadow-xl shadow-teal-700/25 border border-teal-500/30 flex items-center justify-center space-x-2 transition"
              >
                <Building2 className="w-4 h-4" />
                <span>Hospital Admin Portal</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => onNavigate('/login/doctor')}
                className="w-full sm:w-auto px-6 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl border border-slate-700 flex items-center justify-center space-x-2 transition"
              >
                <Stethoscope className="w-4 h-4 text-blue-400" />
                <span>Doctor Workspace</span>
              </button>

              <button
                onClick={() => onNavigate('/login/patient')}
                className="w-full sm:w-auto px-6 py-3.5 bg-sky-950/60 hover:bg-sky-900/80 text-sky-300 font-bold rounded-xl border border-sky-800/60 flex items-center justify-center space-x-2 transition"
              >
                <Users className="w-4 h-4" />
                <span>Patient Portal</span>
              </button>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-12 border-t border-slate-800 text-left">
              <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800">
                <div className="text-2xl font-bold text-teal-400">12 Portals</div>
                <div className="text-xs text-slate-400 mt-1">Role-Specific Workspaces</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800">
                <div className="text-2xl font-bold text-emerald-400">100% Dynamic</div>
                <div className="text-xs text-slate-400 mt-1">Real Database Hydration</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800">
                <div className="text-2xl font-bold text-cyan-400">Kernel RLS</div>
                <div className="text-xs text-slate-400 mt-1">PostgreSQL Tenant Isolation</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800">
                <div className="text-2xl font-bold text-purple-400">DPDP Act 2023</div>
                <div className="text-xs text-slate-400 mt-1">Privacy & Merkle Audit Trail</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Product Introduction & Architecture */}
      <section id="architecture" className="py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-100/70 px-3 py-1 rounded-full">
              Enterprise Healthcare Architecture
            </span>
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
              Hospital Admin Controlled Access & Zero Standing Privilege
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Every staff identity belongs to a strict tenant boundary. Selecting a role never grants automatic access; credentials, hospital membership, assigned roles, and explicit permission overrides are strictly enforced by the backend on every request.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-14">
            <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold">
                <Building2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Hospital Admin Controlled Staff</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Only the authorized Hospital Admin can onboard staff, assign roles, configure individual ALLOW/DENY permission overrides, deactivate accounts, and revoke active sessions.
              </p>
            </div>

            <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Strict Multi-Factor Identity</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Centralized staff identity supports multi-role users (e.g., Doctor who is also Head of Department) with safe workspace selectors and progressive rate-limited authentication.
              </p>
            </div>

            <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center font-bold">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Explicit DENY Precedence</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Fine-grained permissions follow the strict rule: Explicit Deny &gt; Explicit Allow &gt; Role RBAC &gt; Default Deny. Deactivated or suspended accounts are locked out immediately.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Hospital Management Features (12 Role Workspaces) */}
      <section id="features" className="py-20 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-100/70 px-3 py-1 rounded-full">
              Comprehensive Clinical & Operational Modules
            </span>
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
              11 Dedicated Workspaces Accessible via Navbar Role Selector
            </h2>
            <p className="text-sm text-slate-600">
              Click any workspace below or use the <strong>Login / Select Role</strong> dropdown in the top navbar to proceed to the authenticated gateway.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-14">
            {ROLE_OPTIONS.map((role) => (
              <div
                key={role.slug}
                onClick={() => onNavigate(`/login/${role.slug}`)}
                className="p-5 rounded-2xl border border-slate-200 hover:border-teal-500 bg-white hover:bg-teal-50/20 shadow-xs hover:shadow-md transition cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2.5 rounded-xl bg-slate-100 group-hover:bg-teal-100 transition">
                      {role.icon}
                    </div>
                    <span className="text-[10px] font-mono font-bold text-slate-400 group-hover:text-teal-700">
                      #{role.roleNumber}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-teal-900">
                    {role.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                    {role.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-teal-700 group-hover:text-teal-800">
                  <span>Sign In as {role.title}</span>
                  <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Enterprise Benefits */}
      <section id="benefits" className="py-20 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-400 bg-teal-400/10 px-3 py-1 rounded-full border border-teal-400/20">
                Enterprise Advantage
              </span>
              <h2 className="text-3xl font-bold tracking-tight text-white">
                Engineered for High-Consequence Healthcare Environments
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                Unlike generic clinic software, ASRTAVA provides hospital networks with full clinical decision support, strict tenant data isolation, statutory audit ledgers, and zero hardcoded records.
              </p>

              <div className="space-y-3 text-xs text-slate-300">
                <div className="flex items-center space-x-3">
                  <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                  <span><strong>Zero Hardcoded Records:</strong> Form dropdowns, staff rosters, tariffs, and bed maps dynamically query PostgreSQL.</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                  <span><strong>FEFO Drug Dispensation:</strong> Automatic First-Expiry-First-Out decrementing prevents expiry wastage.</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                  <span><strong>Cryptographic Merkle Audit:</strong> Immutable block chaining detects any unauthorized tampering with patient history.</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                  <span><strong>Interoperability:</strong> Built-in HL7 v2.5.1 ORU^R01, FHIR R4, and DICOMweb WADO-RS viewers.</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/60 p-8 rounded-3xl border border-slate-700/80 shadow-2xl space-y-4">
              <div className="flex items-center space-x-3 text-xs text-teal-300 font-mono">
                <Database className="w-4 h-4" />
                <span>POSTGRESQL KERNEL ROW-LEVEL SECURITY</span>
              </div>
              <div className="bg-slate-950 p-4 rounded-xl font-mono text-[11px] text-teal-400 space-y-1">
                <div className="text-slate-500">-- Kernel-level multi-tenant isolation</div>
                <div>CREATE POLICY tenant_isolation_patients ON patients</div>
                <div className="pl-4">FOR ALL USING (</div>
                <div className="pl-8 text-white">hospital_id = current_setting('app.current_tenant_id')::uuid</div>
                <div className="pl-8 text-teal-300">OR current_setting('app.is_super_admin') = 'true'</div>
                <div className="pl-4">);</div>
              </div>
              <p className="text-xs text-slate-400">
                Guarantees complete database-level separation so Hospital A can never view or manipulate records belonging to Hospital B.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. About Section */}
      <section id="about" className="py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-100/70 px-3 py-1 rounded-full">
              About ASRTAVA
            </span>
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
              Mission-Critical Healthcare Technology
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              ASRTAVA was founded to bridge the gap between disjointed clinical departments and corporate hospital administration. By uniting outpatient scheduling, emergency triage, inpatient wards, pathology diagnostics, modality radiology, pharmacy supply chains, and patient self-service under a centralized permission engine, we eliminate friction and enhance patient clinical outcomes.
            </p>
          </div>
        </div>
      </section>

      {/* 7. Contact Information */}
      <section id="contact" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-teal-900 to-slate-900 rounded-3xl p-8 sm:p-12 text-white shadow-xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-teal-300">
                  24/7 Clinical & Technical Support Desk
                </span>
                <h3 className="text-2xl font-bold text-white mt-1">
                  Connect with ASRTAVA Hospital Systems Team
                </h3>
                <p className="text-xs text-teal-100/80 mt-2 leading-relaxed">
                  For tenant provisioning, emergency technical support, API integrations, or Hospital Admin onboarding assistance.
                </p>

                <div className="mt-6 space-y-3 text-xs text-teal-100">
                  <div className="flex items-center space-x-3">
                    <Phone className="w-4 h-4 text-teal-400" />
                    <span>Emergency NOC: +91 (800) 277-8282 / Toll-Free 24x7</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Mail className="w-4 h-4 text-teal-400" />
                    <span>Operations: support@asrtava.hospital | enterprise@asrtava.hospital</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <MapPin className="w-4 h-4 text-teal-400" />
                    <span>Cyber City Tech Hub, Tower 4, Healthcare Solutions Wing</span>
                  </div>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/10 space-y-3 text-xs">
                <div className="font-bold text-white text-sm">Authorized Hospital Portal Access</div>
                <p className="text-teal-100/90 text-xs">
                  Hospital staff must access portals using their authorized official credentials issued by their Hospital Administrator.
                </p>
                <button
                  onClick={() => onNavigate('/login/hospital-admin')}
                  className="w-full py-2.5 px-4 bg-teal-500 hover:bg-teal-400 text-slate-900 font-bold rounded-xl transition shadow-md"
                >
                  Sign In as Hospital Administrator →
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. Footer */}
      <footer className="bg-slate-950 text-slate-400 text-xs py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center font-bold text-white text-sm">
                A
              </div>
              <div>
                <span className="font-bold text-white tracking-wider">ASRTAVA</span>
                <span className="text-[10px] text-teal-400 ml-2 font-mono">v1.0.0-RC1</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-6 text-[11px] text-slate-400">
              <a href="#architecture" className="hover:text-white transition">Architecture</a>
              <a href="#features" className="hover:text-white transition">Workspaces</a>
              <a href="#benefits" className="hover:text-white transition">Kernel RLS</a>
              <a href="#contact" className="hover:text-white transition">24x7 NOC</a>
              <span className="text-slate-600">|</span>
              <button onClick={() => onNavigate('/super-admin/login')} className="hover:text-purple-400 transition font-semibold">
                Super Admin Login
              </button>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row justify-between items-center text-[11px] text-slate-400 gap-4">
            <div>
              © 2026 ASRTAVA Health Technology Systems Inc. All rights reserved.
            </div>
            <div className="flex items-center space-x-2 text-[10px] text-teal-500">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>DPDP Act 2023 · ISO 27001 · HIPAA Architecture Aligned</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

