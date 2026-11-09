import React, { useState } from 'react';
import { Building2, Shield, CheckCircle2, ArrowRight, HelpCircle } from 'lucide-react';
import { Button, Input, useToast } from '../components/ui';
import { saasApi } from '../services/api';

interface HospitalRegistrationProps {
  onSwitchPortal?: (path: string) => void;
  onLaunchOnboarding?: (resumptionToken: string) => void;
}

export const HospitalRegistration: React.FC<HospitalRegistrationProps> = ({
  onSwitchPortal,
  onLaunchOnboarding,
}) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [successData, setSuccessData] = useState<{
    slug: string;
    adminEmail: string;
    resumptionToken: string;
  } | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [legalName, setLegalName] = useState('');
  const [code, setCode] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [gstin, setGstin] = useState('');
  const [plan, setPlan] = useState<'starter' | 'professional' | 'enterprise'>('professional');
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !phone || !city || !state || !adminName || !adminEmail) {
      showToast({
        type: 'warning',
        title: 'Validation Error',
        message: 'Please complete all required fields.',
      });
      return;
    }

    try {
      setLoading(true);
      const res = await saasApi.registerHospital({
        name,
        legalName: legalName || name,
        code: code || undefined,
        email,
        phone,
        city,
        state,
        pincode,
        gstin,
        subscriptionPlan: plan,
        adminName,
        adminEmail,
        adminPassword: adminPassword || undefined,
      });

      if (res.data?.success) {
        setSuccessData(res.data.data);
        showToast({
          type: 'success',
          title: 'Organization Registered',
          message: 'Tenant provisioned successfully. 30-day enterprise trial activated.',
        });
      }
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Registration Failed',
        message: err.response?.data?.message || err.message || 'Unable to provision tenant.',
      });
    } finally {
      setLoading(false);
    }
  };

  if (successData) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4">
        <div className="w-full max-w-lg bg-slate-800/90 border border-teal-500/30 rounded-2xl p-8 shadow-2xl text-center space-y-6">
          <div className="w-16 h-16 bg-teal-500/20 text-teal-400 rounded-2xl flex items-center justify-center mx-auto ring-8 ring-teal-500/10">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Organization Provisioned</h1>
            <p className="text-sm text-slate-400 mt-2">
              Your multi-tenant healthcare instance is initialized with isolated Row-Level Security.
            </p>
          </div>

          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-700/60 text-left text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-400">Tenant Slug:</span>
              <span className="font-mono text-teal-400 font-bold">{successData.slug}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Admin Account:</span>
              <span className="text-white font-medium">{successData.adminEmail}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Trial Period:</span>
              <span className="text-emerald-400 font-semibold">30 Days (Full Suite)</span>
            </div>
          </div>

          <div className="space-y-3">
            <Button
              variant="primary"
              className="w-full justify-center py-2.5 bg-teal-600 hover:bg-teal-500"
              onClick={() => {
                if (onLaunchOnboarding) {
                  onLaunchOnboarding(successData.resumptionToken);
                } else if (onSwitchPortal) {
                  onSwitchPortal('/hospital/login');
                }
              }}
            >
              <span>Launch Hospital Onboarding Wizard</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>

            <button
              onClick={() => onSwitchPortal && onSwitchPortal('/hospital/login')}
              className="text-xs text-slate-400 hover:text-white transition"
            >
              Skip to Hospital Admin Login →
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-2xl bg-slate-800/90 border border-slate-700/70 rounded-2xl p-8 shadow-2xl backdrop-blur-md">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-700/60 pb-5 mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-teal-600/20 text-teal-400 rounded-xl flex items-center justify-center font-bold text-lg border border-teal-500/30">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight">ASRTAVA SaaS Organization Onboarding</h1>
              <p className="text-xs text-slate-400">Self-serve multi-tenant hospital registration & automated provisioning</p>
            </div>
          </div>
          <button
            onClick={() => onSwitchPortal && onSwitchPortal('/hospital/login')}
            className="text-xs text-teal-400 hover:text-teal-300 font-medium"
          >
            Existing Client? Sign In
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 text-xs">
          {/* Section 1: Hospital Organization Details */}
          <div>
            <h2 className="text-xs font-bold text-teal-400 uppercase tracking-wider mb-3">1. Hospital Organization Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Hospital / Brand Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Apex Multi-Specialty Hospital"
                  className="w-full p-2.5 bg-slate-900/80 border border-slate-700 text-slate-200 rounded-lg focus:border-teal-500"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Tenant Organization Code (URL Slug)</label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  placeholder="e.g. apex-care"
                  className="w-full p-2.5 bg-slate-900/80 border border-slate-700 text-teal-400 font-mono rounded-lg focus:border-teal-500"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Official Hospital Email *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@apexcare.org"
                  className="w-full p-2.5 bg-slate-900/80 border border-slate-700 text-slate-200 rounded-lg focus:border-teal-500"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Official Contact Phone *</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full p-2.5 bg-slate-900/80 border border-slate-700 text-slate-200 rounded-lg focus:border-teal-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Location & Compliance */}
          <div className="pt-3 border-t border-slate-700/50">
            <h2 className="text-xs font-bold text-teal-400 uppercase tracking-wider mb-3">2. Location & Tax Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">City *</label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Bangalore"
                  className="w-full p-2.5 bg-slate-900/80 border border-slate-700 text-slate-200 rounded-lg focus:border-teal-500"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">State *</label>
                <input
                  type="text"
                  required
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="Karnataka"
                  className="w-full p-2.5 bg-slate-900/80 border border-slate-700 text-slate-200 rounded-lg focus:border-teal-500"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">GSTIN (Optional)</label>
                <input
                  type="text"
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value)}
                  placeholder="29AAAAA0000A1Z5"
                  className="w-full p-2.5 bg-slate-900/80 border border-slate-700 text-slate-200 rounded-lg focus:border-teal-500 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Subscription Tier */}
          <div className="pt-3 border-t border-slate-700/50">
            <h2 className="text-xs font-bold text-teal-400 uppercase tracking-wider mb-3">3. Preferred Subscription Tier (Includes 30-Day Free Trial)</h2>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'starter', name: 'Starter', price: '₹ 14,999/mo', desc: 'Clinics up to 25 staff & OPD' },
                { id: 'professional', name: 'Professional', price: '₹ 29,999/mo', desc: 'Mid-size hospitals, IPD & LIMS' },
                { id: 'enterprise', name: 'Enterprise', price: '₹ 59,999/mo', desc: 'Multi-branch, OT & full suite' },
              ].map((t) => (
                <div
                  key={t.id}
                  onClick={() => setPlan(t.id as any)}
                  className={`p-3 rounded-xl border cursor-pointer transition ${
                    plan === t.id
                      ? 'border-teal-500 bg-teal-950/40 text-teal-200 ring-1 ring-teal-500'
                      : 'border-slate-700 bg-slate-900/50 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  <div className="font-bold text-slate-200">{t.name}</div>
                  <div className="text-teal-400 font-bold mt-1">{t.price}</div>
                  <div className="text-[10px] text-slate-400 mt-1">{t.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: Initial Primary Administrator */}
          <div className="pt-3 border-t border-slate-700/50">
            <h2 className="text-xs font-bold text-teal-400 uppercase tracking-wider mb-3">4. Primary Administrator Account</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Administrator Full Name *</label>
                <input
                  type="text"
                  required
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  placeholder="Dr. Rajesh Sharma"
                  className="w-full p-2.5 bg-slate-900/80 border border-slate-700 text-slate-200 rounded-lg focus:border-teal-500"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Admin Email (Login ID) *</label>
                <input
                  type="email"
                  required
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="rajesh.sharma@apexcare.org"
                  className="w-full p-2.5 bg-slate-900/80 border border-slate-700 text-slate-200 rounded-lg focus:border-teal-500"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Temporary Password</label>
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Defaults to secure pass"
                  className="w-full p-2.5 bg-slate-900/80 border border-slate-700 text-slate-200 rounded-lg focus:border-teal-500"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-700/60 flex items-center justify-between">
            <div className="flex items-center text-slate-400 space-x-1.5 text-[11px]">
              <Shield className="w-4 h-4 text-teal-400" />
              <span>Multi-tenant isolation backed by PostgreSQL Row-Level Security</span>
            </div>
            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              className="bg-teal-600 hover:bg-teal-500 text-white font-semibold px-6 py-2.5"
            >
              {loading ? 'Provisioning Instance...' : 'Register & Provision Hospital'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
