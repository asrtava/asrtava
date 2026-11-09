import React, { useState } from 'react';
import {
  Scan,
  ShieldAlert,
  Layers,
  FileCheck2,
  PhoneCall,
  Activity,
  CheckCircle2,
  AlertTriangle,
  ZoomIn,
  Eye,
  Plus,
  RefreshCw,
  Search,
  Filter,
  Check,
  ChevronRight,
  Droplets,
  Radio,
  FileText
} from 'lucide-react';
import { Button, Input, Badge, useToast, Modal } from '../../components/ui';

interface Modality {
  id: string;
  name: string;
  modalityType: 'CT' | 'MRI' | 'XR' | 'US' | 'MG' | 'FL';
  aeTitle: string;
  ipAddress: string;
  port: number;
  roomNumber: string;
  status: 'ONLINE' | 'ACQUIRING' | 'MAINTENANCE' | 'OFFLINE';
  activeAppointmentsToday: number;
}

interface SafetyScreening {
  id: string;
  patientName: string;
  uhid: string;
  modalityType: string;
  hasPacemakerOrImplant: boolean;
  hasClaustrophobia: boolean;
  pregnancyStatus: 'NOT_PREGNANT' | 'CONFIRMED' | 'UNKNOWN' | 'NOT_APPLICABLE';
  renalFunctionEgfr: number;
  iodineAllergyHistory: boolean;
  clearanceStatus: 'CLEARED' | 'REQUIRES_NEPHROLOGY_CLEARANCE' | 'CONTRAINDICATED';
  clearedBy: string;
}

interface PACSStudyItem {
  id: string;
  accessionNumber: string;
  patientName: string;
  uhid: string;
  modality: string;
  studyDescription: string;
  seriesCount: number;
  instanceCount: number;
  studyDate: string;
  storageUri: string;
  status: 'ACQUIRED' | 'INTERPRETING' | 'FINALIZED' | 'ADDENDUM_ATTACHED';
}

interface CriticalFinding {
  id: string;
  accessionNumber: string;
  patientName: string;
  uhid: string;
  findingDescription: string;
  orderingDoctor: string;
  communicatedTo: string;
  readBackConfirmed: boolean;
  urgencyLevel: 'EMERGENT_STAT' | 'URGENT_1HOUR' | 'SIGNIFICANT_24HOUR';
  loggedAt: string;
}

export const AdvancedRISHub: React.FC = () => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'modalities' | 'screening' | 'pacs' | 'reporting' | 'critical' | 'contrast'>('modalities');

  // Modality States
  const [modalities, setModalities] = useState<Modality[]>([
    {
      id: 'mod-1',
      name: 'Siemens Somatom Force 128-Slice',
      modalityType: 'CT',
      aeTitle: 'SOMATOM_CT1',
      ipAddress: '192.168.10.45',
      port: 104,
      roomNumber: 'Rad-Suite 101',
      status: 'ONLINE',
      activeAppointmentsToday: 18,
    },
    {
      id: 'mod-2',
      name: 'GE Signa Pioneer 3.0T High-Field MRI',
      modalityType: 'MRI',
      aeTitle: 'GE_SIGNA_MRI3T',
      ipAddress: '192.168.10.46',
      port: 104,
      roomNumber: 'MRI Shielded Suite 102',
      status: 'ACQUIRING',
      activeAppointmentsToday: 12,
    },
    {
      id: 'mod-3',
      name: 'Philips DigitalDiagnost C90 DR',
      modalityType: 'XR',
      aeTitle: 'PHILIPS_DR_X1',
      ipAddress: '192.168.10.47',
      port: 104,
      roomNumber: 'X-Ray Bay 103',
      status: 'ONLINE',
      activeAppointmentsToday: 26,
    },
    {
      id: 'mod-4',
      name: 'GE Logiq E10 Ultrasound Doppler',
      modalityType: 'US',
      aeTitle: 'LOGIQ_E10_US',
      ipAddress: '192.168.10.48',
      port: 104,
      roomNumber: 'Sonography Room 104',
      status: 'ONLINE',
      activeAppointmentsToday: 14,
    },
  ]);

  // Safety Screening Checklist
  const [screenings, setScreenings] = useState<SafetyScreening[]>([
    {
      id: 'scr-1',
      patientName: 'Vikram Joshi',
      uhid: 'APEX-2026-00051',
      modalityType: 'CT with IV Contrast',
      hasPacemakerOrImplant: false,
      hasClaustrophobia: false,
      pregnancyStatus: 'NOT_APPLICABLE',
      renalFunctionEgfr: 78,
      iodineAllergyHistory: false,
      clearanceStatus: 'CLEARED',
      clearedBy: 'Dr. Vikram Sethi',
    },
    {
      id: 'scr-2',
      patientName: 'Kavita Patel',
      uhid: 'APEX-2026-00087',
      modalityType: 'MRI Pelvis with Gadolinium',
      hasPacemakerOrImplant: false,
      hasClaustrophobia: true,
      pregnancyStatus: 'NOT_PREGNANT',
      renalFunctionEgfr: 28,
      iodineAllergyHistory: false,
      clearanceStatus: 'REQUIRES_NEPHROLOGY_CLEARANCE',
      clearedBy: 'Dr. Suresh Nair',
    },
    {
      id: 'scr-3',
      patientName: 'Priya Iyer',
      uhid: 'APEX-2026-00085',
      modalityType: 'CT Abdomen',
      hasPacemakerOrImplant: false,
      hasClaustrophobia: false,
      pregnancyStatus: 'CONFIRMED',
      renalFunctionEgfr: 94,
      iodineAllergyHistory: false,
      clearanceStatus: 'CONTRAINDICATED',
      clearedBy: 'Dr. Ananya Roy',
    },
  ]);

  // PACS Studies
  const [pacsStudies, setPacsStudies] = useState<PACSStudyItem[]>([
    {
      id: 'pacs-1',
      accessionNumber: 'ACC-2026-9041',
      patientName: 'Vikram Joshi',
      uhid: 'APEX-2026-00051',
      modality: 'CT',
      studyDescription: 'CT Thorax High-Resolution (HRCT)',
      seriesCount: 4,
      instanceCount: 684,
      studyDate: '2026-11-09 10:15',
      storageUri: 'dicom-archive://pacs/ct/2026/11/09/ACC-2026-9041.tar',
      status: 'INTERPRETING',
    },
    {
      id: 'pacs-2',
      accessionNumber: 'ACC-2026-9042',
      patientName: 'Ramesh Verma',
      uhid: 'APEX-2026-00084',
      modality: 'CT',
      studyDescription: 'CT Angiography Coronary Arteries',
      seriesCount: 8,
      instanceCount: 1240,
      studyDate: '2026-11-09 09:30',
      storageUri: 'dicom-archive://pacs/ct/2026/11/09/ACC-2026-9042.tar',
      status: 'FINALIZED',
    },
    {
      id: 'pacs-3',
      accessionNumber: 'ACC-2026-9043',
      patientName: 'Meenakshi Sundaram',
      uhid: 'APEX-2026-00099',
      modality: 'MRI',
      studyDescription: 'MRI Brain with DWI & FLAIR',
      seriesCount: 6,
      instanceCount: 412,
      studyDate: '2026-11-09 11:00',
      storageUri: 'dicom-archive://pacs/mri/2026/11/09/ACC-2026-9043.tar',
      status: 'ACQUIRED',
    },
  ]);

  // Critical Panic Findings Log
  const [criticalFindings, setCriticalFindings] = useState<CriticalFinding[]>([
    {
      id: 'cf-1',
      accessionNumber: 'ACC-2026-9018',
      patientName: 'Sunil Gavaskar',
      uhid: 'APEX-2026-00032',
      findingDescription: 'Acute middle cerebral artery (MCA) occlusion with developing cytotoxic edema.',
      orderingDoctor: 'Dr. Rajesh Sharma (Emergency)',
      communicatedTo: 'Dr. Rajesh Sharma',
      readBackConfirmed: true,
      urgencyLevel: 'EMERGENT_STAT',
      loggedAt: '2026-11-09 08:45 AM',
    },
    {
      id: 'cf-2',
      accessionNumber: 'ACC-2026-9022',
      patientName: 'Harish Rao',
      uhid: 'APEX-2026-00041',
      findingDescription: 'Tension pneumothorax right hemithorax with mediastinal shift.',
      orderingDoctor: 'Dr. Vikram Sethi (ICU)',
      communicatedTo: 'Sister-in-Charge Reena',
      readBackConfirmed: true,
      urgencyLevel: 'EMERGENT_STAT',
      loggedAt: '2026-11-09 09:15 AM',
    },
  ]);

  // Modals
  const [isViewerModalOpen, setIsViewerModalOpen] = useState(false);
  const [selectedPacsStudy, setSelectedPacsStudy] = useState<PACSStudyItem | null>(null);
  const [isAddendumModalOpen, setIsAddendumModalOpen] = useState(false);
  const [addendumText, setAddendumText] = useState('');

  const handleOpenDicomViewer = (study: PACSStudyItem) => {
    setSelectedPacsStudy(study);
    setIsViewerModalOpen(true);
  };

  const handleAttachAddendum = () => {
    if (!addendumText.trim() || !selectedPacsStudy) return;
    setPacsStudies((prev) =>
      prev.map((s) => (s.id === selectedPacsStudy.id ? { ...s, status: 'ADDENDUM_ATTACHED' } : s))
    );
    setIsAddendumModalOpen(false);
    setAddendumText('');
    showToast({
      type: 'success',
      title: 'Radiology Report Addendum Signed',
      message: `Signed legal addendum attached to ${selectedPacsStudy.accessionNumber}. Version history preserved.`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white p-5 rounded-2xl shadow-md border border-teal-800/40">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-teal-500/20 text-teal-300 border border-teal-500/30 flex items-center space-x-1">
                <Scan className="w-3 h-3" />
                <span>Enterprise RIS / PACS / DICOM Suite</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                DICOM 3.0 / HL7 Compliant
              </span>
            </div>
            <h2 className="text-xl font-bold mt-2 tracking-tight">Advanced Radiology & PACS Operations Control</h2>
            <p className="text-xs text-slate-300 mt-0.5">
              High-throughput DICOM modality worklists, renal/pregnancy safety screening, structured reporting & critical findings audit.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="px-3 py-1.5 bg-slate-800/80 rounded-lg border border-slate-700 text-xs">
              <span className="text-slate-400">Total DICOM Storage: </span>
              <span className="font-mono font-bold text-teal-300">4.8 TB</span>
            </div>
            <div className="px-3 py-1.5 bg-slate-800/80 rounded-lg border border-slate-700 text-xs">
              <span className="text-slate-400">Instances Indexed: </span>
              <span className="font-mono font-bold text-emerald-300">842,109</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('modalities')}
          className={`px-3 py-2 text-xs font-semibold rounded-lg transition flex items-center space-x-1.5 ${
            activeTab === 'modalities' ? 'bg-teal-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Radio className="w-3.5 h-3.5" />
          <span>Modality Worklists ({modalities.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('screening')}
          className={`px-3 py-2 text-xs font-semibold rounded-lg transition flex items-center space-x-1.5 ${
            activeTab === 'screening' ? 'bg-teal-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Patient Safety Screening ({screenings.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('pacs')}
          className={`px-3 py-2 text-xs font-semibold rounded-lg transition flex items-center space-x-1.5 ${
            activeTab === 'pacs' ? 'bg-teal-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>PACS DICOM Archive ({pacsStudies.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('critical')}
          className={`px-3 py-2 text-xs font-semibold rounded-lg transition flex items-center space-x-1.5 ${
            activeTab === 'critical' ? 'bg-rose-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <PhoneCall className="w-3.5 h-3.5" />
          <span>Critical Panic Alerts ({criticalFindings.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('contrast')}
          className={`px-3 py-2 text-xs font-semibold rounded-lg transition flex items-center space-x-1.5 ${
            activeTab === 'contrast' ? 'bg-teal-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Droplets className="w-3.5 h-3.5" />
          <span>Contrast Media & Safety</span>
        </button>
      </div>

      {/* Tab 1: Modality Worklists */}
      {activeTab === 'modalities' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {modalities.map((m) => (
            <div key={m.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:border-teal-300 transition">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900">{m.name}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
                      {m.modalityType}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">{m.roomNumber}</div>
                </div>
                <Badge
                  variant={m.status === 'ONLINE' ? 'success' : m.status === 'ACQUIRING' ? 'brand' : 'warning'}
                  size="sm"
                >
                  {m.status}
                </Badge>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-4 p-2.5 bg-slate-50 rounded-lg text-xs font-mono">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">AE Title</span>
                  <span className="font-bold text-slate-800">{m.aeTitle}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">IP : Port</span>
                  <span className="text-slate-800">{m.ipAddress}:{m.port}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Today's Scans</span>
                  <span className="font-bold text-teal-700">{m.activeAppointmentsToday} patients</span>
                </div>
              </div>

              <div className="flex justify-between items-center mt-4 pt-3 border-t border-slate-100">
                <span className="text-xs text-emerald-600 font-medium flex items-center">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                  DICOM C-ECHO Echo Verified (12ms)
                </span>
                <Button size="sm" variant="outline">
                  View Worklist Queue
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: Safety Screening */}
      {activeTab === 'screening' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Patient Radiation & Contrast Safety Screenings</h3>
              <p className="text-xs text-slate-500">
                Mandatory renal function (eGFR &gt; 30 mL/min/1.73m² for gadolinium/iodine) and MRI safety audit.
              </p>
            </div>
          </div>

          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Patient</th>
                <th className="py-3 px-3">Procedure & Modality</th>
                <th className="py-3 px-3">eGFR Level</th>
                <th className="py-3 px-3">MRI Safety Check</th>
                <th className="py-3 px-3">Pregnancy Status</th>
                <th className="py-3 px-3">Clearance Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              {screenings.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/60">
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900">{s.patientName}</div>
                    <div className="text-[11px] font-mono text-slate-400">{s.uhid}</div>
                  </td>
                  <td className="py-3 px-3 font-medium text-slate-800">{s.modalityType}</td>
                  <td className="py-3 px-3">
                    <span
                      className={`font-mono font-bold px-2 py-0.5 rounded text-xs ${
                        s.renalFunctionEgfr >= 60
                          ? 'bg-emerald-50 text-emerald-700'
                          : s.renalFunctionEgfr >= 30
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      {s.renalFunctionEgfr} mL/min
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    {s.hasPacemakerOrImplant ? (
                      <span className="text-rose-600 font-bold flex items-center">
                        <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                        Implant Detected
                      </span>
                    ) : (
                      <span className="text-emerald-600 flex items-center">
                        <Check className="w-3.5 h-3.5 mr-1" />
                        No Ferromagnetic Metal
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3">
                    <span className="text-slate-700 font-medium">{s.pregnancyStatus}</span>
                  </td>
                  <td className="py-3 px-3">
                    <Badge
                      variant={
                        s.clearanceStatus === 'CLEARED'
                          ? 'success'
                          : s.clearanceStatus === 'REQUIRES_NEPHROLOGY_CLEARANCE'
                          ? 'warning'
                          : 'danger'
                      }
                      size="sm"
                    >
                      {s.clearanceStatus.replace(/_/g, ' ')}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <Button size="sm" variant="outline">
                      Review Safety Form
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 3: PACS DICOM Archive */}
      {activeTab === 'pacs' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Indexed DICOM Studies & SOP Instances</h3>
              <p className="text-xs text-slate-500">
                Connected to ASRTAVA compliant object store. Pixel data stored securely with indexed relational metadata.
              </p>
            </div>
          </div>

          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Accession & Date</th>
                <th className="py-3 px-3">Patient</th>
                <th className="py-3 px-3">Modality</th>
                <th className="py-3 px-3">Study Description</th>
                <th className="py-3 px-3">Series / Slices</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-right">PACS Workstation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              {pacsStudies.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/60">
                  <td className="py-3.5 px-4">
                    <div className="font-mono font-bold text-teal-800">{p.accessionNumber}</div>
                    <div className="text-[11px] text-slate-400">{p.studyDate}</div>
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-bold text-slate-900">{p.patientName}</div>
                    <div className="text-[11px] font-mono text-slate-400">{p.uhid}</div>
                  </td>
                  <td className="py-3 px-3">
                    <span className="font-bold text-cyan-800 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200">
                      {p.modality}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-semibold text-slate-800">{p.studyDescription}</td>
                  <td className="py-3 px-3 font-mono">
                    {p.seriesCount} series · <span className="text-teal-700 font-bold">{p.instanceCount} slices</span>
                  </td>
                  <td className="py-3 px-3">
                    <Badge
                      variant={
                        p.status === 'FINALIZED'
                          ? 'success'
                          : p.status === 'ADDENDUM_ATTACHED'
                          ? 'brand'
                          : p.status === 'INTERPRETING'
                          ? 'warning'
                          : 'neutral'
                      }
                      size="sm"
                    >
                      {p.status.replace(/_/g, ' ')}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-4 text-right space-x-2">
                    <Button size="sm" variant="primary" onClick={() => handleOpenDicomViewer(p)}>
                      <Eye className="w-3.5 h-3.5 mr-1" />
                      Launch DICOM Viewer
                    </Button>
                    {p.status === 'FINALIZED' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedPacsStudy(p);
                          setIsAddendumModalOpen(true);
                        }}
                      >
                        <FileText className="w-3.5 h-3.5 mr-1" />
                        Addendum
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 4: Critical Findings Panic Log */}
      {activeTab === 'critical' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-rose-200 bg-rose-50/50 flex justify-between items-center">
            <div>
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <h3 className="font-bold text-rose-900 text-sm">Critical Imaging Findings & Panic Notifications</h3>
              </div>
              <p className="text-xs text-rose-700 mt-0.5">
                Immediate mandatory communication log with telephone read-back confirmation as required by hospital safety accreditation.
              </p>
            </div>
            <Button size="sm" variant="danger">
              <PhoneCall className="w-3.5 h-3.5 mr-1" />
              Log Critical Finding Call
            </Button>
          </div>

          <table className="w-full text-left text-xs">
            <thead className="bg-rose-50/30 text-slate-500 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Urgency & Logged Time</th>
                <th className="py-3 px-3">Patient</th>
                <th className="py-3 px-4">Critical Pathology / Finding</th>
                <th className="py-3 px-3">Ordering Physician</th>
                <th className="py-3 px-3">Communicated Recipient</th>
                <th className="py-3 px-3">Read-Back Verified</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              {criticalFindings.map((cf) => (
                <tr key={cf.id} className="hover:bg-rose-50/30">
                  <td className="py-3.5 px-4">
                    <span className="font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded text-[11px] block w-fit mb-1">
                      {cf.urgencyLevel.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">{cf.loggedAt}</span>
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-bold text-slate-900">{cf.patientName}</div>
                    <div className="text-[11px] font-mono text-slate-400">{cf.uhid}</div>
                  </td>
                  <td className="py-3 px-4 font-semibold text-rose-900">{cf.findingDescription}</td>
                  <td className="py-3 px-3 text-slate-800">{cf.orderingDoctor}</td>
                  <td className="py-3 px-3 font-medium text-slate-800">{cf.communicatedTo}</td>
                  <td className="py-3 px-3">
                    {cf.readBackConfirmed ? (
                      <span className="text-emerald-700 font-bold flex items-center bg-emerald-50 px-2 py-0.5 rounded w-fit border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                        Telephone Read-Back Confirmed
                      </span>
                    ) : (
                      <span className="text-amber-700 font-bold flex items-center">
                        <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                        Pending Read-Back
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 5: Contrast Media & Safety */}
      {activeTab === 'contrast' && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div>
            <h3 className="font-bold text-slate-800 text-sm">Contrast Media Administration & Safety Registry</h3>
            <p className="text-xs text-slate-500">
              Detailed tracking of IV iodinated and gadolinium-based contrast agents, injection flow rates, and adverse event logging.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-xs text-slate-500 font-medium">Standard IV Non-Ionic Contrast</span>
              <div className="font-bold text-slate-900 mt-1">Iopamidol 370 mg/mL (Isovue)</div>
              <div className="text-xs text-slate-500 mt-1">Lot: ISO-2026-99201 · Exp: 2028-04</div>
              <div className="mt-3 text-xs text-teal-700 font-semibold">Available Stock: 140 Vials (100 mL)</div>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-xs text-slate-500 font-medium">Macrocyclic Gadolinium Agent</span>
              <div className="font-bold text-slate-900 mt-1">Gadobutrol 1.0 mmol/mL (Gadovist)</div>
              <div className="text-xs text-slate-500 mt-1">Lot: GAD-2026-1184 · Exp: 2027-10</div>
              <div className="mt-3 text-xs text-teal-700 font-semibold">Available Stock: 85 Vials (15 mL)</div>
            </div>

            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
              <span className="text-xs text-emerald-800 font-medium">Adverse Reaction Emergency Kit</span>
              <div className="font-bold text-emerald-950 mt-1">Emergency Resuscitation Tray Ready</div>
              <div className="text-xs text-emerald-700 mt-1">Epinephrine 1:1000, Hydrocortisone, Diphenhydramine</div>
              <div className="mt-3 text-xs text-emerald-800 font-bold flex items-center">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                Verified this morning by Radiology Nurse
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DICOM Viewer Modal */}
      {selectedPacsStudy && (
        <Modal
          isOpen={isViewerModalOpen}
          onClose={() => setIsViewerModalOpen(false)}
          title={`PACS Web DICOM Workstation — ${selectedPacsStudy.studyDescription}`}
          description={`Patient: ${selectedPacsStudy.patientName} (${selectedPacsStudy.uhid}) · Accession: ${selectedPacsStudy.accessionNumber}`}
          footer={
            <Button variant="outline" onClick={() => setIsViewerModalOpen(false)}>
              Close DICOM Viewer
            </Button>
          }
        >
          <div className="space-y-4">
            <div className="bg-slate-950 text-white rounded-xl p-4 flex flex-col items-center justify-center min-h-[320px] relative border border-slate-800">
              <div className="absolute top-3 left-3 text-[11px] font-mono text-cyan-400 space-y-0.5">
                <div>MODALITY: {selectedPacsStudy.modality}</div>
                <div>SERIES: 3 / {selectedPacsStudy.seriesCount}</div>
                <div>IMAGE: 142 / {selectedPacsStudy.instanceCount}</div>
                <div>WINDOW: W 1500 / L -600 (LUNG)</div>
              </div>
              <div className="absolute top-3 right-3 text-[11px] font-mono text-slate-400 text-right space-y-0.5">
                <div>KV: 120 · mA: 280</div>
                <div>SLICE: 1.00 mm</div>
                <div>FOV: 350 mm</div>
                <div>ZOOM: 100%</div>
              </div>
              <div className="flex flex-col items-center justify-center text-center p-8">
                <Scan className="w-16 h-16 text-teal-400 animate-pulse mb-3" />
                <span className="text-sm font-semibold text-slate-200">High-Resolution Diagnostic DICOM Canvas</span>
                <span className="text-xs text-slate-400 mt-1 font-mono">
                  {selectedPacsStudy.storageUri}
                </span>
                <div className="flex gap-2 mt-4">
                  <span className="px-2 py-1 bg-slate-800 text-[11px] rounded text-slate-300">W/L: Lung</span>
                  <span className="px-2 py-1 bg-slate-800 text-[11px] rounded text-slate-300">W/L: Bone</span>
                  <span className="px-2 py-1 bg-slate-800 text-[11px] rounded text-slate-300">W/L: Mediastinum</span>
                </div>
              </div>
            </div>
            <div className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex justify-between items-center">
              <span>Lossless DICOM transfer via WADO-RS / DICOMweb standard. Zero lossy compression.</span>
              <span className="font-mono text-teal-700 font-bold">16-bit Grayscale</span>
            </div>
          </div>
        </Modal>
      )}

      {/* Addendum Modal */}
      {selectedPacsStudy && (
        <Modal
          isOpen={isAddendumModalOpen}
          onClose={() => setIsAddendumModalOpen(false)}
          title={`Attach Signed Legal Addendum — ${selectedPacsStudy.accessionNumber}`}
          description={`Patient: ${selectedPacsStudy.patientName} (${selectedPacsStudy.uhid})`}
          footer={
            <>
              <Button variant="outline" onClick={() => setIsAddendumModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleAttachAddendum}>
                <FileCheck2 className="w-4 h-4 mr-1.5" />
                Digitally Sign & Lock Addendum
              </Button>
            </>
          }
        >
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-slate-700">
              Addendum Clarification / Supplemental Interpretation
            </label>
            <textarea
              value={addendumText}
              onChange={(e) => setAddendumText(e.target.value)}
              placeholder="State the additional diagnostic findings, reason for addendum, or comparison with prior studies..."
              className="w-full h-32 p-3 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
            />
            <div className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded border border-amber-200">
              Note: The original finalized report cannot be overwritten or altered. This addendum will be permanently appended with your digital signature and timestamp.
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

