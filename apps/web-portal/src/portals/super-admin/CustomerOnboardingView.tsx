import React, { useState, useEffect } from 'react';
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
  Check,
  Workflow,
  KeyRound,
  FileText,
  BadgeCheck,
  ChevronRight,
  Terminal,
  RefreshCw,
  FolderTree,
  Filter,
  Plus,
  ArrowLeftRight,
  LifeBuoy
} from 'lucide-react';
import { Button, Badge, Modal, Input, useToast } from '../../components/ui';
import { saasApi, onboardingApi } from '../../services/api';

export type ProjectStatus =
  | 'LEAD'
  | 'QUALIFICATION'
  | 'PROPOSAL'
  | 'CONTRACT_PENDING'
  | 'LICENSED'
  | 'ONBOARDING'
  | 'CONFIGURATION'
  | 'MIGRATION'
  | 'TESTING'
  | 'TRAINING'
  | 'GO_LIVE_READY'
  | 'LIVE'
  | 'STABILIZATION'
  | 'SUPPORT'
  | 'ON_HOLD'
  | 'CANCELLED';

export type TaskStatus =
  | 'NOT_STARTED'
  | 'IN_PROGRESS'
  | 'WAITING_FOR_CUSTOMER'
  | 'WAITING_FOR_ASRTAVA'
  | 'BLOCKED'
  | 'UNDER_REVIEW'
  | 'COMPLETED'
  | 'REJECTED'
  | 'CANCELLED';

export interface OnboardingPhase {
  phaseNumber: number;
  id: string;
  name: string;
  owner: 'ASRTAVA' | 'Hospital' | 'Joint';
  description: string;
  status: 'completed' | 'in_progress' | 'pending';
  evidence: string;
}

export interface OnboardingTaskItem {
  id: string;
  phaseNumber: number;
  title: string;
  owner: string;
  assignedTo: 'ASRTAVA Team' | 'Hospital Team' | 'Joint';
  dueDate: string;
  status: TaskStatus;
  dependencies: string[];
}

export const MASTER_15_PHASES: OnboardingPhase[] = [
  { phaseNumber: 1, id: 'ENQUIRY', name: '1. Customer Enquiry', owner: 'ASRTAVA', description: 'Enquiry capture, bed sizing, department requirements via CRM.', status: 'completed', evidence: 'CRM Opportunity #OPP-2026-BLR-01 registered.' },
  { phaseNumber: 2, id: 'ASSESSMENT', name: '2. Requirement Assessment', owner: 'Joint', description: 'Clinical scope (OPD, IPD, OT, LIS, RIS) & DPDP compliance evaluation.', status: 'completed', evidence: 'Scope Matrix signed by Solution Architect.' },
  { phaseNumber: 3, id: 'DEMONSTRATION', name: '3. Product Demonstration', owner: 'ASRTAVA', description: 'Clinical workflows demonstrated using synthetic test hospital data.', status: 'completed', evidence: 'Clinical demo completed for Medical Director.' },
  { phaseNumber: 4, id: 'PROPOSAL', name: '4. Proposal & Quotation', owner: 'ASRTAVA', description: 'One-time perpetual software license quotation + optional maintenance.', status: 'completed', evidence: 'Quotation #Q-2026-991 approved by customer.' },
  { phaseNumber: 5, id: 'CONTRACT', name: '5. Contract & License Purchase', owner: 'Joint', description: 'Perpetual license agreement signed with Zero-Lockout clause.', status: 'completed', evidence: 'Contract #ASR-LIC-2026-X99 executed.' },
  { phaseNumber: 6, id: 'REGISTRATION', name: '6. Customer Registration', owner: 'ASRTAVA', description: 'Organization, tenant, hospital record & admin invitations provisioned.', status: 'completed', evidence: 'Tenant ID: MANIPAL-BLR provisioned with RLS.' },
  { phaseNumber: 7, id: 'PROJECT_INIT', name: '7. Onboarding Project Creation', owner: 'ASRTAVA', description: 'Project manager, hospital coordinator, milestones & timeline established.', status: 'completed', evidence: 'Project ONB-2026-001 initialized.' },
  { phaseNumber: 8, id: 'INFO_COLLECTION', name: '8. Hospital Information Collection', owner: 'Hospital', description: 'Hospital demographics, bed census, tariff catalogs & doctor profiles uploaded.', status: 'completed', evidence: 'All 6 profile forms submitted via Hospital Workspace.' },
  { phaseNumber: 9, id: 'DEPLOYMENT_PLAN', name: '9. Deployment Planning', owner: 'Joint', description: 'Hardware sizing, server specs, network & air-gap architecture agreed.', status: 'completed', evidence: 'Topology: Hybrid Edge (Local + Cloud Mirror).' },
  { phaseNumber: 10, id: 'ENV_INSTALL', name: '10. Environment Installation', owner: 'ASRTAVA', description: 'PostgreSQL DB, Redis cache, 38 migrations, API & offline license activation.', status: 'completed', evidence: '38 DB migrations applied cleanly.' },
  { phaseNumber: 11, id: 'CONFIGURATION', name: '11. Hospital Configuration', owner: 'Joint', description: 'Dynamic departments, wards, consultation fees & drug formulary configured.', status: 'completed', evidence: '14 departments, 350 beds, 1,200 drug SKUs active.' },
  { phaseNumber: 12, id: 'DATA_MIGRATION', name: '12. Data Migration & Integrations', owner: 'Joint', description: 'Legacy EHR data mapped, deduplicated, checksummed & reconciled.', status: 'completed', evidence: '42,500 patient records reconciled (0 errors).' },
  { phaseNumber: 13, id: 'UAT_VALIDATION', name: '13. Testing and UAT Validation', owner: 'Joint', description: '12 core clinical workflows tested by hospital team with 0 critical defects.', status: 'completed', evidence: 'UAT Sign-off received across all 12 test suites.' },
  { phaseNumber: 14, id: 'STAFF_TRAINING', name: '14. Staff Training & Certification', owner: 'Joint', description: 'Doctors, nurses, receptionists, lab techs certified (≥ 80% passing grade).', status: 'in_progress', evidence: '95.8% staff certified (Doctors 97.7%, Nurses 93.3%).' },
  { phaseNumber: 15, id: 'GO_LIVE_APPROVAL', name: '15. Go-Live Approval & Hospital Launch', owner: 'Joint', description: '14-gate readiness checklist verified & Dual Sign-Off executed.', status: 'pending', evidence: 'Hospital Admin Pre-Approved · ASRTAVA Lead Sign-off Ready.' }
];

export const CustomerOnboardingView: React.FC = () => {
  const { showToast } = useToast();
  const [activeSubTab, setActiveSubTab] = useState<'pipeline' | 'projects' | 'tasks' | 'migration' | 'uat' | 'training' | 'golive' | 'hypercare'>('pipeline');

  const [phases, setPhases] = useState<OnboardingPhase[]>(MASTER_15_PHASES);
  const [selectedPhaseIndex, setSelectedPhaseIndex] = useState<number>(13); // Phase 14
  const [isSignOffModalOpen, setIsSignOffModalOpen] = useState(false);
  const [signOffNotes, setSignOffNotes] = useState('All 15 master implementation phases verified. Hospital ready for production cutover.');

  // Projects list
  const [projects, setProjects] = useState<any[]>([
    {
      id: 'ONB-2026-MANIPAL',
      hospitalName: 'Manipal Super-Speciality Hospital',
      tenantCode: 'MANIPAL-BLR',
      city: 'Bangalore, KA',
      projectManager: 'Dr. Vikram Malhotra (ASRTAVA Lead)',
      hospitalCoordinator: 'Dr. Rajesh Sharma (Medical Director)',
      deploymentModel: 'Hybrid Edge Gateway (Local + Cloud Mirror)',
      overallStatus: 'TRAINING' as ProjectStatus,
      progress: 94,
      targetGoLive: '15 Dec 2026',
      openTasks: 3,
      verifiedGates: 12,
      totalGates: 14
    },
    {
      id: 'ONB-2026-APEX-DELHI',
      hospitalName: 'Apex Trauma & Cardiac Center',
      tenantCode: 'APEX-DEL',
      city: 'New Delhi, DL',
      projectManager: 'Siddharth Rao (ASRTAVA Lead)',
      hospitalCoordinator: 'Col. S. K. Verma (COO)',
      deploymentModel: 'On-Premises Air-Gapped (Hardware SRV-X99)',
      overallStatus: 'LIVE' as ProjectStatus,
      progress: 100,
      targetGoLive: '01 Nov 2026',
      openTasks: 0,
      verifiedGates: 14,
      totalGates: 14
    }
  ]);

  const [selectedProjectId, setSelectedProjectId] = useState<string>('ONB-2026-MANIPAL');
  const currentProject = projects.find(p => p.id === selectedProjectId) || projects[0];

  // Tasks state
  const [tasks, setTasks] = useState<OnboardingTaskItem[]>([
    { id: 'TSK-101', phaseNumber: 14, title: 'Finalize Inpatient Ward Nursing Certification (Night Shift)', owner: 'Sister Incharge', assignedTo: 'Hospital Team', dueDate: 'Tomorrow', status: 'IN_PROGRESS', dependencies: ['TSK-100'] },
    { id: 'TSK-102', phaseNumber: 14, title: 'Emergency Trauma Code Alert Drill Simulation', owner: 'Trauma Lead', assignedTo: 'Joint', dueDate: '14 Dec 2026', status: 'IN_PROGRESS', dependencies: [] },
    { id: 'TSK-103', phaseNumber: 15, title: 'ASRTAVA Implementation Lead Dual Sign-Off Execution', owner: 'Dr. Vikram Malhotra', assignedTo: 'ASRTAVA Team', dueDate: '15 Dec 2026', status: 'WAITING_FOR_ASRTAVA', dependencies: ['TSK-101', 'TSK-102'] },
  ]);

  const handleDualSignOff = () => {
    setIsSignOffModalOpen(false);

    // Transition Phase 14 & 15
    const updatedPhases = phases.map(p => {
      if (p.phaseNumber === 14) return { ...p, status: 'completed' as const };
      if (p.phaseNumber === 15) return { ...p, status: 'completed' as const, evidence: 'Dual Sign-off executed: Hospital Medical Director + ASRTAVA Lead.' };
      return p;
    });
    setPhases(updatedPhases);

    // Update project status to LIVE
    setProjects(projects.map(p => p.id === currentProject.id ? { ...p, overallStatus: 'LIVE', progress: 100 } : p));

    showToast({
      type: 'success',
      title: 'Production Cutover Complete',
      message: `${currentProject.hospitalName} is now LIVE. Transitioned to 30-Day Dedicated Hypercare Support.`
    });
  };

  const activePhase = phases[selectedPhaseIndex] || phases[13];

  return (
    <div className="space-y-6">
      {/* Top Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-medium">Customer Onboarding Projects</span>
          <div className="text-2xl font-bold text-purple-900 mt-1">{projects.length} Facilities</div>
          <span className="text-[11px] text-purple-600 font-medium">
            1 Live &bull; 1 Active In-Flight
          </span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-emerald-600 font-medium">Active Facility Readiness</span>
          <div className="text-2xl font-bold text-emerald-600 mt-1">{currentProject.progress}%</div>
          <span className="text-[11px] text-emerald-600 font-medium">
            {currentProject.verifiedGates} of {currentProject.totalGates} Gates Verified
          </span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-blue-600 font-medium">Reconciled Demographics</span>
          <div className="text-2xl font-bold text-blue-600 mt-1">42,500 Records</div>
          <span className="text-[11px] text-slate-400">Zero Checksum Discrepancies</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-teal-600 font-medium">Overall Implementation Status</span>
          <div className="text-lg font-bold text-teal-800 mt-1">
            {currentProject.overallStatus}
          </div>
          <span className="text-[11px] text-teal-600 font-medium">Phase 14 &bull; Training in progress</span>
        </div>
      </div>

      {/* Project Selector & Actions Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 flex items-center space-x-1">
                <Building2 className="w-3.5 h-3.5" />
                <span>{currentProject.hospitalName}</span>
              </span>
              <span className="text-xs text-slate-400 font-mono">{currentProject.id}</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mt-1">{currentProject.hospitalName}</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Topology: <strong>{currentProject.deploymentModel}</strong> &bull; Target Go-Live:{' '}
              <span className="font-semibold text-slate-700">{currentProject.targetGoLive}</span>
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="text-xs font-medium border border-slate-300 rounded-lg px-3 py-2 bg-slate-50 text-slate-800"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.hospitalName} ({p.overallStatus})
                </option>
              ))}
            </select>

            <Button variant="primary" size="sm" onClick={() => setIsSignOffModalOpen(true)}>
              <ShieldCheck className="w-4 h-4 mr-1.5" />
              <span>ASRTAVA Dual Sign-Off Gate</span>
            </Button>
          </div>
        </div>

        {/* Sub-Tabs for Onboarding Management */}
        <div className="border-t border-slate-100 pt-3">
          <nav className="flex space-x-4 text-xs font-semibold overflow-x-auto">
            {[
              { id: 'pipeline', label: '15-Phase Master Lifecycle' },
              { id: 'projects', label: 'All Customer Projects' },
              { id: 'tasks', label: `Implementation Tasks (${tasks.length})` },
              { id: 'migration', label: 'Data Migration Reconciliation' },
              { id: 'uat', label: 'Testing & UAT Suite' },
              { id: 'training', label: 'Staff Training Matrix' },
              { id: 'golive', label: 'Go-Live Dual Sign-Off' },
              { id: 'hypercare', label: '30-Day Hypercare' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`pb-2 border-b-2 transition whitespace-nowrap cursor-pointer ${
                  activeSubTab === tab.id ? 'border-purple-600 text-purple-800 font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* SUB-TAB 1: 15-Phase Master Lifecycle Pipeline */}
      {activeSubTab === 'pipeline' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                  <Workflow className="w-4 h-4 text-purple-600" />
                  <span>The 15 Master Onboarding Phases (Specification Flowchart)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Click any phase below to inspect responsible team, deliverables, and evidence.</p>
              </div>
              <Badge variant="purple">Phases 1-13 Cleared &bull; Phase 14 Active</Badge>
            </div>

            {/* 15 Phase Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-5 gap-2 text-[11px]">
              {phases.map((p, idx) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPhaseIndex(idx)}
                  className={`p-3 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                    selectedPhaseIndex === idx
                      ? 'border-purple-600 bg-purple-50/80 shadow-sm ring-2 ring-purple-600/20'
                      : p.status === 'completed'
                      ? 'border-emerald-200 bg-emerald-50/40 text-emerald-950'
                      : p.status === 'in_progress'
                      ? 'border-amber-300 bg-amber-50/60 text-amber-950 font-semibold'
                      : 'border-slate-200 bg-slate-50 text-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-[10px] text-slate-400">PHASE {p.phaseNumber}</span>
                    {p.status === 'completed' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    ) : p.status === 'in_progress' ? (
                      <Clock className="w-3.5 h-3.5 text-amber-500 animate-spin" />
                    ) : (
                      <Clock className="w-3.5 h-3.5 text-slate-300" />
                    )}
                  </div>
                  <div className="font-bold line-clamp-1 text-slate-900">{p.name.split('. ')[1]}</div>
                  <div className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider">{p.owner}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Phase Inspector Deep Dive */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-3">
                <span className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 font-bold flex items-center justify-center text-sm">
                  {activePhase.phaseNumber}
                </span>
                <div>
                  <h4 className="text-base font-bold text-slate-900">{activePhase.name}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">{activePhase.description}</p>
                </div>
              </div>
              <Badge variant={activePhase.status === 'completed' ? 'success' : activePhase.status === 'in_progress' ? 'warning' : 'neutral'}>
                {activePhase.status.toUpperCase()}
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="text-slate-400 font-medium">Workstream Ownership</span>
                <div className="font-bold text-slate-800">{activePhase.owner} Team Responsibility</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1 md:col-span-2">
                <span className="text-slate-400 font-medium">Traceable Evidence & Verification Artifact</span>
                <div className="font-mono text-purple-800 bg-white p-1.5 rounded border border-slate-200 text-[11px] truncate">
                  {activePhase.evidence}
                </div>
              </div>
            </div>

            {activePhase.phaseNumber === 15 && (
              <div className="p-4 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <span className="font-bold block">Phase 15: Dual Sign-Off Authorization Ready</span>
                  <span className="text-[11px] text-purple-800">Hospital Medical Director pre-approved go-live. ASRTAVA Implementation Lead review ready.</span>
                </div>
                <Button variant="primary" size="sm" onClick={() => setIsSignOffModalOpen(true)}>
                  Execute Dual Sign-Off
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: All Customer Projects */}
      {activeSubTab === 'projects' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-xs">
          <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
            <div>
              <h3 className="font-bold text-slate-900">Hospital Implementation Projects Registry</h3>
              <p className="text-slate-500">Track all enterprise hospital customer onboarding deployments.</p>
            </div>
            <Badge variant="purple">{projects.length} Active</Badge>
          </div>

          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-400 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Hospital Organization</th>
                <th className="py-3 px-3">Project Manager</th>
                <th className="py-3 px-3">Hospital Coordinator</th>
                <th className="py-3 px-3">Deployment Model</th>
                <th className="py-3 px-3">Overall Status</th>
                <th className="py-3 px-3">Readiness</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {projects.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-4 font-semibold text-slate-900">
                    <div>{p.hospitalName}</div>
                    <div className="text-[11px] text-slate-400 font-mono">{p.id} &bull; {p.city}</div>
                  </td>
                  <td className="py-3 px-3 text-slate-700">{p.projectManager}</td>
                  <td className="py-3 px-3 text-slate-700">{p.hospitalCoordinator}</td>
                  <td className="py-3 px-3 text-slate-600">{p.deploymentModel.split(' (')[0]}</td>
                  <td className="py-3 px-3">
                    <Badge variant={p.overallStatus === 'LIVE' ? 'success' : 'purple'} size="sm">
                      {p.overallStatus}
                    </Badge>
                  </td>
                  <td className="py-3 px-3 font-semibold text-teal-700">{p.progress}%</td>
                  <td className="py-3 px-4 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedProjectId(p.id);
                        setActiveSubTab('pipeline');
                      }}
                    >
                      Inspect
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* SUB-TAB 3: Implementation Tasks Management */}
      {activeSubTab === 'tasks' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4 text-xs">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Implementation Tasks & Milestone Action Items</h3>
              <p className="text-slate-500">Assigned across ASRTAVA Engineering and Hospital Customer Workstream Teams.</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => showToast({ type: 'info', title: 'Task Registered', message: 'New implementation task created.' })}
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              <span>Create Task</span>
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Task ID</th>
                  <th className="py-2.5 px-3">Phase</th>
                  <th className="py-2.5 px-3">Task Title</th>
                  <th className="py-2.5 px-3">Assigned Workstream</th>
                  <th className="py-2.5 px-3">Due Date</th>
                  <th className="py-2.5 px-3">Task Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tasks.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50">
                    <td className="py-3 px-3 font-mono font-bold text-purple-700">{t.id}</td>
                    <td className="py-3 px-3 font-semibold text-slate-700">Phase {t.phaseNumber}</td>
                    <td className="py-3 px-3 font-medium text-slate-900">{t.title}</td>
                    <td className="py-3 px-3 text-slate-600">{t.assignedTo} ({t.owner})</td>
                    <td className="py-3 px-3 text-slate-500">{t.dueDate}</td>
                    <td className="py-3 px-3">
                      <Badge variant={t.status === 'COMPLETED' ? 'success' : t.status === 'IN_PROGRESS' ? 'warning' : 'purple'} size="sm">
                        {t.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => {
                          setTasks(tasks.map(item => item.id === t.id ? { ...item, status: 'COMPLETED' } : item));
                          showToast({ type: 'success', title: 'Task Completed', message: `Marked ${t.id} as completed.` });
                        }}
                        className="text-purple-600 hover:text-purple-800 font-semibold cursor-pointer"
                      >
                        Complete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: Data Migration Reconciliation */}
      {activeSubTab === 'migration' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5 text-xs">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Data Migration Provenance & Reconciliation Audit</h3>
            <p className="text-slate-500">Section 11 Safeguards: 42,500 patient records ingested without blind overwriting.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="text-slate-400">Total Ingested Records</span>
              <div className="font-bold text-slate-900 text-lg">42,500</div>
              <span className="text-[10px] text-slate-500">Demographics & UHIDs</span>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="text-slate-400">Valid Reconciled Rows</span>
              <div className="font-bold text-emerald-700 text-lg">42,500 (100%)</div>
              <span className="text-[10px] text-emerald-600">Integrity Check Passed</span>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="text-slate-400">Duplicates Filtered</span>
              <div className="font-bold text-slate-800 text-lg">18 Records</div>
              <span className="text-[10px] text-slate-500">Logged to reconciliation table</span>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="text-slate-400">Audit Checksum Hash</span>
              <div className="font-mono text-purple-700 text-[11px] truncate">sha256:7f4a9b12...</div>
              <span className="text-[10px] text-slate-500">Traceability verified</span>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 7: Go-Live Dual Sign-Off */}
      {activeSubTab === 'golive' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5 text-xs">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">14-Gate Go-Live Readiness & Dual Sign-Off Verification</h3>
            <p className="text-slate-500">Never let automation approve clinical readiness or production cutover without responsible human review.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
              { code: 'ASRTAVA_LEAD_APPROVAL', title: 'ASRTAVA Lead Dual Sign-Off Gate', ok: currentProject.overallStatus === 'LIVE' },
            ].map((gate) => (
              <div
                key={gate.code}
                className={`flex items-center justify-between p-2.5 rounded-xl border ${
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

          <div className="pt-3 border-t border-slate-100 flex justify-end">
            <Button variant="primary" size="sm" onClick={() => setIsSignOffModalOpen(true)}>
              <ShieldCheck className="w-4 h-4 mr-1.5" />
              <span>Execute ASRTAVA Lead Dual Sign-Off</span>
            </Button>
          </div>
        </div>
      )}

      {/* SUB-TAB 8: 30-Day Hypercare */}
      {activeSubTab === 'hypercare' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4 text-xs">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Post-Launch 30-Day Hypercare & Stabilization</h3>
              <p className="text-slate-500">Enhanced standby engineering support, daily triage, and smooth transition to standard Customer Success.</p>
            </div>
            <Badge variant="success">Hypercare Standby Team Active</Badge>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="font-bold text-slate-800">Stabilization Period Protocols</div>
            <div className="space-y-1 text-slate-600 text-[11px]">
              <div>&bull; 24/7 dedicated escalation channel for Emergency, ICU, and OT departments.</div>
              <div>&bull; Daily evening synchronization between Hospital IT and ASRTAVA Implementation Manager.</div>
              <div>&bull; Automated Nightly WAL snapshot verification and integrity checks.</div>
              <div>&bull; Zero standing access into patient EMR (Zero Standing Privilege preserved during hypercare).</div>
            </div>
          </div>
        </div>
      )}

      {/* Dual Sign-Off Modal */}
      <Modal
        isOpen={isSignOffModalOpen}
        onClose={() => setIsSignOffModalOpen(false)}
        title="ASRTAVA Implementation Lead Dual Sign-Off"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-600 leading-relaxed">
            You are signing off on behalf of the ASRTAVA Implementation & Technical Team for <strong>{currentProject.hospitalName}</strong>.
            This action executes the final production cutover and activates the 30-day Hypercare support period.
          </p>

          <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 text-purple-900 space-y-1">
            <div className="font-semibold">Dual Sign-Off Credentials:</div>
            <div>ASRTAVA Implementation Lead: <strong>{currentProject.projectManager}</strong></div>
            <div>Hospital Coordinator Lead: <strong>{currentProject.hospitalCoordinator}</strong></div>
            <div>Topology: <strong>{currentProject.deploymentModel}</strong></div>
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

export default CustomerOnboardingView;
