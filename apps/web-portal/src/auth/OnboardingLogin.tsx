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

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Simulate/execute customer coordinator authentication
      await new Promise((r) => setTimeout(r, 600));
      if (!email || !password) {
        setError('Please enter your official customer coordinator email and password.');
        return;
      }

      if (onLoginSuccess) {
        onLoginSuccess({
          email,
          customerName: 'Dr. Vikram Malhotra',
          hospitalName: 'Manipal Super-Speciality Hospital',
          projectCode: 'ONB-2026-MANIPAL',
          role: 'Hospital Implementation Coordinator'
        });
      } else if (onSwitchPortal) {
        onSwitchPortal('/onboarding');
      }
    } catch (err: any) {
      setError(err.message || 'Customer authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleTokenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await new Promise((r) => setTimeout(r, 600));
      if (!projectToken.trim()) {
        setError('Please enter a valid invitation code or project token.');
        return;
      }

      if (onLoginSuccess) {
        onLoginSuccess({
          email: 'coordinator@hospital.org',
          customerName: 'Hospital Project Coordinator',
          hospitalName: 'Customer Hospital Facility',
          projectCode: projectToken,
          role: 'Customer Implementation Lead'
        });
      } else if (onSwitchPortal) {
        onSwitchPortal('/onboarding');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid or expired invitation token.');
    } finally {
      setLoading(false);
    }
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

        {/* Form Mode 1: Email + Password */}
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

            <Button
              type="submit"
              variant="primary"
              className="w-full justify-center py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-teal-600/20"
              disabled={loading}
            >
              {loading ? 'Authenticating...' : 'Sign In to Implementation Workspace'}
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </form>
        )}

        {/* Form Mode 2: Invitation Token */}
        {activeMode === 'token' && (
          <form onSubmit={handleTokenSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Project Code or Invitation Token
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
              <p className="text-[11px] text-slate-500 mt-1">
                Enter the project reference provided in your ASRTAVA onboarding welcome pack.
              </p>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full justify-center py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-teal-600/20"
              disabled={loading}
            >
              {loading ? 'Validating Token...' : 'Access Onboarding Project'}
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

