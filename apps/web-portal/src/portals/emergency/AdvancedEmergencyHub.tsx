import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Flame,
  Truck,
  HeartPulse,
  Activity,
  ShieldAlert,
  Clock,
  UserCheck,
  CheckCircle2,
  PhoneCall,
  Plus,
  RefreshCw,
  Search,
  Filter,
  Check,
  ChevronRight,
  ClipboardList,
  FileCheck2,
  AlertCircle,
  Layers,
  Thermometer,
  Eye,
  FileText,
  Radio,
  Siren,
  Sparkles
} from 'lucide-react';
import { Button, Input, Badge, useToast, Modal } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { useHospital } from '../../context/HospitalContext';

interface EmergencyPatient {
  id: string;
  encounterNumber: string;
  patientName: string;
  uhid: string;
  isUnknownIdentity: boolean;
  age: number | string;
  gender: string;
  arrivalMode: 'WALK_IN' | 'AMBULANCE' | 'POLICE_BRING_IN' | 'HELICOPTER';
  presentingComplaint: string;
  esiLevel: number;
  zone: 'RED_RESUS' | 'YELLOW_ACUTE' | 'GREEN_FAST_TRACK';
  vitals: {
    hr: number;
    bp: string;
    rr: number;
    spo2: number;
    gcs: number;
  };
  arrivalTime: string;
  isMedicoLegal: boolean;
  status: 'TRIAGING' | 'IN_RESUS' | 'UNDER_OBSERVATION' | 'ADMITTED_ICU' | 'DISCHARGED';
}

interface AmbulanceUnit {
  id: string;
  vehicleNumber: string;
  type: string;
  status: 'AVAILABLE' | 'DISPATCHED' | 'ON_SCENE' | 'EN_ROUTE_HOSPITAL';
  paramedic: string;
  driver: string;
  currentLocation: string;
  activeTripEta?: string;
}

export const AdvancedEmergencyHub: React.FC = () => {
  const { showToast } = useToast();
  const { activePortalTab, setActivePortalTab } = useAuth();
  const { emergencyPatients, registerEmergencyPatient } = useHospital();
  const [activeTab, setActiveTab] = useState<'triage_board' | 'trauma_resus' | 'ambulance' | 'stat_orders' | 'mlc'>('triage_board');

  useEffect(() => {
    if (activePortalTab && ['triage_board', 'trauma_resus', 'ambulance', 'stat_orders', 'mlc'].includes(activePortalTab)) {
      setActiveTab(activePortalTab as any);
    }
  }, [activePortalTab]);

  const switchTab = (tab: 'triage_board' | 'trauma_resus' | 'ambulance' | 'stat_orders' | 'mlc') => {
    setActiveTab(tab);
    setActivePortalTab(tab);
  };

  // 1. Live ED Patients - synchronized with HospitalContext
  const [patients, setPatients] = useState<EmergencyPatient[]>([
    {
      id: 'ed-1',
      encounterNumber: 'ED-2026-9011',
      patientName: 'Unidentified Male (Found Unconscious)',
      uhid: 'TEMP-UHID-ED-88412',
      isUnknownIdentity: true,
      age: '~35',
      gender: 'M',
      arrivalMode: 'AMBULANCE',
      presentingComplaint: 'High-speed motor vehicle collision, severe head trauma, flail chest',
      esiLevel: 1,
      zone: 'RED_RESUS',
      vitals: { hr: 138, bp: '78/42', rr: 32, spo2: 84, gcs: 6 },
      arrivalTime: '10:45 AM (8 mins ago)',
      isMedicoLegal: true,
      status: 'IN_RESUS',
    },
    {
      id: 'ed-2',
      encounterNumber: 'ED-2026-9012',
      patientName: 'Kavita Sundaram',
      uhid: 'APEX-2026-00088',
      isUnknownIdentity: false,
      age: 62,
      gender: 'F',
      arrivalMode: 'WALK_IN',
      presentingComplaint: 'Crushing retrosternal chest pain radiating to left jaw, diaphoresis',
      esiLevel: 2,
      zone: 'YELLOW_ACUTE',
      vitals: { hr: 96, bp: '154/92', rr: 20, spo2: 95, gcs: 15 },
      arrivalTime: '10:30 AM (23 mins ago)',
      isMedicoLegal: false,
      status: 'UNDER_OBSERVATION',
    },
    {
      id: 'ed-3',
      encounterNumber: 'ED-2026-9013',
      patientName: 'Arjun Mehta',
      uhid: 'APEX-2026-00109',
      isUnknownIdentity: false,
      age: 28,
      gender: 'M',
      arrivalMode: 'WALK_IN',
      presentingComplaint: 'Colles fracture right wrist after fall from two-wheeler',
      esiLevel: 4,
      zone: 'GREEN_FAST_TRACK',
      vitals: { hr: 78, bp: '122/80', rr: 16, spo2: 99, gcs: 15 },
      arrivalTime: '10:15 AM (38 mins ago)',
      isMedicoLegal: true,
      status: 'UNDER_OBSERVATION',
    },
  ]);

  useEffect(() => {
    if (emergencyPatients.length > 0) {
      setPatients(emergencyPatients);
    }
  }, [emergencyPatients]);

  // 2. Ambulance Fleet
  const [ambulances, setAmbulances] = useState<AmbulanceUnit[]>([
    {
      id: 'amb-1',
      vehicleNumber: 'MH-12-ED-1081',
      type: 'ALS (Advanced Life Support Mobile ICU)',
      status: 'EN_ROUTE_HOSPITAL',
      paramedic: 'Paramedic Rahul Sharma',
      driver: 'Mahesh Patil',
      currentLocation: 'Western Express Highway (4.2 km away)',
      activeTripEta: '6 mins remaining',
    },
    {
      id: 'amb-2',
      vehicleNumber: 'MH-12-ED-1082',
      type: 'ALS (Advanced Life Support)',
      status: 'AVAILABLE',
      paramedic: 'Paramedic Sunita Rao',
      driver: 'Anil Kadam',
      currentLocation: 'Hospital Base Station Bay 2',
    },
    {
      id: 'amb-3',
      vehicleNumber: 'MH-12-ED-1083',
      type: 'BLS (Basic Life Support)',
      status: 'AVAILABLE',
      paramedic: 'EMT Vikram Shinde',
      driver: 'Pravin Pawar',
      currentLocation: 'Hospital Base Station Bay 3',
    },
  ]);

  // Modals & Actions
  const [isTempUhidModalOpen, setIsTempUhidModalOpen] = useState(false);
  const [tempComplaint, setTempComplaint] = useState('Severe polytrauma, unresponsive at scene');
  const [tempArrivalMode, setTempArrivalMode] = useState<'AMBULANCE' | 'POLICE_BRING_IN' | 'WALK_IN'>('AMBULANCE');

  const handleIssueTempUhid = async () => {
    const randomSuffix = Math.floor(10000 + Math.random() * 90000);
    const newTempUhid = `TEMP-UHID-ED-${randomSuffix}`;

    const newEnc = await registerEmergencyPatient({
      patientName: `Unidentified Emergency Patient (${newTempUhid})`,
      uhid: newTempUhid,
      isUnknownIdentity: true,
      age: '~35',
      gender: 'U',
      arrivalMode: tempArrivalMode,
      presentingComplaint: tempComplaint,
      esiLevel: 1,
      vitals: { hr: 120, bp: '85/50', rr: 28, spo2: 89, gcs: 7 },
      isMedicoLegal: true,
    });

    setPatients((prev) => [newEnc, ...prev]);
    setIsTempUhidModalOpen(false);
    showToast({
      type: 'success',
      title: 'Temporary Emergency UHID Issued',
      message: `${newTempUhid} generated with Red Resuscitation Bay assignment. All diagnostic & blood bank billing gates bypassed.`,
    });
  };

  const handleActivateTraumaCode = () => {
    showToast({
      type: 'warning',
      title: 'CODE RED: Trauma Team Activation Broadcast',
      message: 'Trauma Leader, Emergency Physician, Anaesthetist, General Surgeon & Orthopaedic Surgeon alerted. Response timer started.',
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 text-white p-5 rounded-2xl shadow-md border border-rose-800/40">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center space-x-1">
                <Siren className="w-3 h-3 animate-pulse" />
                <span>Emergency Department & Trauma Command Center</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                24/7 Level-1 Trauma Ready
              </span>
            </div>
            <h2 className="text-xl font-bold mt-2 tracking-tight">Acute Triage, Resuscitation & Pre-Hospital Care</h2>
            <p className="text-xs text-slate-300 mt-0.5">
              Standardized ESI 5-level triage, instant temporary UHID issuance, ATLS resuscitation & clinical emergency payment override.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="danger" onClick={handleActivateTraumaCode}>
              <Flame className="w-3.5 h-3.5 mr-1" />
              Broadcast Code Red / Trauma Alert
            </Button>
            <Button size="sm" variant="primary" onClick={() => setIsTempUhidModalOpen(true)}>
              <Plus className="w-3.5 h-3.5 mr-1" />
              Issue Temp Emergency UHID
            </Button>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('triage_board')}
          className={`px-3 py-2 text-xs font-semibold rounded-lg transition flex items-center space-x-1.5 ${
            activeTab === 'triage_board' ? 'bg-rose-700 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>ESI Triage Board ({patients.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('trauma_resus')}
          className={`px-3 py-2 text-xs font-semibold rounded-lg transition flex items-center space-x-1.5 ${
            activeTab === 'trauma_resus' ? 'bg-rose-700 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <HeartPulse className="w-3.5 h-3.5" />
          <span>ATLS Resuscitation Bay</span>
        </button>
        <button
          onClick={() => setActiveTab('ambulance')}
          className={`px-3 py-2 text-xs font-semibold rounded-lg transition flex items-center space-x-1.5 ${
            activeTab === 'ambulance' ? 'bg-rose-700 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Truck className="w-3.5 h-3.5" />
          <span>Ambulance Dispatch & PCR ({ambulances.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('stat_orders')}
          className={`px-3 py-2 text-xs font-semibold rounded-lg transition flex items-center space-x-1.5 ${
            activeTab === 'stat_orders' ? 'bg-rose-700 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>STAT Emergency Overrides</span>
        </button>
        <button
          onClick={() => setActiveTab('mlc')}
          className={`px-3 py-2 text-xs font-semibold rounded-lg transition flex items-center space-x-1.5 ${
            activeTab === 'mlc' ? 'bg-rose-700 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Medico-Legal Case (MLC) Log</span>
        </button>
      </div>

      {/* Tab 1: ESI Triage Board */}
      {activeTab === 'triage_board' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl">
              <div className="flex justify-between items-center">
                <span className="font-bold text-rose-950 text-xs uppercase tracking-wide">Red Zone — Resuscitation (ESI 1)</span>
                <span className="px-2 py-0.5 bg-rose-200 text-rose-900 rounded font-bold text-xs">Immediate Influx</span>
              </div>
              <div className="text-2xl font-bold text-rose-900 mt-2">
                {patients.filter((p) => p.zone === 'RED_RESUS').length} Patients
              </div>
              <span className="text-[11px] text-rose-700">GCS &lt; 9 · Hemodynamic Shock · Airway Compromise</span>
            </div>

            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <div className="flex justify-between items-center">
                <span className="font-bold text-amber-950 text-xs uppercase tracking-wide">Yellow Zone — Acute Emergent (ESI 2-3)</span>
                <span className="px-2 py-0.5 bg-amber-200 text-amber-900 rounded font-bold text-xs">&lt; 15 Mins</span>
              </div>
              <div className="text-2xl font-bold text-amber-900 mt-2">
                {patients.filter((p) => p.zone === 'YELLOW_ACUTE').length} Patients
              </div>
              <span className="text-[11px] text-amber-700">Severe Chest Pain · Dyspnea · Multiple Resources</span>
            </div>

            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
              <div className="flex justify-between items-center">
                <span className="font-bold text-emerald-950 text-xs uppercase tracking-wide">Green Zone — Fast Track (ESI 4-5)</span>
                <span className="px-2 py-0.5 bg-emerald-200 text-emerald-900 rounded font-bold text-xs">&lt; 60 Mins</span>
              </div>
              <div className="text-2xl font-bold text-emerald-900 mt-2">
                {patients.filter((p) => p.zone === 'GREEN_FAST_TRACK').length} Patients
              </div>
              <span className="text-[11px] text-emerald-700">Minor Trauma · Simple Suturing · Mild Ailments</span>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Triage Priority & Zone</th>
                  <th className="py-3 px-3">Patient Details</th>
                  <th className="py-3 px-4">Presenting Complaint</th>
                  <th className="py-3 px-3">Vital Signs & GCS</th>
                  <th className="py-3 px-3">Arrival Mode</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-4 text-right">Emergency Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {patients.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/60">
                    <td className="py-3.5 px-4">
                      <span
                        className={`font-bold px-2 py-0.5 rounded text-[10px] block w-fit mb-1 ${
                          p.zone === 'RED_RESUS'
                            ? 'bg-rose-100 text-rose-800 border border-rose-200 animate-pulse font-mono'
                            : p.zone === 'YELLOW_ACUTE'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200 font-mono'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200 font-mono'
                        }`}
                      >
                        ESI Level {p.esiLevel} ({p.zone.replace(/_/g, ' ')})
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">{p.arrivalTime}</span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900">{p.patientName}</div>
                      <div className="text-[11px] font-mono text-slate-400">
                        {p.age} · {p.gender} · {p.uhid}
                      </div>
                      {p.isMedicoLegal && (
                        <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.2 rounded inline-block mt-0.5">
                          MLC Case
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{p.presentingComplaint}</td>
                    <td className="py-3 px-3 font-mono text-xs">
                      <div>HR: {p.vitals.hr} · BP: {p.vitals.bp}</div>
                      <div className="text-slate-500">SpO2: {p.vitals.spo2}% · <span className="font-bold text-rose-700">GCS: {p.vitals.gcs}/15</span></div>
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-800">{p.arrivalMode.replace(/_/g, ' ')}</td>
                    <td className="py-3 px-3">
                      <Badge
                        variant={p.status === 'IN_RESUS' ? 'danger' : p.status === 'UNDER_OBSERVATION' ? 'brand' : 'neutral'}
                        size="sm"
                      >
                        {p.status.replace(/_/g, ' ')}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <Button size="sm" variant="primary">
                        Open ED Chart
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: ATLS Resuscitation Bay */}
      {activeTab === 'trauma_resus' && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-6">
          <div className="flex justify-between items-center border-b border-slate-200 pb-4">
            <div>
              <div className="flex items-center space-x-2">
                <HeartPulse className="w-5 h-5 text-rose-600" />
                <h3 className="font-bold text-slate-900 text-base">ATLS Primary Survey & Resuscitation Checklist</h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Active Case: Unidentified Male (TEMP-UHID-ED-88412) · Red Resus Bay 1
              </p>
            </div>
            <span className="px-3 py-1 bg-rose-100 text-rose-800 font-bold rounded-lg text-xs animate-pulse">
              Massive Transfusion Protocol (MTP) Active: 4 Units O-Neg PRBCs
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div className="p-4 bg-rose-50/40 rounded-xl border border-rose-200 space-y-2">
              <span className="font-bold text-rose-950 text-xs uppercase block">A: Airway & C-Spine</span>
              <div className="text-xs text-slate-700 space-y-1">
                <div>✓ Hard cervical collar in situ</div>
                <div className="text-rose-700 font-bold">Oral ETT Tube Size 8.0</div>
                <div className="text-[11px] text-slate-500">Secured at 22 cm at incisors</div>
              </div>
            </div>

            <div className="p-4 bg-rose-50/40 rounded-xl border border-rose-200 space-y-2">
              <span className="font-bold text-rose-950 text-xs uppercase block">B: Breathing</span>
              <div className="text-xs text-slate-700 space-y-1">
                <div>Right hemithorax dull</div>
                <div className="text-rose-700 font-bold">Chest Tube (Intercostal Drain)</div>
                <div className="text-[11px] text-slate-500">32 Fr placed: 600 mL blood</div>
              </div>
            </div>

            <div className="p-4 bg-rose-50/40 rounded-xl border border-rose-200 space-y-2">
              <span className="font-bold text-rose-950 text-xs uppercase block">C: Circulation</span>
              <div className="text-xs text-slate-700 space-y-1">
                <div>Two 16G large bore IVs</div>
                <div>Pelvic binder applied</div>
                <div className="text-rose-700 font-bold">Rapid Infuser Running</div>
              </div>
            </div>

            <div className="p-4 bg-rose-50/40 rounded-xl border border-rose-200 space-y-2">
              <span className="font-bold text-rose-950 text-xs uppercase block">D: Disability (GCS)</span>
              <div className="text-xs text-slate-700 space-y-1">
                <div className="font-bold text-rose-900">GCS: 6/15 (E1V1M4)</div>
                <div>Pupils: Right 4mm sluggish</div>
                <div>Left 3mm reactive</div>
              </div>
            </div>

            <div className="p-4 bg-rose-50/40 rounded-xl border border-rose-200 space-y-2">
              <span className="font-bold text-rose-950 text-xs uppercase block">E: Exposure</span>
              <div className="text-xs text-slate-700 space-y-1">
                <div>Full trauma log-roll done</div>
                <div>Bair Hugger warm air blanket</div>
                <div className="font-bold text-emerald-800">FAST Scan: Splenic Fluid +</div>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-slate-200">
            <span className="text-xs text-slate-500">
              Immediate Surgical Decision: Hemodynamically unstable splenic injury with hemothorax.
            </span>
            <Button size="sm" variant="danger">
              Transfer to Emergency Operation Theatre (STAT)
            </Button>
          </div>
        </div>
      )}

      {/* Tab 3: Ambulance Dispatch & Pre-Hospital PCR */}
      {activeTab === 'ambulance' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Ambulance Fleet Status & GPS Telemetry</h3>
              <p className="text-xs text-slate-500">
                Live pre-hospital sync connecting mobile paramedics to receiving emergency physicians.
              </p>
            </div>
            <Button size="sm" variant="primary">
              <PhoneCall className="w-3.5 h-3.5 mr-1" />
              Dispatch 108 Emergency Ambulance
            </Button>
          </div>

          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Vehicle Number & Type</th>
                <th className="py-3 px-3">Crew (Paramedic & Driver)</th>
                <th className="py-3 px-4">Live Location & Telemetry</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Active Trip ETA</th>
                <th className="py-3 px-4 text-right">Mobile PCR Handover</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              {ambulances.map((amb) => (
                <tr key={amb.id} className="hover:bg-slate-50/60">
                  <td className="py-3.5 px-4">
                    <div className="font-mono font-bold text-slate-900">{amb.vehicleNumber}</div>
                    <div className="text-[11px] text-slate-500">{amb.type}</div>
                  </td>
                  <td className="py-3 px-3">
                    <div className="text-slate-800 font-medium">{amb.paramedic}</div>
                    <div className="text-[11px] text-slate-400">Driver: {amb.driver}</div>
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-800">{amb.currentLocation}</td>
                  <td className="py-3 px-3">
                    <Badge
                      variant={amb.status === 'AVAILABLE' ? 'success' : amb.status === 'EN_ROUTE_HOSPITAL' ? 'danger' : 'brand'}
                      size="sm"
                    >
                      {amb.status.replace(/_/g, ' ')}
                    </Badge>
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-rose-700">
                    {amb.activeTripEta || '—'}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    {amb.status === 'EN_ROUTE_HOSPITAL' && (
                      <Button size="sm" variant="outline">
                        <FileText className="w-3.5 h-3.5 mr-1 text-rose-700" />
                        View Live Mobile PCR
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 4: STAT Emergency Overrides */}
      {activeTab === 'stat_orders' && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="border-b border-slate-200 pb-3">
            <h3 className="font-bold text-slate-800 text-sm">Emergency Clinical Overrides Registry</h3>
            <p className="text-xs text-slate-500">
              Under ASRTAVA's core clinical charter, life-saving diagnostic imaging, blood products, and emergency surgeries bypass cashier payments completely.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
              <span className="font-bold text-rose-700 uppercase tracking-wide block">CT Polytrauma Protocol</span>
              <div className="text-slate-800 font-semibold">HRCT Brain, C-Spine, Chest & Abdomen</div>
              <div className="text-slate-500 text-[11px]">Encounter: ED-2026-9011 (TEMP-UHID)</div>
              <div className="pt-2 text-emerald-700 font-bold flex items-center">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                Dispatched to Modality Suite 101 (Payment Bypassed)
              </div>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
              <span className="font-bold text-rose-700 uppercase tracking-wide block">STAT Blood Bank Crossmatch</span>
              <div className="text-slate-800 font-semibold">4 Units O-Negative Uncrossmatched PRBCs</div>
              <div className="text-slate-500 text-[11px]">Encounter: ED-2026-9011 (TEMP-UHID)</div>
              <div className="pt-2 text-emerald-700 font-bold flex items-center">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                Issued Immediately from Emergency Cooler
              </div>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
              <span className="font-bold text-rose-700 uppercase tracking-wide block">STAT Pharmacy Resuscitation</span>
              <div className="text-slate-800 font-semibold">Norepinephrine, Tranexamic Acid (TXA 1g IV)</div>
              <div className="text-slate-500 text-[11px]">Encounter: ED-2026-9011 (TEMP-UHID)</div>
              <div className="pt-2 text-emerald-700 font-bold flex items-center">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                Administered bedside by Trauma Nurse
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Medico-Legal Case (MLC) Registry */}
      {activeTab === 'mlc' && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="border-b border-slate-200 pb-3 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Medico-Legal Cases (MLC) & Police Intimation Registry</h3>
              <p className="text-xs text-slate-500">
                Statutory tracking of Road Traffic Accidents (RTA), assaults, burns, and industrial trauma.
              </p>
            </div>
            <Button size="sm" variant="outline">
              <Plus className="w-3.5 h-3.5 mr-1" />
              Register New MLC
            </Button>
          </div>

          <div className="space-y-3">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-mono font-bold text-rose-800 text-sm">MLC-2026-4412</span>
                <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded font-bold">RTA — Road Traffic Accident</span>
              </div>
              <div className="text-slate-800">
                <strong>Patient:</strong> Unidentified Male (~35y) · Encounter: ED-2026-9011
              </div>
              <div className="text-slate-600">
                <strong>Injury Description:</strong> Severe blunt polytrauma, multiple rib fractures, hemothorax, depressed skull fracture.
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-2 border-t border-slate-200 text-[11px] text-slate-500">
                <div>Police Station: Shivaji Nagar Police Station</div>
                <div>Intimation Sent: 2026-11-09 10:52 AM</div>
                <div>Acknowledged by: Head Constable S. Jadhav (Badge #4812)</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Temp UHID Modal */}
      <Modal
        isOpen={isTempUhidModalOpen}
        onClose={() => setIsTempUhidModalOpen(false)}
        title="Issue Temporary Emergency UHID (John / Jane Doe)"
        description="Creates an immediate emergency encounter for unidentified, unconscious or polytrauma arrivals."
        footer={
          <>
            <Button variant="outline" onClick={() => setIsTempUhidModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleIssueTempUhid}>
              <Plus className="w-4 h-4 mr-1.5" />
              Issue Temp UHID & Direct to Red Bay
            </Button>
          </>
        }
      >
        <div className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Arrival Mode</label>
            <select
              value={tempArrivalMode}
              onChange={(e) => setTempArrivalMode(e.target.value as any)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-medium"
            >
              <option value="AMBULANCE">Emergency 108 Ambulance Arrival</option>
              <option value="POLICE_BRING_IN">Police Bring-In</option>
              <option value="WALK_IN">Bystander / Walk-In</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Presenting Acute Condition</label>
            <textarea
              value={tempComplaint}
              onChange={(e) => setTempComplaint(e.target.value)}
              className="w-full h-24 p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-[11px]">
            Notice: Temporary emergency UHID bypasses all financial checks, assigning the patient directly to the Red Resuscitation Bay with STAT laboratory and imaging tokens.
          </div>
        </div>
      </Modal>
    </div>
  );
};

