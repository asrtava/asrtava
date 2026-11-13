import React, { useState } from 'react';
import {
  FileCheck2,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  Building2,
  KeyRound,
  CheckCircle2,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { Button, Input } from '../components/ui';
import { authApi } from '../services/api';

interface OnboardingLoginProps {
  onSwitchPortal?: (path: string) => void;
  onLoginSuccess?: (customerData: any) => void;
}

export const OnboardingLogin: React.FC<OnboardingLoginProps> = ({
  onSwitchPortal,
  onLoginSuccess
}) => {
  const [activeMode, setActiveMode] = useState<'credentials' | 'token'>('credentials');
  const [email, setEmail] = useState('vikram.malhotra@manipal.edu');
  const [password, setPassword] = useState('Onboarding@2026!');
  const [projectToken, setProjectToken] = useState('ONB-2026-MANIPAL');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const executeOnboardingAuth = async (authEmail: string, authPass: string, authCode: string) => {
    setError(null);
    setLoading(true);

    try {
      if (!authEmail.trim() || !authPass.trim()) {
        setError('Both coordinator work email and password are required. Project codes do not grant standalone access without verified identity.');
        return;
      }
      if (!authCode.trim()) {
        setError('Please enter a valid onboarding project code or invitation token.');
        return;
      }

      const res = await authApi.loginOnboardingPortal({
        email: authEmail.trim(),
        password: authPass.trim(),
        projectCode: authCode.trim()
      });

      const data = res.data?.data || res.data;
      if (onLoginSuccess) {
        onLoginSuccess({
          email: data.user?.email || authEmail,
          customerName: data.user?.customerName || 'Hospital Coordinator',
          hospitalName: data.user?.hospitalName || 'Customer Hospital Facility',
          projectCode: data.user?.projectCode || authCode,
          role: data.user?.role || 'Hospital Implementation Lead'
        });
      } else if (onSwitchPortal) {
        onSwitchPortal('/onboarding');
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
        err.message ||
        'Authentication failed: Identity could not be verified for this onboarding project.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await executeOnboardingAuth(email, password, projectToken);
  };

  const handleTokenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await executeOnboardingAuth(email, password, projectToken);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Background Subtle Gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-teal-900/20 via-slate-950 to-slate-950 pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900/90 backdrop-blur-xl border border-teal-500/30 rounded-3xl p-8 shadow-2xl relative z-10 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-teal-500/10 border border-teal-500/30 text-teal-400 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
            <FileCheck2 className="w-7 h-7" />
          </div>
          <div>
            <span className="text-[10px] font-bold tracking-widest text-teal-400 uppercase">
              Customer Onboarding Portal
            </span>
            <h1 className="text-2xl font-bold text-white tracking-tight mt-1">
              Implementation Workspace
            </h1>
          </div>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Authorized hospital customer workspace for facility configuration, data migration, UAT validation and go-live readiness.
          </p>
        </div>

        {/* Tab Selector: Credentials vs Invitation Code */}
        <div className="grid grid-cols-2 p-1 bg-slate-800/80 rounded-xl border border-slate-700/80 text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setActiveMode('credentials');
              setError(null);
            }}
            className={`py-2 rounded-lg transition ${
              activeMode === 'credentials'
                ? 'bg-teal-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Coordinator Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveMode('token');
              setError(null);
            }}
            className={`py-2 rounded-lg transition ${
              activeMode === 'token'
                ? 'bg-teal-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Invitation Code / Token
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center space-x-2 text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Mode 1: Email + Password + Project Code */}
        {activeMode === 'credentials' && (
          <form onSubmit={handleCredentialsSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Coordinator Work Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-800/90 border border-slate-700 text-white rounded-xl pl-9 pr-3 py-2 text-xs focus:ring-2 focus:ring-teal-500 outline-none"
                  placeholder="coordinator@hospital.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-800/90 border border-slate-700 text-white rounded-xl pl-9 pr-3 py-2 text-xs focus:ring-2 focus:ring-teal-500 outline-none"
                  placeholder="••••••••••••"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Onboarding Project Code
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={projectToken}
                  onChange={(e) => setProjectToken(e.target.value)}
                  className="w-full font-mono bg-slate-800/90 border border-slate-700 text-teal-300 rounded-xl pl-9 pr-3 py-2 text-xs focus:ring-2 focus:ring-teal-500 outline-none"
                  placeholder="ONB-2026-MANIPAL"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full justify-center py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-teal-600/20"
              disabled={loading}
            >
              {loading ? 'Authenticating Identity & Project...' : 'Sign In to Implementation Workspace'}
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </form>
        )}

        {/* Form Mode 2: Project Resumption Code + Verified Identity */}
        {activeMode === 'token' && (
          <form onSubmit={handleTokenSubmit} className="space-y-4">
            <div className="p-3 bg-teal-950/40 border border-teal-500/30 rounded-xl text-[11px] text-teal-300 space-y-1">
              <span className="font-bold block flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
                Zero Standalone Token Access Policy
              </span>
              <p className="text-slate-400">
                A project code alone does not grant access. You must provide verified identity credentials associated with this project.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Project Resumption Code or Invitation Token
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={projectToken}
                  onChange={(e) => setProjectToken(e.target.value)}
                  className="w-full font-mono bg-slate-800/90 border border-slate-700 text-teal-300 rounded-xl pl-9 pr-3 py-2 text-xs focus:ring-2 focus:ring-teal-500 outline-none"
                  placeholder="ONB-2026-XXXXX or token"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Authorized Coordinator Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-800/90 border border-slate-700 text-white rounded-xl pl-9 pr-3 py-2 text-xs focus:ring-2 focus:ring-teal-500 outline-none"
                  placeholder="coordinator@hospital.org"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Coordinator Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-800/90 border border-slate-700 text-white rounded-xl pl-9 pr-3 py-2 text-xs focus:ring-2 focus:ring-teal-500 outline-none"
                  placeholder="••••••••••••"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full justify-center py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-teal-600/20"
              disabled={loading}
            >
              {loading ? 'Verifying Credentials & Membership...' : 'Verify Identity & Access Project'}
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </form>
        )}

        {/* Security Notice */}
        <div className="pt-3 border-t border-slate-800/80 flex items-start space-x-2 text-[11px] text-slate-400">
          <ShieldCheck className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
          <span>
            This portal is restricted to authorized hospital implementation representatives. Clinical patient records are segregated and inaccessible through this portal.
          </span>
        </div>

        {/* Return to Public Website */}
        <div className="text-center pt-1">
          <button
            type="button"
            onClick={() => onSwitchPortal && onSwitchPortal('/')}
            className="text-xs text-slate-400 hover:text-white transition cursor-pointer"
          >
            &larr; Return to ASRTAVA Corporate Website
          </button>
        </div>
      </div>
    </div>
  );
};

