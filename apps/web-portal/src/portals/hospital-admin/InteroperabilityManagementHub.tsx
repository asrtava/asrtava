import React, { useState } from 'react';
import {
  Activity,
  Layers,
  Radio,
  FileCode,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Send,
  ShieldCheck,
  Search,
  ExternalLink,
  Cpu,
  FileSpreadsheet,
  Check,
  RotateCcw,
  Clock,
  ArrowRight
} from 'lucide-react';
import { Button, Badge, useToast } from '../../components/ui';

export const InteroperabilityManagementHub: React.FC = () => {
  const { showToast } = useToast();
  const [activeSubTab, setActiveSubTab] = useState<'hl7' | 'fhir' | 'dicom' | 'devices' | 'terminology' | 'insurance' | 'dlq'>('hl7');

  // HL7 Simulator State
  const [hl7Input, setHl7Input] = useState(
    'MSH|^~\\&|LAB_SYS|APEX_CARE|ASRTAVA_HMS|MAIN|20261109120000||ORU^R01|MSG-CTRL-9921|P|2.5.1\r\nPID|1||UHID-2026-8801||Verma^Arjun||19820410|M\r\nOBR|1|ORD-501|FILL-501|CBC^Complete Blood Count\r\nOBX|1|NM|6690-2^Leukocytes|1|8.5|10^3/uL|4.0-11.0|N|||F\r\nOBX|2|NM|718-7^Hemoglobin|1|15.2|g/dL|13.5-17.5|N|||F'
  );
  const [hl7AckOutput, setHl7AckOutput] = useState<string | null>(null);

  // Terminology Mapping State
  const [termSourceCode, setTermSourceCode] = useState('CBC_WBC');
  const [termMappedResult, setTermMappedResult] = useState<any>(null);

  // Device Results Pathologist Approval State
  const [quarantinedPackets, setQuarantinedPackets] = useState([
    {
      id: 'pkt-8801',
      device: 'Sysmex XN-1000 Hematology Analyzer',
      specimenBarcode: 'SPEC-882190',
      analyte: 'Leukocytes (WBC)',
      value: '22.4 10^3/uL',
      refRange: '4.0 - 11.0',
      flag: 'CRITICAL',
      status: 'Quarantined (Panic Value)',
      time: '10 mins ago',
    },
    {
      id: 'pkt-8802',
      device: 'Roche Cobas c311 Biochemistry',
      specimenBarcode: 'SPEC-882191',
      analyte: 'Serum Potassium (K+)',
      value: '7.1 mmol/L',
      refRange: '3.5 - 5.1',
      flag: 'CRITICAL',
      status: 'Quarantined (Panic Value)',
      time: '25 mins ago',
    },
  ]);

  // DLQ State
  const [dlqJobs, setDlqJobs] = useState([
    {
      id: 'dlq-101',
      subsystem: 'HL7_V2',
      identifier: 'MSG-ERR-4401',
      error: 'SYNTAX_ERROR: Missing MSH-9 message type field',
      retries: 2,
      status: 'pending',
    },
    {
      id: 'dlq-102',
      subsystem: 'DICOM_PACS',
      identifier: '1.2.840.113619.2.55.3.8812',
      error: 'TIMEOUT: Local PACS server socket timeout (192.168.10.42:104)',
      retries: 1,
      status: 'pending',
    },
  ]);

  const handleTestHL7Ingest = () => {
    // Simulate HL7 v2 ACK generation
    const controlIdMatch = hl7Input.match(/MSH\|.*?\|.*?\|.*?\|.*?\|.*?\|.*?\|.*?\|.*?\|(.*?)\|/);
    const ctrlId = controlIdMatch ? controlIdMatch[1] : `CTRL-${Date.now()}`;
    const ack = `MSH|^~\\&|ASRTAVA_HMS|APEX_CARE|LAB_SYS|DELHI|20261109152000||ACK|ACK-${Date.now()}|P|2.5.1\r\nMSA|AA|${ctrlId}|Message processed successfully into clinical outbox`;
    setHl7AckOutput(ack);
    showToast({
      type: 'success',
      title: 'HL7 Message Ingested',
      message: `Generated standard Application Accept (AA) ACK for ${ctrlId}.`,
    });
  };

  const handleMapTerminology = () => {
    if (termSourceCode.toUpperCase().includes('WBC')) {
      setTermMappedResult({
        sourceSystem: 'LOCAL_LAB',
        sourceCode: termSourceCode,
        targetSystem: 'LOINC',
        targetCode: '6690-2',
        targetDisplay: 'Leukocytes [#/volume] in Blood by Automated count',
        equivalence: 'equal',
      });
    } else {
      setTermMappedResult({
        sourceSystem: 'LOCAL_LAB',
        sourceCode: termSourceCode,
        targetSystem: 'LOINC',
        targetCode: '718-7',
        targetDisplay: 'Hemoglobin [Mass/volume] in Blood',
        equivalence: 'equal',
      });
    }
  };

  const handleApprovePacket = (id: string) => {
    setQuarantinedPackets((prev) => prev.filter((p) => p.id !== id));
    showToast({
      type: 'success',
      title: 'Pathologist Sign-Off Verified',
      message: `Diagnostic telemetry ${id} approved. Released directly to patient medical chart.`,
    });
  };

  const handleReplayDLQ = (id: string) => {
    setDlqJobs((prev) => prev.map((j) => (j.id === id ? { ...j, status: 'replayed_success' } : j)));
    showToast({
      type: 'success',
      title: 'Dead-Letter Message Replayed',
      message: `Payload ${id} requeued to transactional outbox worker.`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header telemetry ribbon */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 rounded-2xl p-6 text-white shadow-md border border-teal-900/40">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <div className="flex items-center space-x-2 text-teal-400 font-semibold text-xs mb-1">
              <Radio className="w-4 h-4 animate-pulse" />
              <span>Healthcare Interoperability Engine · Standards-Based Integration Gateway</span>
            </div>
            <h2 className="text-xl font-bold tracking-tight">HL7, FHIR, DICOM, LIS & Medical Device Center</h2>
            <p className="text-xs text-slate-300 max-w-2xl mt-1">
              Bi-directional clinical data exchange complying with HL7 v2.5.1, FHIR R4, DICOMweb, ASTM 1394-97, Ayushman Bharat Digital Mission (ABDM), and National Health Claims Exchange (NHCX).
            </p>
          </div>

          <div className="flex flex-wrap gap-2 text-xs">
            <span className="px-3 py-1.5 rounded-lg bg-teal-900/60 border border-teal-500/40 font-mono text-teal-200 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
              <span>FHIR R4.0.1 Active</span>
            </span>
            <span className="px-3 py-1.5 rounded-lg bg-teal-900/60 border border-teal-500/40 font-mono text-teal-200 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
              <span>HL7 MLLP Gateway Online</span>
            </span>
            <span className="px-3 py-1.5 rounded-lg bg-teal-900/60 border border-teal-500/40 font-mono text-teal-200 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
              <span>DICOMweb PACS Ready</span>
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs font-semibold">
        {[
          { id: 'hl7', label: '1. HL7 v2 Messaging' },
          { id: 'fhir', label: '2. FHIR R4 APIs' },
          { id: 'dicom', label: '3. DICOM PACS & MWL' },
          { id: 'devices', label: '4. LIS & Medical Devices' },
          { id: 'terminology', label: '5. Terminology (LOINC / SNOMED)' },
          { id: 'insurance', label: '6. Insurance & NHCX Claims' },
          { id: 'dlq', label: `7. Dead-Letter Queue (${dlqJobs.filter((j) => j.status === 'pending').length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as any)}
            className={`px-3 py-2 rounded-xl transition whitespace-nowrap ${
              activeSubTab === tab.id
                ? 'bg-teal-700 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* SUB-TAB 1: HL7 v2 MESSAGING */}
      {activeSubTab === 'hl7' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">HL7 v2 Inbound Message Receiver</h3>
                <p className="text-slate-500 text-[11px]">Paste pipe-delimited message (ADT, ORM, ORU, SIU) to verify parsing & ACK.</p>
              </div>
              <Badge variant="success" size="sm">MLLP / HTTP</Badge>
            </div>

            <textarea
              value={hl7Input}
              onChange={(e) => setHl7Input(e.target.value)}
              rows={8}
              className="w-full font-mono text-[11px] p-3 rounded-xl border border-slate-300 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />

            <Button variant="primary" size="sm" onClick={handleTestHL7Ingest}>
              <Send className="w-3.5 h-3.5 mr-1.5" />
              <span>Simulate Inbound Transmission</span>
            </Button>

            {hl7AckOutput && (
              <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
                <span className="font-bold text-emerald-900 text-[11px] flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  Outbound Acknowledgement (ACK):
                </span>
                <pre className="font-mono text-[10px] text-emerald-800 whitespace-pre-wrap">{hl7AckOutput}</pre>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-3">Supported HL7 Event Categories</h3>
            <div className="space-y-3">
              {[
                { type: 'ADT^A01 / ADT^A08', name: 'Admission, Transfer & Demographics Update', desc: 'Syncs patient admission bed and demographic changes.' },
                { type: 'ORM^O01', name: 'General Diagnostic Order Message', desc: 'Transmits laboratory and imaging test requisitions.' },
                { type: 'ORU^R01', name: 'Observation & Diagnostic Results Message', desc: 'Ingests clinical analyte values, reference ranges, and flags.' },
                { type: 'SIU^S12', name: 'Notification of New Appointment Booking', desc: 'Schedules outpatient consultations across connected clinics.' },
                { type: 'MDM^T02', name: 'Medical Document Notification', desc: 'Exchanges signed clinical discharge summaries and notes.' },
              ].map((h) => (
                <div key={h.type} className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 flex justify-between items-center">
                  <div>
                    <span className="font-mono font-bold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded text-[10px]">{h.type}</span>
                    <div className="font-bold text-slate-800 mt-1">{h.name}</div>
                    <p className="text-slate-500 text-[11px]">{h.desc}</p>
                  </div>
                  <Badge variant="info" size="sm">Active</Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: FHIR R4 APIS */}
      {activeSubTab === 'fhir' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6 text-xs">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">FHIR R4 Standardized Resource Endpoints</h3>
              <p className="text-slate-500 text-[11px]">Conforms to HL7 FHIR Release 4 and ABDM Health Information Exchange profiles.</p>
            </div>
            <a
              href="/api/v1/interop/fhir/$metadata"
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-lg bg-teal-50 text-teal-700 font-semibold border border-teal-200 flex items-center gap-1.5 hover:bg-teal-100 transition"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Inspect CapabilityStatement ($metadata)</span>
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { res: 'Patient', count: '1,420 Records', desc: 'Demographics, UHID, ABHA address & contacts' },
              { res: 'Encounter', count: '890 Visits', desc: 'OPD consults, IPD admissions & triage episodes' },
              { res: 'Observation', count: '3,150 Analytes', desc: 'Vital signs, lab bio-reference values & flags' },
              { res: 'DiagnosticReport', count: '740 Reports', desc: 'Hematology, biochemistry & radiology PACS' },
              { res: 'MedicationRequest', count: '2,110 Rx', desc: 'Prescriptions, dosages & frequencies' },
              { res: 'Coverage & Claim', count: '194 Filings', desc: 'Insurance policies, pre-auth & NHCX claims' },
            ].map((f) => (
              <div key={f.res} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-mono font-bold text-teal-800 text-sm">{f.res}</span>
                  <Badge variant="neutral" size="sm">{f.count}</Badge>
                </div>
                <p className="text-slate-600 text-[11px]">{f.desc}</p>
                <div className="pt-2 text-[10px] text-teal-600 font-mono">GET /api/v1/interop/fhir/{f.res}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: DICOM PACS & MWL */}
      {activeSubTab === 'dicom' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6 text-xs">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">DICOM Modality Worklist (MWL) & PACS Bridge</h3>
              <p className="text-slate-500 text-[11px]">Scheduled worklists for CT, MRI, Ultrasound, and X-Ray modalities with ambiguous study quarantine.</p>
            </div>
            <Badge variant="success" size="sm">DICOMweb Connected</Badge>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-400 uppercase font-semibold border-b border-slate-200 text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Accession #</th>
                  <th className="py-2.5 px-3">Patient ID</th>
                  <th className="py-2.5 px-3">Patient Name</th>
                  <th className="py-2.5 px-3">Modality</th>
                  <th className="py-2.5 px-3">Scheduled Procedure</th>
                  <th className="py-2.5 px-3">Scanner Station AET</th>
                  <th className="py-2.5 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {[
                  { acc: 'ACC-20261109-101', uhid: 'UHID-2026-9081', name: 'Arjun Verma', mod: 'CT', desc: 'CT Brain Plain - Emergency Trauma Evaluation', aet: 'CT_CONSOLE_01', status: 'SCHEDULED' },
                  { acc: 'ACC-20261109-102', uhid: 'UHID-2026-9082', name: 'Kavita Nair', mod: 'MR', desc: 'MRI Lumbar Spine with Contrast', aet: 'MR_CONSOLE_02', status: 'SCHEDULED' },
                  { acc: 'ACC-20261109-103', uhid: 'UHID-2026-9083', name: 'Rohan Mehra', mod: 'US', desc: 'Ultrasound Whole Abdomen', aet: 'US_PORTABLE_01', status: 'IN_PROGRESS' },
                ].map((row) => (
                  <tr key={row.acc} className="hover:bg-slate-50/60">
                    <td className="py-3 px-3 font-mono font-bold text-teal-700">{row.acc}</td>
                    <td className="py-3 px-3 font-mono">{row.uhid}</td>
                    <td className="py-3 px-3 font-semibold text-slate-900">{row.name}</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">{row.mod}</span>
                    </td>
                    <td className="py-3 px-3">{row.desc}</td>
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-500">{row.aet}</td>
                    <td className="py-3 px-3 text-right">
                      <Badge variant="success" size="sm">{row.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: LIS & MEDICAL DEVICES */}
      {activeSubTab === 'devices' && (
        <div className="space-y-6 text-xs">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Medical Device Telemetry & Pathologist Approval Gate</h3>
                <p className="text-slate-500 text-[11px]">
                  Clinical safety guardrail: Analyzer readings stay quarantined until authorized medical sign-off.
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-rose-700 bg-rose-50 border border-rose-200 font-bold text-[11px]">
                {quarantinedPackets.length} Panic Packets Pending Approval
              </span>
            </div>

            <div className="space-y-3">
              {quarantinedPackets.map((pkt) => (
                <div key={pkt.id} className="p-4 rounded-xl border border-rose-200 bg-rose-50/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <Cpu className="w-4 h-4 text-slate-700" />
                      <span className="font-bold text-slate-900">{pkt.device}</span>
                      <Badge variant="danger" size="sm">{pkt.flag}</Badge>
                      <span className="text-slate-400 text-[10px]">&bull; {pkt.time}</span>
                    </div>
                    <div className="text-slate-700 font-medium">
                      Specimen: <strong className="font-mono text-teal-800">{pkt.specimenBarcode}</strong> &bull; Analyte: <strong>{pkt.analyte}</strong>
                    </div>
                    <div className="text-[11px] text-slate-600">
                      Observed: <strong className="text-rose-700 font-bold text-sm">{pkt.value}</strong> (Reference Range: {pkt.refRange})
                    </div>
                  </div>

                  <Button variant="primary" size="sm" onClick={() => handleApprovePacket(pkt.id)}>
                    <Check className="w-3.5 h-3.5 mr-1" />
                    <span>Pathologist Sign-Off & Release</span>
                  </Button>
                </div>
              ))}

              {quarantinedPackets.length === 0 && (
                <div className="p-6 text-center text-slate-400 bg-slate-50 rounded-xl">
                  All medical device readings reviewed and approved. Zero pending quarantined panic packets.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 5: TERMINOLOGY MAPPING */}
      {activeSubTab === 'terminology' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6 text-xs">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-sm">Clinical Terminology & Code Concept Mapping</h3>
            <p className="text-slate-500 text-[11px]">Translates local hospital lab, charge, and diagnostic codes into universal LOINC, SNOMED-CT, and ICD-10 standards.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Local Laboratory Code</label>
              <input
                type="text"
                value={termSourceCode}
                onChange={(e) => setTermSourceCode(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-mono"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Target Universal System</label>
              <select className="w-full p-2.5 rounded-xl border border-slate-300 text-xs">
                <option value="LOINC">LOINC (Logical Observation Identifiers)</option>
                <option value="SNOMED_CT">SNOMED-CT (Clinical Terms)</option>
                <option value="ICD_10">ICD-10 (International Classification of Diseases)</option>
              </select>
            </div>
            <Button variant="primary" size="sm" onClick={handleMapTerminology}>
              <Search className="w-3.5 h-3.5 mr-1.5" />
              <span>Translate Concept</span>
            </Button>
          </div>

          {termMappedResult && (
            <div className="p-4 bg-teal-50/60 border border-teal-200 rounded-xl space-y-2">
              <span className="font-bold text-teal-900 text-xs">Concept Mapping Verified:</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-[11px]">
                <div>
                  <span className="text-slate-500 block">Source Code:</span>
                  <strong className="font-mono text-slate-800">{termMappedResult.sourceCode}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Target Standard:</span>
                  <strong className="font-mono text-teal-700">{termMappedResult.targetSystem} &bull; {termMappedResult.targetCode}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Universal Concept Display:</span>
                  <strong className="text-slate-800">{termMappedResult.targetDisplay}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Equivalence Relationship:</span>
                  <Badge variant="success" size="sm">{termMappedResult.equivalence}</Badge>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 6: INSURANCE & NHCX */}
      {activeSubTab === 'insurance' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6 text-xs">
          <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">National Health Claims Exchange (NHCX) & Insurance Adapters</h3>
              <p className="text-slate-500 text-[11px]">Automated Cashless Pre-Authorizations, Itemized Tariff Submissions, and IRDAI Claim Adjudication.</p>
            </div>
            <Badge variant="success" size="sm">NHCX FHIR Gateway Live</Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
              <span className="text-slate-500">Connected Insurance Payers</span>
              <div className="text-2xl font-bold text-slate-900 mt-1">24 Payers</div>
              <span className="text-[11px] text-teal-600">Star Health, HDFC ERGO, ICICI Lombard, PM-JAY</span>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
              <span className="text-slate-500">Auto-Adjudication Rate</span>
              <div className="text-2xl font-bold text-teal-700 mt-1">91.4%</div>
              <span className="text-[11px] text-teal-600">Average approval time: 14 mins</span>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
              <span className="text-slate-500">Total Claims Settled (30d)</span>
              <div className="text-2xl font-bold text-slate-900 mt-1">₹ 42.8 Lakhs</div>
              <span className="text-[11px] text-slate-500">Zero duplicate claim rejections</span>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 7: DEAD-LETTER QUEUE (DLQ) */}
      {activeSubTab === 'dlq' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4 text-xs">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Integration Dead-Letter Queue (DLQ) & Fault Tolerance</h3>
              <p className="text-slate-500 text-[11px]">Quarantines malformed messages, network drops, and schema errors with audit replaying.</p>
            </div>
          </div>

          <div className="space-y-3">
            {dlqJobs.map((job) => (
              <div key={job.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded text-[10px]">{job.subsystem}</span>
                    <strong className="text-slate-900">{job.identifier}</strong>
                    <Badge variant={job.status === 'replayed_success' ? 'success' : 'warning'} size="sm">
                      {job.status === 'replayed_success' ? 'Replayed' : 'Quarantined'}
                    </Badge>
                  </div>
                  <p className="text-slate-600 font-mono text-[11px]">{job.error}</p>
                  <div className="text-[10px] text-slate-400">Retry Count: {job.retries} of 5 max attempts</div>
                </div>

                {job.status === 'pending' && (
                  <Button variant="outline" size="sm" onClick={() => handleReplayDLQ(job.id)}>
                    <RotateCcw className="w-3.5 h-3.5 mr-1 text-teal-700" />
                    <span>Replay Message</span>
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
