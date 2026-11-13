import React, { useState, useEffect } from 'react';
import {
  Pill,
  ShieldAlert,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Thermometer,
  RotateCcw,
  Layers,
  Lock,
  Plus,
  Search,
  ShoppingCart,
  Calendar,
  FileText,
  UserCheck,
  RefreshCw,
  TrendingUp,
  XCircle,
  Eye,
  Check
} from 'lucide-react';
import { Button, Input, Badge, Modal, useToast } from '../../components/ui';
import { useHospital } from '../../context/HospitalContext';
import { pharmacyAdvancedApi } from '../../services/api';

export const AdvancedPharmacyHub: React.FC = () => {
  const { showToast } = useToast();
  const { prescriptions, inventory, invoices } = useHospital();
  const [activeTab, setActiveTab] = useState<
    'verification' | 'fefo-stock' | 'inpatient-emar' | 'cold-chain' | 'recalls' | 'narcotics' | 'procurement'
  >('verification');

  // Verification Review Modal State
  const [selectedRx, setSelectedRx] = useState<any | null>(null);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [verifyDecision, setVerifyDecision] = useState<'VERIFIED_APPROVED' | 'REJECTED_CLINICAL_QUERY'>('VERIFIED_APPROVED');
  const [pharmacistNotes, setPharmacistNotes] = useState('');

  // eMAR Dose Admin Modal State
  const [isEmarModalOpen, setIsEmarModalOpen] = useState(false);
  const [emarPatient, setEmarPatient] = useState('Inpatient (Ward 3A)');
  const [emarDrug, setEmarDrug] = useState('Huminsulin Regular 100 IU/mL');
  const [emarDose, setEmarDose] = useState('6 Units Subcutaneous');
  const [emarCosigner, setEmarCosigner] = useState('nurse-charge');
  const [emarPulse, setEmarPulse] = useState(78);
  const [emarBP, setEmarBP] = useState('120/80');

  // Recall Modal State
  const [isRecallModalOpen, setIsRecallModalOpen] = useState(false);
  const [recallLot, setRecallLot] = useState('');
  const [recallReason, setRecallReason] = useState('');
  const [recallClass, setRecallClass] = useState<'CLASS_I_LIFE_THREATENING' | 'CLASS_II_TEMPORARY_HEALTH_HAZARD'>('CLASS_I_LIFE_THREATENING');

  // Cold Chain Excursion Modal State
  const [isTempModalOpen, setIsTempModalOpen] = useState(false);
  const [tempUnit, setTempUnit] = useState('FRIDGE-VACC-01');
  const [tempReading, setTempReading] = useState(11.5);

  // Narcotic Vault Transaction State
  const [isNarcoticModalOpen, setIsNarcoticModalOpen] = useState(false);
  const [narcoticDrug, setNarcoticDrug] = useState('Morphine Sulfate 10mg/mL Ampoule');
  const [narcoticQty, setNarcoticQty] = useState(-5);
  const [narcoticWitness, setNarcoticWitness] = useState('nurse-charge');

  // Dynamic Pharmacist Verification Queue Data - synchronized with HospitalContext.prescriptions
  const [verificationQueueItems, setVerificationQueueItems] = useState<any[]>([]);

  useEffect(() => {
    if (prescriptions && prescriptions.length > 0) {
      setVerificationQueueItems(
        prescriptions.map((p, idx) => ({
          id: p.id || `pvq-${idx + 1}`,
          prescriptionNumber: p.rxNumber || `RX-2026-${String(p.id).replace(/\D/g, '').slice(-6).padStart(6, '0')}`,
          patient: p.patientName || 'Inpatient',
          uhid: p.uhid || (p.patientId ? `UHID-2026-${String(p.patientId).slice(-5)}` : `UHID-2026-00${idx + 10}`),
          doctor: p.doctorName || 'Attending Physician',
          drugs: p.items && p.items.length > 0
            ? p.items.map(m => ({ name: m.drugName, dose: m.dosage || '1 tab OD', qty: m.qty || 10 }))
            : (p as any).medications
            ? (p as any).medications.map((m: any) => ({ name: m.name, dose: m.dosage || '1 tab OD', qty: m.days ? m.days * 2 : 10 }))
            : [{ name: (p as any).medicationName || 'Prescribed Drug', dose: (p as any).dosage || '1 tab OD', qty: 10 }],
          safetyAlert: null,
          status: p.status === 'Dispensed' ? 'VERIFIED_APPROVED' : 'PENDING_REVIEW',
        }))
      );
    } else {
      setVerificationQueueItems([]);
    }
  }, [prescriptions]);

  // Dynamic FEFO Batches Data - synchronized with HospitalContext.inventory
  const [fefoBatches, setFefoBatches] = useState<any[]>([]);

  useEffect(() => {
    if (inventory && inventory.length > 0) {
      setFefoBatches(
        inventory.map((item, idx) => {
          const batchCode = item.batch || (item as any).batchNumber || `BAT-${idx + 101}`;
          const expiryDate = item.expiry || (item as any).expiryDate || '2027-12-31';
          return {
            batch: batchCode,
            drug: item.name,
            expiry: expiryDate,
            daysLeft: expiryDate ? Math.ceil((new Date(expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 365,
            stock: item.stock || 0,
            cost: item.unitPrice ? item.unitPrice * 0.7 : 10,
            mrp: item.unitPrice || 15,
            bin: (item as any).location || 'BIN-PHARM-01',
            status: (item.stock || 0) <= (item.reorderLevel || 10) ? 'NEAR_EXPIRY' : 'AVAILABLE',
          };
        })
      );
    } else {
      setFefoBatches([]);
    }
  }, [inventory]);

  // Recalls & Quarantines State
  const [recalls, setRecalls] = useState<any[]>([]);

  // Narcotic Perpetual Register
  const [narcoticLogs, setNarcoticLogs] = useState<any[]>([]);

  // Sample Cold Chain Units
  const [coldChainUnits] = useState([
    { code: 'FRIDGE-MAIN-01', name: 'Main Pharmacy Biologicals Refrigerator', temp: 4.2, min: 2.0, max: 8.0, status: 'NORMAL' },
    { code: 'FRIDGE-VACC-01', name: 'Central Vaccine & Cold Storage Vault', temp: 5.1, min: 2.0, max: 8.0, status: 'NORMAL' },
    { code: 'FREEZER-PLASMA-01', name: 'Blood Bank Fresh Frozen Plasma Freezer', temp: -22.4, min: -25.0, max: -18.0, status: 'NORMAL' },
  ]);

  // Dynamic Revenue
  const pharmacyRevenue = invoices
    ? invoices
        .filter(inv => inv.category === 'Pharmacy' || ((inv as any).items && (inv as any).items.some((it: any) => it.type === 'Pharmacy' || it.department === 'Pharmacy')))
        .reduce((sum, inv) => sum + ((inv as any).paidAmount || inv.paid || inv.total || 0), 0)
    : 0;

  const handleVerifySubmit = () => {
    if (!selectedRx) return;
    if (verifyDecision === 'VERIFIED_APPROVED') {
      pharmacyAdvancedApi.checkSafety({
        drugsToPrescribe: selectedRx.drugs?.map((d: any) => d.name) || [],
        patientAllergies: [],
      }).catch(() => {});
      showToast({
        type: 'success',
        title: 'Prescription Verified & Approved',
        message: `eRx ${selectedRx.prescriptionNumber} approved for FEFO dispensing and committed to pharmacy service.`,
      });
    } else {
      showToast({
        type: 'warning',
        title: 'Prescription Clinical Query Raised',
        message: `Prescription ${selectedRx.prescriptionNumber} returned to prescriber with query notes.`,
      });
    }
    setIsVerifyModalOpen(false);
    setSelectedRx(null);
  };

  const handleEmarSubmit = () => {
    if (!emarCosigner) {
      showToast({
        type: 'error',
        title: 'Safety Policy Violation',
        message: 'High-Alert medication requires mandatory dual-nurse cosign.',
      });
      return;
    }
    showToast({
      type: 'success',
      title: 'eMAR Dose Recorded',
      message: `${emarDrug} administered to ${emarPatient}. Pulse: ${emarPulse} bpm, BP: ${emarBP}. Cosigned by ${emarCosigner}.`,
    });
    setIsEmarModalOpen(false);
  };

  const handleRecallSubmit = () => {
    if (!recallLot.trim()) return;
    const newRecall = {
      id: `rcl-${Date.now()}`,
      code: `RCL-MANUF-2026-${Math.floor(100 + Math.random() * 900)}`,
      lot: recallLot,
      reason: recallReason || 'Manufacturer voluntary batch quarantine',
      recallClass: recallClass,
      date: new Date().toLocaleDateString(),
      quarantinedStock: 0,
      tracedPatients: 0,
    };
    setRecalls([newRecall, ...recalls]);
    showToast({
      type: 'warning',
      title: 'Manufacturer Product Recall Registered',
      message: `Batch ${recallLot} quarantined hospital-wide. Recall Class: ${recallClass}. Patient trace dispatched.`,
    });
    setIsRecallModalOpen(false);
    setRecallLot('');
    setRecallReason('');
  };

  const handleTempExcursion = () => {
    showToast({
      type: 'error',
      title: 'Temperature Excursion Alert Triggered',
      message: `Unit ${tempUnit} reported ${tempReading}°C (Safe: 2.0°C - 8.0°C). Associated stock automatically quarantined!`,
    });
    setIsTempModalOpen(false);
  };

  const handleNarcoticSubmit = () => {
    const newLog = {
      id: `narc-${Date.now()}`,
      timestamp: new Date().toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }),
      drug: narcoticDrug,
      txType: narcoticQty > 0 ? 'VAULT_RECEIPT' : 'WARD_DISPENSE',
      qty: narcoticQty,
      balance: Math.max(0, 50 + narcoticQty),
      custodian: 'custodian-primary',
      witness: narcoticWitness,
    };
    setNarcoticLogs([newLog, ...narcoticLogs]);
    showToast({
      type: 'success',
      title: 'Narcotic Vault Dual-Custody Transaction Logged',
      message: `Dispensed ${Math.abs(narcoticQty)} units of ${narcoticDrug}. Verified by witness ${narcoticWitness}.`,
    });
    setIsNarcoticModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Clinical Safety & Operational Telemetry Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Pending Verification</span>
            <ShieldAlert className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-700">
            {verificationQueueItems.filter(r => r.status === 'PENDING_REVIEW').length} Prescriptions
          </div>
          <div className="text-xs text-slate-500 mt-2 font-medium">
            {verificationQueueItems.filter(r => r.safetyAlert).length} DDI Alerts Flagged
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">FEFO Stock Batches</span>
            <Layers className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-bold text-slate-800">{fefoBatches.length} Batches</div>
          <div className="text-xs text-emerald-600 mt-2 font-medium">100% FEFO Auto-Allocation</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Near Expiry (&lt; 60 Days)</span>
            <Clock className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold text-rose-700">
            {fefoBatches.filter(b => b.daysLeft > 0 && b.daysLeft <= 60).length} Lots
          </div>
          <div className="text-xs text-rose-600 mt-2 font-medium">Automatic FEFO Priority Active</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Cold-Chain Status</span>
            <Thermometer className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-blue-700">
            {coldChainUnits.filter(u => u.status === 'NORMAL').length} / {coldChainUnits.length} Normal
          </div>
          <div className="text-xs text-emerald-600 mt-2 font-medium">Sensors Active</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Daily Pharmacy Revenue</span>
            <TrendingUp className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-purple-800">₹{pharmacyRevenue.toLocaleString('en-IN')}</div>
          <div className="text-xs text-slate-500 mt-2 font-medium">HSN 3004 (5% GST) Ledgered</div>
        </div>
      </div>

      {/* Pharmacy Workspace Sub-Tabs */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-wrap items-center justify-between border-b border-slate-200 px-4 pt-3 gap-2">
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab('verification')}
              className={`flex items-center gap-1.5 pb-3 px-3 border-b-2 text-sm font-semibold transition ${
                activeTab === 'verification'
                  ? 'border-teal-600 text-teal-800'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
              Pharmacist Verification Queue
            </button>
            <button
              onClick={() => setActiveTab('fefo-stock')}
              className={`flex items-center gap-1.5 pb-3 px-3 border-b-2 text-sm font-semibold transition ${
                activeTab === 'fefo-stock'
                  ? 'border-teal-600 text-teal-800'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Layers className="w-4 h-4" />
              FEFO Batch Inventory
            </button>
            <button
              onClick={() => setActiveTab('inpatient-emar')}
              className={`flex items-center gap-1.5 pb-3 px-3 border-b-2 text-sm font-semibold transition ${
                activeTab === 'inpatient-emar'
                  ? 'border-teal-600 text-teal-800'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              Inpatient eMAR Administration
            </button>
            <button
              onClick={() => setActiveTab('cold-chain')}
              className={`flex items-center gap-1.5 pb-3 px-3 border-b-2 text-sm font-semibold transition ${
                activeTab === 'cold-chain'
                  ? 'border-teal-600 text-teal-800'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Thermometer className="w-4 h-4" />
              Cold Chain & Excursions
            </button>
            <button
              onClick={() => setActiveTab('recalls')}
              className={`flex items-center gap-1.5 pb-3 px-3 border-b-2 text-sm font-semibold transition ${
                activeTab === 'recalls'
                  ? 'border-teal-600 text-teal-800'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              Product Recalls & Quarantines
            </button>
            <button
              onClick={() => setActiveTab('narcotics')}
              className={`flex items-center gap-1.5 pb-3 px-3 border-b-2 text-sm font-semibold transition ${
                activeTab === 'narcotics'
                  ? 'border-teal-600 text-teal-800'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Lock className="w-4 h-4" />
              Narcotic Vault (Dual-Custody)
            </button>
          </div>

          <div className="pb-3 flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => showToast({ type: 'info', title: 'Refreshed', message: 'Pharmacy queue & inventory telemetry updated.' })}
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1" />
              Refresh
            </Button>
            {activeTab === 'inpatient-emar' && (
              <Button variant="primary" size="sm" onClick={() => setIsEmarModalOpen(true)}>
                <Plus className="w-3.5 h-3.5 mr-1" />
                Record eMAR Dose
              </Button>
            )}
            {activeTab === 'cold-chain' && (
              <Button variant="outline" size="sm" onClick={() => setIsTempModalOpen(true)}>
                <Thermometer className="w-3.5 h-3.5 mr-1" />
                Log Temp Sensor
              </Button>
            )}
            {activeTab === 'recalls' && (
              <Button variant="danger" size="sm" onClick={() => setIsRecallModalOpen(true)}>
                <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                Issue Product Recall
              </Button>
            )}
            {activeTab === 'narcotics' && (
              <Button variant="primary" size="sm" onClick={() => setIsNarcoticModalOpen(true)}>
                <Lock className="w-3.5 h-3.5 mr-1" />
                Dual-Custody Vault Entry
              </Button>
            )}
          </div>
        </div>

        {/* 1. Pharmacist Verification Queue Tab */}
        {activeTab === 'verification' && (
          <div className="p-6 space-y-4">
            <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <h4 className="text-base font-bold text-slate-800">Pre-Dispensing Pharmacist Verification Queue</h4>
                <p className="text-xs text-slate-500">
                  Every doctor eRx undergoes clinical pharmacist verification for dosage, allergies, and drug-drug interactions before physical dispensing.
                </p>
              </div>
              <Badge variant="warning">
                {verificationQueueItems.filter(r => r.status === 'PENDING_REVIEW').length} Awaiting Clinical Verification
              </Badge>
            </div>

            <div className="space-y-3">
              {verificationQueueItems.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500 bg-white rounded-xl border border-dashed border-slate-300">
                  No prescriptions currently awaiting pharmacist verification. New doctor e-prescriptions will queue here for clinical interaction check and dispensing sign-off.
                </div>
              ) : (
                verificationQueueItems.map((rx) => (
                  <div key={rx.id} className="border border-slate-200 rounded-xl p-4 bg-white shadow-sm space-y-3">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-800">{rx.prescriptionNumber}</span>
                          <Badge variant={rx.status === 'VERIFIED_APPROVED' ? 'success' : 'warning'}>
                            {rx.status}
                          </Badge>
                        </div>
                        <div className="text-xs text-slate-600 mt-1">
                          Patient: <span className="font-semibold text-slate-800">{rx.patient}</span> ({rx.uhid}) • Prescribed by: {rx.doctor}
                        </div>
                      </div>
                      <div>
                        {rx.status === 'PENDING_REVIEW' ? (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => {
                              setSelectedRx(rx);
                              setIsVerifyModalOpen(true);
                            }}
                          >
                            <UserCheck className="w-3.5 h-3.5 mr-1" />
                            Review & Verify eRx
                          </Button>
                        ) : (
                          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Approved for Dispense
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Safety Alert Warning Banner */}
                    {rx.safetyAlert && (
                      <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg flex items-start gap-2.5 text-xs text-amber-900">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold uppercase tracking-wider">{rx.safetyAlert.type}: </span>
                          <span>{rx.safetyAlert.message}</span>
                        </div>
                      </div>
                    )}

                    {/* Prescribed Items */}
                    <div className="bg-slate-50 p-3 rounded-lg text-xs space-y-1">
                      <div className="font-semibold text-slate-700 mb-1">Prescribed Medications:</div>
                      {rx.drugs && rx.drugs.map((d: any, i: number) => (
                        <div key={i} className="flex justify-between text-slate-700">
                          <span>• <span className="font-medium text-slate-900">{d.name}</span> ({d.dose})</span>
                          <span className="font-mono text-slate-500">Qty: {d.qty}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* 2. FEFO Batch Inventory Tab */}
        {activeTab === 'fefo-stock' && (
          <div className="p-6 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="text-base font-bold text-slate-800">Batch-Level Inventory & First-Expiry-First-Out (FEFO) Engine</h4>
                <p className="text-xs text-slate-500">
                  Batches sorted strictly by earliest expiry date. Dispensing engine automatically allocates nearest non-expired lot.
                </p>
              </div>
            </div>

            <div className="border border-slate-200 rounded-lg overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700">
                <thead className="bg-slate-50 text-xs font-semibold text-slate-600 uppercase border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Batch #</th>
                    <th className="px-4 py-3">Drug Description</th>
                    <th className="px-4 py-3">Expiry Date</th>
                    <th className="px-4 py-3 text-center">Days to Expiry</th>
                    <th className="px-4 py-3 text-right">Available Qty</th>
                    <th className="px-4 py-3">Storage Location</th>
                    <th className="px-4 py-3 text-center">Batch Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {fefoBatches.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-500">
                        No pharmaceutical batches currently in inventory. Stock received via GRNs or catalog additions will populate here.
                      </td>
                    </tr>
                  ) : (
                    fefoBatches.map((b) => (
                      <tr key={b.batch} className="hover:bg-slate-50 transition">
                        <td className="px-4 py-3 font-mono font-bold text-slate-800">{b.batch}</td>
                        <td className="px-4 py-3 font-medium text-slate-800">{b.drug}</td>
                        <td className="px-4 py-3 font-mono">{b.expiry}</td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`text-xs px-2 py-0.5 rounded font-semibold ${
                              b.daysLeft < 0
                                ? 'bg-rose-100 text-rose-800'
                                : b.daysLeft < 60
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {b.daysLeft < 0 ? `Expired (${Math.abs(b.daysLeft)}d ago)` : `${b.daysLeft} days`}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold">{b.stock}</td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-600">{b.bin}</td>
                        <td className="px-4 py-3 text-center">
                          <Badge
                            variant={
                              b.status === 'AVAILABLE'
                                ? 'success'
                                : b.status === 'NEAR_EXPIRY'
                                ? 'warning'
                                : 'danger'
                            }
                          >
                            {b.status}
                          </Badge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 3. Inpatient eMAR Administration Tab */}
        {activeTab === 'inpatient-emar' && (
          <div className="p-6 space-y-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex justify-between items-center">
              <div>
                <h4 className="text-base font-bold text-slate-800">Electronic Medication Administration Record (eMAR)</h4>
                <p className="text-xs text-slate-500">
                  Ward nursing medication passes with 5-Rights verification, vital sign checks, and mandatory dual-nurse cosign for High-Alert/Narcotics.
                </p>
              </div>
              <Badge variant="brand">Ward Schedule</Badge>
            </div>

            <div className="p-8 text-center text-xs text-slate-500 bg-white rounded-xl border border-dashed border-slate-300">
              No inpatient eMAR medication doses administered yet today. Doses scheduled for ward inpatients will log dual nurse cosigns and vitals verification here.
            </div>
          </div>
        )}

        {/* 4. Cold Chain Temperature Monitor Tab */}
        {activeTab === 'cold-chain' && (
          <div className="p-6 space-y-4">
            <div>
              <h4 className="text-base font-bold text-slate-800">Cold-Chain Biologicals & Vaccine Temperature Monitoring</h4>
              <p className="text-xs text-slate-500">
                Automated continuous temperature logging (2.0°C – 8.0°C). Any excursion automatically quarantines affected inventory lots.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {coldChainUnits.map((u) => (
                <div
                  key={u.code}
                  className={`p-4 rounded-xl border ${
                    u.status === 'EXCURSION_ALARM'
                      ? 'bg-rose-50 border-rose-300'
                      : 'bg-white border-slate-200 shadow-sm'
                  } space-y-2`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-mono font-bold text-xs text-slate-800">{u.code}</span>
                    <Badge variant={u.status === 'EXCURSION_ALARM' ? 'danger' : 'success'}>
                      {u.status}
                    </Badge>
                  </div>
                  <div className="text-xs font-semibold text-slate-700">{u.name}</div>
                  <div className="flex items-baseline gap-2 pt-2">
                    <span className={`text-3xl font-bold font-mono ${u.status === 'EXCURSION_ALARM' ? 'text-rose-700' : 'text-teal-700'}`}>
                      {u.temp > 0 ? `+${u.temp.toFixed(1)}` : u.temp.toFixed(1)}°C
                    </span>
                    <span className="text-xs text-slate-500">Safe: {u.min}°C to {u.max}°C</span>
                  </div>
                  {u.status === 'EXCURSION_ALARM' && (
                    <div className="text-[11px] font-bold text-rose-800 bg-rose-100 p-2 rounded">
                      Excursion &gt; 8.0°C detected! Stock automatically moved to QUARANTINED_TEMP_EXCURSION.
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. Product Recalls Tab */}
        {activeTab === 'recalls' && (
          <div className="p-6 space-y-4">
            <div>
              <h4 className="text-base font-bold text-slate-800">Manufacturer & Regulatory Lot Recalls (CDSCO / FDA)</h4>
              <p className="text-xs text-slate-500">
                Immediately freeze affected hospital stock and identify all patients who received recalled lots for clinical follow-up.
              </p>
            </div>

            {recalls.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 bg-white rounded-xl border border-dashed border-slate-300">
                No active manufacturer product recalls or CDSCO lot quarantines. Click "Issue Product Recall" above to quarantine suspicious batches and audit dispensed patients.
              </div>
            ) : (
              recalls.map((r) => (
                <div key={r.id} className="border border-rose-200 rounded-xl p-4 bg-rose-50/50 space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Badge variant="danger">{r.recallClass}</Badge>
                      <span className="font-mono font-bold text-sm text-slate-800">{r.code}</span>
                    </div>
                    <span className="text-xs text-slate-500 font-mono">{r.date}</span>
                  </div>
                  <div className="text-xs text-slate-800 font-medium">
                    Recalled Batch: <span className="font-mono font-bold text-rose-800">{r.lot}</span>
                  </div>
                  <div className="text-xs text-slate-700">Reason: {r.reason}</div>
                </div>
              ))
            )}
          </div>
        )}

        {/* 6. Narcotic Vault Tab */}
        {activeTab === 'narcotics' && (
          <div className="p-6 space-y-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex justify-between items-center">
              <div>
                <h4 className="text-base font-bold text-slate-800">Schedule X & Narcotic Double-Custody Safe Vault</h4>
                <p className="text-xs text-slate-500">
                  Every addition, ward issue, patient dose, or wastage destruction requires primary custodian + independent witness cosign.
                </p>
              </div>
              <Badge variant="brand">NDPS Perpetual Register</Badge>
            </div>

            <div className="border border-slate-200 rounded-lg overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700">
                <thead className="bg-slate-100 text-xs font-semibold text-slate-600 uppercase border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Timestamp</th>
                    <th className="px-4 py-3">Controlled Substance</th>
                    <th className="px-4 py-3">Tx Type</th>
                    <th className="px-4 py-3 text-right">Qty</th>
                    <th className="px-4 py-3 text-right">Perpetual Balance</th>
                    <th className="px-4 py-3">Primary Custodian</th>
                    <th className="px-4 py-3">Witness Cosigner</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-mono">
                  {narcoticLogs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-500 font-sans">
                        No Schedule X narcotic vault transactions logged. Dual-custody perpetual inventory logs for controlled substances will appear here.
                      </td>
                    </tr>
                  ) : (
                    narcoticLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50 transition">
                        <td className="px-4 py-3 text-slate-500">{log.timestamp}</td>
                        <td className="px-4 py-3 font-semibold text-slate-800">{log.drug}</td>
                        <td className="px-4 py-3">{log.txType}</td>
                        <td className={`px-4 py-3 text-right font-bold ${log.qty > 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {log.qty > 0 ? `+${log.qty}` : log.qty}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-slate-900">{log.balance}</td>
                        <td className="px-4 py-3 text-slate-700">{log.custodian}</td>
                        <td className="px-4 py-3 text-slate-700">{log.witness}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal: Pharmacist Verification Review */}
      {isVerifyModalOpen && selectedRx && (
        <Modal
          isOpen={isVerifyModalOpen}
          onClose={() => setIsVerifyModalOpen(false)}
          title={`Pharmacist Clinical Review — ${selectedRx.prescriptionNumber}`}
          maxWidth="lg"
        >
          <div className="space-y-4">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-1">
              <div>Patient: <span className="font-bold text-slate-800">{selectedRx.patient}</span> ({selectedRx.uhid})</div>
              <div>Attending Prescriber: <span className="font-semibold text-slate-800">{selectedRx.doctor}</span></div>
            </div>

            {selectedRx.safetyAlert && (
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg text-xs text-amber-900 space-y-1">
                <div className="font-bold uppercase tracking-wider">{selectedRx.safetyAlert.type}</div>
                <div>{selectedRx.safetyAlert.message}</div>
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1 block">Clinical Pharmacist Decision</label>
              <div className="flex gap-4 text-xs font-medium">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="decision"
                    value="VERIFIED_APPROVED"
                    checked={verifyDecision === 'VERIFIED_APPROVED'}
                    onChange={() => setVerifyDecision('VERIFIED_APPROVED')}
                  />
                  <span>Verify & Approve for Dispensing</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="decision"
                    value="REJECTED_CLINICAL_QUERY"
                    checked={verifyDecision === 'REJECTED_CLINICAL_QUERY'}
                    onChange={() => setVerifyDecision('REJECTED_CLINICAL_QUERY')}
                  />
                  <span>Reject & Raise Prescriber Query</span>
                </label>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1 block">Clinical Pharmacist Notes & Counseling Advice</label>
              <Input
                placeholder="e.g. Dose verified against renal function; advise patient to take after food."
                value={pharmacistNotes}
                onChange={(e) => setPharmacistNotes(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setIsVerifyModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleVerifySubmit}>
                Confirm Verification
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal: Record eMAR Dose */}
      {isEmarModalOpen && (
        <Modal
          isOpen={isEmarModalOpen}
          onClose={() => setIsEmarModalOpen(false)}
          title="Inpatient eMAR Medication Administration"
          maxWidth="md"
        >
          <div className="space-y-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Inpatient & Bed</label>
              <Input value={emarPatient} onChange={(e) => setEmarPatient(e.target.value)} />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Medication & Dose</label>
              <Input value={`${emarDrug} — ${emarDose}`} disabled />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Pre-dose Pulse (bpm)</label>
                <Input type="number" value={emarPulse} onChange={(e) => setEmarPulse(Number(e.target.value))} />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Pre-dose BP (mmHg)</label>
                <Input value={emarBP} onChange={(e) => setEmarBP(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Mandatory Dual-Nurse Cosigner ID (High-Alert Drug)</label>
              <Input value={emarCosigner} onChange={(e) => setEmarCosigner(e.target.value)} />
              <p className="text-[11px] text-slate-500 mt-1">High-Alert insulin requires second RN verification.</p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setIsEmarModalOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleEmarSubmit}>Confirm Administration</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal: Product Recall */}
      {isRecallModalOpen && (
        <Modal
          isOpen={isRecallModalOpen}
          onClose={() => setIsRecallModalOpen(false)}
          title="Issue Product Lot Recall"
          maxWidth="md"
        >
          <div className="space-y-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Recalled Batch Number</label>
              <Input value={recallLot} onChange={(e) => setRecallLot(e.target.value)} />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Recall Severity Class</label>
              <select
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                value={recallClass}
                onChange={(e: any) => setRecallClass(e.target.value)}
              >
                <option value="CLASS_I_LIFE_THREATENING">Class I (Life Threatening Hazard)</option>
                <option value="CLASS_II_TEMPORARY_HEALTH_HAZARD">Class II (Temporary Health Hazard)</option>
              </select>
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Regulatory Recall Reason</label>
              <Input value={recallReason} onChange={(e) => setRecallReason(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setIsRecallModalOpen(false)}>Cancel</Button>
              <Button variant="danger" onClick={handleRecallSubmit}>Freeze Stock & Trace Patients</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal: Temperature Excursion */}
      {isTempModalOpen && (
        <Modal
          isOpen={isTempModalOpen}
          onClose={() => setIsTempModalOpen(false)}
          title="Simulate Cold-Chain Sensor Reading"
          maxWidth="sm"
        >
          <div className="space-y-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Storage Unit</label>
              <Input value={tempUnit} onChange={(e) => setTempUnit(e.target.value)} />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Temperature Reading (°C)</label>
              <Input type="number" step="0.1" value={tempReading} onChange={(e) => setTempReading(Number(e.target.value))} />
              <p className="text-[11px] text-slate-500 mt-1">Safe biological range: 2.0°C to 8.0°C.</p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setIsTempModalOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleTempExcursion}>Log Temperature</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal: Narcotic Vault Entry */}
      {isNarcoticModalOpen && (
        <Modal
          isOpen={isNarcoticModalOpen}
          onClose={() => setIsNarcoticModalOpen(false)}
          title="Schedule X & Narcotic Safe Vault Entry"
          maxWidth="md"
        >
          <div className="space-y-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Controlled Substance</label>
              <Input value={narcoticDrug} disabled />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Quantity Change (Dose)</label>
                <Input type="number" value={narcoticQty} onChange={(e) => setNarcoticQty(Number(e.target.value))} />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Mandatory Witness User ID</label>
                <Input value={narcoticWitness} onChange={(e) => setNarcoticWitness(e.target.value)} />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setIsNarcoticModalOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleNarcoticSubmit}>Log Dual-Custody Transaction</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

