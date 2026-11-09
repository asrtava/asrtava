import React, { useState } from 'react';
import {
  DollarSign,
  TrendingUp,
  Receipt,
  Scale,
  Clock,
  ShieldCheck,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  Download,
  Plus,
  RefreshCw,
  Percent,
  Layers,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { Button, Input, Badge, Modal, useToast } from '../../components/ui';

interface JournalEntryLine {
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  memo: string;
}

export const RevenueCycleAccountingHub: React.FC = () => {
  const { showToast } = useToast();
  const [subTab, setSubTab] = useState<'trial-balance' | 'ar-aging' | 'cashier-shifts' | 'gst-returns' | 'profit-loss'>('trial-balance');

  // New Journal Voucher Modal State
  const [isJournalModalOpen, setIsJournalModalOpen] = useState(false);
  const [jvNarration, setJvNarration] = useState('');
  const [jvReferenceType, setJvReferenceType] = useState('MANUAL_JOURNAL');
  const [jvLines, setJvLines] = useState<JournalEntryLine[]>([
    { accountCode: '1001', accountName: 'Cash in Hand (Counter Float)', debit: 5000, credit: 0, memo: 'Counter float' },
    { accountCode: '1002', accountName: 'Hospital Operating Bank Account', debit: 0, credit: 5000, memo: 'Withdrawal from bank' },
  ]);

  // Cashier Close Modal State
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [shiftCounter, setShiftCounter] = useState('Counter-OPD-1');
  const [countedCash, setCountedCash] = useState<number>(23000);
  const [supervisorPin, setSupervisorPin] = useState('');

  // Sample Live Chart of Accounts & Trial Balance Data
  const trialBalanceAccounts = [
    { code: '1001', name: 'Cash in Hand (Counter Float)', type: 'ASSET', debit: 45000.0, credit: 0.0 },
    { code: '1002', name: 'Hospital Operating Bank Account', type: 'ASSET', debit: 3840000.0, credit: 0.0 },
    { code: '1201', name: 'Accounts Receivable - Outpatient (OPD)', type: 'ASSET', debit: 385000.0, credit: 0.0 },
    { code: '1202', name: 'Accounts Receivable - Inpatient (IPD)', type: 'ASSET', debit: 780000.0, credit: 0.0 },
    { code: '1203', name: 'Accounts Receivable - Corporate / TPA', type: 'ASSET', debit: 260000.0, credit: 0.0 },
    { code: '1301', name: 'Pharmaceutical Inventory', type: 'ASSET', debit: 1250000.0, credit: 0.0 },
    { code: '2001', name: 'Accounts Payable - Medical Vendors', type: 'LIABILITY', debit: 0.0, credit: 890000.0 },
    { code: '2002', name: 'CGST Output Tax Payable (9%)', type: 'LIABILITY', debit: 0.0, credit: 45000.0 },
    { code: '2003', name: 'SGST Output Tax Payable (9%)', type: 'LIABILITY', debit: 0.0, credit: 45000.0 },
    { code: '2101', name: 'Patient Advances & Security Deposits', type: 'LIABILITY', debit: 0.0, credit: 620000.0 },
    { code: '3001', name: 'Hospital Capital & Reserves', type: 'EQUITY', debit: 0.0, credit: 4955000.0 },
    { code: '4001', name: 'OPD Consultation Revenue', type: 'REVENUE', debit: 0.0, credit: 320000.0 },
    { code: '4002', name: 'IPD Room & Nursing Care Revenue', type: 'REVENUE', debit: 0.0, credit: 680000.0 },
    { code: '4003', name: 'Laboratory Diagnostics Revenue', type: 'REVENUE', debit: 0.0, credit: 245000.0 },
    { code: '4004', name: 'Radiology Imaging Revenue', type: 'REVENUE', debit: 0.0, credit: 195000.0 },
    { code: '4005', name: 'Pharmacy Sales Revenue', type: 'REVENUE', debit: 0.0, credit: 410000.0 },
    { code: '4006', name: 'Surgery & OT Revenue', type: 'REVENUE', debit: 0.0, credit: 520000.0 },
    { code: '5001', name: 'Medical Consumables & Surgical Expense', type: 'EXPENSE', debit: 185000.0, credit: 0.0 },
    { code: '5002', name: 'Hospital Staff Salaries', type: 'EXPENSE', debit: 415000.0, credit: 0.0 },
    { code: '5004', name: 'Patient Discounts & Adjustments', type: 'EXPENSE', debit: 85000.0, credit: 0.0 },
  ];

  const totalDebits = trialBalanceAccounts.reduce((sum, a) => sum + a.debit, 0);
  const totalCredits = trialBalanceAccounts.reduce((sum, a) => sum + a.credit, 0);
  const isTBBalanced = Math.abs(totalDebits - totalCredits) < 0.01;

  // Total Journal Entry Inputs Calculation
  const jvTotalDebit = jvLines.reduce((sum, l) => sum + (Number(l.debit) || 0), 0);
  const jvTotalCredit = jvLines.reduce((sum, l) => sum + (Number(l.credit) || 0), 0);
  const isJVBalanced = Math.abs(jvTotalDebit - jvTotalCredit) < 0.001 && jvTotalDebit > 0;

  const handlePostJV = () => {
    if (!isJVBalanced) {
      showToast({
        type: 'error',
        title: 'Double-Entry Balance Error',
        message: 'Total debits must strictly equal total credits.',
      });
      return;
    }
    if (!jvNarration.trim()) {
      showToast({
        type: 'warning',
        title: 'Missing Narration',
        message: 'Please enter a clinical or financial memo narration.',
      });
      return;
    }
    showToast({
      type: 'success',
      title: 'Journal Entry Posted',
      message: `Journal entry posted to General Ledger successfully! Total: ₹${jvTotalDebit.toLocaleString('en-IN')}`,
    });
    setIsJournalModalOpen(false);
    setJvNarration('');
  };

  const handleCloseShift = () => {
    if (supervisorPin !== '1234' && supervisorPin !== '9999') {
      showToast({
        type: 'error',
        title: 'Authorization Denied',
        message: 'Invalid Supervisor Override PIN.',
      });
      return;
    }
    const expectedCash = 23000;
    const variance = countedCash - expectedCash;
    if (variance === 0) {
      showToast({
        type: 'success',
        title: 'Shift Closed (Balanced)',
        message: `Counter Shift ${shiftCounter} closed and verified BALANCED. Settlement voucher posted.`,
      });
    } else {
      showToast({
        type: 'warning',
        title: 'Shift Discrepancy Recorded',
        message: `Counter Shift ${shiftCounter} closed with variance of ₹${variance}. Variance hold recorded.`,
      });
    }
    setIsShiftModalOpen(false);
    setSupervisorPin('');
  };

  return (
    <div className="space-y-6">
      {/* Top Telemetry KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Gross Billed</span>
            <DollarSign className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-bold text-slate-800">₹48,50,000</div>
          <div className="flex items-center gap-1 text-xs text-emerald-600 mt-2 font-medium">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+14.2% vs last month</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Net Revenue</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-800">₹47,65,000</div>
          <div className="flex items-center gap-1 text-xs text-slate-500 mt-2 font-medium">
            <span>Deductions: ₹85,000 (1.8%)</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Collections Today</span>
            <Receipt className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-800">₹4,12,500</div>
          <div className="flex items-center gap-1 text-xs text-blue-600 mt-2 font-medium">
            <span>48.5% UPI • 26.2% Card</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total AR Receivables</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-slate-800">₹14,25,000</div>
          <div className="flex items-center gap-1 text-xs text-amber-600 mt-2 font-medium">
            <span>₹7.8L TPA Insurance</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Collection Rate</span>
            <Percent className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-purple-700">94.2%</div>
          <div className="flex items-center gap-1 text-xs text-emerald-600 mt-2 font-medium">
            <span>SLA Target: &gt; 92.0%</span>
          </div>
        </div>
      </div>

      {/* RCM Sub-Navigation Tabs */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-wrap items-center justify-between border-b border-slate-200 px-4 pt-3 gap-2">
          <div className="flex space-x-2">
            <button
              onClick={() => setSubTab('trial-balance')}
              className={`flex items-center gap-2 pb-3 px-3 border-b-2 text-sm font-semibold transition ${
                subTab === 'trial-balance'
                  ? 'border-teal-600 text-teal-800'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Scale className="w-4 h-4" />
              General Ledger & Trial Balance
            </button>
            <button
              onClick={() => setSubTab('ar-aging')}
              className={`flex items-center gap-2 pb-3 px-3 border-b-2 text-sm font-semibold transition ${
                subTab === 'ar-aging'
                  ? 'border-teal-600 text-teal-800'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Clock className="w-4 h-4" />
              AR Aging Analysis
            </button>
            <button
              onClick={() => setSubTab('cashier-shifts')}
              className={`flex items-center gap-2 pb-3 px-3 border-b-2 text-sm font-semibold transition ${
                subTab === 'cashier-shifts'
                  ? 'border-teal-600 text-teal-800'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Receipt className="w-4 h-4" />
              Cashier Shifts & Floats
            </button>
            <button
              onClick={() => setSubTab('gst-returns')}
              className={`flex items-center gap-2 pb-3 px-3 border-b-2 text-sm font-semibold transition ${
                subTab === 'gst-returns'
                  ? 'border-teal-600 text-teal-800'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              GST & Tax Compliance (SAC 999312)
            </button>
            <button
              onClick={() => setSubTab('profit-loss')}
              className={`flex items-center gap-2 pb-3 px-3 border-b-2 text-sm font-semibold transition ${
                subTab === 'profit-loss'
                  ? 'border-teal-600 text-teal-800'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              Profit & Loss (P&L)
            </button>
          </div>

          <div className="pb-3 flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => showToast({ type: 'info', title: 'Ledger Refreshed', message: 'Financial statements refreshed from general ledger.' })}
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1" />
              Refresh
            </Button>
            {subTab === 'trial-balance' && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsJournalModalOpen(true)}
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Post Journal Voucher
              </Button>
            )}
            {subTab === 'cashier-shifts' && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsShiftModalOpen(true)}
              >
                <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                Close Counter & Reconcile
              </Button>
            )}
          </div>
        </div>

        {/* 1. Trial Balance Tab */}
        {subTab === 'trial-balance' && (
          <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-200 gap-4">
              <div>
                <h4 className="text-base font-bold text-slate-800">Double-Entry Trial Balance Statement</h4>
                <p className="text-xs text-slate-500">
                  Real-time general ledger balances. Mathematical verification: ∑ Debits must equal ∑ Credits.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={isTBBalanced ? 'success' : 'danger'}>
                  {isTBBalanced ? '✓ General Ledger Balanced' : '⚠ Ledger Out of Balance'}
                </Badge>
                <Button variant="outline" size="sm" onClick={() => showToast({ type: 'info', title: 'Excel Export', message: 'Exporting Trial Balance to Excel...' })}>
                  <Download className="w-3.5 h-3.5 mr-1" />
                  Export XLS
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-sm text-slate-700">
                <thead className="bg-slate-100 text-xs font-semibold text-slate-600 uppercase border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Account Code</th>
                    <th className="px-4 py-3">Account Name</th>
                    <th className="px-4 py-3">Classification</th>
                    <th className="px-4 py-3 text-right">Debit Balance (₹)</th>
                    <th className="px-4 py-3 text-right">Credit Balance (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {trialBalanceAccounts.map((ac) => (
                    <tr key={ac.code} className="hover:bg-slate-50 transition">
                      <td className="px-4 py-3 font-mono font-medium text-slate-800">{ac.code}</td>
                      <td className="px-4 py-3 font-medium text-slate-800">{ac.name}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs px-2 py-0.5 rounded font-semibold ${
                            ac.type === 'ASSET'
                              ? 'bg-blue-100 text-blue-700'
                              : ac.type === 'LIABILITY'
                              ? 'bg-amber-100 text-amber-700'
                              : ac.type === 'EQUITY'
                              ? 'bg-purple-100 text-purple-700'
                              : ac.type === 'REVENUE'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-rose-100 text-rose-700'
                          }`}
                        >
                          {ac.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-slate-900">
                        {ac.debit > 0 ? ac.debit.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '-'}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-slate-900">
                        {ac.credit > 0 ? ac.credit.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '-'}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
                    <td colSpan={3} className="px-4 py-3 text-right uppercase tracking-wider">
                      Grand Totals:
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-teal-800 text-base">
                      ₹{totalDebits.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-teal-800 text-base">
                      ₹{totalCredits.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 2. AR Aging Analysis Tab */}
        {subTab === 'ar-aging' && (
          <div className="p-6 space-y-6">
            <div>
              <h4 className="text-base font-bold text-slate-800">Accounts Receivable (AR) Aging Breakdown</h4>
              <p className="text-xs text-slate-500">
                Segmented into 4 standard aging buckets with TPA insurance and corporate payer tracking.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                <div className="text-xs font-semibold text-emerald-700 uppercase">0 – 30 Days (Current)</div>
                <div className="text-xl font-bold text-emerald-900 mt-1">₹8,50,000</div>
                <div className="text-xs text-emerald-700 mt-2 font-medium">59.6% of outstanding • Normal flow</div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="text-xs font-semibold text-blue-700 uppercase">31 – 60 Days</div>
                <div className="text-xl font-bold text-blue-900 mt-1">₹3,20,000</div>
                <div className="text-xs text-blue-700 mt-2 font-medium">22.5% • TPA query response required</div>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="text-xs font-semibold text-amber-700 uppercase">61 – 90 Days</div>
                <div className="text-xl font-bold text-amber-900 mt-1">₹1,65,000</div>
                <div className="text-xs text-amber-700 mt-2 font-medium">11.6% • High-priority escalation</div>
              </div>
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-4">
                <div className="text-xs font-semibold text-rose-700 uppercase">90+ Days (Doubtful)</div>
                <div className="text-xl font-bold text-rose-900 mt-1">₹90,000</div>
                <div className="text-xs text-rose-700 mt-2 font-medium">6.3% • Subject to bad-debt provisioning</div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
              <h5 className="text-sm font-bold text-slate-800">Payer Category Breakdown</h5>
              <div className="space-y-2">
                <div>
                  <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                    <span>TPA & Private Health Insurers</span>
                    <span>₹7,80,000 (54.7%)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div className="bg-teal-600 h-2 rounded-full" style={{ width: '54.7%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                    <span>Self-Pay Patients</span>
                    <span>₹3,85,000 (27.0%)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: '27.0%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                    <span>Corporate & PSU Credit Panels</span>
                    <span>₹2,60,000 (18.3%)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div className="bg-purple-600 h-2 rounded-full" style={{ width: '18.3%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. Cashier Shifts Tab */}
        {subTab === 'cashier-shifts' && (
          <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="text-base font-bold text-slate-800">Counter Cashier Shifts & Blind Count Settlement</h4>
                <p className="text-xs text-slate-500">
                  Track physical cash in counters, system expectations, refunds disbursed, and supervisor approvals.
                </p>
              </div>
            </div>

            <div className="border border-slate-200 rounded-lg overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700">
                <thead className="bg-slate-50 text-xs font-semibold text-slate-600 uppercase border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Counter</th>
                    <th className="px-4 py-3">Cashier</th>
                    <th className="px-4 py-3 text-right">Opening Float</th>
                    <th className="px-4 py-3 text-right">Cash In</th>
                    <th className="px-4 py-3 text-right">Cash Out (Refunds)</th>
                    <th className="px-4 py-3 text-right">Expected Cash</th>
                    <th className="px-4 py-3 text-right">Counted Cash</th>
                    <th className="px-4 py-3 text-center">Variance</th>
                    <th className="px-4 py-3 text-center">Shift Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3 font-semibold text-slate-800">Counter-OPD-1</td>
                    <td className="px-4 py-3 font-medium text-slate-700">Rohit Sharma</td>
                    <td className="px-4 py-3 text-right font-mono">₹5,000.00</td>
                    <td className="px-4 py-3 text-right font-mono">₹20,000.00</td>
                    <td className="px-4 py-3 text-right font-mono">₹2,000.00</td>
                    <td className="px-4 py-3 text-right font-mono font-semibold">₹23,000.00</td>
                    <td className="px-4 py-3 text-right font-mono font-semibold">₹23,000.00</td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                        ₹0.00 (Balanced)
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant="success">CLOSED</Badge>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3 font-semibold text-slate-800">Counter-EMERG-2</td>
                    <td className="px-4 py-3 font-medium text-slate-700">Meera Iyer</td>
                    <td className="px-4 py-3 text-right font-mono">₹10,000.00</td>
                    <td className="px-4 py-3 text-right font-mono">₹34,500.00</td>
                    <td className="px-4 py-3 text-right font-mono">₹0.00</td>
                    <td className="px-4 py-3 text-right font-mono font-semibold">₹44,500.00</td>
                    <td className="px-4 py-3 text-right font-mono font-semibold">-</td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-xs text-slate-400">Shift In-Progress</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant="warning">OPEN</Badge>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 4. GST Returns Tab */}
        {subTab === 'gst-returns' && (
          <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-200 gap-4">
              <div>
                <h4 className="text-base font-bold text-slate-800">GST Compliance & Tax Schedules (India)</h4>
                <p className="text-xs text-slate-500">
                  GSTIN: <span className="font-mono font-semibold text-slate-800">07AAAAA0000A1Z5</span> • FY 2026-27 (Q1)
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => showToast({ type: 'info', title: 'GSTR-1 Export', message: 'Exporting GSTR-1 JSON Payload...' })}>
                  <Download className="w-3.5 h-3.5 mr-1" />
                  GSTR-1 JSON
                </Button>
                <Button variant="outline" size="sm" onClick={() => showToast({ type: 'info', title: 'GSTR-3B Export', message: 'Exporting GSTR-3B PDF Summary...' })}>
                  <Download className="w-3.5 h-3.5 mr-1" />
                  GSTR-3B PDF
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl">
                <div className="text-xs font-semibold text-emerald-800 uppercase">Exempt Healthcare (SAC 999312)</div>
                <div className="text-2xl font-bold text-emerald-950 mt-1">₹39,50,000</div>
                <div className="text-xs text-emerald-800 mt-2 font-medium">
                  Notification 12/2017-Central Tax Rate (0% GST)
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl">
                <div className="text-xs font-semibold text-blue-800 uppercase">Taxable Pharmacy Turnover</div>
                <div className="text-2xl font-bold text-blue-950 mt-1">₹9,00,000</div>
                <div className="text-xs text-blue-800 mt-2 font-medium">HSN 3004 (5%) & HSN 300490 (12%)</div>
              </div>
              <div className="bg-purple-50 border border-purple-200 p-4 rounded-xl">
                <div className="text-xs font-semibold text-purple-800 uppercase">Total Tax Liability (CGST + SGST)</div>
                <div className="text-2xl font-bold text-purple-950 mt-1">₹90,000</div>
                <div className="text-xs text-purple-800 mt-2 font-medium">CGST: ₹45,000 | SGST: ₹45,000</div>
              </div>
            </div>

            <div className="border border-slate-200 rounded-lg overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700">
                <thead className="bg-slate-100 text-xs font-semibold text-slate-600 uppercase border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">HSN / SAC Code</th>
                    <th className="px-4 py-3">Service / Drug Description</th>
                    <th className="px-4 py-3 text-center">GST Rate</th>
                    <th className="px-4 py-3 text-right">Taxable Turnover (₹)</th>
                    <th className="px-4 py-3 text-right">Tax Payable (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3 font-mono font-semibold text-slate-800">999312</td>
                    <td className="px-4 py-3 font-medium text-slate-800">
                      Specialized Clinical Healthcare Services (Consultation, Inpatient, Diagnostics, Surgery)
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                        0% (Exempt)
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono">39,50,000.00</td>
                    <td className="px-4 py-3 text-right font-mono text-emerald-700 font-semibold">0.00</td>
                  </tr>
                  <tr className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3 font-mono font-semibold text-slate-800">3004</td>
                    <td className="px-4 py-3 font-medium text-slate-800">Medicaments in measured doses (Retail Pharmacy)</td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-xs font-bold text-blue-800 bg-blue-100 px-2 py-0.5 rounded">5% GST</span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono">6,00,000.00</td>
                    <td className="px-4 py-3 text-right font-mono text-slate-900 font-semibold">30,000.00</td>
                  </tr>
                  <tr className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3 font-mono font-semibold text-slate-800">300490</td>
                    <td className="px-4 py-3 font-medium text-slate-800">Diagnostic reagents & consumables</td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-xs font-bold text-purple-800 bg-purple-100 px-2 py-0.5 rounded">12% GST</span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono">3,00,000.00</td>
                    <td className="px-4 py-3 text-right font-mono text-slate-900 font-semibold">36,000.00</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 5. Profit & Loss Tab */}
        {subTab === 'profit-loss' && (
          <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="text-base font-bold text-slate-800">Hospital Operating Statement (Profit & Loss)</h4>
                <p className="text-xs text-slate-500">Live operational revenues vs operating expenses.</p>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-500 uppercase font-semibold">Net Operating Surplus</div>
                <div className="text-2xl font-bold text-teal-800">₹16,85,000</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Departmental Revenues */}
              <div className="border border-slate-200 rounded-xl p-4 space-y-3 bg-white">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h5 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    Operating Revenues
                  </h5>
                  <span className="text-sm font-bold text-emerald-700">₹23,70,000</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-slate-700">
                    <span>IPD Room & Nursing Care</span>
                    <span className="font-mono font-medium">₹6,80,000</span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>Surgery & Operation Theatre</span>
                    <span className="font-mono font-medium">₹5,20,000</span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>Pharmacy Sales</span>
                    <span className="font-mono font-medium">₹4,10,000</span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>OPD Consultations</span>
                    <span className="font-mono font-medium">₹3,20,000</span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>Laboratory Diagnostics</span>
                    <span className="font-mono font-medium">₹2,45,000</span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>Radiology & Imaging</span>
                    <span className="font-mono font-medium">₹1,95,000</span>
                  </div>
                </div>
              </div>

              {/* Operating Expenses */}
              <div className="border border-slate-200 rounded-xl p-4 space-y-3 bg-white">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h5 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    <ArrowDownRight className="w-4 h-4 text-rose-600" />
                    Operating Expenses & Deductions
                  </h5>
                  <span className="text-sm font-bold text-rose-700">₹6,85,000</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-slate-700">
                    <span>Staff & Clinical Salaries</span>
                    <span className="font-mono font-medium">₹4,15,000</span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>Medical & Surgical Consumables</span>
                    <span className="font-mono font-medium">₹1,85,000</span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>Discounts & Adjustments</span>
                    <span className="font-mono font-medium">₹85,000</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal: Post Journal Voucher */}
      {isJournalModalOpen && (
        <Modal
          isOpen={isJournalModalOpen}
          onClose={() => setIsJournalModalOpen(false)}
          title="Create Double-Entry Journal Voucher"
          maxWidth="lg"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Reference Voucher Type</label>
                <select
                  value={jvReferenceType}
                  onChange={(e) => setJvReferenceType(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                >
                  <option value="MANUAL_JOURNAL">Manual General Journal</option>
                  <option value="INTER_BRANCH_TRANSFER">Inter-Branch Settlement</option>
                  <option value="DEPRECIATION">Asset Depreciation</option>
                  <option value="CASHIER_SETTLEMENT">Cashier Counter Settlement</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Posting Date</label>
                <Input type="date" defaultValue={new Date().toISOString().split('T')[0]} />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Transaction Narration / Clinical Memo</label>
              <Input
                placeholder="e.g. Allocation of operational float from main bank account"
                value={jvNarration}
                onChange={(e) => setJvNarration(e.target.value)}
              />
            </div>

            <div className="border border-slate-200 rounded-lg p-3 bg-slate-50 space-y-2">
              <div className="text-xs font-bold text-slate-700 uppercase">Journal Distribution Lines</div>
              {jvLines.map((line, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 text-xs items-center bg-white p-2 rounded border border-slate-200">
                  <div className="col-span-5 font-mono text-slate-800 font-medium">
                    {line.accountCode} - {line.accountName}
                  </div>
                  <div className="col-span-3">
                    <input
                      type="number"
                      placeholder="Debit (₹)"
                      value={line.debit || ''}
                      onChange={(e) => {
                        const updated = [...jvLines];
                        updated[idx].debit = Number(e.target.value) || 0;
                        setJvLines(updated);
                      }}
                      className="w-full px-2 py-1 border border-slate-300 rounded text-right font-mono"
                    />
                  </div>
                  <div className="col-span-3">
                    <input
                      type="number"
                      placeholder="Credit (₹)"
                      value={line.credit || ''}
                      onChange={(e) => {
                        const updated = [...jvLines];
                        updated[idx].credit = Number(e.target.value) || 0;
                        setJvLines(updated);
                      }}
                      className="w-full px-2 py-1 border border-slate-300 rounded text-right font-mono"
                    />
                  </div>
                  <div className="col-span-1 text-center font-bold text-slate-400">
                    {line.debit > 0 ? 'Dr' : 'Cr'}
                  </div>
                </div>
              ))}

              <div className="flex justify-between items-center pt-2 border-t border-slate-200 text-sm font-semibold">
                <span className="text-xs uppercase text-slate-500">Totals:</span>
                <div className="flex gap-4 font-mono">
                  <span>Dr: ₹{jvTotalDebit.toLocaleString('en-IN')}</span>
                  <span>Cr: ₹{jvTotalCredit.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <span className={isJVBalanced ? 'text-emerald-700 font-bold' : 'text-rose-700 font-bold'}>
                  {isJVBalanced ? '✓ Balanced (Debits == Credits)' : '⚠ Unbalanced (Difference: ₹' + Math.abs(jvTotalDebit - jvTotalCredit) + ')'}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setIsJournalModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handlePostJV} disabled={!isJVBalanced}>
                Verify & Post Journal Entry
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal: Close Cashier Shift */}
      {isShiftModalOpen && (
        <Modal
          isOpen={isShiftModalOpen}
          onClose={() => setIsShiftModalOpen(false)}
          title="Cashier Shift Closing & Reconciliation"
          maxWidth="md"
        >
          <div className="space-y-4">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-1">
              <div className="flex justify-between text-slate-600">
                <span>Selected Counter:</span>
                <span className="font-bold text-slate-800">{shiftCounter}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>System Expected Cash:</span>
                <span className="font-bold text-slate-800 font-mono">₹23,000.00</span>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Physically Counted Cash in Drawer (₹)</label>
              <Input
                type="number"
                value={countedCash}
                onChange={(e) => setCountedCash(Number(e.target.value) || 0)}
              />
              <div className="text-xs mt-1 font-semibold">
                Variance: <span className={countedCash - 23000 === 0 ? 'text-emerald-700' : 'text-rose-700'}>
                  ₹{(countedCash - 23000).toLocaleString('en-IN')} {countedCash - 23000 === 0 ? '(Balanced)' : '(Discrepancy)'}
                </span>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Managerial Supervisor Authorization PIN</label>
              <Input
                type="password"
                placeholder="Enter 4-digit supervisor PIN (e.g. 1234)"
                value={supervisorPin}
                onChange={(e) => setSupervisorPin(e.target.value)}
              />
              <p className="text-[11px] text-slate-500 mt-1">Requires supervisor PIN authorization for counter shift signoff.</p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setIsShiftModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleCloseShift}>
                Confirm Shift Closure
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
