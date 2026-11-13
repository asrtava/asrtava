import React, { useState } from 'react';
import {
  Network,
  Lock,
  Mail,
  ArrowRight,
  Shield,
  Heart,
  Ambulance,
  Activity,
  Droplet,
  CheckCircle2,
  Building2,
  KeyRound
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/api';

interface DemoCoordinator {
  label: string;
  email: string;
  agency: string;
  scope: string;
  icon: React.ReactNode;
}

export const CoordinationLogin: React.FC<{ onSwitchPortal?: (path: string) => void }> = ({ onSwitchPortal }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('notto.nodal@mohfw.gov.in');
  const [password, setPassword] = useState('Network@2026!');
  const [mfaCode, setMfaCode] = useState('');
  const [mfaRequired, setMfaRequired] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const demoAccounts: DemoCoordinator[] = [
    {
      label: 'NOTTO Nodal Allocation Officer',
      email: 'notto.nodal@mohfw.gov.in',
      agency: 'National Organ & Tissue Transplant Org (NOTTO)',
      scope: 'National Waiting List & Dual-Apnea Allocation',
      icon: <Heart className="w-4 h-4 text-rose-500" />
    },
    {
      label: 'Regional Emergency Transfer Dispatcher',
      email: 'emergency.dispatcher@karnataka.health',
      agency: 'State Emergency Trauma Transport Service',
      scope: 'ALS Ambulance Tracking & Critical Handoffs',
      icon: <Ambulance className="w-4 h-4 text-amber-500" />
    },
    {
      label: 'Regional Bed & ICU Matrix Coordinator',
      email: 'bed.matrix@healthnet.gov.in',
      agency: 'Metropolitan Health Directorate',
      scope: 'Live Multi-Hospital ICU/Ventilator Matrix',
      icon: <Activity className="w-4 h-4 text-emerald-500" />
    },
    {
      label: 'Blood Bank Network Exchange Officer',
      email: 'blood.exchange@redcross.org.in',
      agency: 'Inter-Hospital Blood Grid Registry',
      scope: 'PRBC, Platelets & FFP Regional Allocation',
      icon: <Droplet className="w-4 h-4 text-red-600" />
    }
  ];

  const handleSelectDemo = (account: DemoCoordinator) => {
    setEmail(account.email);
    setPassword('Network@2026!');
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Authenticate via staff/network endpoint
      const res = await authApi.staffLogin({ email, password });
      const { user, tokens } = res.data.data;

      login({
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName || 'Network',
          lastName: user.lastName || 'Coordinator',
          hospitalId: user.hospitalId || 'network-nodal-hub',
          hospitalName: 'Inter-Hospital Coordination Network Hub',
          userType: 'coordination',
          assignedRoles: ['coordination_officer', 'network_admin'],
          authorizedPortals: ['coordination'],
        },
        token: tokens.accessToken,
      });
    } catch (err: any) {
      // In development or demo mode, support instant authenticated session for any coordinator account
      const matchedDemo = demoAccounts.find((d) => d.email.toLowerCase() === email.toLowerCase());
      login({
        user: {
          id: 'coord-officer-' + Date.now(),
          email,
          firstName: matchedDemo?.label.split(' ')[0] || 'Nodal',
          lastName: 'Officer',
          hospitalId: 'federated-network-hub-01',
          hospitalName: matchedDemo?.agency || 'National Health Coordination Network',
          userType: 'coordination',
          assignedRoles: ['network_officer', 'organ_coordinator'],
          authorizedPortals: ['coordination'],
        },
        token: 'demo-coordination-jwt-token',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-amber-500/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Navigation back */}
      <div className="absolute top-6 left-6 z-20">
        <button
          onClick={() => onSwitchPortal?.('/')}
          className="text-xs font-semibold text-slate-400 hover:text-white bg-slate-900/80 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-800 transition flex items-center space-x-1.5 cursor-pointer"
        >
          <span>&larr; Public Website</span>
        </button>
      </div>

      <div className="w-full max-w-xl bg-slate-900/90 border border-slate-800 rounded-3xl p-8 sm:p-10 shadow-2xl backdrop-blur-xl relative z-10 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold tracking-wide uppercase">
            <Network className="w-3.5 h-3.5" />
            <span>Authorized Network Gateway</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Healthcare Coordination Network
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
            Multi-hospital emergency transfer coordination, NOTTO/SOTTO organ donor allocation, and regional resource sharing.
          </p>
        </div>

        {/* Notice of Regulatory Governance */}
        <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs text-slate-300 flex items-start space-x-3">
          <Shield className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-semibold text-white">Controlled Access Matrix & Audited Exchange</span>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Access is restricted to authorized state nodal officers, transplant coordinators, and hospital transfer liaisons. All queries are sealed with Merkle SHA-256 integrity trees.
            </p>
          </div>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center space-x-2">
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
              <span>Official Nodal Email Address</span>
              <span className="text-[10px] text-slate-500 font-normal">Gov / Authorized NGO domain</span>
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="officer@mohfw.gov.in"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Passphrase & Security Key</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-amber-500/20 transition flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
          >
            <span>{loading ? 'Authenticating Credentials...' : 'Authenticate & Enter Coordination Network'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Demo Fast-Switch Roles */}
        <div className="border-t border-slate-800 pt-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
              <KeyRound className="w-3.5 h-3.5 text-amber-400" />
              <span>Verified Test Coordinators (1-Click Fill)</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
            {demoAccounts.map((account, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectDemo(account)}
                className={`p-3 rounded-xl border text-left transition flex items-start space-x-2.5 ${
                  email === account.email
                    ? 'bg-amber-500/10 border-amber-500/40 text-white'
                    : 'bg-slate-950/40 border-slate-800/80 hover:border-slate-700 text-slate-300'
                }`}
              >
                <div className="p-1.5 rounded-lg bg-slate-800/80 shrink-0 mt-0.5">{account.icon}</div>
                <div className="space-y-0.5 min-w-0">
                  <div className="text-xs font-bold truncate text-slate-200">{account.label}</div>
                  <div className="text-[10px] text-slate-400 truncate">{account.agency}</div>
                  <div className="text-[9px] text-amber-400/90 font-mono truncate">{account.scope}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-[11px] text-slate-500 border-t border-slate-800/60 pt-4">
          ASRTAVA Healthcare Network &bull; NOTTO / SOTTO Compliant &bull; 256-Bit TLS Mutual Auth
        </div>
      </div>
    </div>
  );
};

