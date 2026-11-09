import React, { useState } from 'react';
import {
  FlaskConical,
  Microscope,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  ShieldCheck,
  Activity,
  FileText,
  Clock,
  Search,
  UserCheck,
  Check,
  XCircle,
  TrendingUp,
  BarChart2,
  Bug,
  TestTube2
} from 'lucide-react';
import { Modal, Button, Input, Badge, useToast } from '../../components/ui';

interface SpecimenItem {
  id: string;
  accessionNumber: string;
  patientName: string;
  uhid: string;
  testName: string;
  department: string;
  container: string;
  collectionTime: string;
  status: 'COLLECTED' | 'RECEIVED' | 'IN_PROCESS' | 'TESTED' | 'AUTHORIZED' | 'REJECTED';
}

interface TestResultItem {
  id: string;
  accessionNumber: string;
  patientName: string;
  parameter: string;
  value: number;
  unit: string;
  refRange: string;
  flag: 'NORMAL' | 'ABNORMAL_HIGH' | 'ABNORMAL_LOW' | 'CRITICAL_PANIC';
  validationStatus: 'ENTERED' | 'TECHNICALLY_VALIDATED' | 'PATHOLOGIST_AUTHORIZED';
}

export const AdvancedLISHub: React.FC = () => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'accession' | 'results' | 'signoff' | 'critical' | 'microbio' | 'qc'>('accession');

  // Specimen Accessioning State
  const [specimens, setSpecimens] = useState<SpecimenItem[]>([
    {
      id: 'spec-01',
      accessionNumber: 'ACC-2026-90412',
      patientName: 'Rohan Deshmukh',
      uhid: 'UHID-2026-4410',
      testName: 'Complete Blood Count (CBC) with Diff',
      department: 'Haematology',
      container: 'EDTA Lavender Top',
      collectionTime: '20 mins ago',
      status: 'RECEIVED',
    },
    {
      id: 'spec-02',
      accessionNumber: 'ACC-2026-90413',
      patientName: 'Meenakshi Iyer',
      uhid: 'UHID-2026-3829',
      testName: 'Renal Function Test (K+, Creatinine, Urea)',
      department: 'Clinical Biochemistry',
      container: 'SST Gel Gold Top',
      collectionTime: '35 mins ago',
      status: 'TESTED',
    },
    {
      id: 'spec-03',
      accessionNumber: 'ACC-2026-90414',
      patientName: 'Karan Mehra',
      uhid: 'UHID-2026-1920',
      testName: 'Blood Culture & Sensitivity',
      department: 'Microbiology',
      container: 'Blood Culture Bottle (Aerobic)',
      collectionTime: '1 hour ago',
      status: 'IN_PROCESS',
    },
  ]);

  // Results State
  const [resultsList, setResultsList] = useState<TestResultItem[]>([
    {
      id: 'res-01',
      accessionNumber: 'ACC-2026-90413',
      patientName: 'Meenakshi Iyer',
      parameter: 'Serum Potassium (K+)',
      value: 6.9,
      unit: 'mmol/L',
      refRange: '3.5 - 5.1',
      flag: 'CRITICAL_PANIC',
      validationStatus: 'ENTERED',
    },
    {
      id: 'res-02',
      accessionNumber: 'ACC-2026-90413',
      patientName: 'Meenakshi Iyer',
      parameter: 'Serum Creatinine',
      value: 2.8,
      unit: 'mg/dL',
      refRange: '0.6 - 1.2',
      flag: 'ABNORMAL_HIGH',
      validationStatus: 'TECHNICALLY_VALIDATED',
    },
    {
      id: 'res-03',
      accessionNumber: 'ACC-2026-90412',
      patientName: 'Rohan Deshmukh',
      parameter: 'Hemoglobin (Hb)',
      value: 13.8,
      unit: 'g/dL',
      refRange: '13.0 - 17.0',
      flag: 'NORMAL',
      validationStatus: 'TECHNICALLY_VALIDATED',
    },
  ]);

  // Specimen Rejection Modal
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedSpecimenForReject, setSelectedSpecimenForReject] = useState<SpecimenItem | null>(null);
  const [rejectReason, setRejectReason] = useState('Hemolyzed sample (Gross hemolysis +++)');

  // QC Measurement Form
  const [qcTargetMean, setQcTargetMean] = useState('140.0');
  const [qcSD, setQcSD] = useState('2.5');
  const [qcMeasured, setQcMeasured] = useState('146.5');
  const [qcWestgardResult, setQcWestgardResult] = useState<any>(null);

  const handleOpenRejectModal = (spec: SpecimenItem) => {
    setSelectedSpecimenForReject(spec);
    setShowRejectModal(true);
  };

  const handleConfirmRejection = () => {
    if (!selectedSpecimenForReject) return;
    setSpecimens(
      specimens.map((s) =>
        s.id === selectedSpecimenForReject.id ? { ...s, status: 'REJECTED' } : s
      )
    );
    setShowRejectModal(false);
    showToast({
      type: 'warning',
      title: 'Specimen Rejected & Recollection Ticket Created',
      message: `${selectedSpecimenForReject.accessionNumber} rejected for reason: ${rejectReason}. Ward notified for redraw.`,
    });
  };

  const handleValidateTechnologist = (id: string) => {
    setResultsList(
      resultsList.map((r) => (r.id === id ? { ...r, validationStatus: 'TECHNICALLY_VALIDATED' } : r))
    );
    showToast({
      type: 'success',
      title: 'Technical Validation Signed',
      message: 'Technologist technical verification complete. Forwarded to Pathologist queue.',
    });
  };

  const handleAuthorizePathologist = (id: string) => {
    setResultsList(
      resultsList.map((r) => (r.id === id ? { ...r, validationStatus: 'PATHOLOGIST_AUTHORIZED' } : r))
    );
    showToast({
      type: 'success',
      title: 'Report Medically Authorized',
      message: 'Signed with Pathologist Digital Signature. Report released to Doctor & Patient portal.',
    });
  };

  const handleRunQcCalculation = (e: React.FormEvent) => {
    e.preventDefault();
    const mean = Number(qcTargetMean);
    const sd = Number(qcSD);
    const val = Number(qcMeasured);
    const zScore = Number(((val - mean) / sd).toFixed(2));

    let violation = 'None (In Control)';
    let status: 'IN_CONTROL' | 'WARNING' | 'OUT_OF_CONTROL' = 'IN_CONTROL';

    if (Math.abs(zScore) > 3.0) {
      violation = '1_3S Rule Violation (Gross Error)';
      status = 'OUT_OF_CONTROL';
    } else if (Math.abs(zScore) > 2.0) {
      violation = '1_2S Warning (Inspect Calibration)';
      status = 'WARNING';
    }

    setQcWestgardResult({ zScore, violation, status });
    showToast({
      type: status === 'OUT_OF_CONTROL' ? 'error' : status === 'WARNING' ? 'warning' : 'success',
      title: `Westgard IQC: ${status}`,
      message: `Z-Score: ${zScore} | ${violation}`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-xl p-6 shadow-md">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-blue-500/30 text-blue-200 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-blue-400/30">
                CENTRAL DIAGNOSTIC LABORATORY (NABL / ISO 15189 READY)
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Enterprise Laboratory Information System (LIS)</h1>
            <p className="text-sm text-blue-100/80">
              Accessioning, analyzer automation, two-tier validation, microbiology cultures & Westgard IQC.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-4 py-2 text-center">
              <span className="text-xs text-blue-200 block">Active Accessions</span>
              <span className="text-xl font-bold">{specimens.length} Samples</span>
            </div>
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-4 py-2 text-center">
              <span className="text-xs text-red-200 block">Critical Alerts</span>
              <span className="text-xl font-bold text-red-400">1 Panic Flag</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 bg-white rounded-t-xl px-4 overflow-x-auto shadow-sm">
        <button
          onClick={() => setActiveTab('accession')}
          className={`flex items-center gap-2 py-3 px-4 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'accession'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <QrCode className="w-4 h-4" /> Accessioning & Barcode
        </button>
        <button
          onClick={() => setActiveTab('results')}
          className={`flex items-center gap-2 py-3 px-4 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'results'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Activity className="w-4 h-4" /> Analyzer Telemetry & Results
        </button>
        <button
          onClick={() => setActiveTab('signoff')}
          className={`flex items-center gap-2 py-3 px-4 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'signoff'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <ShieldCheck className="w-4 h-4" /> Pathologist Sign-Off Gate
        </button>
        <button
          onClick={() => setActiveTab('critical')}
          className={`flex items-center gap-2 py-3 px-4 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'critical'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <AlertTriangle className="w-4 h-4" /> Panic Value Alert Center
        </button>
        <button
          onClick={() => setActiveTab('microbio')}
          className={`flex items-center gap-2 py-3 px-4 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'microbio'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Bug className="w-4 h-4" /> Microbiology & AST
        </button>
        <button
          onClick={() => setActiveTab('qc')}
          className={`flex items-center gap-2 py-3 px-4 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'qc'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <BarChart2 className="w-4 h-4" /> Westgard IQC & Levey-Jennings
        </button>
      </div>

      {/* Tab 1: Accessioning & Specimen Tracker */}
      {activeTab === 'accession' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-bold text-slate-900">Specimen Accessioning Worklist</h2>
            <Button
              variant="primary"
              size="sm"
              onClick={() =>
                showToast({
                  type: 'success',
                  title: 'New Accession Generated',
                  message: 'Printed 2D barcode label for SST Gold Serum tube.',
                })
              }
            >
              Print Accession Barcodes
            </Button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Accession / Barcode</th>
                  <th className="py-3 px-3">Patient Details</th>
                  <th className="py-3 px-3">Investigation & Dept</th>
                  <th className="py-3 px-3">Container Tube</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-4 text-right">Quality Inspection</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {specimens.map((spec) => (
                  <tr key={spec.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4 font-mono font-bold text-blue-900">
                      {spec.accessionNumber}
                      <span className="block text-[11px] font-normal text-slate-500">{spec.collectionTime}</span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-bold text-slate-900 block">{spec.patientName}</span>
                      <span className="text-[11px] text-slate-400 font-mono">{spec.uhid}</span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-semibold text-slate-800 block">{spec.testName}</span>
                      <span className="text-[11px] text-blue-600 font-medium">{spec.department}</span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-xs font-medium">
                        {spec.container}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <Badge
                        variant={
                          spec.status === 'AUTHORIZED'
                            ? 'success'
                            : spec.status === 'REJECTED'
                            ? 'danger'
                            : spec.status === 'TESTED'
                            ? 'info'
                            : 'warning'
                        }
                      >
                        {spec.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {spec.status !== 'REJECTED' ? (
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleOpenRejectModal(spec)}
                        >
                          Reject Sample
                        </Button>
                      ) : (
                        <span className="text-red-600 text-xs font-semibold">Recollection Pending</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Analyzer Telemetry & Results */}
      {activeTab === 'results' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-bold text-slate-900">Automated Analyzer Results Staging & Technical Verification</h2>
            <Badge variant="info">Live Feed: Sysmex XN-1000 & Roche Cobas c311 Connected</Badge>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Accession</th>
                  <th className="py-3 px-3">Patient</th>
                  <th className="py-3 px-3">Parameter Analysed</th>
                  <th className="py-3 px-3">Measured Value</th>
                  <th className="py-3 px-3">Ref Range</th>
                  <th className="py-3 px-3">Clinical Flag</th>
                  <th className="py-3 px-4 text-right">Technologist Sign</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {resultsList.map((res) => (
                  <tr key={res.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4 font-mono font-bold text-blue-900">{res.accessionNumber}</td>
                    <td className="py-3 px-3 font-semibold text-slate-900">{res.patientName}</td>
                    <td className="py-3 px-3 font-medium text-slate-800">{res.parameter}</td>
                    <td className="py-3 px-3 font-bold text-slate-900">
                      {res.value} {res.unit}
                    </td>
                    <td className="py-3 px-3 text-slate-500">{res.refRange}</td>
                    <td className="py-3 px-3">
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded ${
                          res.flag === 'CRITICAL_PANIC'
                            ? 'bg-red-100 text-red-800 border border-red-300 animate-pulse'
                            : res.flag === 'ABNORMAL_HIGH' || res.flag === 'ABNORMAL_LOW'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {res.flag}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {res.validationStatus === 'ENTERED' ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleValidateTechnologist(res.id)}
                        >
                          Technologist Validate
                        </Button>
                      ) : (
                        <Badge variant="success">Technically Verified</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Pathologist Sign-Off Gate */}
      {activeTab === 'signoff' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-bold text-slate-900">Pathologist Medical Authorization Gate</h2>
            <Badge variant="warning">Digital Signature Authentication Mandated</Badge>
          </div>

          <div className="space-y-3">
            {resultsList.map((res) => (
              <div
                key={res.id}
                className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded">
                      {res.accessionNumber}
                    </span>
                    <span className="text-xs text-slate-600 font-semibold">{res.patientName}</span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-base">
                    {res.parameter}: {res.value} {res.unit}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Biological Reference: {res.refRange} | Status: <strong>{res.validationStatus}</strong>
                  </p>
                </div>

                <div>
                  {res.validationStatus === 'PATHOLOGIST_AUTHORIZED' ? (
                    <Badge variant="success">Medically Authorized & Released</Badge>
                  ) : (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleAuthorizePathologist(res.id)}
                    >
                      Authorize & Apply Digital Seal
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Panic Value Alert Center */}
      {activeTab === 'critical' && (
        <div className="space-y-4">
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-red-900">Critical Laboratory Value Notification Policy</h3>
              <p className="text-xs text-red-800 mt-0.5">
                Panic values represent life-threatening physiological abnormalities requiring immediate verbal telephone read-back confirmation within 15 minutes.
              </p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <div>
                <span className="text-xs font-bold text-red-800 bg-red-100 px-2.5 py-0.5 rounded">
                  PANIC ALERT — POTASSIUM 6.9 mmol/L (Severe Hyperkalemia)
                </span>
                <h4 className="text-base font-bold text-slate-900 mt-2">Patient: Meenakshi Iyer (UHID-2026-3829)</h4>
                <p className="text-xs text-slate-600">Location: Ward 4 Bed 12 | Attending Physician: Dr. Rajesh Sharma</p>
              </div>
              <Button
                variant="danger"
                onClick={() =>
                  showToast({
                    type: 'success',
                    title: 'Telephone Read-Back Confirmed',
                    message: 'Dr. Rajesh Sharma notified verbally at 16:32 IST. Read-back verified.',
                  })
                }
              >
                Log Verbal Read-Back Confirmed
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Microbiology & AST */}
      {activeTab === 'microbio' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Bug className="w-5 h-5 text-blue-600" /> Blood Culture Isolation
            </h3>
            <div className="space-y-2 text-xs">
              <p><strong>Accession:</strong> ACC-2026-90414 (Karan Mehra)</p>
              <p><strong>Incubation Time:</strong> 48 Hours Aerobic</p>
              <p><strong>Organism Isolated:</strong> <em>Escherichia coli</em> (ESBL Positive)</p>
              <p><strong>Colony Count:</strong> &gt; 100,000 CFU/mL</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 mb-3">Antimicrobial Susceptibility Testing (AST)</h3>
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-700 uppercase font-semibold">
                <tr>
                  <th className="py-2 px-3">Antibiotic Agent</th>
                  <th className="py-2 px-3">MIC (mcg/mL)</th>
                  <th className="py-2 px-3">Interpretation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-2 px-3 font-semibold">Meropenem</td>
                  <td className="py-2 px-3">&lt;= 0.5</td>
                  <td className="py-2 px-3"><span className="text-emerald-700 font-bold">SENSITIVE</span></td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-semibold">Amikacin</td>
                  <td className="py-2 px-3">&lt;= 4.0</td>
                  <td className="py-2 px-3"><span className="text-emerald-700 font-bold">SENSITIVE</span></td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-semibold">Ciprofloxacin</td>
                  <td className="py-2 px-3">&gt;= 8.0</td>
                  <td className="py-2 px-3"><span className="text-red-700 font-bold">RESISTANT</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 6: Westgard IQC */}
      {activeTab === 'qc' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-blue-600" /> Internal Quality Control (IQC) Entry
            </h3>
            <form onSubmit={handleRunQcCalculation} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700">Target Mean (μ)</label>
                <Input value={qcTargetMean} onChange={(e) => setQcTargetMean(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700">Standard Deviation (1σ)</label>
                <Input value={qcSD} onChange={(e) => setQcSD(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700">Measured Value Today</label>
                <Input value={qcMeasured} onChange={(e) => setQcMeasured(e.target.value)} />
              </div>
              <Button type="submit" variant="primary" className="w-full mt-2">
                Evaluate Westgard Rules & Plot
              </Button>
            </form>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center items-center text-center">
            {qcWestgardResult ? (
              <div className="space-y-2">
                <span
                  className={`text-xs font-bold px-3 py-1 rounded-full ${
                    qcWestgardResult.status === 'OUT_OF_CONTROL'
                      ? 'bg-red-100 text-red-800'
                      : qcWestgardResult.status === 'WARNING'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  Status: {qcWestgardResult.status}
                </span>
                <h4 className="text-3xl font-extrabold text-slate-900 mt-2">Z-Score: {qcWestgardResult.zScore}</h4>
                <p className="text-xs text-slate-600">{qcWestgardResult.violation}</p>
              </div>
            ) : (
              <p className="text-xs text-slate-400">Enter daily control measurement to run automated Westgard rule evaluation.</p>
            )}
          </div>
        </div>
      )}

      {/* Specimen Rejection Modal */}
      {showRejectModal && selectedSpecimenForReject && (
        <Modal
          isOpen={showRejectModal}
          onClose={() => setShowRejectModal(false)}
          title="Specimen Quality Rejection & Recollection"
          maxWidth="md"
        >
          <div className="space-y-4">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900">
              <p>
                Rejecting accession <strong>{selectedSpecimenForReject.accessionNumber}</strong> ({selectedSpecimenForReject.testName}) will flag the specimen and automatically dispatch a recollection request to phlebotomy.
              </p>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Root Cause Rejection Reason</label>
              <select
                className="w-full text-xs border border-slate-300 rounded-md p-2 bg-white"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              >
                <option value="Hemolyzed sample (Gross hemolysis +++)">Hemolyzed sample (Gross hemolysis +++)</option>
                <option value="Clotted whole blood specimen in EDTA">Clotted whole blood specimen in EDTA</option>
                <option value="Quantity Not Sufficient (QNS)">Quantity Not Sufficient (QNS)</option>
                <option value="Incorrect collection container / tube">Incorrect collection container / tube</option>
                <option value="Specimen leaking / unsealed container">Specimen leaking / unsealed container</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setShowRejectModal(false)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={handleConfirmRejection}>
                Confirm Rejection & Dispatch Ticket
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

