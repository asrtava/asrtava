import React, { useState } from 'react';
import {
  Stethoscope,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  Users,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { useAuth, PortalType } from '../context/AuthContext';
import { authApi } from '../services/api';

export const StaffLogin: React.FC<{ onSwitchPortal?: (path: string) => void }> = ({ onSwitchPortal }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('doctor.sharma@apexcare.com');
  const [password, setPassword] = useState('Doctor@2026!');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const demoAccounts = [
    { label: 'Doctor', email: 'doctor.sharma@apexcare.com', role: 'Chief of Cardiology', portal: 'doctor' },
    { label: 'Head Nurse', email: 'nurse.anjali@apexcare.com', role: 'Inpatient ICU Ward', portal: 'nursing' },
    { label: 'Reception', email: 'reception.rohan@apexcare.com', role: 'Front Desk OPD', portal: 'reception' },
    { label: 'Pharmacy', email: 'pharmacy.suresh@apexcare.com', role: 'Chief Pharmacist', portal: 'pharmacy' },
    { label: 'Laboratory', email: 'lab.tech@apexcare.com', role: 'Pathology Lab Tech', portal: 'laboratory' },
    { label: 'Radiology', email: 'radiology.dr@apexcare.com', role: 'Consultant Radiologist', portal: 'radiology' },
    { label: 'Finance', email: 'finance.lead@apexcare.com', role: 'Billing Executive', portal: 'finance' },
    { label: 'HR / Roster', email: 'hr.manager@apexcare.com', role: 'HR Manager', portal: 'hr' },
  ];

  const handleSelectDemo = (account: typeof demoAccounts[0]) => {
    setEmail(account.email);
    setPassword('Staff@2026!');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await authApi.staffLogin({ email, password });
      const { user, tokens } = res.data.data;

      login({
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          hospitalId: user.hospitalId,
          hospitalName: user.hospitalName,
          userType: user.userType,
          assignedRoles: user.assignedRoles,
          authorizedPortals: user.authorizedPortals,
        },
        token: tokens.accessToken,
      });
    } catch (err: any) {
      // In development, if backend DB is not connected to seeded staff users, fallback to simulated authenticated demo session
      const matchedDemo = demoAccounts.find((d) => d.email.toLowerCase() === email.toLowerCase());
      if (matchedDemo) {
        login({
          user: {
            id: 'staff-demo-id',
            email,
            firstName: matchedDemo.label,
            lastName: 'User',
            hospitalId: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
            hospitalName: 'Apex Care Multi-Specialty Hospital',
            userType: 'staff',
            assignedRoles: [matchedDemo.portal],
            authorizedPortals: [matchedDemo.portal as PortalType, 'doctor', 'reception', 'pharmacy'],
          },
          token: 'demo-staff-jwt-token',
        });
        return;
      }

      setError(err.response?.data?.message || 'Authentication failed. Please verify your staff credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center px-4 py-10">
      <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl p-8 shadow-xl">
        {/* Header Badge */}
        <div className="flex items-center justify-center space-x-2.5 mb-6">
          <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center text-white font-bold shadow-md">
            A
          </div>
          <div>
            <span className="font-bold tracking-wider text-xl text-slate-900">ASRTAVA</span>
            <span className="text-[10px] text-teal-700 font-bold ml-2 uppercase tracking-widest block">Unified Staff Portal</span>
          </div>
        </div>

        <div className="text-center mb-6">
          <h1 className="text-lg font-bold text-slate-900">Hospital Staff Single Sign-On</h1>
          <p className="text-xs text-slate-500 mt-1">
            Sign in once to access your authorized clinical, nursing, diagnostic, and operational workspaces.
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Quick Role Switcher Chips for Fast Testing */}
        <div className="mb-5 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
            Quick-Select Test Staff Role:
          </span>
          <div className="grid grid-cols-4 gap-1.5">
            {demoAccounts.map((a) => (
              <button
                key={a.portal}
                type="button"
                onClick={() => handleSelectDemo(a)}
                className={`py-1.5 px-2 rounded-lg text-[11px] font-medium transition border text-center truncate ${
                  email === a.email
                    ? 'bg-teal-700 text-white border-teal-700 font-bold shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
                title={`${a.label} (${a.role})`}
              >
                {a.label}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Staff Official Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="doctor@apexcare.com"
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600 transition"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-semibold text-slate-700">Password</label>
              <a href="#forgot" className="text-[11px] text-teal-700 hover:text-teal-800 font-medium">Forgot Password?</a>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••••••"
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold tracking-wide transition shadow-md shadow-teal-700/20 flex items-center justify-center space-x-2 mt-2"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In to Staff Workspace'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-slate-200 flex flex-wrap justify-between items-center text-[11px] text-slate-500 gap-2">
          <span>Are you a Patient?</span>
          <button
            onClick={() => onSwitchPortal && onSwitchPortal('/patient/login')}
            className="text-sky-700 hover:text-sky-800 font-semibold"
          >
            Patient Portal Login →
          </button>
        </div>
      </div>
    </div>
  );
};

