import React, { useState, useEffect } from 'react';
import {
  Scissors,
  CheckCircle2,
  AlertTriangle,
  Clock,
  UserCheck,
  ShieldCheck,
  Activity,
  Heart,
  Droplets,
  Plus,
  RefreshCw,
  Search,
  Filter,
  Check,
  ChevronRight,
  ClipboardCheck,
  FileCheck2,
  AlertCircle,
  Layers,
  Thermometer,
  Eye,
  FileText
} from 'lucide-react';
import { Button, Input, Badge, useToast, Modal } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';

interface TheatreRoom {
  id: string;
  theatreNumber: string;
  name: string;
  specialty: string;
  isLaminarAirflow: boolean;
  status: 'AVAILABLE' | 'IN_SURGERY' | 'CLEANING' | 'MAINTENANCE';
  currentProcedure?: string;
  surgeonName?: string;
}

interface ScheduledSurgery {
  id: string;
  patientName: string;
  uhid: string;
  age: number;
  gender: string;
  procedureName: string;
  primarySurgeon: string;
  anaesthetist: string;
  theatreName: string;
  scheduledTime: string;
  priority: 'ELECTIVE' | 'URGENT' | 'STAT_EMERGENCY';
  status: 'SCHEDULED' | 'IN_PREOP' | 'IN_THEATRE' | 'RECOVERY' | 'COMPLETED';
}

interface SurgicalCount {
  category: string;
  initial: number;
  added: number;
  closing: number;
  isMatch: boolean;
}

export const AdvancedOTHub: React.FC = () => {
  const { showToast } = useToast();
  const { activePortalTab, setActivePortalTab } = useAuth();
  const [activeTab, setActiveTab] = useState<'theatres' | 'schedules' | 'who_checklist' | 'anaesthesia' | 'counts' | 'pacu'>('theatres');

  useEffect(() => {
    if (activePortalTab && ['theatres', 'schedules', 'who_checklist', 'anaesthesia', 'counts', 'pacu'].includes(activePortalTab)) {
      setActiveTab(activePortalTab as any);
    }
  }, [activePortalTab]);

  const switchTab = (tab: 'theatres' | 'schedules' | 'who_checklist' | 'anaesthesia' | 'counts' | 'pacu') => {
    setActiveTab(tab);
    setActivePortalTab(tab);
  };

  // 1. Operating Theatre Suites
  const [theatres, setTheatres] = useState<TheatreRoom[]>([
    {
      id: 'th-1',
      theatreNumber: 'OT-Suite 1 (Modular)',
      name: 'Cardiothoracic & Vascular OT',
      specialty: 'CARDIOTHORACIC',
      isLaminarAirflow: true,
      status: 'IN_SURGERY',
      currentProcedure: 'CABG Off-Pump 3-Grafts',
      surgeonName: 'Dr. Vikram Sethi',
    },
    {
      id: 'th-2',
      theatreNumber: 'OT-Suite 2 (Ultra-Clean)',
      name: 'Joint Replacement & Orthopaedics',
      specialty: 'ORTHOPAEDIC',
      isLaminarAirflow: true,
      status: 'AVAILABLE',
    },
    {
      id: 'th-3',
      theatreNumber: 'OT-Suite 3 (Endosuite)',
      name: 'Laparoscopic & Bariatric OT',
      specialty: 'GENERAL_MINIMAL_ACCESS',
      isLaminarAirflow: true,
      status: 'CLEANING',
    },
    {
      id: 'th-4',
      theatreNumber: 'OT-Suite 4 (Emergency)',
      name: '24/7 STAT Emergency Trauma OT',
      specialty: 'TRAUMA_EMERGENCY',
      isLaminarAirflow: true,
      status: 'AVAILABLE',
    },
  ]);

  // 2. Surgery Schedule
  const [schedules, setSchedules] = useState<ScheduledSurgery[]>([
    {
      id: 'surg-1',
      patientName: 'Ramesh Verma',
      uhid: 'APEX-2026-00084',
      age: 58,
      gender: 'M',
      procedureName: 'Off-Pump Coronary Artery Bypass (CABG)',
      primarySurgeon: 'Dr. Vikram Sethi (CTVS)',
      anaesthetist: 'Dr. Ananya Roy (Chief Cardiac Anaesthetist)',
      theatreName: 'OT-Suite 1 (Modular)',
      scheduledTime: '08:30 AM - 12:30 PM',
      priority: 'ELECTIVE',
      status: 'IN_THEATRE',
    },
    {
      id: 'surg-2',
      patientName: 'Kavita Patel',
      uhid: 'APEX-2026-00087',
      age: 41,
      gender: 'F',
      procedureName: 'Laparoscopic Cholecystectomy',
      primarySurgeon: 'Dr. Rajesh Sharma',
      anaesthetist: 'Dr. Suresh Nair',
      theatreName: 'OT-Suite 3 (Endosuite)',
      scheduledTime: '11:00 AM - 12:15 PM',
      priority: 'ELECTIVE',
      status: 'IN_PREOP',
    },
    {
      id: 'surg-3',
      patientName: 'Deepak Chopra',
      uhid: 'APEX-2026-00104',
      age: 34,
      gender: 'M',
      procedureName: 'Emergency Laparotomy (Blunt Abdominal Trauma)',
      primarySurgeon: 'Dr. Vikram Sethi',
      anaesthetist: 'Dr. Ananya Roy',
      theatreName: 'OT-Suite 4 (Emergency)',
      scheduledTime: 'STAT (Immediate)',
      priority: 'STAT_EMERGENCY',
      status: 'SCHEDULED',
    },
  ]);

  // 3. WHO Surgical Safety Checklist State
  const [whoPhase, setWhoPhase] = useState<'SIGN_IN' | 'TIME_OUT' | 'SIGN_OUT'>('TIME_OUT');
  const [signInDone, setSignInDone] = useState(true);
  const [timeOutDone, setTimeOutDone] = useState(false);
  const [signOutDone, setSignOutDone] = useState(false);
  const [antibioticGiven, setAntibioticGiven] = useState(true);
  const [siteMarked, setSiteMarked] = useState(true);
  const [airwayRisk, setAirwayRisk] = useState(false);

  // 4. Surgical Counts (Sponges, Sharps, Instruments)
  const [counts, setCounts] = useState<SurgicalCount[]>([
    { category: 'Laparotomy Sponges (Radiopaque)', initial: 10, added: 5, closing: 15, isMatch: true },
    { category: 'Surgical Gauze Swabs', initial: 20, added: 10, closing: 30, isMatch: true },
    { category: 'Sharps & Suture Needles', initial: 8, added: 4, closing: 12, isMatch: true },
    { category: 'Artery Forceps & Clamps', initial: 24, added: 0, closing: 24, isMatch: true },
  ]);

  // 5. PACU Aldrete Scoring
  const [aldreteActivity, setAldreteActivity] = useState(2);
  const [aldreteRespiration, setAldreteRespiration] = useState(2);
  const [aldreteCirculation, setAldreteCirculation] = useState(2);
  const [aldreteConsciousness, setAldreteConsciousness] = useState(2);
  const [aldreteO2Sat, setAldreteO2Sat] = useState(2);

  const totalAldrete = aldreteActivity + aldreteRespiration + aldreteCirculation + aldreteConsciousness + aldreteO2Sat;

  const handleCompleteTimeOut = () => {
    setTimeOutDone(true);
    showToast({
      type: 'success',
      title: 'WHO Time-Out Verified & Recorded',
      message: 'Surgical team verified patient, operative site, antibiotic timing and essential imaging. Cleared for incision.',
    });
  };

  const handlePacuDischarge = () => {
    if (totalAldrete < 9) {
      showToast({
        type: 'error',
        title: 'PACU Discharge Blocked',
        message: `Current Modified Aldrete score is ${totalAldrete}/10. Safe ward discharge strictly requires a minimum score of 9.`,
      });
      return;
    }
    showToast({
      type: 'success',
      title: 'Patient Cleared for Inpatient Ward Transfer',
      message: `Modified Aldrete score of ${totalAldrete}/10 verified. Patient stable for surgical ward bed assignment.`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 rounded-2xl shadow-md border border-indigo-800/40">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center space-x-1">
                <Scissors className="w-3 h-3" />
                <span>Operation Theatre & Perioperative Care Suite</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                WHO Surgical Safety Standard
              </span>
            </div>
            <h2 className="text-xl font-bold mt-2 tracking-tight">Surgical Scheduling, Theatre Safety & PACU Recovery</h2>
            <p className="text-xs text-slate-300 mt-0.5">
              Multi-resource surgeon/anaesthetist conflict prevention, 3-phase WHO checklist, sponge reconciliation & Aldrete recovery tracking.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="px-3 py-1.5 bg-slate-800/80 rounded-lg border border-slate-700 text-xs">
              <span className="text-slate-400">Active Theatres: </span>
              <span className="font-mono font-bold text-indigo-300">4 Suites Online</span>
            </div>
            <div className="px-3 py-1.5 bg-slate-800/80 rounded-lg border border-slate-700 text-xs">
              <span className="text-slate-400">Surgeries Today: </span>
              <span className="font-mono font-bold text-emerald-300">14 Procedures</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('theatres')}
          className={`px-3 py-2 text-xs font-semibold rounded-lg transition flex items-center space-x-1.5 ${
            activeTab === 'theatres' ? 'bg-indigo-700 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>OT Room Status ({theatres.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('schedules')}
          className={`px-3 py-2 text-xs font-semibold rounded-lg transition flex items-center space-x-1.5 ${
            activeTab === 'schedules' ? 'bg-indigo-700 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Surgical Schedule & Conflicts ({schedules.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('who_checklist')}
          className={`px-3 py-2 text-xs font-semibold rounded-lg transition flex items-center space-x-1.5 ${
            activeTab === 'who_checklist' ? 'bg-indigo-700 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>WHO Surgical Safety Checklist</span>
        </button>
        <button
          onClick={() => setActiveTab('anaesthesia')}
          className={`px-3 py-2 text-xs font-semibold rounded-lg transition flex items-center space-x-1.5 ${
            activeTab === 'anaesthesia' ? 'bg-indigo-700 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Anaesthesia & Intraoperative Chart</span>
        </button>
        <button
          onClick={() => setActiveTab('counts')}
          className={`px-3 py-2 text-xs font-semibold rounded-lg transition flex items-center space-x-1.5 ${
            activeTab === 'counts' ? 'bg-indigo-700 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <ClipboardCheck className="w-3.5 h-3.5" />
          <span>Surgical Counts & Sharps</span>
        </button>
        <button
          onClick={() => setActiveTab('pacu')}
          className={`px-3 py-2 text-xs font-semibold rounded-lg transition flex items-center space-x-1.5 ${
            activeTab === 'pacu' ? 'bg-indigo-700 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Heart className="w-3.5 h-3.5" />
          <span>PACU Recovery & Aldrete Score</span>
        </button>
      </div>

      {/* Tab 1: Theatres Status */}
      {activeTab === 'theatres' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {theatres.map((th) => (
            <div key={th.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:border-indigo-300 transition">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900">{th.theatreNumber}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {th.specialty}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">{th.name}</div>
                </div>
                <Badge
                  variant={th.status === 'AVAILABLE' ? 'success' : th.status === 'IN_SURGERY' ? 'brand' : 'warning'}
                  size="sm"
                >
                  {th.status.replace(/_/g, ' ')}
                </Badge>
              </div>

              {th.status === 'IN_SURGERY' ? (
                <div className="mt-3 p-3 bg-indigo-50/60 border border-indigo-100 rounded-lg text-xs space-y-1">
                  <div className="font-semibold text-indigo-950 flex items-center">
                    <Activity className="w-3.5 h-3.5 mr-1.5 text-indigo-600 animate-pulse" />
                    <span>Current: {th.currentProcedure}</span>
                  </div>
                  <div className="text-slate-600 text-[11px]">Primary Surgeon: {th.surgeonName}</div>
                </div>
              ) : (
                <div className="mt-3 p-3 bg-slate-50 border border-slate-100 rounded-lg text-xs text-slate-500">
                  Theatre sterilized and ready for next scheduled case.
                </div>
              )}

              <div className="flex justify-between items-center mt-4 pt-3 border-t border-slate-100 text-xs">
                <span className="text-emerald-700 font-medium flex items-center">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                  HEPA Laminar Air Flow Active
                </span>
                <Button size="sm" variant="outline">
                  View Theatre Schedule
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: Surgical Schedule */}
      {activeTab === 'schedules' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Today's Operating Theatre Schedule & Case Roster</h3>
              <p className="text-xs text-slate-500">
                Automated multi-resource collision engine checks theatre room, surgeon, and anaesthetist schedules simultaneously.
              </p>
            </div>
            <Button size="sm" variant="primary">
              <Plus className="w-3.5 h-3.5 mr-1" />
              Schedule New Case
            </Button>
          </div>

          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Time & Urgency</th>
                <th className="py-3 px-3">Patient Details</th>
                <th className="py-3 px-4">Procedure Planned</th>
                <th className="py-3 px-3">Surgical & Anaesthesia Team</th>
                <th className="py-3 px-3">Operating Theatre</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              {schedules.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/60">
                  <td className="py-3.5 px-4">
                    <span
                      className={`font-bold px-2 py-0.5 rounded text-[10px] block w-fit mb-1 ${
                        s.priority === 'STAT_EMERGENCY'
                          ? 'bg-rose-100 text-rose-800 border border-rose-200 animate-pulse'
                          : s.priority === 'URGENT'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {s.priority.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">{s.scheduledTime}</span>
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-bold text-slate-900">{s.patientName}</div>
                    <div className="text-[11px] font-mono text-slate-400">
                      {s.age}y · {s.gender} · {s.uhid}
                    </div>
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-800">{s.procedureName}</td>
                  <td className="py-3 px-3">
                    <div className="text-slate-800 font-medium">{s.primarySurgeon}</div>
                    <div className="text-[11px] text-slate-500">{s.anaesthetist}</div>
                  </td>
                  <td className="py-3 px-3 font-medium text-indigo-900">{s.theatreName}</td>
                  <td className="py-3 px-3">
                    <Badge
                      variant={
                        s.status === 'IN_THEATRE'
                          ? 'brand'
                          : s.status === 'COMPLETED'
                          ? 'success'
                          : s.status === 'IN_PREOP'
                          ? 'warning'
                          : 'neutral'
                      }
                      size="sm"
                    >
                      {s.status.replace(/_/g, ' ')}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-4 text-right space-x-2">
                    <Button size="sm" variant="outline">
                      View Chart
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 3: WHO Surgical Safety Checklist */}
      {activeTab === 'who_checklist' && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-4">
            <div>
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-base">WHO Surgical Safety Checklist — Live Case</h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Case: CABG Off-Pump · Patient: Ramesh Verma (APEX-2026-00084) · Theatre: OT-Suite 1
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold flex items-center">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                Sign-In Verified
              </span>
              <span className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center ${
                timeOutDone ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}>
                {timeOutDone ? <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> : <Clock className="w-3.5 h-3.5 mr-1" />}
                {timeOutDone ? 'Time-Out Completed' : 'Time-Out In Progress'}
              </span>
              <span className="px-2.5 py-1 bg-slate-100 text-slate-500 rounded-lg text-xs font-bold">
                Sign-Out Pending
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Phase 1: Sign-In */}
            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-950 text-xs uppercase tracking-wide">Phase 1: Sign-In</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">Before Induction</span>
              </div>
              <div className="space-y-2 text-xs text-slate-700">
                <label className="flex items-center space-x-2">
                  <input type="checkbox" checked={true} readOnly className="rounded text-emerald-600" />
                  <span>Patient Identity & Consent Confirmed</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" checked={siteMarked} onChange={(e) => setSiteMarked(e.target.checked)} className="rounded text-emerald-600" />
                  <span>Surgical Site Marked / NA</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" checked={true} readOnly className="rounded text-emerald-600" />
                  <span>Pulse Oximeter on & functioning</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" checked={true} readOnly className="rounded text-emerald-600" />
                  <span>Known Allergy Checked (None)</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" checked={airwayRisk} onChange={(e) => setAirwayRisk(e.target.checked)} className="rounded text-emerald-600" />
                  <span>Difficult Airway / Aspiration Risk Evaluated</span>
                </label>
              </div>
              <div className="pt-2 border-t border-emerald-200 text-[11px] text-emerald-800 font-medium">
                Verified at 08:35 AM by Dr. Ananya Roy (Anaesthetist)
              </div>
            </div>

            {/* Phase 2: Time-Out */}
            <div className={`p-4 rounded-xl border space-y-3 ${
              timeOutDone ? 'border-emerald-200 bg-emerald-50/30' : 'border-indigo-300 bg-indigo-50/40'
            }`}>
              <div className="flex items-center justify-between">
                <span className="font-bold text-indigo-950 text-xs uppercase tracking-wide">Phase 2: Time-Out</span>
                <span className="text-[10px] bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded font-bold">Before Incision</span>
              </div>
              <div className="space-y-2 text-xs text-slate-700">
                <label className="flex items-center space-x-2">
                  <input type="checkbox" checked={true} readOnly className="rounded text-indigo-600" />
                  <span>All team members introduced by name & role</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" checked={true} readOnly className="rounded text-indigo-600" />
                  <span>Surgeon & Anaesthetist confirm operative plan</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" checked={antibioticGiven} onChange={(e) => setAntibioticGiven(e.target.checked)} className="rounded text-indigo-600" />
                  <span className="font-semibold text-indigo-900">Antibiotic Prophylaxis given within 60 mins</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" checked={true} readOnly className="rounded text-indigo-600" />
                  <span>Essential diagnostic imaging displayed</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" checked={true} readOnly className="rounded text-indigo-600" />
                  <span>Sterility indicators verified by scrub nurse</span>
                </label>
              </div>
              <div className="pt-3 border-t border-indigo-200 flex justify-between items-center">
                {!timeOutDone ? (
                  <Button size="sm" variant="primary" onClick={handleCompleteTimeOut}>
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                    Confirm Time-Out
                  </Button>
                ) : (
                  <span className="text-[11px] text-emerald-800 font-medium">
                    Verified at 08:58 AM by Dr. Vikram Sethi & Team
                  </span>
                )}
              </div>
            </div>

            {/* Phase 3: Sign-Out */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3 opacity-80">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-xs uppercase tracking-wide">Phase 3: Sign-Out</span>
                <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-bold">Before Leaving OT</span>
              </div>
              <div className="space-y-2 text-xs text-slate-600">
                <label className="flex items-center space-x-2">
                  <input type="checkbox" disabled className="rounded" />
                  <span>Nurse verbally confirms procedure name</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" disabled className="rounded" />
                  <span>Instrument, sponge & needle count correct</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" disabled className="rounded" />
                  <span>Specimen labeled (including patient name)</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" disabled className="rounded" />
                  <span>Surgeon & Anaesthetist review key recovery concerns</span>
                </label>
              </div>
              <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-500">
                Awaiting surgical completion & wound closure.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Anaesthesia Charting & Intraoperative Vitals */}
      {activeTab === 'anaesthesia' && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Intraoperative Anaesthesia Monitoring Log</h3>
              <p className="text-xs text-slate-500">
                Real-time hemodynamics, airway ventilation metrics, and controlled narcotic administration records.
              </p>
            </div>
            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 font-mono text-xs rounded border border-emerald-200 font-bold">
              Anaesthesia Type: General (ETT Size 8.0)
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
              <span className="text-[11px] text-slate-400 block font-medium">Heart Rate</span>
              <div className="text-2xl font-bold text-slate-900 font-mono mt-0.5">72</div>
              <span className="text-[10px] text-emerald-600">BPM (Sinus Rhythm)</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
              <span className="text-[11px] text-slate-400 block font-medium">Blood Pressure</span>
              <div className="text-2xl font-bold text-slate-900 font-mono mt-0.5">118/74</div>
              <span className="text-[10px] text-emerald-600">MAP: 88 mmHg</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
              <span className="text-[11px] text-slate-400 block font-medium">SpO2</span>
              <div className="text-2xl font-bold text-slate-900 font-mono mt-0.5">99%</div>
              <span className="text-[10px] text-emerald-600">FiO2: 45%</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
              <span className="text-[11px] text-slate-400 block font-medium">EtCO2</span>
              <div className="text-2xl font-bold text-slate-900 font-mono mt-0.5">36</div>
              <span className="text-[10px] text-emerald-600">mmHg (Normal)</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
              <span className="text-[11px] text-slate-400 block font-medium">Core Temp</span>
              <div className="text-2xl font-bold text-slate-900 font-mono mt-0.5">36.6°C</div>
              <span className="text-[10px] text-emerald-600">Esophageal Probe</span>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wide block">
              Controlled Narcotics & Anaesthetic Drugs Log
            </span>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
              <div className="p-2 bg-white rounded border border-slate-200">
                <span className="font-bold text-slate-800">Propofol (1% IV):</span>
                <span className="text-slate-600 ml-1">150 mg at 08:38 AM (Induction)</span>
              </div>
              <div className="p-2 bg-white rounded border border-slate-200">
                <span className="font-bold text-slate-800">Fentanyl (IV):</span>
                <span className="text-slate-600 ml-1">150 mcg at 08:39 AM</span>
              </div>
              <div className="p-2 bg-white rounded border border-slate-200">
                <span className="font-bold text-slate-800">Vecuronium:</span>
                <span className="text-slate-600 ml-1">8 mg at 08:41 AM (Intubation)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Surgical Counts & Sharps */}
      {activeTab === 'counts' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Surgical Sponge, Needle & Instrument Reconciliation</h3>
              <p className="text-xs text-slate-500">
                Mandatory dual-nurse verification (Scrub Nurse + Circulating Nurse) to prevent Retained Foreign Objects (RFO).
              </p>
            </div>
            <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded font-bold text-xs flex items-center">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
              All Counts Balanced
            </span>
          </div>

          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Item Category</th>
                <th className="py-3 px-3">Initial Count</th>
                <th className="py-3 px-3">Added Intra-op</th>
                <th className="py-3 px-3">Closing Count</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-right">Nurse Signatures</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              {counts.map((c, idx) => (
                <tr key={idx} className="hover:bg-slate-50/60">
                  <td className="py-3 px-4 font-bold text-slate-900">{c.category}</td>
                  <td className="py-3 px-3 font-mono font-semibold">{c.initial}</td>
                  <td className="py-3 px-3 font-mono text-indigo-700">+{c.added}</td>
                  <td className="py-3 px-3 font-mono font-bold text-slate-900">{c.closing}</td>
                  <td className="py-3 px-3">
                    <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold border border-emerald-200 flex items-center w-fit">
                      <Check className="w-3 h-3 mr-1" />
                      Reconciled
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right text-[11px] text-slate-500">
                    Scrub: Sr. Priya · Circulating: Sr. Deepa
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 6: PACU Recovery & Aldrete Score */}
      {activeTab === 'pacu' && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-6">
          <div className="flex justify-between items-center border-b border-slate-200 pb-4">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Post-Anaesthesia Care Unit (PACU) & Modified Aldrete Score</h3>
              <p className="text-xs text-slate-500">
                Systematic evaluation of 5 physiologic recovery parameters. A minimum score of 9 is required before ward discharge.
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 block font-medium">Total Aldrete Score</span>
              <span className={`text-2xl font-bold font-mono ${totalAldrete >= 9 ? 'text-emerald-600' : 'text-amber-600'}`}>
                {totalAldrete} / 10
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="font-bold text-slate-800 text-xs block mb-1">1. Activity</span>
              <select
                value={aldreteActivity}
                onChange={(e) => setAldreteActivity(Number(e.target.value))}
                className="w-full text-xs p-1.5 bg-white border border-slate-200 rounded font-medium"
              >
                <option value={2}>2 - Moves 4 extremities voluntarily</option>
                <option value={1}>1 - Moves 2 extremities</option>
                <option value={0}>0 - Unable to move extremities</option>
              </select>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="font-bold text-slate-800 text-xs block mb-1">2. Respiration</span>
              <select
                value={aldreteRespiration}
                onChange={(e) => setAldreteRespiration(Number(e.target.value))}
                className="w-full text-xs p-1.5 bg-white border border-slate-200 rounded font-medium"
              >
                <option value={2}>2 - Deep breath & cough freely</option>
                <option value={1}>1 - Dyspneic / shallow breathing</option>
                <option value={0}>0 - Apneic / requires airway</option>
              </select>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="font-bold text-slate-800 text-xs block mb-1">3. Circulation</span>
              <select
                value={aldreteCirculation}
                onChange={(e) => setAldreteCirculation(Number(e.target.value))}
                className="w-full text-xs p-1.5 bg-white border border-slate-200 rounded font-medium"
              >
                <option value={2}>2 - BP within 20% pre-op level</option>
                <option value={1}>1 - BP 20-49% pre-op level</option>
                <option value={0}>0 - BP +/- 50% pre-op level</option>
              </select>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="font-bold text-slate-800 text-xs block mb-1">4. Consciousness</span>
              <select
                value={aldreteConsciousness}
                onChange={(e) => setAldreteConsciousness(Number(e.target.value))}
                className="w-full text-xs p-1.5 bg-white border border-slate-200 rounded font-medium"
              >
                <option value={2}>2 - Fully awake & oriented</option>
                <option value={1}>1 - Arousable on calling</option>
                <option value={0}>0 - Not responding</option>
              </select>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="font-bold text-slate-800 text-xs block mb-1">5. O2 Saturation</span>
              <select
                value={aldreteO2Sat}
                onChange={(e) => setAldreteO2Sat(Number(e.target.value))}
                className="w-full text-xs p-1.5 bg-white border border-slate-200 rounded font-medium"
              >
                <option value={2}>2 - SpO2 &gt; 92% on room air</option>
                <option value={1}>1 - Needs supplemental O2</option>
                <option value={0}>0 - SpO2 &lt; 90% with O2</option>
              </select>
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-slate-200">
            <div className="text-xs text-slate-600">
              {totalAldrete >= 9 ? (
                <span className="text-emerald-700 font-bold flex items-center">
                  <CheckCircle2 className="w-4 h-4 mr-1 text-emerald-600" />
                  Criteria Met: Patient is clinically stable for transfer to Inpatient Surgical Ward.
                </span>
              ) : (
                <span className="text-amber-700 font-bold flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1 text-amber-600" />
                  Criteria Not Met: Continue PACU monitoring until score reaches 9.
                </span>
              )}
            </div>

            <Button
              size="sm"
              variant={totalAldrete >= 9 ? 'primary' : 'outline'}
              onClick={handlePacuDischarge}
            >
              <UserCheck className="w-3.5 h-3.5 mr-1" />
              Authorize Discharge to Surgical Ward
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

