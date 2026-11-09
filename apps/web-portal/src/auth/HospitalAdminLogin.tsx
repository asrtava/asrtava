import React, { useState } from 'react';
import { Building2, Lock, Mail, Building, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/api';

export const HospitalAdminLogin: React.FC<{ onSwitchPortal?: (path: string) => void }> = ({ onSwitchPortal }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('director@apexcare.com');
  const [password, setPassword] = useState('HospitalAdmin@2026!');
  const [hospitalCode, setHospitalCode] = useState('APEX-BLR');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [memberships, setMemberships] = useState<Array<{ id: string; code: string; name: string }>>([]);
  const [selectedHospital, setSelectedHospital] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await authApi.hospitalAdminLogin({
        email,
        password,
        hospitalCode: selectedHospital || hospitalCode || undefined,
      });

      const { user, tokens } = res.data.data;
      login({
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          hospitalId: user.hospitalId,
          hospitalName: user.hospitalName,
          userType: 'hospital_admin',
          assignedRoles: user.assignedRoles,
          authorizedPortals: user.authorizedPortals,
        },
        token: tokens.accessToken,
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center px-4 py-12 relative">
      <div className="w-full max-w-md bg-slate-800 border border-slate-700 rounded-2xl p-8 shadow-2xl relative z-10">
        <div className="flex items-center justify-center space-x-2 mb-6">
          <div className="w-10 h-10 rounded-xl bg-brand-700/20 border border-brand-500/30 flex items-center justify-center text-brand-500">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold tracking-wider text-xl text-white">ASRTAVA</span>
            <span className="text-[10px] text-brand-500 font-bold ml-2 uppercase tracking-widest block">Hospital Admin Workspace</span>
          </div>
        </div>

        <div className="text-center mb-6">
          <h1 className="text-lg font-bold text-slate-100">Facility Administration Gate</h1>
          <p className="text-xs text-slate-400 mt-1">
            Access hospital profile, departments, staff duty rosters, and billing settings.
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Hospital Organization Code (Optional)</label>
            <div className="relative">
              <Building className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={hospitalCode}
                onChange={(e) => setHospitalCode(e.target.value.toUpperCase())}
                placeholder="e.g. APEX-BLR"
                className="w-full pl-9 pr-3 py-2 bg-slate-900/80 border border-slate-700 rounded-xl text-xs text-slate-100 uppercase placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Administrator Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="director@apexcare.com"
                className="w-full pl-9 pr-3 py-2 bg-slate-900/80 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-semibold text-slate-300">Password</label>
              <a href="#forgot" className="text-[11px] text-brand-500 hover:text-brand-400">Forgot?</a>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••••••"
                className="w-full pl-9 pr-3 py-2 bg-slate-900/80 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-brand-700 hover:bg-brand-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold tracking-wide transition shadow-lg shadow-brand-700/20 flex items-center justify-center space-x-2 mt-2"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In to Hospital Console'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-slate-700 flex justify-between items-center text-[11px] text-slate-400">
          <span>Staff or Clinician?</span>
          <button
            onClick={() => onSwitchPortal && onSwitchPortal('/staff/login')}
            className="text-brand-500 hover:text-brand-400 font-semibold"
          >
            Common Staff Login →
          </button>
        </div>
      </div>
    </div>
  );
};

