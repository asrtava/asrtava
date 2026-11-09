import React, { useState, useEffect } from 'react';
import {
  Building2,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Clock,
  Users,
  CreditCard,
  Sparkles,
  ShieldCheck,
  Check
} from 'lucide-react';
import { Button, useToast, Badge } from '../components/ui';
import { saasApi } from '../services/api';

interface OnboardingWizardProps {
  resumptionToken: string;
  onComplete: () => void;
  onExit: () => void;
}

const WIZARD_STEPS = [
  { step: 1, title: 'Org Profile', desc: 'Legal entity and tax' },
  { step: 2, title: 'Branding', desc: 'Logo & brand colors' },
  { step: 3, title: 'Branches', desc: 'Main campus & facilities' },
  { step: 4, title: 'Departments', desc: 'Specialties & clinical units' },
  { step: 5, title: 'Working Hours', desc: 'Shifts & consultation slots' },
  { step: 6, title: 'Clinical Services', desc: 'OPD, IPD, Diagnostics' },
  { step: 7, title: 'Staff Setup', desc: 'Initial doctor invitations' },
  { step: 8, title: 'Plan Selection', desc: 'Subscription tier' },
  { step: 9, title: 'Billing Setup', desc: 'Tax invoice details' },
  { step: 10, title: 'Final Activation', desc: 'Review & launch' },
];

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({
  resumptionToken,
  onComplete,
  onExit,
}) => {
  const { showToast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hospitalInfo, setHospitalInfo] = useState<any>(null);

  // Form states per step
  const [logoUrl, setLogoUrl] = useState('');
  const [brandColor, setBrandColor] = useState('#0F766E');
  const [slotDuration, setSlotDuration] = useState('15');
  const [enableWhatsapp, setEnableWhatsapp] = useState(true);
  const [initialDoctors, setInitialDoctors] = useState('Dr. Sharma, Dr. Priya Nair');

  useEffect(() => {
    async function loadProgress() {
      try {
        const res = await saasApi.getOnboardingProgress(resumptionToken);
        if (res.data?.success) {
          const { onboarding, hospital } = res.data.data;
          setHospitalInfo(hospital);
          setCurrentStep(onboarding.current_step || 1);
        }
      } catch (err: any) {
        showToast({
          type: 'error',
          title: 'Load Error',
          message: 'Unable to resume onboarding with this token.',
        });
      }
    }
    if (resumptionToken) {
      loadProgress();
    }
  }, [resumptionToken]);

  const handleNextStep = async () => {
    try {
      setLoading(true);
      await saasApi.saveOnboardingStep(resumptionToken, currentStep, {
        step: currentStep,
        savedAt: new Date().toISOString(),
        logoUrl,
        brandColor,
        slotDuration,
        enableWhatsapp,
      });

      if (currentStep < 10) {
        setCurrentStep((prev) => prev + 1);
      } else {
        // Complete onboarding
        await saasApi.completeOnboarding(resumptionToken);
        showToast({
          type: 'success',
          title: 'Onboarding Completed',
          message: 'Your hospital instance is fully activated!',
        });
        onComplete();
      }
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Save Failed',
        message: err.response?.data?.message || err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      {/* Top Bar */}
      <header className="bg-slate-800/90 border-b border-slate-700/80 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-teal-600 text-white rounded-lg flex items-center justify-center font-bold">
            A
          </div>
          <div>
            <h1 className="text-sm font-bold text-white">
              {hospitalInfo ? hospitalInfo.name : 'Hospital Tenant'} · Onboarding Wizard
            </h1>
            <p className="text-[11px] text-slate-400">Step {currentStep} of 10: {WIZARD_STEPS[currentStep - 1]?.title}</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Badge variant="info" size="sm">
            Resume Token: {resumptionToken.slice(0, 10)}...
          </Badge>
          <button onClick={onExit} className="text-xs text-slate-400 hover:text-white">
            Save & Exit
          </button>
        </div>
      </header>

      {/* Progress Stepper */}
      <div className="bg-slate-800/50 border-b border-slate-700/60 px-6 py-3 overflow-x-auto">
        <div className="flex items-center space-x-2 min-w-max">
          {WIZARD_STEPS.map((s) => (
            <div
              key={s.step}
              onClick={() => s.step <= currentStep && setCurrentStep(s.step)}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs cursor-pointer transition ${
                s.step === currentStep
                  ? 'bg-teal-600 text-white font-bold'
                  : s.step < currentStep
                  ? 'bg-slate-800 text-teal-400 hover:bg-slate-700'
                  : 'text-slate-500'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  s.step < currentStep ? 'bg-teal-500/20 text-teal-400' : 'border border-current'
                }`}
              >
                {s.step < currentStep ? <Check className="w-3 h-3" /> : s.step}
              </div>
              <span>{s.title}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Wizard Content Body */}
      <div className="flex-1 max-w-3xl w-full mx-auto p-8 flex flex-col justify-between">
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 shadow-xl space-y-6 text-xs">
          <div>
            <span className="text-[10px] uppercase font-bold text-teal-400 tracking-wider">
              Step {currentStep} · {WIZARD_STEPS[currentStep - 1]?.desc}
            </span>
            <h2 className="text-xl font-bold text-white mt-1">
              {WIZARD_STEPS[currentStep - 1]?.title} Configuration
            </h2>
          </div>

          {/* Step 1: Org Profile */}
          {currentStep === 1 && (
            <div className="space-y-3">
              <p className="text-slate-300">
                Verify your organization legal identity. ASRTAVA uses this for official tax invoices and medical registration compliance.
              </p>
              <div className="bg-slate-900/60 p-4 rounded-xl space-y-2 border border-slate-700">
                <div className="flex justify-between">
                  <span className="text-slate-400">Organization Name:</span>
                  <span className="font-semibold text-white">{hospitalInfo?.name || 'Apex Multi-Specialty'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Tenant Code:</span>
                  <span className="font-mono text-teal-400 font-bold">{hospitalInfo?.code || 'apex-care'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Primary Contact:</span>
                  <span className="text-slate-200">{hospitalInfo?.email}</span>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Branding */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <p className="text-slate-300">
                Customize your white-label hospital branding, patient appointment notifications, and portal theme.
              </p>
              <div className="space-y-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Hospital Logo URL (SVG / PNG)</label>
                  <input
                    type="text"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="https://yourhospital.com/logo.png"
                    className="w-full p-2.5 bg-slate-900/80 border border-slate-700 rounded-lg text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Primary Brand Accent Color</label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="color"
                      value={brandColor}
                      onChange={(e) => setBrandColor(e.target.value)}
                      className="w-10 h-10 rounded border border-slate-700 bg-transparent cursor-pointer"
                    />
                    <span className="font-mono text-slate-400">{brandColor}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Branches */}
          {currentStep === 3 && (
            <div className="space-y-3">
              <p className="text-slate-300">
                Every hospital tenant has a default <strong>Main Campus</strong> branch automatically created. You can configure additional branches later if your subscription tier permits.
              </p>
              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-700 flex items-center justify-between">
                <div>
                  <div className="font-bold text-white text-sm">Main Campus</div>
                  <div className="text-slate-400 text-xs">Primary Facility · Central Operations</div>
                </div>
                <Badge variant="success" size="sm">Provisioned</Badge>
              </div>
            </div>
          )}

          {/* Step 4: Departments */}
          {currentStep === 4 && (
            <div className="space-y-3">
              <p className="text-slate-300">
                Default clinical departments have been automatically initialized. Select any additional specialized departments:
              </p>
              <div className="grid grid-cols-2 gap-2">
                {['Cardiology', 'General Medicine', 'Orthopedics', 'Pediatrics', 'Neurology', 'Gynecology'].map((dept) => (
                  <div key={dept} className="flex items-center space-x-2 bg-slate-900/50 p-2.5 rounded-lg border border-slate-700">
                    <input type="checkbox" defaultChecked className="rounded text-teal-600 focus:ring-teal-500" />
                    <span className="text-slate-200">{dept}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 5: Working Hours */}
          {currentStep === 5 && (
            <div className="space-y-3">
              <p className="text-slate-300">Configure doctor consultation slot duration and OPD operating windows.</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Appointment Slot Duration</label>
                  <select
                    value={slotDuration}
                    onChange={(e) => setSlotDuration(e.target.value)}
                    className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200"
                  >
                    <option value="10">10 Minutes</option>
                    <option value="15">15 Minutes (Standard)</option>
                    <option value="20">20 Minutes</option>
                    <option value="30">30 Minutes</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">OPD Shift Hours</label>
                  <input
                    type="text"
                    disabled
                    value="09:00 AM - 06:00 PM"
                    className="w-full p-2 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-400"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 6: Clinical Services */}
          {currentStep === 6 && (
            <div className="space-y-3">
              <p className="text-slate-300">Core clinical modules activated for your instance:</p>
              <div className="grid grid-cols-3 gap-3">
                {['OPD Queue', 'IPD Bed Grid', 'Pharmacy FEFO', 'LIMS Laboratory', 'Radiology RIS', 'Billing & Tax'].map((mod) => (
                  <div key={mod} className="p-3 bg-teal-950/30 border border-teal-500/30 rounded-xl text-center">
                    <div className="text-teal-400 font-semibold">{mod}</div>
                    <div className="text-[10px] text-slate-400 mt-1">Enabled</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 7: Staff Setup */}
          {currentStep === 7 && (
            <div className="space-y-3">
              <p className="text-slate-300">Invite key medical doctors and staff members to join your workspace.</p>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Initial Doctor Names (Comma separated)</label>
                <input
                  type="text"
                  value={initialDoctors}
                  onChange={(e) => setInitialDoctors(e.target.value)}
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-200"
                />
              </div>
            </div>
          )}

          {/* Step 8: Plan Selection */}
          {currentStep === 8 && (
            <div className="space-y-3">
              <p className="text-slate-300">Your subscription tier:</p>
              <div className="bg-slate-900/60 p-4 rounded-xl border border-teal-500/40">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-lg font-bold text-white capitalize">{hospitalInfo?.subscription_plan || 'Professional'} Tier</span>
                    <div className="text-xs text-emerald-400">Includes 30-Day Enterprise Full Access Trial</div>
                  </div>
                  <Badge variant="success" size="sm">Active Trial</Badge>
                </div>
              </div>
            </div>
          )}

          {/* Step 9: Billing Setup */}
          {currentStep === 9 && (
            <div className="space-y-3">
              <p className="text-slate-300">No payment is required during the 30-day trial period. Monthly invoicing will begin after trial expiry.</p>
              <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-700 text-slate-400">
                Trial invoice amount: <strong className="text-white">₹ 0.00</strong> (Complimentary Onboarding)
              </div>
            </div>
          )}

          {/* Step 10: Final Activation */}
          {currentStep === 10 && (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto ring-8 ring-emerald-500/10">
                <ShieldCheck className="w-10 h-10" />
              </div>
              <h3 className="text-lg font-bold text-white">Ready for Production Launch</h3>
              <p className="text-slate-400 max-w-md mx-auto text-xs">
                All tenant configurations, security policies, and initial workspaces have been provisioned. Click below to activate your hospital instance.
              </p>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="mt-6 flex items-center justify-between">
          <Button
            variant="outline"
            disabled={currentStep === 1 || loading}
            onClick={handlePrevStep}
            className="border-slate-700 text-slate-300"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            <span>Previous</span>
          </Button>

          <Button
            variant="primary"
            disabled={loading}
            onClick={handleNextStep}
            className="bg-teal-600 hover:bg-teal-500 text-white font-semibold px-6"
          >
            {loading ? (
              'Saving...'
            ) : currentStep === 10 ? (
              'Activate & Launch Hospital'
            ) : (
              <>
                <span>Next Step</span>
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
