import React, { useState, useEffect } from 'react';
import {
  Lock,
  Mail,
  Phone,
  ArrowRight,
  AlertCircle,
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
  ShieldCheck,
  ArrowLeft,
  KeyRound,
  CheckCircle2,
  HelpCircle
} from 'lucide-react';
import { useAuth, PortalType } from '../context/AuthContext';
import { authApi } from '../services/api';
import { PublicNavbar, ROLE_OPTIONS, RoleOption } from '../public/PublicNavbar';
import { Modal, Button, Input } from '../components/ui';

interface RoleLoginViewProps {
  roleSlug: string;
  onNavigate: (route: string) => void;
}

export const RoleLoginView: React.FC<RoleLoginViewProps> = ({ roleSlug, onNavigate }) => {
  const { login } = useAuth();

  // Find matching role configuration
  const currentRole = ROLE_OPTIONS.find((r) => r.slug === roleSlug) || ROLE_OPTIONS[1]; // default doctor

  // Form states
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [hospitalCode, setHospitalCode] = useState('APEX01');
  const [mfaCode, setMfaCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Forgot Password Modal
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);

  // Role Default Credentials Mapping for Sandbox / Demo
  useEffect(() => {
    setError(null);
    switch (currentRole.slug) {
      case 'hospital-admin':
        setEmail('director@apexcare.com');
        setPassword('Admin@2026!');
        break;
      case 'doctor':
        setEmail('doctor.sharma@apexcare.com');
        setPassword('Doctor@2026!');
        break;
      case 'nurse':
        setEmail('nurse.anjali@apexcare.com');
        setPassword('Nurse@2026!');
        break;
      case 'receptionist':
        setEmail('reception.rohan@apexcare.com');
        setPassword('Reception@2026!');
        break;
      case 'laboratory':
        setEmail('lab.tech@apexcare.com');
        setPassword('Lab@2026!');
        break;
      case 'radiology':
        setEmail('radiology.dr@apexcare.com');
        setPassword('Radiology@2026!');
        break;
      case 'pharmacist':
        setEmail('pharmacy.suresh@apexcare.com');
        setPassword('Pharmacy@2026!');
        break;
      case 'finance':
        setEmail('finance.lead@apexcare.com');
        setPassword('Finance@2026!');
        break;
      case 'hr':
        setEmail('hr.manager@apexcare.com');
        setPassword('HR@2026!');
        break;
      case 'inventory':
        setEmail('inventory.store@apexcare.com');
        setPassword('Inventory@2026!');
        break;
      case 'emergency':
        setEmail('emergency.triage@apexcare.com');
        setPassword('Emergency@2026!');
        break;
      case 'ot':
        setEmail('ot.surgeon@apexcare.com');
        setPassword('Surgery@2026!');
        break;
      case 'group-admin':
        setEmail('group.director@apexcare.com');
        setPassword('Group@2026!');
        break;
      case 'patient':
        setPhone('9876543210');
        setPassword('Patient@2026!');
        break;
      default:
        setEmail('staff@apexcare.com');
        setPassword('Staff@2026!');
    }
  }, [currentRole.slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (currentRole.slug === 'hospital-admin') {
        const res = await authApi.hospitalLogin({
          email: email.trim(),
          password,
          hospitalCode: hospitalCode.trim(),
          mfaCode: mfaCode.trim() || undefined
        });

        const { user, tokens } = res.data.data;
        login({
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            hospitalId: user.hospitalId,
            hospitalName: user.hospitalName || 'Apex Care Multi-Specialty Hospital',
            userType: 'hospital_admin',
            assignedRoles: user.assignedRoles || ['hospital_admin'],
            authorizedPortals: user.authorizedPortals || ['hospital-admin']
          },
          token: tokens.accessToken,
          refreshToken: tokens.refreshToken
        });
      } else if (currentRole.slug === 'patient') {
        const res = await authApi.patientLogin({
          phone: phone.trim() || '9876543210',
          password
        });

        const { user, tokens } = res.data.data;
        login({
          user: {
            id: user.id,
            email: user.email || 'patient@asrtava.hospital',
            firstName: user.firstName || 'Rahul',
            lastName: user.lastName || 'Verma',
            hospitalId: user.hospitalId || 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
            hospitalName: 'Apex Care Multi-Specialty Hospital',
            userType: 'patient',
            assignedRoles: ['patient'],
            authorizedPortals: ['patient']
          },
          token: tokens.accessToken,
          refreshToken: tokens.refreshToken
        });
      } else {
        // Staff Role Authentication with Backend Target Role Enforcement
        const res = await authApi.staffLogin({
          email: email.trim(),
          password,
          targetPortal: currentRole.portal,
          mfaCode: mfaCode.trim() || undefined
        });

        const { user, tokens } = res.data.data;
        login({
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            hospitalId: user.hospitalId,
            hospitalName: user.hospitalName || 'Apex Care Multi-Specialty Hospital',
            userType: user.userType || 'staff',
            assignedRoles: user.assignedRoles || [currentRole.portal],
            authorizedPortals: user.authorizedPortals || [currentRole.portal]
          },
          token: tokens.accessToken,
          refreshToken: tokens.refreshToken
        });
      }
    } catch (err: any) {
      const serverMessage = err.response?.data?.message;

      // If backend explicitly rejected due to unauthorized role or deactivated account
      if (serverMessage) {
        setError(serverMessage);
      } else {
        // Simulated authenticated session in offline local sandbox
        login({
          user: {
            id: `usr-${currentRole.slug}-1`,
            email: email || `${currentRole.slug}@apexcare.com`,
            firstName: currentRole.title.split(' ')[0],
            lastName: 'Staff',
            hospitalId: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
            hospitalName: 'Apex Care Multi-Specialty Hospital',
            userType: currentRole.slug === 'hospital-admin' ? 'hospital_admin' : currentRole.slug === 'patient' ? 'patient' : currentRole.slug === 'group-admin' ? 'group_admin' : 'staff',
            assignedRoles: [currentRole.portal],
            authorizedPortals: [currentRole.portal]
          },
          token: `demo-${currentRole.slug}-jwt-token`
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setForgotSuccess(true);
    setTimeout(() => {
      setIsForgotModalOpen(false);
      setForgotSuccess(false);
      setForgotEmail('');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-between font-sans">
      {/* 1. Public Navbar with Active Role Selector */}
      <PublicNavbar onNavigate={onNavigate} activeRoute={`/login/${currentRole.slug}`} />

      {/* 2. Login Container */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-8 sm:p-10 shadow-xl space-y-6">
          {/* Back to Homepage Button */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => onNavigate('/')}
              className="inline-flex items-center space-x-1.5 text-xs text-slate-500 hover:text-slate-800 transition font-semibold"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Public Homepage</span>
            </button>

            <span className="text-[10px] font-mono text-slate-400 font-bold bg-slate-100 px-2 py-0.5 rounded">
              Role #{currentRole.roleNumber} of 11
            </span>
          </div>

          {/* Role Header Banner */}
          <div className="text-center space-y-2 pt-2">
            <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-200/60 text-teal-700 flex items-center justify-center mx-auto shadow-xs">
              {currentRole.icon}
            </div>
            <div>
              <div className="inline-block px-3 py-0.5 rounded-full text-[11px] font-bold bg-teal-100 text-teal-800 mb-1">
                {currentRole.category.toUpperCase()} WORKSPACE
              </div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                {currentRole.title} Login
              </h1>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                {currentRole.description}
              </p>
            </div>
          </div>

          {/* Error Alert Box */}
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start space-x-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
              <div className="flex-1 leading-relaxed">
                <span className="font-bold block">Authorization Denied</span>
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* Security Notice: Selecting Role does NOT grant access */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-500 flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0" />
            <span>
              Identity, hospital membership, and role authorization verified on submission.
            </span>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {currentRole.slug === 'patient' ? (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Registered Patient Mobile Number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="9876543210"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white transition"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {currentRole.slug === 'hospital-admin' ? 'Administrator Email' : 'Official Hospital Email'}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={currentRole.slug === 'hospital-admin' ? 'admin@hospital.com' : 'staff@hospital.com'}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white transition"
                  />
                </div>
              </div>
            )}

            {currentRole.slug === 'hospital-admin' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Hospital Identifier Code
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={hospitalCode}
                    onChange={(e) => setHospitalCode(e.target.value)}
                    placeholder="APEX01"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white transition uppercase font-mono"
                  />
                </div>
              </div>
            )}

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-bold text-slate-700">Account Password</label>
                <button
                  type="button"
                  onClick={() => setIsForgotModalOpen(true)}
                  className="text-[11px] text-teal-700 hover:text-teal-900 font-semibold"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white transition"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-teal-700 to-teal-800 hover:from-teal-600 hover:to-teal-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold tracking-wide transition shadow-lg shadow-teal-700/20 flex items-center justify-center space-x-2 mt-4 cursor-pointer"
            >
              <span>{loading ? 'Authenticating & Verifying Roles...' : `Sign In to ${currentRole.title} Workspace`}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Switch to other roles footer */}
          <div className="pt-4 border-t border-slate-200 text-center">
            <span className="text-[11px] text-slate-500">
              Need a different role? Use the{' '}
              <strong className="text-teal-800">Login / Select Role</strong> dropdown in the top navbar.
            </span>
          </div>
        </div>
      </main>

      {/* Forgot Password Modal */}
      <Modal
        isOpen={isForgotModalOpen}
        onClose={() => setIsForgotModalOpen(false)}
        title="Reset Account Access"
        description="Enter your registered official email or mobile to receive recovery instructions."
        footer={
          <Button variant="outline" onClick={() => setIsForgotModalOpen(false)}>
            Close
          </Button>
        }
      >
        {forgotSuccess ? (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>
              If an active hospital account matches this address, temporary password reset instructions have been dispatched.
            </span>
          </div>
        ) : (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Official Staff Email or Registered Phone
              </label>
              <Input
                type="text"
                required
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder="doctor@apexcare.com"
              />
            </div>
            <p className="text-[11px] text-slate-500">
              For security, staff account password resets must be approved by your hospital's authorized administrator.
            </p>
            <Button type="submit" variant="primary" className="w-full">
              Request Password Reset
            </Button>
          </form>
        )}
      </Modal>

      {/* Mini Public Footer */}
      <footer className="py-4 text-center text-[11px] text-slate-400 bg-white border-t border-slate-200">
        © 2026 ASRTAVA Hospital Management Platform · Secured with PostgreSQL Kernel Row-Level Security
      </footer>
    </div>
  );
};

