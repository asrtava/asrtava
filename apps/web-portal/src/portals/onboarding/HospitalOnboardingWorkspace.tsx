import React, { useState, useEffect } from 'react';
import {
  Building2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Upload,
  FileText,
  Users,
  Server,
  Layers,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  Database,
  ArrowRight,
  Send,
  Download,
  GraduationCap,
  Activity,
  Check,
  Phone,
  Mail,
  Calendar,
  Lock,
  Workflow,
  HelpCircle,
  FileSpreadsheet,
  ArrowLeft
} from 'lucide-react';
import { Button, Badge, Modal, Input, useToast } from '../../components/ui';
import { onboardingApi, saasApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export type WorkspaceTab =
  | 'welcome'
  | 'profile'
  | 'organization'
  | 'operations'
  | 'staff'
  | 'infrastructure'
  | 'migration'
  | 'integrations'
  | 'documents'
  | 'configuration'
  | 'uat'
  | 'training'
  | 'approvals'
  | 'contacts'
  | 'go-live';

export const HospitalOnboardingWorkspace: React.FC<{ onExit?: () => void }> = ({ onExit }) => {
  const { showToast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('welcome');

  // Customer Input States
  const [hospitalLegalName, setHospitalLegalName] = useState('Manipal Super-Speciality Hospital Pvt Ltd');
  const [hospitalDisplayName, setHospitalDisplayName] = useState('Manipal Hospital Bangalore');
  const [regNumber, setRegNumber] = useState('REG-KA-BLR-2026-9921');
  const [address, setAddress] = useState('98 HAL Old Airport Road, Kodihalli, Bengaluru, Karnataka 560017');
  const [contactEmail, setContactEmail] = useState('admin@manipal.health');
  const [contactPhone, setContactPhone] = useState('+91 80 2502 4444');
  const [timeZone, setTimeZone] = useState('Asia/Kolkata (IST +5:30)');
  const [currency, setCurrency] = useState('INR (₹)');
  const [gstNumber, setGstNumber] = useState('29AAAAA0000A1Z5');

  // Infrastructure State
  const [deploymentModel, setDeploymentModel] = useState('Hybrid Edge (Local Server + Cloud Backup)');
  const [serverSpecs, setServerSpecs] = useState('64 Cores, 256GB RAM, RAID-10 SSD, 10Gbps LAN');
  const [workstationCount, setWorkstationCount] = useState('120');
  const [printerCount, setPrinterCount] = useState('45 Thermal & Laser');
  const [scannerCount, setScannerCount] = useState('60 2D Barcode Scanners');
  const [backupArrangement, setBackupArrangement] = useState('Automated Nightly WAL + Cloud S3 Mirror');

  // Data Migration Upload State
  const [legacyEhrName, setLegacyEhrName] = useState('Legacy Medix SQL (MSSQL)');
  const [patientRecordCount, setPatientRecordCount] = useState('42,500');
  const [mrnFormat, setMrnFormat] = useState('MAN-YYYY-XXXXX');
  const [isTestMigrationApproved, setIsTestMigrationApproved] = useState(true);

  // UAT & Sign-off State
  const [isSignOffModalOpen, setIsSignOffModalOpen] = useState(false);
  const [hospitalSignOffNotes, setHospitalSignOffNotes] = useState('Hospital Management pre-approved. All clinical departments satisfied with UAT tests.');

  // Project Metrics
  const projectSummary = {
    projectId: 'ONB-2026-MANIPAL',
    hospitalName: 'Manipal Super-Speciality Hospital',
    asrtavaLead: 'Dr. Vikram Malhotra (Senior Implementation Lead)',
    asrtavaTechLead: 'Siddharth Rao (Principal Solutions Architect)',
    targetGoLive: '15 December 2026',
    progressPercentage: 88,
    currentPhase: 'Phase 14: Staff Training & Go-Live Preparation',
    openActionItems: 2,
    verifiedGates: 12,
    totalGates: 14
  };

  const handleSaveProfile = () => {
    showToast({
      type: 'success',
      title: 'Hospital Profile Updated',
      message: 'Facility demographics and legal tax registration saved successfully.'
    });
  };

  const handleHospitalSignOff = () => {
    setIsSignOffModalOpen(false);
    showToast({
      type: 'success',
      title: 'Hospital Management Authorization Registered',
      message: 'Go-Live approval recorded. Formal ASRTAVA dual sign-off gate is now unblocked.'
    });
  };

  const navItems = [
    { id: 'welcome', label: '1. Welcome & Overview', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'profile', label: '2. Hospital Profile', icon: <Building2 className="w-4 h-4" /> },
    { id: 'organization', label: '3. Organization & Branches', icon: <Layers className="w-4 h-4" /> },
    { id: 'operations', label: '4. Clinical Operations & Wards', icon: <Activity className="w-4 h-4" /> },
    { id: 'staff', label: '5. Staff Directory & Roles', icon: <Users className="w-4 h-4" /> },
    { id: 'infrastructure', label: '6. IT Infrastructure', icon: <Server className="w-4 h-4" /> },
    { id: 'migration', label: '7. Data Migration', icon: <Database className="w-4 h-4" /> },
    { id: 'integrations', label: '8. External Integrations', icon: <Workflow className="w-4 h-4" /> },
    { id: 'documents', label: '9. Document Submissions', icon: <FileText className="w-4 h-4" /> },
    { id: 'configuration', label: '10. Configuration Review', icon: <CheckCircle2 className="w-4 h-4" /> },
    { id: 'uat', label: '11. Testing & UAT Validation', icon: <CheckCircle2 className="w-4 h-4" /> },
    { id: 'training', label: '12. Staff Training & Exams', icon: <GraduationCap className="w-4 h-4" /> },
    { id: 'approvals', label: '13. Pending Approvals', icon: <Clock className="w-4 h-4" /> },
    { id: 'contacts', label: '14. ASRTAVA Contacts', icon: <Phone className="w-4 h-4" /> },
    { id: 'go-live', label: '15. Go-Live Authorization', icon: <ShieldCheck className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navigation Banner */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center text-white font-bold shadow-sm">
              A
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-slate-900 text-sm">ASRTAVA Hospital Onboarding Workspace</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
                  CUSTOMER PORTAL
                </span>
              </div>
              <p className="text-[11px] text-slate-500">{projectSummary.hospitalName} &bull; {projectSummary.projectId}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="hidden md:flex items-center space-x-2 bg-slate-100 px-3 py-1.5 rounded-xl text-xs">
              <span className="text-slate-500 font-medium">Implementation Lead:</span>
              <span className="font-bold text-slate-800">{projectSummary.asrtavaLead.split(' (')[0]}</span>
            </div>
            {onExit && (
              <Button variant="outline" size="sm" onClick={onExit}>
                <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                <span>Exit Workspace</span>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col md:flex-row gap-6">
        {/* Left Sidebar Navigation */}
        <aside className="w-full md:w-64 shrink-0 space-y-4">
          {/* Progress Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-800">
              <span>Onboarding Progress</span>
              <span className="text-teal-700 font-mono">{projectSummary.progressPercentage}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-teal-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${projectSummary.progressPercentage}%` }}
              />
            </div>
            <div className="text-[11px] text-slate-500 leading-tight">
              Target Go-Live: <strong className="text-slate-800">{projectSummary.targetGoLive}</strong>
            </div>
          </div>

          {/* Nav List */}
          <nav className="bg-white rounded-2xl border border-slate-200 p-2 shadow-sm space-y-0.5 text-xs font-medium text-slate-600">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as WorkspaceTab)}
                className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-left transition cursor-pointer ${
                  activeTab === item.id
                    ? 'bg-teal-50 text-teal-900 font-bold border border-teal-200'
                    : 'hover:bg-slate-50 text-slate-700'
                }`}
              >
                <span className={activeTab === item.id ? 'text-teal-700' : 'text-slate-400'}>{item.icon}</span>
                <span className="truncate">{item.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Right Content Area */}
        <main className="flex-1 min-w-0">
          {/* TAB 1: Welcome & Overview */}
          {activeTab === 'welcome' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-teal-900 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
                <div className="space-y-3 max-w-2xl relative z-10">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                    Enterprise Implementation Workspace
                  </span>
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                    Welcome to the ASRTAVA Onboarding Workspace
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    This dedicated portal allows your hospital management, clinical leadership, and IT teams to collaborate directly with the ASRTAVA Implementation Team. Review configurations, submit demographic master lists, track staff training, and authorize milestones leading to production cutover.
                  </p>
                </div>
              </div>

              {/* Status Overview Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
                  <span className="text-slate-400 font-medium">Current Project Phase</span>
                  <div className="font-bold text-slate-900 text-sm">Phase 14: Staff Training & Validation</div>
                  <span className="text-[11px] text-teal-700 font-semibold">Pre-Cutover Stage</span>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
                  <span className="text-slate-400 font-medium">Readiness Verification Gates</span>
                  <div className="font-bold text-slate-900 text-sm">{projectSummary.verifiedGates} of {projectSummary.totalGates} Gates Verified</div>
                  <span className="text-[11px] text-emerald-600 font-semibold">100% Core Clinical Cleared</span>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
                  <span className="text-slate-400 font-medium">Pending Hospital Action Items</span>
                  <div className="font-bold text-slate-900 text-sm">{projectSummary.openActionItems} Action Items</div>
                  <span className="text-[11px] text-amber-600 font-semibold">Training completion & sign-off</span>
                </div>
              </div>

              {/* 15-Phase Roadmap Card */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                    <Workflow className="w-4 h-4 text-teal-600" />
                    <span>Master Onboarding Roadmap (15 Structured Phases)</span>
                  </h3>
                  <Badge variant="brand">Dual Sign-Off Gate</Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-2 text-[11px]">
                  {[
                    { num: 1, title: 'Enquiry', done: true },
                    { num: 2, title: 'Requirements', done: true },
                    { num: 3, title: 'Demonstration', done: true },
                    { num: 4, title: 'Perpetual Quote', done: true },
                    { num: 5, title: 'License Purchase', done: true },
                    { num: 6, title: 'Customer Reg', done: true },
                    { num: 7, title: 'Project Init', done: true },
                    { num: 8, title: 'Hospital Info', done: true },
                    { num: 9, title: 'Deployment Plan', done: true },
                    { num: 10, title: 'Environment Setup', done: true },
                    { num: 11, title: 'Configuration', done: true },
                    { num: 12, title: 'Data Migration', done: true },
                    { num: 13, title: 'Testing & UAT', done: true },
                    { num: 14, title: 'Staff Training', done: false, active: true },
                    { num: 15, title: 'Go-Live Launch', done: false },
                  ].map((p) => (
                    <div
                      key={p.num}
                      className={`p-2.5 rounded-xl border flex items-center space-x-2 ${
                        p.done
                          ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950 font-medium'
                          : p.active
                          ? 'bg-teal-50 border-teal-500 text-teal-900 font-bold ring-2 ring-teal-500/20'
                          : 'bg-slate-50 border-slate-200 text-slate-500'
                      }`}
                    >
                      <span className="font-mono text-[10px] w-5 h-5 rounded-full flex items-center justify-center bg-white border border-slate-200 shrink-0">
                        {p.done ? <Check className="w-3 h-3 text-emerald-600" /> : p.num}
                      </span>
                      <span className="truncate">{p.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Hospital Profile */}
          {activeTab === 'profile' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
              <div>
                <h2 className="text-base font-bold text-slate-900">Hospital Legal Profile & Demographics</h2>
                <p className="text-xs text-slate-500">Provide official statutory credentials used for invoices, EMR headers, and clinical printouts.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Legal Registered Entity Name *</label>
                  <Input value={hospitalLegalName} onChange={(e) => setHospitalLegalName(e.target.value)} />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Public Display / Branding Name *</label>
                  <Input value={hospitalDisplayName} onChange={(e) => setHospitalDisplayName(e.target.value)} />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Hospital Clinical Registration # *</label>
                  <Input value={regNumber} onChange={(e) => setRegNumber(e.target.value)} />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">GST / Tax Identification Number *</label>
                  <Input value={gstNumber} onChange={(e) => setGstNumber(e.target.value)} />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Full Facility Postal Address *</label>
                  <Input value={address} onChange={(e) => setAddress(e.target.value)} />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Official Nodal Email Address *</label>
                  <Input value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Main Reception / Telephony Line *</label>
                  <Input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <Button variant="primary" size="sm" onClick={handleSaveProfile}>
                  <Check className="w-4 h-4 mr-1.5" />
                  <span>Save Demographic Information</span>
                </Button>
              </div>
            </div>
          )}

          {/* TAB 6: IT Infrastructure */}
          {activeTab === 'infrastructure' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
              <div>
                <h2 className="text-base font-bold text-slate-900">IT Infrastructure & Hardware Environment</h2>
                <p className="text-xs text-slate-500">Document local server sizing, workstations, network topology, and peripheral readiness.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Selected Deployment Model</label>
                  <Input value={deploymentModel} disabled className="bg-slate-50" />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Local Server Specifications</label>
                  <Input value={serverSpecs} onChange={(e) => setServerSpecs(e.target.value)} />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Total Connected Clinical Workstations</label>
                  <Input value={workstationCount} onChange={(e) => setWorkstationCount(e.target.value)} />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Thermal & Laser Prescription Printers</label>
                  <Input value={printerCount} onChange={(e) => setPrinterCount(e.target.value)} />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Barcode & QR Scanners (OPD/IPD/Pharmacy)</label>
                  <Input value={scannerCount} onChange={(e) => setScannerCount(e.target.value)} />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Backup & Disaster Recovery Strategy</label>
                  <Input value={backupArrangement} onChange={(e) => setBackupArrangement(e.target.value)} />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start space-x-3">
                <Server className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-800">Hardware Sizing Verification Cleared:</span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Your infrastructure easily supports up to 350 beds and 500 concurrent clinical staff accounts with &lt; 25ms internal query latency.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: Data Migration */}
          {activeTab === 'migration' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
              <div>
                <h2 className="text-base font-bold text-slate-900">Legacy EHR Data Migration & Reconciliation</h2>
                <p className="text-xs text-slate-500">Safeguards: Traceability checksums, deduplication, and zero blind overwriting.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-slate-400 font-medium">Source Legacy EHR</span>
                  <div className="font-bold text-slate-800 text-sm">{legacyEhrName}</div>
                  <span className="text-[10px] text-slate-500">MSSQL Database Dump</span>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-slate-400 font-medium">Demographics Reconciled</span>
                  <div className="font-bold text-emerald-700 text-sm">{patientRecordCount} Records</div>
                  <span className="text-[10px] text-emerald-600">0 Duplicate Errors</span>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-slate-400 font-medium">Hospital Sign-Off Status</span>
                  <div className="font-bold text-slate-900 text-sm">
                    {isTestMigrationApproved ? 'Approved by Hospital' : 'Pending Review'}
                  </div>
                  <span className="text-[10px] text-teal-600">Checksum: sha256:7f4a...9b12</span>
                </div>
              </div>

              {/* Ingestion Pipeline Stages */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
                <h3 className="font-bold text-slate-800">Standard 8-Stage Migration Pipeline Progress</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                  {[
                    '1. Export Received',
                    '2. Data Assessed',
                    '3. Fields Mapped',
                    '4. Deduplication Passed',
                    '5. Test Migration',
                    '6. Hospital Reviewed',
                    '7. Production Migrated',
                    '8. Provenance Sealed'
                  ].map((stage, idx) => (
                    <div key={idx} className="p-2 rounded-lg bg-white border border-slate-200 flex items-center space-x-1.5 text-slate-700">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="truncate">{stage}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 12: Staff Training & Certification */}
          {activeTab === 'training' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
              <div>
                <h2 className="text-base font-bold text-slate-900">Hospital Staff Role Training & Certification</h2>
                <p className="text-xs text-slate-500">Every clinical department completes simulated workflow practice with ≥ 80% passing grade threshold.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-slate-400 font-medium">Doctor Clinical EMR Module</span>
                  <div className="text-lg font-bold text-emerald-700">88 / 90 Certified (97.7%)</div>
                  <span className="text-[10px] text-slate-500">SOAP Notes, e-Rx, ICD-10 Coding</span>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-slate-400 font-medium">Inpatient Nursing Station</span>
                  <div className="text-lg font-bold text-emerald-700">140 / 150 Certified (93.3%)</div>
                  <span className="text-[10px] text-slate-500">Bed Transfers & e-MAR 5 Rights</span>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-slate-400 font-medium">Pharmacy & Dispensing</span>
                  <div className="text-lg font-bold text-emerald-700">22 / 22 Certified (100%)</div>
                  <span className="text-[10px] text-slate-500">FEFO Batch Management & POS</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-teal-50 border border-teal-200 text-teal-900 text-xs flex items-center justify-between">
                <div>
                  <span className="font-bold block">Hospital Training Sign-Off Requirement:</span>
                  <span className="text-[11px] text-teal-800">Overall staff completion stands at 95.8%. Department head sign-offs received.</span>
                </div>
                <Badge variant="success">READY FOR CUTOVER</Badge>
              </div>
            </div>
          )}

          {/* TAB 15: Go-Live Authorization & Dual Sign-Off */}
          {activeTab === 'go-live' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
              <div>
                <h2 className="text-base font-bold text-slate-900">Hospital Management Go-Live Authorization</h2>
                <p className="text-xs text-slate-500">Final readiness review prior to live production activation and 30-day dedicated hypercare support.</p>
              </div>

              <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-2">
                <span className="font-bold text-sm flex items-center">
                  <AlertTriangle className="w-4 h-4 mr-1 text-amber-600" />
                  Hospital Medical Director & Management Sign-Off Gate
                </span>
                <p className="text-amber-800 leading-relaxed text-[11px]">
                  By signing off, you certify that all clinical catalogs, pricing tariffs, staff access rights, migrated medical records, and departmental training modules have been evaluated, tested, and approved for production cutover.
                </p>
              </div>

              {/* 14 Mandatory Gates Checklist */}
              <div className="space-y-2 text-xs">
                <div className="font-bold text-slate-900">Mandatory Production Readiness Gate Evaluation</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    '1. Perpetual Software License Cryptographically Bound',
                    '2. Hosting Environment Hardware Benchmark Cleared',
                    '3. Multi-Tenant Row-Level Security Verified',
                    '4. Automated WAL Backup & Restore Drill Verified',
                    '5. Departments, Wards & Outpatient Tariffs Configured',
                    '6. 42,500 Patient Demographic Records Reconciled',
                    '7. Role-Specific Staff Training Certified (≥ 80%)',
                    '8. User Acceptance Testing (UAT) - Zero Critical Defects',
                    '9. DICOM PACS & Lab Analyzer Interfaces Verified',
                    '10. Emergency Resuscitation & Code Protocols Operational',
                    '11. 30-Day Dedicated Hypercare Support Team Assigned',
                    '12. Hospital Management Go-Live Authorization (This Gate)'
                  ].map((gate, i) => (
                    <div key={i} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-slate-700">
                      <div className="flex items-center space-x-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="font-medium text-[11px]">{gate}</span>
                      </div>
                      <span className="text-[9px] font-bold text-emerald-700 uppercase bg-emerald-50 px-2 py-0.5 rounded">
                        CLEARED
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="text-xs text-slate-500">
                  Ready to authorize live hospital operations?
                </div>
                <Button variant="primary" size="sm" onClick={() => setIsSignOffModalOpen(true)}>
                  <ShieldCheck className="w-4 h-4 mr-1.5" />
                  <span>Execute Hospital Management Go-Live Sign-Off</span>
                </Button>
              </div>
            </div>
          )}

          {/* Fallback for other tabs */}
          {['organization', 'operations', 'staff', 'integrations', 'documents', 'configuration', 'uat', 'approvals', 'contacts'].includes(activeTab) && (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm text-center space-y-4">
              <div className="w-12 h-12 bg-teal-50 text-teal-700 rounded-2xl flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 capitalize">{activeTab} Workstream Review</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                  This workstream is currently managed under Phase 14 of the onboarding project with ASRTAVA Lead Dr. Vikram Malhotra.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setActiveTab('welcome')}>
                Back to Overview
              </Button>
            </div>
          )}
        </main>
      </div>

      {/* Hospital Sign-Off Modal */}
      <Modal
        isOpen={isSignOffModalOpen}
        onClose={() => setIsSignOffModalOpen(false)}
        title="Hospital Management Formal Go-Live Sign-Off"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-600 leading-relaxed">
            You are signing off on behalf of the Hospital Administration and Medical Directorate for <strong>{projectSummary.hospitalName}</strong>.
            This action formally records customer readiness and triggers production cutover.
          </p>

          <div className="p-3 bg-teal-50 rounded-xl border border-teal-200 text-teal-900 space-y-1">
            <div className="font-semibold">Sign-Off Record:</div>
            <div>Signee: <strong>Medical Director & Hospital CEO</strong></div>
            <div>Facility: <strong>{projectSummary.hospitalName}</strong></div>
            <div>Deployment: <strong>Hybrid Edge Gateway (Local + Cloud Mirror)</strong></div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Hospital Management Sign-Off Remarks *</label>
            <Input
              value={hospitalSignOffNotes}
              onChange={(e) => setHospitalSignOffNotes(e.target.value)}
              placeholder="Enter remarks..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <Button variant="outline" size="sm" onClick={() => setIsSignOffModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleHospitalSignOff}>
              <ShieldCheck className="w-4 h-4 mr-1.5" />
              <span>Confirm & Authorize Production Go-Live</span>
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default HospitalOnboardingWorkspace;
