import React, { useState } from 'react';
import { Shield, Lock, Mail, KeyRound, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/api';

export const SuperAdminLogin: React.FC<{ onSwitchPortal?: (path: string) => void }> = ({ onSwitchPortal }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('superadmin@asrtava.com');
  const [password, setPassword] = useState('SuperAdmin@2026!');
  const [mfaCode, setMfaCode] = useState('');
  const [isMfaRequired, setIsMfaRequired] = useState(false);
  const [tempToken, setTempToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await authApi.superAdminLogin({
        email,
        password,
        mfaCode: isMfaRequired ? mfaCode : undefined,
      });

      if (res.data.mfaRequired) {
        setIsMfaRequired(true);
        setTempToken(res.data.tempToken);
        setLoading(false);
        return;
      }

      const { user, tokens } = res.data.data;
      login({
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          hospitalId: null,
          userType: 'super_admin',
          assignedRoles: ['super_admin'],
          authorizedPortals: ['super-admin'],
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
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl relative z-10">
        {/* Header Badge */}
        <div className="flex items-center justify-center space-x-2 mb-6">
          <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold tracking-wider text-xl text-white">ASRTAVA</span>
            <span className="text-[10px] text-purple-400 font-bold ml-2 uppercase tracking-widest block">Super Admin Console</span>
          </div>
        </div>

        <div className="text-center mb-6">
          <h1 className="text-lg font-bold text-slate-100">Platform Security Gate</h1>
          <p className="text-xs text-slate-400 mt-1">
            Isolated platform administration login. Hardware/TOTP MFA mandatory.
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isMfaRequired ? (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Master Operator Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="superadmin@asrtava.com"
                    className="w-full pl-9 pr-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-semibold text-slate-300">Master Password</label>
                  <a href="#forgot" className="text-[11px] text-purple-400 hover:text-purple-300">Forgot?</a>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••••••"
                    className="w-full pl-9 pr-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="p-4 bg-purple-950/40 border border-purple-800/40 rounded-xl space-y-3">
              <div className="flex items-center space-x-2 text-purple-300 font-bold text-xs">
                <KeyRound className="w-4 h-4" />
                <span>Two-Factor Authentication (TOTP)</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Enter the 6-digit verification code from your authenticator app (Google Authenticator / 1Password).
              </p>
              <input
                type="text"
                maxLength={6}
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                required
                placeholder="123456"
                className="w-full text-center tracking-[0.4em] font-mono font-bold text-lg py-2.5 bg-slate-900 border border-purple-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold tracking-wide transition shadow-lg shadow-purple-600/20 flex items-center justify-center space-x-2 mt-2"
          >
            <span>{loading ? 'Authenticating...' : isMfaRequired ? 'Verify MFA & Enter Console' : 'Authenticate Master Operator'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-slate-800 flex justify-between items-center text-[11px] text-slate-400">
          <span>Need a different portal?</span>
          <button
            onClick={() => onSwitchPortal && onSwitchPortal('/staff/login')}
            className="text-purple-400 hover:text-purple-300 font-semibold"
          >
            Staff & Hospital Login →
          </button>
        </div>
      </div>
    </div>
  );
};

