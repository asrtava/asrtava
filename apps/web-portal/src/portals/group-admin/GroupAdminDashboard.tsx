import React, { useState, useEffect } from 'react';
import {
  Building2,
  Network,
  Users,
  Activity,
  DollarSign,
  Truck,
  ArrowRightLeft,
  Calendar,
  Layers,
  Search,
  Filter,
  Plus,
  ShieldCheck,
  Sparkles,
  ChevronRight,
  ChevronDown,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText
} from 'lucide-react';
import { Button, Badge, Modal, Input, useToast } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';

export const GroupAdminDashboard: React.FC = () => {
  const { showToast } = useToast();
  const { activePortalTab, setActivePortalTab } = useAuth();

  const [activeTab, setActiveTab] = useState<'overview' | 'hierarchy' | 'transfers' | 'stock' | 'finance' | 'doctors' | 'licensing'>('overview');

  useEffect(() => {
    if (activePortalTab && ['overview', 'hierarchy', 'transfers', 'stock', 'finance', 'doctors', 'licensing'].includes(activePortalTab)) {
      setActiveTab(activePortalTab as any);
    }
  }, [activePortalTab]);

  const switchTab = (tab: 'overview' | 'hierarchy' | 'transfers' | 'stock' | 'finance' | 'doctors' | 'licensing') => {
    setActiveTab(tab);
    setActivePortalTab(tab);
  };
  const [selectedHospital, setSelectedHospital] = useState<string>('all');
  const [isExpansionModalOpen, setIsExpansionModalOpen] = useState(false);
  const [requestedLocations, setRequestedLocations] = useState('2');
  const [requestedBeds, setRequestedBeds] = useState('250');
  const [expansionJustification, setExpansionJustification] = useState('Expansion for upcoming cardiac wing in Pune and daycare center in Chennai.');

  const hospitals = [
    { id: 'hosp-delhi-saket', name: 'Apex Super Speciality Hospital, Saket', region: 'North', city: 'New Delhi', beds: 450, staff: 210, opdToday: 142, revToday: '₹ 4,85,000', status: 'Optimal' },
    { id: 'hosp-blr-indira', name: 'Apex Hospital, Indiranagar', region: 'South', city: 'Bengaluru', beds: 320, staff: 160, opdToday: 98, revToday: '₹ 3,40,000', status: 'Optimal' },
    { id: 'hosp-hyd-banjara', name: 'Apex Care Clinic & Daycare', region: 'South', city: 'Hyderabad', beds: 50, staff: 80, opdToday: 45, revToday: '₹ 1,10,000', status: 'High Volume' }
  ];

  const handleRequestExpansion = () => {
    setIsExpansionModalOpen(false);
    showToast({
      type: 'success',
      title: 'Expansion Request Submitted',
      message: `Commercial expansion request logged for ${requestedLocations} additional locations. Perpetual license remains non-blocked.`
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-100 text-indigo-800 flex items-center space-x-1">
              <Network className="w-3.5 h-3.5" />
              <span>Enterprise Group HQ Console &bull; Central Operations</span>
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">Apex Healthcare Network</h1>
          <p className="text-sm text-slate-500">
            Multi-hospital oversight, cross-branch transfers, centralized EMPI, doctor scheduling and group finance.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm" onClick={() => setIsExpansionModalOpen(true)}>
            <Plus className="w-4 h-4 mr-1 text-indigo-600" />
            <span>Request Branch Expansion</span>
          </Button>
          <Button variant="primary" size="sm" onClick={() => setActiveTab('transfers')}>
            <ArrowRightLeft className="w-4 h-4 mr-1" />
            <span>View Active Transfers</span>
          </Button>
        </div>
      </div>

      {/* Group KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-medium">Hospitals & Branches</span>
          <div className="text-2xl font-bold text-indigo-950 mt-1">3 Hospitals · 6 Branches</div>
          <span className="text-[11px] text-indigo-600 font-medium">Northern & Southern Regions</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-emerald-600 font-medium">Consolidated Today's Revenue</span>
          <div className="text-2xl font-bold text-emerald-600 mt-1">₹ 9,35,000</div>
          <span className="text-[11px] text-emerald-600 font-medium">All 3 Facilities Combined</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-blue-600 font-medium">Master Patients (EMPI)</span>
          <div className="text-2xl font-bold text-blue-600 mt-1">48,200 Individuals</div>
          <span className="text-[11px] text-slate-400">Zero-Duplication Cross-Hospital Index</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-purple-600 font-medium">Total Multi-Site Staff</span>
          <div className="text-2xl font-bold text-purple-600 mt-1">450 Medical Staff</div>
          <span className="text-[11px] text-purple-600">38 Visiting Multi-Branch Doctors</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-6 text-xs font-semibold overflow-x-auto">
          {[
            { id: 'overview', label: 'Group Operations Overview' },
            { id: 'hierarchy', label: 'Organizational Hierarchy (DAG)' },
            { id: 'transfers', label: 'Cross-Hospital Transfers & Referrals' },
            { id: 'stock', label: 'Inter-Branch Stock Transfers' },
            { id: 'finance', label: 'Consolidated Finance & Ledger' },
            { id: 'doctors', label: 'Cross-Branch Doctor Schedules' },
            { id: 'licensing', label: 'Enterprise License Allocation' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-3 border-b-2 transition whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-indigo-600 text-indigo-900 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Hospital Facilities & Operational Performance</h3>
                <p className="text-xs text-slate-500">Live metrics across hospitals under Apex Healthcare Holdings.</p>
              </div>
              <span className="text-xs font-mono text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded">3 Facilities Online</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Hospital Facility</th>
                    <th className="py-2.5 px-3">Region / Location</th>
                    <th className="py-2.5 px-3">Inpatient Beds</th>
                    <th className="py-2.5 px-3">Active Staff</th>
                    <th className="py-2.5 px-3">Today OPD</th>
                    <th className="py-2.5 px-3">Today Revenue</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {hospitals.map((hosp) => (
                    <tr key={hosp.id} className="hover:bg-slate-50">
                      <td className="py-3 px-3 font-semibold text-slate-900">{hosp.name}</td>
                      <td className="py-3 px-3 text-slate-600">{hosp.city} ({hosp.region})</td>
                      <td className="py-3 px-3 text-slate-800">{hosp.beds} Beds</td>
                      <td className="py-3 px-3 text-slate-800">{hosp.staff} Staff</td>
                      <td className="py-3 px-3 text-blue-700 font-semibold">{hosp.opdToday} Consults</td>
                      <td className="py-3 px-3 text-emerald-700 font-semibold">{hosp.revToday}</td>
                      <td className="py-3 px-3">
                        <Badge variant="success" size="sm">
                          {hosp.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Hierarchy DAG */}
      {activeTab === 'hierarchy' && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Configurable Hierarchy & Operational Nodes</h3>
            <p className="text-xs text-slate-500">Recursive node architecture with DAG cycle prevention.</p>
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div className="font-bold text-indigo-900 flex items-center space-x-1.5">
                <Building2 className="w-4 h-4 text-indigo-600" />
                <span>[ORGANIZATION] Apex Healthcare Holdings Global Ltd (ROOT)</span>
              </div>
              <div className="pl-6 pt-2 space-y-2">
                <div className="border-l-2 border-indigo-200 pl-3">
                  <div className="font-semibold text-slate-800">&bull; [REGION] Northern Regional Directorate</div>
                  <div className="pl-4 pt-1 space-y-1 text-slate-600">
                    <div>&bull; [HOSPITAL] Apex Super Speciality Hospital, Saket</div>
                    <div className="pl-4 text-slate-500">&bull; [BRANCH] Apex Saket Outpatient Daycare Branch</div>
                    <div className="pl-8 text-slate-400">&bull; [DEPARTMENT] Cardiology &bull; [UNIT] Cath Lab #1</div>
                  </div>
                </div>

                <div className="border-l-2 border-indigo-200 pl-3">
                  <div className="font-semibold text-slate-800">&bull; [REGION] Southern Regional Directorate</div>
                  <div className="pl-4 pt-1 space-y-1 text-slate-600">
                    <div>&bull; [HOSPITAL] Apex Hospital, Indiranagar</div>
                    <div className="pl-4 text-slate-500">&bull; [CLINIC] Apex Whitefield Diagnostic & Consultation Clinic</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Cross-Hospital Transfers */}
      {activeTab === 'transfers' && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Inter-Hospital Clinical Transfers & Referrals</h3>
              <p className="text-xs text-slate-500">Emergency transfers, step-down beds, and shared super-specialist consultations.</p>
            </div>
            <span className="text-xs font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">ACLS Ambulance Tracking Live</span>
          </div>

          <div className="p-3.5 bg-indigo-50/60 rounded-xl border border-indigo-200 flex items-start justify-between text-xs">
            <div className="space-y-1">
              <div className="font-bold text-indigo-950 flex items-center space-x-2">
                <span className="px-2 py-0.5 bg-red-100 text-red-800 rounded font-bold uppercase text-[10px]">EMERGENCY</span>
                <span>Transfer #TRF-2026-8812 &bull; Patient: Ramesh Gupta (EMPI-2026-9021)</span>
              </div>
              <div className="text-slate-600">
                Route: <strong>Apex Hospital, Indiranagar</strong> &rarr; <strong>Apex Super Speciality, Saket</strong>
              </div>
              <div className="text-slate-500 text-[11px]">
                Reason: Acute STEMI requiring surgical revascularization &bull; Initiated by: Dr. Ananya Roy
              </div>
            </div>
            <Badge variant="warning" size="sm">
              In Transit
            </Badge>
          </div>
        </div>
      )}

      {/* Tab 4: Inter-Branch Stock Transfers */}
      {activeTab === 'stock' && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Centralized Procurement & Inter-Branch Stock Movements</h3>
            <p className="text-xs text-slate-500">Central warehouse replenishment, cold-chain shipments, and traceable lot receipts.</p>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-center text-xs">
            <div>
              <div className="font-semibold text-slate-900">STK-TRF-2026-1049 &bull; Adrenaline 1mg/mL Injection (200 Vials)</div>
              <div className="text-slate-500 text-[11px]">Source: Delhi Central Pharmacy &rarr; Destination: Bengaluru Hospital (Batch: BAT-ADR-2026-X1)</div>
            </div>
            <Badge variant="success" size="sm">
              Received & Stocked
            </Badge>
          </div>
        </div>
      )}

      {/* Tab 5: Consolidated Finance */}
      {activeTab === 'finance' && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Consolidated Financial Oversight & Inter-Branch Settlements</h3>
            <p className="text-xs text-slate-500">P&L rollups while preserving legal entity boundaries and statutory compliance.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-slate-500">Group Gross Billed Revenue</span>
              <div className="text-xl font-bold text-slate-900 mt-1">₹ 1,48,50,000</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-slate-500">Inter-Branch Reimbursements</span>
              <div className="text-xl font-bold text-blue-700 mt-1">₹ 2,45,000</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-slate-500">Settled Inter-Facility Trans</span>
              <div className="text-xl font-bold text-emerald-700 mt-1">12 Transactions</div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 6: Doctors */}
      {activeTab === 'doctors' && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Cross-Branch Doctor Schedules & Anti-Collision Engine</h3>
            <p className="text-xs text-slate-500">Prevents overlapping appointments across physical hospital facilities.</p>
          </div>

          <div className="space-y-2 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-center">
              <div>
                <div className="font-semibold text-slate-900">Dr. Ananya Roy (Cardiology)</div>
                <div className="text-slate-500 text-[11px]">Monday: 09:00 - 13:00 at Delhi Saket Hospital (OPD-102)</div>
                <div className="text-slate-500 text-[11px]">Tuesday: 10:00 - 14:00 at Bengaluru Whitefield Clinic (OPD-04)</div>
              </div>
              <Badge variant="success" size="sm">
                Collision Free
              </Badge>
            </div>
          </div>
        </div>
      )}

      {/* Tab 7: Licensing */}
      {activeTab === 'licensing' && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Perpetual License Allocation Across Group Facilities</h3>
            <p className="text-xs text-slate-500">Location entitlement tracking under perpetual enterprise software license.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-200">
              <span className="text-indigo-900 font-semibold">Authorized Locations</span>
              <div className="text-xl font-bold text-indigo-950 mt-1">3 of 3 Consumed</div>
              <span className="text-[11px] text-indigo-700">Perpetual License Scope</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-slate-500 font-semibold">Total Bed Tier Capacity</span>
              <div className="text-xl font-bold text-slate-900 mt-1">820 / 1,000 Beds</div>
              <span className="text-[11px] text-slate-400">82% Quota Consumed</span>
            </div>
            <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
              <span className="text-emerald-900 font-semibold">Perpetual Status</span>
              <div className="text-xl font-bold text-emerald-950 mt-1">Active & Permanent</div>
              <span className="text-[11px] text-emerald-700">Zero Compulsory Lockout</span>
            </div>
          </div>
        </div>
      )}

      {/* Branch Expansion Modal */}
      <Modal
        isOpen={isExpansionModalOpen}
        onClose={() => setIsExpansionModalOpen(false)}
        title="Enterprise License Location Expansion Request"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-600">
            Request an amendment to your perpetual software license for additional hospital branches or clinic locations.
            Existing clinical workflows will continue without interruption.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Additional Locations</label>
              <Input
                type="number"
                value={requestedLocations}
                onChange={(e) => setRequestedLocations(e.target.value)}
                min="1"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Additional Beds</label>
              <Input
                type="number"
                value={requestedBeds}
                onChange={(e) => setRequestedBeds(e.target.value)}
                min="10"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Operational Justification</label>
            <Input
              value={expansionJustification}
              onChange={(e) => setExpansionJustification(e.target.value)}
              placeholder="e.g. Opening new satellite center in Pune..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <Button variant="outline" size="sm" onClick={() => setIsExpansionModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleRequestExpansion}>
              <ShieldCheck className="w-4 h-4 mr-1.5" />
              <span>Submit Expansion Request</span>
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

