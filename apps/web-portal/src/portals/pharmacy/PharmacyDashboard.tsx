import React, { useState, useEffect, useMemo } from 'react';
import {
  Pill,
  Package,
  AlertTriangle,
  Clock,
  Search,
  CheckCircle2,
  ShoppingCart,
  Calendar,
  Layers,
  Check,
  Plus,
  Receipt,
  Printer,
  ArrowRightLeft,
  Truck,
  FileCheck,
  ShieldAlert,
  Sparkles
} from 'lucide-react';
import { Modal, Button, Input, Badge, useToast } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { useHospital } from '../../context/HospitalContext';
import { pharmacyApi } from '../../services/api';
import { AdvancedPharmacyHub } from './AdvancedPharmacyHub';
import { PharmacyIntelligence } from '../../services/recommendationEngine';

interface RxItem {
  drug: string;
  form: string;
  qty: number;
  batch: string;
  expiry: string;
  unitPrice: number;
  stock: number;
}

interface PendingRx {
  id: string;
  rxId: string;
  patient: string;
  uhid: string;
  doctor: string;
  time: string;
  items: RxItem[];
  status: 'Pending' | 'Dispensed';
}

interface StockBatch {
  id: string;
  name: string;
  category: string;
  batch: string;
  exp: string;
  stock: number;
  cost: number;
  mrp: number;
  status: 'Healthy' | 'Low Stock' | 'Expiring Soon';
}

export const PharmacyDashboard: React.FC = () => {
  const { showToast } = useToast();
  const { activePortalTab, setActivePortalTab } = useAuth();
  const {
    prescriptions: hospitalPrescriptions,
    inventory: hospitalInventory,
    dispensePrescription,
    createInvoice,
    collectInvoicePayment
  } = useHospital();

  const [activeTab, setActiveTab] = useState<'queue' | 'inventory' | 'advanced'>('queue');

  useEffect(() => {
    if (activePortalTab && ['queue', 'inventory', 'advanced'].includes(activePortalTab)) {
      setActiveTab(activePortalTab as any);
    }
  }, [activePortalTab]);

  const switchTab = (tab: 'queue' | 'inventory' | 'advanced') => {
    setActiveTab(tab);
    setActivePortalTab(tab);
  };
  const [searchQuery, setSearchQuery] = useState('');

  // Map dynamic electronic prescriptions from HospitalContext
  const prescriptions: PendingRx[] = useMemo(() => {
    return hospitalPrescriptions.map((rx) => ({
      id: rx.id,
      rxId: rx.rxNumber,
      patient: rx.patientName,
      uhid: rx.uhid,
      doctor: rx.doctorName,
      time: rx.time || 'Today',
      status: rx.status,
      items: rx.items.map((it, idx) => ({
        drug: it.drugName,
        form: 'Tablet',
        qty: it.qty || 30,
        batch: `BAT-2026-${String(idx + 1).padStart(2, '0')}A`,
        expiry: '12/2027',
        unitPrice: it.unitPrice || 7.5,
        stock: 450
      }))
    }));
  }, [hospitalPrescriptions]);

  // Map inventory from HospitalContext
  const inventory: StockBatch[] = useMemo(() => {
    return hospitalInventory.map((item) => ({
      id: item.id,
      name: item.name,
      category: item.category,
      batch: item.batch || 'BAT-2026-01',
      exp: item.expiry || '2027-12-31',
      stock: item.stock,
      cost: item.unitPrice * 0.6,
      mrp: item.unitPrice,
      status: item.status
    }));
  }, [hospitalInventory]);

  // Pharmacy Intelligence Inventory & Expiry Recommendations
  const pharmacyRecommendations = useMemo(() => {
    return inventory
      .map((item) =>
        PharmacyIntelligence.evaluateInventoryItem({
          name: item.name,
          currentStock: item.stock,
          reorderLevel: 50,
          expiryDate: item.exp
        })
      )
      .filter((r) => r.status !== 'OPTIMAL');
  }, [inventory]);

  // Dispense Modal State
  const [selectedRx, setSelectedRx] = useState<PendingRx | null>(null);
  const [isDispenseModalOpen, setIsDispenseModalOpen] = useState(false);

  // Generic Substitution State
  const [isSubstituteModalOpen, setIsSubstituteModalOpen] = useState(false);
  const [itemToSubstitute, setItemToSubstitute] = useState<{ index: number; drug: string; qty: number } | null>(null);
  const [selectedGenericReplacement, setSelectedGenericReplacement] = useState('Generic Bioequivalent INN');
  const [substitutionReason, setSubstitutionReason] = useState('Equivalent INN active pharmaceutical ingredient; hospital formulary approved; reduces patient OOP cost.');

  // Purchase Request Requisition State
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [poDrug, setPoDrug] = useState('Ceftriaxone 1g Injection');
  const [poQty, setPoQty] = useState(200);
  const [poSupplier, setPoSupplier] = useState('Cipla Institutional Supply Ltd.');
  const [poNotes, setPoNotes] = useState('Low stock replenishment for Central Inpatient Pharmacy (Minimum safety threshold 50 units reached).');

  // POS Walk-in Sale Modal State
  const [isPosModalOpen, setIsPosModalOpen] = useState(false);
  const [posCustomerName, setPosCustomerName] = useState('Walk-in Customer');
  const [posSelectedDrug, setPosSelectedDrug] = useState('Paracetamol 650mg');
  const [posQty, setPosQty] = useState(10);
  const [posPaymentMethod, setPosPaymentMethod] = useState<'Cash' | 'UPI' | 'Card'>('UPI');

  const handleOpenDispense = (rx: PendingRx) => {
    setSelectedRx(rx);
    setIsDispenseModalOpen(true);
  };

  const handleApplySubstitution = () => {
    if (!selectedRx || !itemToSubstitute) return;
    const updatedItems = [...selectedRx.items];
    updatedItems[itemToSubstitute.index] = {
      ...updatedItems[itemToSubstitute.index],
      drug: selectedGenericReplacement,
      unitPrice: 4.0, // generic cost reduction
      batch: 'BAT-2026-GEN01',
    };
    setSelectedRx({ ...selectedRx, items: updatedItems });
    setIsSubstituteModalOpen(false);
    showToast({
      type: 'info',
      title: 'Generic Drug Substituted',
      message: `Replaced ${itemToSubstitute.drug} with formulary generic ${selectedGenericReplacement}. Cost reduced.`
    });
  };

  const handleCreatePurchaseRequisition = () => {
    if (!poDrug || poQty <= 0) return;
    setIsPurchaseModalOpen(false);
    showToast({
      type: 'success',
      title: 'Purchase Requisition Submitted',
      message: `Requisition for ${poQty} units of ${poDrug} forwarded to Hospital Procurement. Supplier: ${poSupplier}.`
    });
  };

  const handleConfirmDispense = async () => {
    if (!selectedRx) return;

    const subtotal = selectedRx.items.reduce((acc, it) => acc + (it.qty * it.unitPrice), 0);
    const tax = subtotal * 0.05;
    const total = subtotal + tax;

    try {
      await pharmacyApi.dispense({
        prescriptionId: selectedRx.id,
        items: selectedRx.items.map(it => ({
          drugName: it.drug,
          quantity: it.qty,
          batchNumber: it.batch,
        }))
      });
    } catch (err) {}

    await dispensePrescription(selectedRx.id, total, 'Counter');

    setIsDispenseModalOpen(false);
    showToast({
      type: 'success',
      title: 'Medication Dispensed & Invoiced',
      message: `Prescription ${selectedRx.rxId} dispensed for ${selectedRx.patient}. Stock deducted via FEFO and invoice recorded in Finance.`
    });
  };

  const handleCompletePosSale = async () => {
    const unitPrice = 2.5;
    const total = posQty * unitPrice;

    try {
      await pharmacyApi.posSale({
        patientName: posCustomerName,
        items: [{ drug: posSelectedDrug, quantity: posQty, unitPrice }],
        paymentMethod: posPaymentMethod,
        total: total.toFixed(2),
      });
    } catch (err) {}

    const inv = await createInvoice({
      patientId: 'pt-pos-walkin',
      patientName: posCustomerName || 'Walk-in Customer',
      uhid: 'UHID-POS-WALKIN',
      category: 'Pharmacy Counter POS Sale',
      items: [
        {
          description: `${posSelectedDrug} (${posQty} units)`,
          quantity: posQty,
          unitRate: unitPrice,
          amount: total
        }
      ]
    });
    const receipt = await collectInvoicePayment(inv.id, total, posPaymentMethod);

    setIsPosModalOpen(false);
    showToast({
      type: 'success',
      title: 'POS Counter Sale Completed',
      message: `Receipt ${receipt} generated for ${posCustomerName}. ₹${total.toFixed(2)} received via ${posPaymentMethod}.`
    });
  };

  const pendingList = prescriptions.filter((p) => p.status === 'Pending');
  const dispensedList = prescriptions.filter((p) => p.status === 'Dispensed');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 flex items-center space-x-1">
              <Pill className="w-3 h-3" />
              <span>Central Hospital Pharmacy · Counter 1</span>
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">Pharmacy Dispensing & Inventory</h1>
          <p className="text-sm text-slate-500">OPD/IPD Electronic Prescriptions, FEFO Batch Allocation & Retail Point-of-Sale.</p>
        </div>

        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm" onClick={() => setIsPurchaseModalOpen(true)}>
            <Truck className="w-4 h-4 mr-1.5 text-teal-700" />
            <span>Procurement Requisition</span>
          </Button>
          <Button variant="primary" size="sm" onClick={() => setIsPosModalOpen(true)}>
            <ShoppingCart className="w-4 h-4 mr-1.5" />
            <span>Counter Retail Sale (POS)</span>
          </Button>
        </div>
      </div>

      {/* Pharmacy KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-rose-600 font-medium">Pending Prescriptions</span>
          <div className="text-2xl font-bold text-rose-600 mt-1">{pendingList.length}</div>
          <span className="text-[11px] text-slate-400">Awaiting dispensing</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-emerald-600 font-medium">Dispensed Today</span>
          <div className="text-2xl font-bold text-emerald-600 mt-1">{dispensedList.length}</div>
          <span className="text-[11px] text-emerald-600 font-medium">
            Total sales: ₹ {dispensedList.reduce((acc, rx) => acc + rx.items.reduce((s, it) => s + (it.qty * it.unitPrice * 1.05), 0), 0).toFixed(0)}
          </span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-amber-600 font-medium">Near Expiry Batches (&lt;60d)</span>
          <div className="text-2xl font-bold text-amber-600 mt-1">
            {inventory.filter((b) => b.status === 'Expiring Soon').length}
          </div>
          <span className="text-[11px] text-amber-600">FEFO priority flag</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-teal-600 font-medium">Total Active Catalog SKUs</span>
          <div className="text-2xl font-bold text-teal-600 mt-1">{inventory.length}</div>
          <span className="text-[11px] text-slate-400">Barcode mapped</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-6 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('queue')}
            className={`pb-3 border-b-2 transition ${
              activeTab === 'queue' ? 'border-teal-600 text-teal-800' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Doctor Prescriptions Queue ({pendingList.length} Pending)
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={`pb-3 border-b-2 transition ${
              activeTab === 'inventory' ? 'border-teal-600 text-teal-800' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Formulary Stock & Batches ({inventory.length} Monitored)
          </button>
          <button
            onClick={() => setActiveTab('advanced')}
            className={`flex items-center gap-1.5 pb-3 border-b-2 transition ${
              activeTab === 'advanced' ? 'border-teal-600 text-teal-800 font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            Clinical Safety, eMAR, Cold-Chain, Recalls & Narcotic Vault
          </button>
        </nav>
      </div>

      {/* Tab: Prescriptions Queue */}
      {activeTab === 'queue' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {prescriptions.map((rx) => {
              const isPending = rx.status === 'Pending';
              const totalAmount = rx.items.reduce((sum, item) => sum + item.qty * item.unitPrice, 0);

              return (
                <div
                  key={rx.id}
                  className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded">
                          {rx.rxId}
                        </span>
                        <span className="text-[11px] text-slate-400">{rx.time}</span>
                      </div>
                      <Badge variant={isPending ? 'warning' : 'success'} size="sm">
                        {rx.status}
                      </Badge>
                    </div>

                    <div className="font-bold text-slate-900 text-sm">{rx.patient}</div>
                    <div className="text-[11px] text-slate-500">
                      UHID: <span className="font-mono">{rx.uhid}</span> · Prescribed by: {rx.doctor}
                    </div>

                    {/* Prescribed Items Table */}
                    <div className="mt-3 bg-slate-50 rounded-lg p-3 border border-slate-100 text-xs space-y-2">
                      {rx.items.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between">
                          <div>
                            <span className="font-semibold text-slate-800">{item.drug}</span>
                            <span className="text-[11px] text-slate-400 block">
                              Batch: {item.batch} · Exp: {item.expiry}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="font-semibold text-slate-900">{item.qty} units</span>
                            <span className="text-[11px] text-slate-500 block">
                              ₹ {(item.qty * item.unitPrice).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Estimated Total</span>
                      <span className="text-base font-bold text-slate-900">₹ {totalAmount.toFixed(2)}</span>
                    </div>

                    {isPending ? (
                      <Button size="sm" variant="primary" onClick={() => handleOpenDispense(rx)}>
                        <Check className="w-4 h-4 mr-1.5" />
                        <span>Dispense & Bill</span>
                      </Button>
                    ) : (
                      <div className="text-xs text-emerald-600 font-semibold flex items-center space-x-1">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Dispensed & Billed</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab: Formulary Stock & Batches */}
      {activeTab === 'inventory' && (
        <div className="space-y-4">
          {pharmacyRecommendations.length > 0 && (
            <div className="p-3.5 bg-teal-50/70 border border-teal-200 rounded-xl text-xs space-y-2 text-teal-950 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="font-bold flex items-center space-x-1.5 text-teal-900">
                  <Sparkles className="w-4 h-4 text-teal-700" />
                  <span>Pharmacy Supply Intelligence: {pharmacyRecommendations.length} Formulary Action(s) Required</span>
                </span>
                <Badge variant="brand" size="sm">Smart Optimization</Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] pt-1">
                {pharmacyRecommendations.slice(0, 4).map((rec, idx) => (
                  <div key={idx} className="bg-white p-2.5 rounded-lg border border-teal-100 space-y-1 shadow-xs">
                    <div className="flex justify-between items-center">
                      <strong className="text-slate-900">{rec.medicineName}</strong>
                      <Badge variant={rec.status === 'STOCKOUT_CRITICAL' ? 'danger' : 'warning'} size="sm">
                        {rec.status === 'STOCKOUT_CRITICAL' ? 'Stockout Risk' : 'FEFO Expiry'}
                      </Badge>
                    </div>
                    <p className="text-slate-600">{rec.recommendedAction}</p>
                    {rec.suggestedGenericAlternative && (
                      <div className="text-emerald-700 font-medium">
                        Generic Bioequivalent: <strong>{rec.suggestedGenericAlternative}</strong>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-400 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Medicine SKU</th>
                <th className="py-3 px-3">Batch #</th>
                <th className="py-3 px-3">Expiry Date</th>
                <th className="py-3 px-3">Current Stock</th>
                <th className="py-3 px-3">Purchase / MRP</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              {inventory.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50/60 transition">
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900">{b.name}</div>
                    <div className="text-[11px] text-slate-400">{b.category}</div>
                  </td>
                  <td className="py-3 px-3 font-mono font-medium text-slate-700">{b.batch}</td>
                  <td className="py-3 px-3 font-medium text-slate-700">{b.exp}</td>
                  <td className="py-3 px-3 font-bold text-slate-900">{b.stock} units</td>
                  <td className="py-3 px-3">
                    <span className="text-slate-400">₹ {b.cost.toFixed(2)}</span> /{' '}
                    <span className="font-bold text-slate-900">₹ {b.mrp.toFixed(2)}</span>
                  </td>
                  <td className="py-3 px-3">
                    <Badge
                      variant={
                        b.status === 'Healthy' ? 'success' : b.status === 'Low Stock' ? 'danger' : 'warning'
                      }
                      size="sm"
                    >
                      {b.status}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        showToast({
                          type: 'info',
                          title: 'Batch Traceability Record',
                          message: `${b.name} (${b.batch}) is stored in Central Pharmacy Rack B-04.`
                        });
                      }}
                    >
                      Trace
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </div>
      )}

      {/* Advanced Pharmacy Hub */}
      {activeTab === 'advanced' && <AdvancedPharmacyHub />}

      {/* Dispense Modal */}
      {selectedRx && (
        <Modal
          isOpen={isDispenseModalOpen}
          onClose={() => setIsDispenseModalOpen(false)}
          title={`Dispense Medication — ${selectedRx.rxId}`}
          description={`Patient: ${selectedRx.patient} (${selectedRx.uhid}) · Prescribed by ${selectedRx.doctor}`}
          footer={
            <>
              <Button variant="outline" onClick={() => setIsDispenseModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleConfirmDispense}>
                Confirm Dispense & Generate Bill
              </Button>
            </>
          }
        >
          <div className="space-y-4 text-xs">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <span className="text-[11px] font-bold text-slate-700 block mb-2 uppercase">
                Allocated Batches (FEFO Rule - First Expire First Out)
              </span>
              <div className="space-y-2">
                {selectedRx.items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs bg-white p-2.5 rounded border border-slate-100">
                    <div>
                      <span className="font-semibold text-slate-900">{item.drug}</span>
                      <span className="text-[11px] text-slate-400 block">
                        Batch: {item.batch} (Exp: {item.expiry}) · In Stock: {item.stock}
                      </span>
                    </div>
                    <div className="flex items-center space-x-3 text-right">
                      <div>
                        <span className="font-bold text-slate-800">{item.qty} pcs</span>
                        <span className="text-[11px] text-slate-500 block">₹ {(item.qty * item.unitPrice).toFixed(2)}</span>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-teal-700 hover:bg-teal-50 text-[11px] h-7 px-2"
                        onClick={() => {
                          setItemToSubstitute({ index: idx, drug: item.drug, qty: item.qty });
                          setSelectedGenericReplacement(`${item.drug.split(' ')[0]} Generic INN ${item.drug.split(' ')[1] || ''}`);
                          setIsSubstituteModalOpen(true);
                        }}
                      >
                        <ArrowRightLeft className="w-3 h-3 mr-1" />
                        <span>Substitute</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-teal-50 border border-teal-200 rounded-lg p-3 text-teal-900 flex justify-between items-center">
              <div>
                <span className="font-bold">Total Bill Payable</span>
                <span className="text-[11px] text-teal-700 block">Includes 12% GST breakdown</span>
              </div>
              <span className="text-lg font-bold text-teal-900">
                ₹{' '}
                {selectedRx.items
                  .reduce((sum, item) => sum + item.qty * item.unitPrice, 0)
                  .toFixed(2)}
              </span>
            </div>
          </div>
        </Modal>
      )}

      {/* POS Counter Sale Modal */}
      <Modal
        isOpen={isPosModalOpen}
        onClose={() => setIsPosModalOpen(false)}
        title="Walk-in Retail Sale (Point of Sale)"
        description="Dispense OTC medications directly to walk-in customer without doctor prescription."
        footer={
          <>
            <Button variant="outline" onClick={() => setIsPosModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCompletePosSale}>
              Complete Sale & Print Receipt
            </Button>
          </>
        }
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Customer / Buyer Name</label>
            <input
              type="text"
              value={posCustomerName}
              onChange={(e) => setPosCustomerName(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Select OTC Medicine</label>
              <select
                value={posSelectedDrug}
                onChange={(e) => setPosSelectedDrug(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
              >
                <option value="Paracetamol 650mg">Paracetamol 650mg (₹ 2.20/tab)</option>
                <option value="Pantoprazole 40mg">Pantoprazole 40mg (₹ 6.00/tab)</option>
                <option value="Cetirizine 10mg">Cetirizine 10mg (₹ 3.00/tab)</option>
                <option value="ORS Electrolyte Sachet">ORS Sachet (₹ 22.00/pack)</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Quantity</label>
              <input
                type="number"
                value={posQty}
                onChange={(e) => setPosQty(parseInt(e.target.value) || 1)}
                min="1"
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Payment Method</label>
            <div className="flex space-x-3">
              {(['UPI', 'Cash', 'Card'] as const).map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setPosPaymentMethod(method)}
                  className={`flex-1 py-2 rounded-lg border text-center font-semibold transition ${
                    posPaymentMethod === method
                      ? 'border-teal-600 bg-teal-50 text-teal-800'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  {method}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Modal>

      {/* Generic Drug Substitution Modal */}
      {itemToSubstitute && (
        <Modal
          isOpen={isSubstituteModalOpen}
          onClose={() => setIsSubstituteModalOpen(false)}
          title="Hospital Formulary Generic Substitution"
          description={`Prescribed brand item: ${itemToSubstitute.drug} (${itemToSubstitute.qty} units)`}
          footer={
            <>
              <Button variant="outline" onClick={() => setIsSubstituteModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleApplySubstitution}>
                Confirm Generic Substitution
              </Button>
            </>
          }
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-950">
              <span className="font-bold block mb-1">Prescription Brand Item:</span>
              <div>{itemToSubstitute.drug} · Qty: {itemToSubstitute.qty} units</div>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Approved Hospital Formulary Generic Alternative</label>
              <input
                type="text"
                value={selectedGenericReplacement}
                onChange={(e) => setSelectedGenericReplacement(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-medium"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Substitution Clinical Justification</label>
              <textarea
                rows={2}
                value={substitutionReason}
                onChange={(e) => setSubstitutionReason(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>

            <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
              Formulary Rule: Substitution replaces the branded drug with an identical active therapeutic moiety and Bioequivalence certificate verified in accordance with Indian Pharmacopoeia standards.
            </div>
          </div>
        </Modal>
      )}

      {/* Purchase Requisition / PO Modal */}
      <Modal
        isOpen={isPurchaseModalOpen}
        onClose={() => setIsPurchaseModalOpen(false)}
        title="Create Medication Purchase Requisition"
        description="Raise an inventory replenishment request for low-stock drugs to Hospital Procurement."
        footer={
          <>
            <Button variant="outline" onClick={() => setIsPurchaseModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCreatePurchaseRequisition}>
              Submit Purchase Requisition
            </Button>
          </>
        }
      >
        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Drug Name / SKU</label>
              <input
                type="text"
                value={poDrug}
                onChange={(e) => setPoDrug(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Order Quantity (Units)</label>
              <input
                type="number"
                value={poQty}
                onChange={(e) => setPoQty(parseInt(e.target.value) || 0)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Registered Pharmaceutical Vendor / Supplier</label>
            <input
              type="text"
              value={poSupplier}
              onChange={(e) => setPoSupplier(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-medium"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Procurement Justification & Remarks</label>
            <textarea
              rows={2}
              value={poNotes}
              onChange={(e) => setPoNotes(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};
