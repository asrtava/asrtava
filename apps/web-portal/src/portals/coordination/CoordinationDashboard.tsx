import React, { useState } from 'react';
import {
  Network,
  HeartPulse,
  Truck,
  BedDouble,
  Activity,
  Radio,
  ShieldCheck,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  Send,
  Lock,
  ArrowRightLeft,
  RefreshCw,
  ExternalLink,
  Building2,
  UserCheck,
  Eye,
  AlertCircle
} from 'lucide-react';
import { Button, Input, Badge, Modal, useToast } from '../../components/ui';

interface CoordinationCase {
  id: string;
  type: 'organ_transplant' | 'emergency_transfer' | 'blood_request' | 'diagnostic_share' | 'specialist_referral';
  requestingHospital: string;
  receivingHospital: string;
  patientUhidMasked: string;
  purpose: string;
  legalAuthority: string;
  status: 'pending_approval' | 'active' | 'in_transit' | 'completed' | 'revoked';
  timestamp: string;
  expiryTime?: string;
  ephemeralToken?: string;
  metadata: {
    organs?: string[];
    sottoRegNo?: string;
    apneaTestPassed?: boolean;
    bloodComponent?: string;
    unitsRequired?: number;
    ambulanceUnit?: string;
    criticality?: 'STAT' | 'HIGH' | 'ROUTINE';
  };
}

const INITIAL_CASES: CoordinationCase[] = [
  {
    id: 'CASE-NOTTO-2026-8819',
    type: 'organ_transplant',
    requestingHospital: 'Apollo Health City (Jubilee Hills)',
    receivingHospital: 'Sunrise Institute of Medical Sciences (Secunderabad)',
    patientUhidMasked: 'ASR-PAT-****-4412',
    purpose: 'Cadaveric Multi-Organ Harvest & Dual Renal Allocation',
    legalAuthority: 'THOA 1994 / NOTTO Allocation Protocol #N-8819',
    status: 'active',
    timestamp: '2026-11-13 11:20 AM',
    metadata: {
      organs: ['Kidneys (Left & Right)', 'Liver', 'Corneas'],
      sottoRegNo: 'SOTTO-TG-2026-0941',
      apneaTestPassed: true,
      criticality: 'STAT'
    }
  },
  {
    id: 'CASE-EMERG-2026-4402',
    type: 'emergency_transfer',
    requestingHospital: 'Care Hospitals (Banjara Hills)',
    receivingHospital: 'Sunrise Institute of Medical Sciences (Secunderabad)',
    patientUhidMasked: 'ASR-PAT-****-9102',
    purpose: 'Acute Aortic Dissection Type A — Immediate Cardiopulmonary Bypass OT',
    legalAuthority: 'Emergency Medical Treatment & Patient Transfer Protocol',
    status: 'in_transit',
    timestamp: '2026-11-13 12:45 PM',
    metadata: {
      ambulanceUnit: 'ALS-AMB-04 (Telemetry Stream Live)',
      criticality: 'STAT'
    }
  },
  {
    id: 'CASE-BLD-2026-1192',
    type: 'blood_request',
    requestingHospital: 'Sunrise Institute of Medical Sciences (Secunderabad)',
    receivingHospital: 'Yashoda Hospitals (Somajiguda)',
    patientUhidMasked: 'ASR-PAT-****-5521',
    purpose: 'Emergency O-Negative PRBC Requisition for Polytrauma Coagulopathy',
    legalAuthority: 'State Blood Transfusion Council Emergency Exchange Charter',
    status: 'completed',
    timestamp: '2026-11-13 09:15 AM',
    metadata: {
      bloodComponent: 'O-Negative Packed Red Blood Cells (PRBC)',
      unitsRequired: 4,
      criticality: 'STAT'
    }
  },
  {
    id: 'CASE-DIAG-2026-0048',
    type: 'diagnostic_share',
    requestingHospital: 'Sunrise Institute of Medical Sciences (Secunderabad)',
    receivingHospital: 'NIMS (Nizam Institute of Medical Sciences)',
    patientUhidMasked: 'ASR-PAT-****-1108',
    purpose: 'Urgent Second Opinion: 3T Brain MRI Diffusion Weighted Imaging (Acute Stroke Mimic)',
    legalAuthority: 'Patient DPDP Form 4 Signed Consent & Treating Physician Direct Order',
    status: 'active',
    timestamp: '2026-11-13 12:10 PM',
    expiryTime: '2026-11-13 02:10 PM (2-Hour TTL)',
    ephemeralToken: 'eph_jwt_9941a8fd2b77... [AES-256 GCM]',
    metadata: {
      criticality: 'HIGH'
    }
  }
];

export const CoordinationDashboard: React.FC = () => {
  const { showToast } = useToast();
  const [activeSubTab, setActiveSubTab] = useState<'cases' | 'notto' | 'transfers' | 'beds' | 'blood' | 'diagnostics' | 'audit'>('cases');
  const [cases, setCases] = useState<CoordinationCase[]>(INITIAL_CASES);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [newRequestModal, setNewRequestModal] = useState<boolean>(false);
  const [diagnosticModal, setDiagnosticModal] = useState<boolean>(false);

  // New Request Form State
  const [newReqType, setNewReqType] = useState<CoordinationCase['type']>('emergency_transfer');
  const [newTargetHospital, setNewTargetHospital] = useState('Apollo Health City (Jubilee Hills)');
  const [newPatientUhid, setNewPatientUhid] = useState('ASR-PAT-2026-8834');
  const [newPurpose, setNewPurpose] = useState('');
  const [newLegalAuthority, setNewLegalAuthority] = useState('Patient Written Consent (DPDP Section 6) & Medical Emergency');

  const filteredCases = cases.filter(c => {
    const matchesType = filterType === 'all' || c.type === filterType;
    const matchesSearch = c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.requestingHospital.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.receivingHospital.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.purpose.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const handleCreateRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPurpose.trim()) {
      showToast({
        type: 'error',
        title: 'Purpose Required',
        message: 'A specific clinical or statutory purpose must be documented for inter-hospital coordination.'
      });
      return;
    }

    const newCase: CoordinationCase = {
      id: `CASE-${newReqType.toUpperCase().slice(0, 4)}-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      type: newReqType,
      requestingHospital: 'Sunrise Institute of Medical Sciences (Secunderabad)',
      receivingHospital: newTargetHospital,
      patientUhidMasked: `ASR-PAT-****-${newPatientUhid.slice(-4) || '9912'}`,
      purpose: newPurpose,
      legalAuthority: newLegalAuthority,
      status: 'pending_approval',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      metadata: {
        criticality: 'STAT'
      }
    };

    setCases([newCase, ...cases]);
    setNewRequestModal(false);
    setNewPurpose('');
    showToast({
      type: 'success',
      title: 'Coordination Request Dispatched',
      message: `Case ${newCase.id} sent to ${newTargetHospital} over the secure ASRTAVA Coordination Gateway.`
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Gateway Header */}
      <div className="bg-gradient-to-r from-teal-900 via-slate-900 to-indigo-950 text-white rounded-2xl p-6 shadow-xl border border-teal-800/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center space-x-2.5">
              <span className="p-2 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/30">
                <Network className="w-5 h-5" />
              </span>
              <span className="text-xs font-mono uppercase tracking-widest text-teal-300 font-bold">
                ASRTAVA Federated Healthcare Coordination Network
              </span>
            </div>
            <h1 className="text-2xl font-black text-white mt-1.5 tracking-tight">
              Inter-Hospital Coordination & Interoperability Gateway
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Purpose-specific, cryptographically audited cross-hospital communication. Direct unrestricted EMR browsing is strictly prohibited under zero-trust tenant isolation.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDiagnosticModal(true)}
              className="bg-slate-800/80 hover:bg-slate-700 text-teal-300 border-teal-500/30 text-xs font-semibold"
            >
              <Radio className="w-3.5 h-3.5 mr-1.5 text-teal-400" />
              <span>Issue Ephemeral Share</span>
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={() => setNewRequestModal(true)}
              className="bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-lg shadow-teal-900/40"
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              <span>Initiate Coordination Request</span>
            </Button>
          </div>
        </div>

        {/* Real-time KPI Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-6 pt-5 border-t border-slate-800/80 text-left">
          <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/60">
            <div className="text-xl font-black text-teal-400">{cases.length}</div>
            <div className="text-[11px] text-slate-300 mt-0.5">Active Network Cases</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/60">
            <div className="text-xl font-black text-rose-400">1 Case</div>
            <div className="text-[11px] text-slate-300 mt-0.5">NOTTO Organ Allocation</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/60">
            <div className="text-xl font-black text-amber-400">1 Unit</div>
            <div className="text-[11px] text-slate-300 mt-0.5">Emergency In-Transit</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/60">
            <div className="text-xl font-black text-cyan-400">14 Beds</div>
            <div className="text-[11px] text-slate-300 mt-0.5">Regional ICU Available</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/60">
            <div className="text-xl font-black text-purple-400">1 Token</div>
            <div className="text-[11px] text-slate-300 mt-0.5">Active 2-Hr Diagnostic Share</div>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex border-b border-slate-200 overflow-x-auto space-x-2 pb-1 text-xs font-semibold">
        <button
          onClick={() => setActiveSubTab('cases')}
          className={`px-4 py-2.5 rounded-xl transition flex items-center space-x-2 cursor-pointer ${
            activeSubTab === 'cases' ? 'bg-teal-700 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Active Case Coordination</span>
          <span className="ml-1.5 px-1.5 py-0.5 text-[10px] rounded-full bg-white/20 text-white font-mono">
            {cases.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('notto')}
          className={`px-4 py-2.5 rounded-xl transition flex items-center space-x-2 cursor-pointer ${
            activeSubTab === 'notto' ? 'bg-teal-700 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <HeartPulse className="w-3.5 h-3.5 text-rose-300" />
          <span>NOTTO Organ Allocation</span>
        </button>

        <button
          onClick={() => setActiveSubTab('transfers')}
          className={`px-4 py-2.5 rounded-xl transition flex items-center space-x-2 cursor-pointer ${
            activeSubTab === 'transfers' ? 'bg-teal-700 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Truck className="w-3.5 h-3.5" />
          <span>Emergency Patient Transfers</span>
        </button>

        <button
          onClick={() => setActiveSubTab('beds')}
          className={`px-4 py-2.5 rounded-xl transition flex items-center space-x-2 cursor-pointer ${
            activeSubTab === 'beds' ? 'bg-teal-700 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <BedDouble className="w-3.5 h-3.5" />
          <span>Regional Bed & ICU Matrix</span>
        </button>

        <button
          onClick={() => setActiveSubTab('blood')}
          className={`px-4 py-2.5 rounded-xl transition flex items-center space-x-2 cursor-pointer ${
            activeSubTab === 'blood' ? 'bg-teal-700 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Activity className="w-3.5 h-3.5 text-red-400" />
          <span>Blood Bank Network</span>
        </button>

        <button
          onClick={() => setActiveSubTab('diagnostics')}
          className={`px-4 py-2.5 rounded-xl transition flex items-center space-x-2 cursor-pointer ${
            activeSubTab === 'diagnostics' ? 'bg-teal-700 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Radio className="w-3.5 h-3.5 text-purple-400" />
          <span>Diagnostic & PACS Exchange</span>
        </button>

        <button
          onClick={() => setActiveSubTab('audit')}
          className={`px-4 py-2.5 rounded-xl transition flex items-center space-x-2 cursor-pointer ${
            activeSubTab === 'audit' ? 'bg-teal-700 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Cryptographic Audit Ledger</span>
        </button>
      </div>

      {/* Sub-tab 1: Active Cases Table */}
      {activeSubTab === 'cases' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex items-center space-x-2">
              <div className="relative w-72">
                <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter cases, hospitals, or UHIDs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="all">All Workflows</option>
                <option value="organ_transplant">NOTTO Organ Allocation</option>
                <option value="emergency_transfer">Emergency Transfer</option>
                <option value="blood_request">Blood Bank Request</option>
                <option value="diagnostic_share">Diagnostic Exchange</option>
              </select>
            </div>

            <div className="text-[11px] text-slate-500">
              Showing <strong>{filteredCases.length}</strong> active inter-hospital coordination cases
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {filteredCases.map((c) => (
              <div key={c.id} className="py-4 hover:bg-slate-50/60 transition rounded-xl p-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center space-x-3">
                    <span className="font-mono font-bold text-xs text-teal-800 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200">
                      {c.id}
                    </span>
                    <Badge variant={c.status === 'active' ? 'success' : c.status === 'in_transit' ? 'warning' : 'info'}>
                      {c.status.toUpperCase().replace('_', ' ')}
                    </Badge>
                    {c.metadata.criticality && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                        {c.metadata.criticality}
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center space-x-1.5">
                    <Clock className="w-3 h-3" />
                    <span>Initiated {c.timestamp}</span>
                  </div>
                </div>

                <div className="mt-2.5">
                  <h4 className="text-sm font-bold text-slate-900">{c.purpose}</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 mt-2 text-xs text-slate-600">
                    <div>
                      <span className="text-slate-400 text-[11px]">Requesting Hospital:</span>{' '}
                      <strong className="text-slate-800">{c.requestingHospital}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px]">Receiving Hospital:</span>{' '}
                      <strong className="text-slate-800">{c.receivingHospital}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px]">Pseudonymized UHID:</span>{' '}
                      <span className="font-mono font-semibold text-slate-700">{c.patientUhidMasked}</span>
                    </div>
                  </div>

                  <div className="mt-2 flex items-center space-x-2 text-[11px] text-slate-500">
                    <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                    <span>Legal / Statutory Authority: <em>{c.legalAuthority}</em></span>
                  </div>

                  {c.ephemeralToken && (
                    <div className="mt-2 p-2 bg-purple-50 border border-purple-200 rounded-lg text-xs flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-purple-900 font-mono text-[11px]">
                        <Lock className="w-3 h-3 text-purple-600" />
                        <span>Token: {c.ephemeralToken}</span>
                      </div>
                      <span className="text-[10px] font-semibold text-purple-700 bg-purple-100 px-2 py-0.5 rounded">
                        {c.expiryTime}
                      </span>
                    </div>
                  )}

                  {c.metadata.organs && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {c.metadata.organs.map((org, i) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-semibold">
                          🫀 {org}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-[11px] text-slate-400">
                    Cryptographic Signature: <span className="font-mono text-slate-500">SHA256:4a88...c10b</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        showToast({
                          type: 'info',
                          title: 'Audit Verification Checked',
                          message: `Case ${c.id} verified against immutable Merkle ledger with zero tenant data bleed.`
                        });
                      }}
                      className="text-xs h-7"
                    >
                      <Eye className="w-3 h-3 mr-1 text-slate-500" />
                      <span>Verify Audit</span>
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        showToast({
                          type: 'success',
                          title: 'Clinical Coordination Channel Opened',
                          message: `End-to-end encrypted voice/data channel established with ${c.receivingHospital}.`
                        });
                      }}
                      className="text-xs h-7 bg-teal-700 hover:bg-teal-600"
                    >
                      <Send className="w-3 h-3 mr-1" />
                      <span>Clinical Channel</span>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sub-tab 2: NOTTO Organ Allocation */}
      {activeSubTab === 'notto' && (
        <div className="space-y-4">
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-xs text-rose-900 flex items-start space-x-3">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong>Statutory Compliance Invariant (THOA 1994 & Amendments):</strong> Under the Transplantation of Human Organs and Tissues Act, autonomous algorithmic organ allocation and organ commercialization are strictly forbidden by law. All organ donations require dual brain stem death apnea tests (&ge; 6 hours apart) and authorized statutory Form 8 / Form 10 affidavits.
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900">National Organ & Tissue Transplant Organization (NOTTO) Cases</h3>
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-mono text-xs font-bold text-teal-800">SOTTO-TG-2026-0941</span>
                  <h4 className="font-bold text-slate-900 text-sm mt-0.5">Cadaveric Multi-Organ Harvest — Green Corridor Scheduled</h4>
                </div>
                <Badge variant="success">NOTTO ALLOCATION CERTIFIED</Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-600 pt-2 border-t border-slate-200">
                <div>Donor Age / Blood Group: <strong>34 Yrs / O-Positive</strong></div>
                <div>Apnea Test 1: <strong>04:00 AM (Confirmed)</strong></div>
                <div>Apnea Test 2 (&ge; 6h): <strong>10:15 AM (Confirmed)</strong></div>
              </div>

              <div className="pt-2 flex flex-wrap gap-2 text-[11px]">
                <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg font-semibold">
                  ✓ Dual Neurologist & Medical Superintendent Sign-off
                </span>
                <span className="px-2.5 py-1 bg-teal-50 text-teal-800 border border-teal-200 rounded-lg font-semibold">
                  ✓ Legal Next-of-Kin Form 8 Affidavit Recorded
                </span>
                <span className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg font-semibold">
                  ✓ State Traffic Police Green Corridor Active (Rajiv Gandhi Airport to Hospital)
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sub-tab 3: Emergency Patient Transfers */}
      {activeSubTab === 'transfers' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Inter-Hospital Emergency Patient Transfer Desk</h3>
              <p className="text-slate-500 text-xs">Real-time telemetry, ALS ambulance tracking, and receiving hospital bed preparation.</p>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setNewRequestModal(true)}
              className="bg-teal-700 hover:bg-teal-600 text-xs"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              <span>Dispatch Transfer</span>
            </Button>
          </div>

          <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Truck className="w-4 h-4 text-amber-600 animate-pulse" />
                <span className="font-bold text-xs text-slate-900">Unit: ALS-AMB-04 (In Transit)</span>
              </div>
              <Badge variant="warning">ETA: 18 MINUTES</Badge>
            </div>
            <p className="text-xs text-slate-700">
              <strong>Patient Condition:</strong> Acute Aortic Dissection Type A. Arterial line monitoring, high-dose labetalol drip active. Receiving hospital Cardiothoracic Surgery Suite on standby.
            </p>
            <div className="flex items-center space-x-4 text-[11px] text-slate-600 font-mono">
              <span>Origin: Care Hospitals Banjara</span>
              <span>&rarr;</span>
              <span>Destination: Sunrise Institute Secunderabad</span>
            </div>
          </div>
        </div>
      )}

      {/* Sub-tab 4: Regional Bed Matrix */}
      {activeSubTab === 'beds' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Regional Bed & Critical-Care Availability Matrix</h3>
              <p className="text-slate-500 text-xs">Timestamped voluntary reporting by participating network hospitals (120-minute validity TTL).</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                showToast({
                  type: 'success',
                  title: 'Bed Capacity Broadcast Updated',
                  message: 'Local capacity published with 120-minute TTL to regional coordination registry.'
                });
              }}
              className="text-xs"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1 text-teal-700" />
              <span>Publish Local Capacity</span>
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold text-[11px]">
                  <th className="py-2.5 px-3">Hospital</th>
                  <th className="py-2.5 px-3">Network Code</th>
                  <th className="py-2.5 px-3">General Ward</th>
                  <th className="py-2.5 px-3">ICU Vacancies</th>
                  <th className="py-2.5 px-3">Ventilators</th>
                  <th className="py-2.5 px-3">Emergency Resus</th>
                  <th className="py-2.5 px-3">Last Verified</th>
                  <th className="py-2.5 px-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-3 font-semibold text-slate-900">Apollo Health City (Jubilee Hills)</td>
                  <td className="py-3 px-3 font-mono text-[11px] text-slate-600">APOL-HYD-01</td>
                  <td className="py-3 px-3 font-bold text-slate-800">42 vacant</td>
                  <td className="py-3 px-3 font-bold text-teal-700">6 vacant</td>
                  <td className="py-3 px-3 font-bold text-sky-700">4 ready</td>
                  <td className="py-3 px-3 font-bold text-rose-700">2 bays</td>
                  <td className="py-3 px-3 text-slate-500 text-[11px]">8 mins ago</td>
                  <td className="py-3 px-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => showToast({ type: 'info', title: 'Transfer Inquiry Sent', message: 'Inquiry dispatched to Apollo bed management desk.' })}
                      className="text-xs h-7 text-teal-700"
                    >
                      <Send className="w-3 h-3 mr-1" />
                      <span>Request</span>
                    </Button>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-3 font-semibold text-slate-900">Care Hospitals (Banjara Hills)</td>
                  <td className="py-3 px-3 font-mono text-[11px] text-slate-600">CARE-HYD-02</td>
                  <td className="py-3 px-3 font-bold text-slate-800">18 vacant</td>
                  <td className="py-3 px-3 font-bold text-teal-700">3 vacant</td>
                  <td className="py-3 px-3 font-bold text-sky-700">2 ready</td>
                  <td className="py-3 px-3 font-bold text-rose-700">1 bay</td>
                  <td className="py-3 px-3 text-slate-500 text-[11px]">14 mins ago</td>
                  <td className="py-3 px-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => showToast({ type: 'info', title: 'Transfer Inquiry Sent', message: 'Inquiry dispatched to Care Hospitals bed management desk.' })}
                      className="text-xs h-7 text-teal-700"
                    >
                      <Send className="w-3 h-3 mr-1" />
                      <span>Request</span>
                    </Button>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-3 font-semibold text-slate-900">Yashoda Hospitals (Somajiguda)</td>
                  <td className="py-3 px-3 font-mono text-[11px] text-slate-600">YASH-HYD-03</td>
                  <td className="py-3 px-3 font-bold text-slate-800">29 vacant</td>
                  <td className="py-3 px-3 font-bold text-teal-700">5 vacant</td>
                  <td className="py-3 px-3 font-bold text-sky-700">3 ready</td>
                  <td className="py-3 px-3 font-bold text-rose-700">3 bays</td>
                  <td className="py-3 px-3 text-slate-500 text-[11px]">5 mins ago</td>
                  <td className="py-3 px-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => showToast({ type: 'info', title: 'Transfer Inquiry Sent', message: 'Inquiry dispatched to Yashoda bed management desk.' })}
                      className="text-xs h-7 text-teal-700"
                    >
                      <Send className="w-3 h-3 mr-1" />
                      <span>Request</span>
                    </Button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sub-tab 5: Blood Bank Network */}
      {activeSubTab === 'blood' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Regional Blood Bank Exchange Network</h3>
              <p className="text-slate-500 text-xs">Cross-facility emergency blood component inquiries without exposing individual donor records or PII.</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => showToast({ type: 'success', title: 'Blood Inventory Refreshed', message: 'Regional blood availability telemetry synchronized.' })}
              className="text-xs"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1 text-teal-700" />
              <span>Refresh Stock</span>
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
            <div className="p-4 rounded-xl border border-red-200 bg-red-50/50">
              <div className="text-xs text-red-700 font-semibold">O-Negative (PRBC)</div>
              <div className="text-2xl font-black text-red-900 mt-1">12 Units</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Across 4 Network Centers</div>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
              <div className="text-xs text-slate-700 font-semibold">A-Negative (PRBC)</div>
              <div className="text-2xl font-black text-slate-900 mt-1">18 Units</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Across 3 Network Centers</div>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
              <div className="text-xs text-slate-700 font-semibold">Single Donor Platelets (SDP)</div>
              <div className="text-2xl font-black text-teal-900 mt-1">8 Units</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Available Immediate Dispatch</div>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
              <div className="text-xs text-slate-700 font-semibold">Fresh Frozen Plasma (FFP)</div>
              <div className="text-2xl font-black text-blue-900 mt-1">45 Units</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Standard Cold Chain Verified</div>
            </div>
          </div>
        </div>
      )}

      {/* Sub-tab 6: Diagnostic & PACS Exchange */}
      {activeSubTab === 'diagnostics' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Ephemeral Diagnostic & PACS Exchange Gateway</h3>
              <p className="text-slate-500 text-xs">Issues short-lived HMAC-signed tokens for targeted external specialist consultation. Automatically revokes upon expiration.</p>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setDiagnosticModal(true)}
              className="bg-teal-700 hover:bg-teal-600 text-xs"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              <span>Issue New Token</span>
            </Button>
          </div>

          <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/40 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-purple-900">CASE-DIAG-2026-0048</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800">EXPIRES IN 92 MINS</span>
            </div>
            <div className="text-xs text-slate-700">
              <strong>DICOM Study UID:</strong> <span className="font-mono text-[11px]">1.2.840.10008.5.1.4.1.1.2.2026.9941</span> (3T MRI Brain Axial DWI)
            </div>
            <div className="text-xs text-slate-600">
              <strong>Consulting Radiologist:</strong> Dr. R. K. Varma (Neuroradiologist, Nizam Institute of Medical Sciences)
            </div>
            <div className="flex items-center space-x-2 pt-2 border-t border-purple-200/60">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  showToast({
                    type: 'success',
                    title: 'DICOMweb Viewer Opened',
                    message: 'Accessing secure encrypted viewer with ephemeral token verification.'
                  });
                }}
                className="text-xs h-7 text-purple-800 border-purple-300"
              >
                <ExternalLink className="w-3 h-3 mr-1" />
                <span>Launch Zero-Footprint DICOM Viewer</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Sub-tab 7: Cryptographic Audit Ledger */}
      {activeSubTab === 'audit' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Tamper-Evident SHA-256 Audit Trail</h3>
              <p className="text-slate-500 text-xs">Immutable cryptographic ledger recording every cross-hospital inquiry, approval, transit, and token access.</p>
            </div>
            <Badge variant="success">LEDGER INTEGRITY VERIFIED</Badge>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            <div className="py-2.5 flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-900">EPHEMERAL_CASE_SHARE_ACCESSED</span> &bull; CASE-DIAG-2026-0048
                <div className="text-[11px] text-slate-400 font-mono mt-0.5">Hash: 8f99e41...b001a &bull; IP: 14.139.69.11 (NIMS Secure Gateway)</div>
              </div>
              <div className="text-[11px] text-slate-500">12:14 PM</div>
            </div>
            <div className="py-2.5 flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-900">EMERGENCY_TRANSFER_INITIATED</span> &bull; CASE-EMERG-2026-4402
                <div className="text-[11px] text-slate-400 font-mono mt-0.5">Hash: b4028ec...f8991 &bull; Unit: ALS-AMB-04</div>
              </div>
              <div className="text-[11px] text-slate-500">12:45 PM</div>
            </div>
            <div className="py-2.5 flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-900">ORGAN_DONOR_CASE_INITIATED</span> &bull; CASE-NOTTO-2026-8819
                <div className="text-[11px] text-slate-400 font-mono mt-0.5">Hash: 5634717...88190 &bull; Authority: SOTTO-TG-2026-0941</div>
              </div>
              <div className="text-[11px] text-slate-500">11:20 AM</div>
            </div>
          </div>
        </div>
      )}

      {/* Modal 1: Initiate Coordination Request */}
      <Modal
        isOpen={newRequestModal}
        onClose={() => setNewRequestModal(false)}
        title="Initiate Inter-Hospital Coordination Request"
      >
        <form onSubmit={handleCreateRequest} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Workflow Type</label>
            <select
              value={newReqType}
              onChange={(e) => setNewReqType(e.target.value as CoordinationCase['type'])}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500"
            >
              <option value="emergency_transfer">Emergency Patient Transfer</option>
              <option value="organ_transplant">NOTTO Organ Allocation Coordination</option>
              <option value="blood_request">Emergency Blood Bank Requisition</option>
              <option value="diagnostic_share">Diagnostic & PACS Second Opinion</option>
              <option value="specialist_referral">Specialist Tele-Referral</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Target Receiving Hospital</label>
            <select
              value={newTargetHospital}
              onChange={(e) => setNewTargetHospital(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500"
            >
              <option value="Apollo Health City (Jubilee Hills)">Apollo Health City (Jubilee Hills)</option>
              <option value="Care Hospitals (Banjara Hills)">Care Hospitals (Banjara Hills)</option>
              <option value="Yashoda Hospitals (Somajiguda)">Yashoda Hospitals (Somajiguda)</option>
              <option value="NIMS (Nizam Institute of Medical Sciences)">NIMS (Nizam Institute of Medical Sciences)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Patient UHID / MRN</label>
            <Input
              value={newPatientUhid}
              onChange={(e) => setNewPatientUhid(e.target.value)}
              placeholder="e.g. ASR-PAT-2026-8834"
              required
            />
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              UHID will be automatically pseudonymized before transmission.
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Purpose & Minimum Clinical Data Selection
            </label>
            <textarea
              value={newPurpose}
              onChange={(e) => setNewPurpose(e.target.value)}
              placeholder="Document the exact clinical necessity and minimal payload required for this case..."
              rows={3}
              required
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Statutory Consent / Lawful Authority</label>
            <Input
              value={newLegalAuthority}
              onChange={(e) => setNewLegalAuthority(e.target.value)}
              required
            />
          </div>

          <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
            <Button variant="ghost" size="sm" type="button" onClick={() => setNewRequestModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" className="bg-teal-700 hover:bg-teal-600">
              Dispatch Request
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal 2: Ephemeral Diagnostic Share */}
      <Modal
        isOpen={diagnosticModal}
        onClose={() => setDiagnosticModal(false)}
        title="Generate Ephemeral Diagnostic Share Token"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600">
            Generates a high-entropy, time-limited token that allows a specified external hospital specialist to view a single imaging study or lab report without unrestricted database access.
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Target Specialist / Hospital</label>
            <Input defaultValue="Dr. R. K. Varma (NIMS Neuroradiology)" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Study / Order Reference</label>
            <Input defaultValue="RAD-MRI-2026-9941 (3T Brain MRI Axial DWI)" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Token Validity Duration</label>
            <select className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs">
              <option value="2">2 Hours (Emergency STAT Second Opinion)</option>
              <option value="6">6 Hours (Routine Specialist Review)</option>
              <option value="24">24 Hours (Multi-Disciplinary Tumor Board)</option>
            </select>
          </div>

          <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
            <Button variant="ghost" size="sm" onClick={() => setDiagnosticModal(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setDiagnosticModal(false);
                showToast({
                  type: 'success',
                  title: 'Ephemeral Token Issued',
                  message: '2-Hour HMAC token generated and transmitted to consulting specialist.'
                });
              }}
              className="bg-purple-700 hover:bg-purple-600 text-white"
            >
              Generate Signed Token
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CoordinationDashboard;
