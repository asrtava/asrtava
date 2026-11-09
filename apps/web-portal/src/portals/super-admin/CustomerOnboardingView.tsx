import React, { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Server,
  Users,
  Building2,
  ShieldCheck,
  FileSpreadsheet,
  GraduationCap,
  Sparkles,
  ArrowRight,
  Send,
  Database,
  Layers,
  Award,
  Activity,
  Check
} from 'lucide-react';
import { Button, Badge, Modal, Input, useToast } from '../../components/ui';

export const CustomerOnboardingView: React.FC = () => {
  const { showToast } = useToast();

  const [selectedImplementation, setSelectedImplementation] = useState<string>('imp-max-001');
  const [isSignOffModalOpen, setIsSignOffModalOpen] = useState(false);
  const [signOffNotes, setSignOffNotes] = useState('All 14 mandatory readiness gates verified and accepted for production cutover.');

  const implementations = [
    {
      id: 'imp-max-001',
      projectCode: 'IMP-2026-MAXSAKET',
      hospitalName: 'Max Super Speciality Hospital, Saket',
      customerGroup: 'Max Healthcare Institute Limited',
      deploymentModel: 'Hybrid (Edge Local + Cloud Analytics)',
      currentStage: 'go_live_readiness',
      stageLabel: 'Go-Live Readiness Evaluation',
      targetGoLive: '2026-12-15',
      readinessScore: 92,
      openCriticalDefects: 0,
      verifiedGates: 13,
      totalGates: 14,
      dataMigrationStatus: 'Reconciled (48,200 records)',
      staffTrained: '412 / 450 (91.5%)',
      leadManager: 'Pooja Iyer (ASRTAVA Lead)',
      hospitalLead: 'Dr. Vikram Mehra (Medical Director)'
    },
    {
      id: 'imp-fortis-002',
      projectCode: 'IMP-2026-FORTISGGN',
      hospitalName: 'Fortis Memorial Research Institute',
      customerGroup: 'Fortis Healthcare Ltd',
      deploymentModel: 'Cloud Multi-Tenant RLS',
      currentStage: 'user_training',
      stageLabel: 'Role-Specific Training & Certification',
      targetGoLive: '2027-01-20',
      readinessScore: 68,
      openCriticalDefects: 1,
      verifiedGates: 8,
      totalGates: 14,
      dataMigrationStatus: 'In Progress (Dry Run Preview)',
      staffTrained: '185 / 320 (57.8%)',
      leadManager: 'Rajiv Sen (ASRTAVA Lead)',
      hospitalLead: 'Dr. Sunita Bansal'
    },
    {
      id: 'imp-aiims-003',
      projectCode: 'IMP-2026-RURALONPREM',
      hospitalName: 'District Memorial Hospital (Govt)',
      customerGroup: 'State Health Mission',
      deploymentModel: 'On-Premises Air-Gapped',
      currentStage: 'implementation_completed',
      stageLabel: 'Implementation Completed (Standard AMC)',
      targetGoLive: '2026-10-01',
      readinessScore: 100,
      openCriticalDefects: 0,
      verifiedGates: 14,
      totalGates: 14,
      dataMigrationStatus: 'Completed & Certified',
      staffTrained: '142 / 142 (100%)',
      leadManager: 'Amit Verma (ASRTAVA Lead)',
      hospitalLead: 'Dr. R. K. Patel'
    }
  ];

  const currentImpl = implementations.find((i) => i.id === selectedImplementation) || implementations[0];

  const handleDualSignOff = () => {
    setIsSignOffModalOpen(false);
    showToast({
      type: 'success',
      title: 'Production Go-Live Authorized',
      message: `ASRTAVA Implementation Lead dual sign-off registered for ${currentImpl.hospitalName}. System transitioned to Live Production & 30-Day Hypercare.`
    });
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-medium">Active Implementation Projects</span>
          <div className="text-2xl font-bold text-purple-900 mt-1">12 Hospitals</div>
          <span className="text-[11px] text-purple-600 font-medium">8 Hybrid · 3 Cloud · 1 On-Prem</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-emerald-600 font-medium">Go-Live Ready (Dual Sign-Off Gate)</span>
          <div className="text-2xl font-bold text-emerald-600 mt-1">2 Hospitals</div>
          <span className="text-[11px] text-emerald-600 font-medium">0 Open Critical UAT Defects</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-blue-600 font-medium">Total Migrated Records</span>
          <div className="text-2xl font-bold text-blue-600 mt-1">1,48,920 Rows</div>
          <span className="text-[11px] text-slate-400">100% Reconciliation Verification</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-amber-600 font-medium">Active Hypercare Tickets</span>
          <div className="text-2xl font-bold text-amber-600 mt-1">3 Tickets</div>
          <span className="text-[11px] text-amber-600">SLA p95 resolution: 42 mins</span>
        </div>
      </div>

      {/* Implementation Project Selection Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 flex items-center space-x-1">
                <Building2 className="w-3.5 h-3.5" />
                <span>{currentImpl.customerGroup}</span>
              </span>
              <span className="text-xs text-slate-400 font-mono">{currentImpl.projectCode}</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mt-1">{currentImpl.hospitalName}</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Topology: <strong>{currentImpl.deploymentModel}</strong> &bull; Target Go-Live:{' '}
              <span className="font-semibold text-slate-700">{currentImpl.targetGoLive}</span>
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <select
              value={selectedImplementation}
              onChange={(e) => setSelectedImplementation(e.target.value)}
              className="text-xs font-medium border border-slate-300 rounded-lg px-3 py-2 bg-slate-50 text-slate-800"
            >
              {implementations.map((impl) => (
                <option key={impl.id} value={impl.id}>
                  {impl.hospitalName} ({impl.stageLabel})
                </option>
              ))}
            </select>

            {currentImpl.currentStage === 'go_live_readiness' && (
              <Button variant="primary" size="sm" onClick={() => setIsSignOffModalOpen(true)}>
                <ShieldCheck className="w-4 h-4 mr-1.5" />
                <span>ASRTAVA Dual Sign-Off</span>
              </Button>
            )}
          </div>
        </div>

        {/* 18-Stage Visual Progress Ribbon */}
        <div className="border-t border-slate-100 pt-4 space-y-2">
          <div className="flex justify-between items-center text-xs font-semibold text-slate-700">
            <span>Implementation Lifecycle Progress: {currentImpl.stageLabel}</span>
            <span className="text-purple-700 font-mono">{currentImpl.readinessScore}% Readiness</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
            <div
              className={`h-2.5 rounded-full transition-all duration-500 ${
                currentImpl.readinessScore === 100
                  ? 'bg-emerald-500'
                  : currentImpl.readinessScore >= 80
                  ? 'bg-purple-600'
                  : 'bg-amber-500'
              }`}
              style={{ width: `${currentImpl.readinessScore}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Implementation Workstream Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 1. Deployment & Infrastructure Assessment */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 text-slate-800 font-bold text-sm">
            <Server className="w-4 h-4 text-purple-600" />
            <span>1. Deployment & Hardware Sizing</span>
          </div>
          <div className="space-y-3 text-xs">
            <div className="flex justify-between p-2.5 bg-slate-50 rounded-lg">
              <span className="text-slate-500">Topology Profile</span>
              <span className="font-semibold text-slate-800">Hybrid Edge-to-Cloud</span>
            </div>
            <div className="flex justify-between p-2.5 bg-slate-50 rounded-lg">
              <span className="text-slate-500">Server Specs</span>
              <span className="font-semibold text-slate-800">64 Cores · 256GB RAM · RAID-10</span>
            </div>
            <div className="flex justify-between p-2.5 bg-slate-50 rounded-lg">
              <span className="text-slate-500">Air-Gapped Resiliency</span>
              <span className="font-semibold text-emerald-700 flex items-center">
                <Check className="w-3.5 h-3.5 mr-1" />
                Verified Offline Safe
              </span>
            </div>
            <div className="flex justify-between p-2.5 bg-slate-50 rounded-lg">
              <span className="text-slate-500">DPDP Act Redaction</span>
              <span className="font-semibold text-emerald-700 flex items-center">
                <Check className="w-3.5 h-3.5 mr-1" />
                PII Masking Active
              </span>
            </div>
          </div>
        </div>

        {/* 2. Data Migration & Master Catalog Reconciled */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 text-slate-800 font-bold text-sm">
            <Database className="w-4 h-4 text-blue-600" />
            <span>2. Data Migration Engine</span>
          </div>
          <div className="space-y-3 text-xs">
            <div className="flex justify-between p-2.5 bg-slate-50 rounded-lg">
              <span className="text-slate-500">Source Legacy EHR</span>
              <span className="font-semibold text-slate-800">Legacy Medix SQL (MSSQL)</span>
            </div>
            <div className="flex justify-between p-2.5 bg-slate-50 rounded-lg">
              <span className="text-slate-500">Patient Demographics</span>
              <span className="font-semibold text-slate-800">42,500 Valid · 18 Duplicates Excluded</span>
            </div>
            <div className="flex justify-between p-2.5 bg-slate-50 rounded-lg">
              <span className="text-slate-500">Human Sign-Off Checkpoint</span>
              <span className="font-semibold text-emerald-700 flex items-center">
                <Check className="w-3.5 h-3.5 mr-1" />
                Approved by Hospital Admin
              </span>
            </div>
            <div className="flex justify-between p-2.5 bg-slate-50 rounded-lg">
              <span className="text-slate-500">Checksum Traceability</span>
              <span className="font-mono text-purple-700">sha256:7f4a...9b12</span>
            </div>
          </div>
        </div>

        {/* 3. Training & Certification Gate */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 text-slate-800 font-bold text-sm">
            <GraduationCap className="w-4 h-4 text-teal-600" />
            <span>3. Training & Certification</span>
          </div>
          <div className="space-y-3 text-xs">
            <div className="flex justify-between p-2.5 bg-slate-50 rounded-lg">
              <span className="text-slate-500">Doctor Clinical EMR Module</span>
              <span className="font-semibold text-emerald-700">88/90 Certified (97.7%)</span>
            </div>
            <div className="flex justify-between p-2.5 bg-slate-50 rounded-lg">
              <span className="text-slate-500">Inpatient Nursing Station</span>
              <span className="font-semibold text-emerald-700">140/150 Certified (93.3%)</span>
            </div>
            <div className="flex justify-between p-2.5 bg-slate-50 rounded-lg">
              <span className="text-slate-500">Pharmacy & FEFO Formulary</span>
              <span className="font-semibold text-emerald-700">22/22 Certified (100%)</span>
            </div>
            <div className="flex justify-between p-2.5 bg-slate-50 rounded-lg">
              <span className="text-slate-500">Passing Grade Threshold</span>
              <span className="font-semibold text-purple-800">&ge; 80% on Clinical Scenario</span>
            </div>
          </div>
        </div>
      </div>

      {/* 14 Mandatory Readiness Gates Summary */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-bold text-slate-900">14-Gate Production Readiness Checklist</h3>
          <span className="text-xs text-purple-700 font-semibold font-mono">
            {currentImpl.verifiedGates} of {currentImpl.totalGates} Gates Verified
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {[
            { code: 'LICENSE_VERIFIED', title: 'Perpetual Software License Verified', ok: true },
            { code: 'DEPLOYMENT_ENV_OPERATIONAL', title: 'Hosting Environment Probe Passed', ok: true },
            { code: 'SECURITY_AUDIT_CLEARED', title: 'NIST & RBAC Encryption Validated', ok: true },
            { code: 'BACKUP_RESTORATION_VERIFIED', title: 'Automated Snapshot Drill Succeeded', ok: true },
            { code: 'HOSPITAL_CONFIG_COMPLETED', title: 'Departments & Tariffs Configured', ok: true },
            { code: 'DATA_MIGRATION_RECONCILED', title: 'Patient Data & Catalogs Reconciled', ok: true },
            { code: 'STAFF_ACCOUNTS_ACTIVATED', title: 'Staff Accounts Enrolled', ok: true },
            { code: 'MANDATORY_TRAINING_CERTIFIED', title: 'Role Certifications (>= 80%)', ok: true },
            { code: 'UAT_SIGN_OFF', title: 'UAT Accepted (0 Critical Defects)', ok: true },
            { code: 'INTEGRATIONS_VERIFIED', title: 'Telecom & PACS Bridges Operational', ok: true },
            { code: 'COMMUNICATION_PLAN_APPROVED', title: 'Launch Notifications Prepared', ok: true },
            { code: 'SUPPORT_TEAM_ASSIGNED', title: 'Hypercare Escalation Matrix Ready', ok: true },
            { code: 'HOSPITAL_ADMIN_APPROVAL', title: 'Hospital Admin Pre-Approved', ok: true },
            { code: 'ASRTAVA_LEAD_APPROVAL', title: 'ASRTAVA Lead Dual Sign-Off Gate', ok: currentImpl.verifiedGates === 14 },
          ].map((gate) => (
            <div
              key={gate.code}
              className={`flex items-center justify-between p-2.5 rounded-lg border ${
                gate.ok ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900' : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}
            >
              <div className="flex items-center space-x-2">
                {gate.ok ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Clock className="w-4 h-4 text-slate-400" />}
                <span className="font-medium">{gate.title}</span>
              </div>
              <span className="font-mono text-[10px] uppercase font-bold text-slate-500">{gate.ok ? 'VERIFIED' : 'PENDING'}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Dual Sign-Off Modal */}
      <Modal
        isOpen={isSignOffModalOpen}
        onClose={() => setIsSignOffModalOpen(false)}
        title="ASRTAVA Implementation Lead Dual Sign-Off"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-600">
            You are signing off on behalf of the ASRTAVA Engineering & Implementation Team for <strong>{currentImpl.hospitalName}</strong>.
            This action executes the final production cutover and activates the 30-day Hypercare support period.
          </p>

          <div className="p-3 bg-purple-50 rounded-lg border border-purple-200 text-purple-900 space-y-1">
            <div className="font-semibold">Sign-Off Verification Credentials:</div>
            <div>Authorized Lead: <strong>Pooja Iyer (ASRTAVA Lead)</strong></div>
            <div>Hospital Partner Lead: <strong>Dr. Vikram Mehra (Medical Director)</strong></div>
            <div>Topology: <strong>{currentImpl.deploymentModel}</strong></div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Formal Implementation Notes & Audit Remarks</label>
            <Input
              value={signOffNotes}
              onChange={(e) => setSignOffNotes(e.target.value)}
              placeholder="Enter audit remarks..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <Button variant="outline" size="sm" onClick={() => setIsSignOffModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleDualSignOff}>
              <ShieldCheck className="w-4 h-4 mr-1.5" />
              <span>Confirm Production Go-Live</span>
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

