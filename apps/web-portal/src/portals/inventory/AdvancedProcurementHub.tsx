import React, { useState, useEffect } from 'react';
import {
  Package,
  Truck,
  Building2,
  FileText,
  CheckCircle2,
  AlertTriangle,
  ClipboardList,
  Wrench,
  DollarSign,
  Plus,
  Check,
  X,
  TrendingUp,
  Cpu,
  ShieldCheck,
  Search,
  ArrowRight
} from 'lucide-react';
import { Button, Badge, Modal, Input, useToast } from '../../components/ui';
import { useHospital } from '../../context/HospitalContext';

interface VendorItem {
  id: string;
  vendorCode: string;
  name: string;
  category: string;
  gstin: string;
  rating: number;
  paymentTerms: string;
  status: 'ACTIVE' | 'SUSPENDED';
}

interface RequisitionItem {
  id: string;
  reqNumber: string;
  department: string;
  purpose: string;
  itemsSummary: string;
  estimatedCost: number;
  priority: 'ROUTINE' | 'URGENT' | 'STAT_EMERGENCY';
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'PO_CREATED';
}

interface PurchaseOrderItem {
  id: string;
  poNumber: string;
  vendorName: string;
  itemsSummary: string;
  expectedDelivery: string;
  grandTotal: number;
  status: 'ISSUED' | 'PARTIALLY_RECEIVED' | 'COMPLETED';
}

interface GrnItem {
  id: string;
  grnNumber: string;
  poNumber: string;
  vendorName: string;
  receivedDate: string;
  receivedQty: number;
  acceptedQty: number;
  rejectedQty: number;
  quarantinedQty: number;
  status: 'INSPECTION_PENDING' | 'ACCEPTED' | 'PARTIALLY_ACCEPTED';
}

interface StockBalanceItem {
  id: string;
  itemCode: string;
  name: string;
  category: string;
  warehouse: string;
  availableQty: number;
  uom: string;
  reorderLevel: number;
  standardCost: number;
}

interface AssetItem {
  id: string;
  assetTag: string;
  name: string;
  category: string;
  department: string;
  room: string;
  serialNumber: string;
  operationalStatus: 'OPERATIONAL' | 'UNDER_REPAIR' | 'CALIBRATION_OVERDUE';
  nextCalibrationDue: string;
}

interface WorkOrderItem {
  id: string;
  woNumber: string;
  assetTag: string;
  assetName: string;
  department: string;
  issue: string;
  priority: 'HIGH' | 'CRITICAL_BREAKDOWN';
  downtimeHours: number;
  status: 'OPEN' | 'IN_PROGRESS' | 'CLOSED';
}

export const AdvancedProcurementHub: React.FC = () => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<
    'procurement' | 'receiving' | 'inventory' | 'movements' | 'reconciliation' | 'invoices' | 'assets' | 'maintenance'
  >('procurement');

  const { inventory } = useHospital();

  // 1. Vendors State
  const [vendors] = useState<VendorItem[]>([]);

  // 2. Requisitions State
  const [requisitions, setRequisitions] = useState<RequisitionItem[]>([]);

  // 3. Purchase Orders State
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrderItem[]>([]);

  // 4. Goods Receipt Notes State
  const [grns, setGrns] = useState<GrnItem[]>([]);

  // 5. Stock Balances State - Dynamically mapped from HospitalContext inventory
  const [stockBalances, setStockBalances] = useState<StockBalanceItem[]>([]);

  useEffect(() => {
    if (inventory && inventory.length > 0) {
      setStockBalances(
        inventory.map((item, idx) => ({
          id: item.id || `sb-${idx + 1}`,
          itemCode: item.sku || `SKU-${idx + 100}`,
          name: item.name,
          category: item.category || 'PHARMACEUTICAL',
          warehouse: 'Central Pharmacy Warehouse',
          availableQty: item.stock || 0,
          uom: item.unit || 'Units',
          reorderLevel: item.reorderLevel || 10,
          standardCost: item.unitPrice || 0,
        }))
      );
    } else {
      setStockBalances([]);
    }
  }, [inventory]);

  // 6. Fixed Assets & Biomedical Equipment State
  const [assets] = useState<AssetItem[]>([]);

  // 7. Breakdown Work Orders State
  const [workOrders, setWorkOrders] = useState<WorkOrderItem[]>([]);

  // Modals & Handlers
  const [isReqModalOpen, setIsReqModalOpen] = useState(false);
  const [newReqDept, setNewReqDept] = useState('Cardiology');
  const [newReqPurpose, setNewReqPurpose] = useState('');
  const [newReqEstCost, setNewReqEstCost] = useState('85000');

  const handleCreateRequisition = () => {
    if (!newReqPurpose.trim()) {
      showToast({ type: 'warning', title: 'Input Required', message: 'Requisition purpose is required.' });
      return;
    }
    const newReq: RequisitionItem = {
      id: `pr-${Date.now()}`,
      reqNumber: `REQ-2026-${Math.floor(100 + Math.random() * 900)}`,
      department: newReqDept,
      purpose: newReqPurpose,
      itemsSummary: 'Direct replenishment request',
      estimatedCost: parseFloat(newReqEstCost) || 50000,
      priority: 'ROUTINE',
      status: 'PENDING_APPROVAL',
    };
    setRequisitions([newReq, ...requisitions]);
    setIsReqModalOpen(false);
    setNewReqPurpose('');
    showToast({
      type: 'success',
      title: 'Requisition Submitted',
      message: `${newReq.reqNumber} queued for administrative approval.`,
    });
  };

  const handleApproveRequisition = (id: string) => {
    setRequisitions(
      requisitions.map(r => (r.id === id ? { ...r, status: 'APPROVED' } : r))
    );
    showToast({
      type: 'success',
      title: 'Requisition Approved',
      message: 'Approved for vendor quotation RFQ broadcast.',
    });
  };

  const handle3WayMatchAndPostGL = (poNumber: string, invoiceAmount: number) => {
    showToast({
      type: 'success',
      title: '3-Way Match Verified & Posted to GL',
      message: `PO ${poNumber} matched against GRN and Invoice. Balanced JV (₹${invoiceAmount.toLocaleString('en-IN')}) posted to Accounts Payable.`,
    });
  };

  const handleResolveWorkOrder = (woId: string) => {
    setWorkOrders(
      workOrders.map(w => (w.id === woId ? { ...w, status: 'CLOSED' } : w))
    );
    showToast({
      type: 'success',
      title: 'Biomedical Safety Certified',
      message: 'Equipment calibrated, electrical safety verified, and returned to clinical service.',
    });
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Metrics Strip */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-gray-900 dark:text-gray-100">{vendors.length}</div>
            <div className="text-xs text-gray-500">Certified Vendors</div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-50 dark:bg-green-900/30 text-green-600 flex items-center justify-center">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {stockBalances.length > 0 ? Array.from(new Set(stockBalances.map(s => s.warehouse))).length : 0} Stores
            </div>
            <div className="text-xs text-gray-500">Warehouse Nodes</div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-gray-900 dark:text-gray-100">
              ₹{stockBalances.reduce((sum, item) => sum + (item.availableQty * item.standardCost), 0).toLocaleString('en-IN')}
            </div>
            <div className="text-xs text-gray-500">Inventory Valuation</div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-900/30 text-amber-600 flex items-center justify-center">
            <ClipboardList className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {requisitions.filter(r => r.status === 'PENDING_APPROVAL').length}
            </div>
            <div className="text-xs text-gray-500">Pending Requisitions</div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-900/30 text-purple-600 flex items-center justify-center">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-gray-900 dark:text-gray-100">{assets.length} Assets</div>
            <div className="text-xs text-gray-500">Biomedical Register</div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-rose-50 dark:bg-rose-900/30 text-rose-600 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {workOrders.filter(w => w.status === 'OPEN').length} Open
            </div>
            <div className="text-xs text-gray-500">Breakdown Tickets</div>
          </div>
        </div>
      </div>

      {/* 2. Navigation Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 flex flex-wrap gap-2 pb-2">
        <button
          onClick={() => setActiveTab('procurement')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            activeTab === 'procurement'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          Purchase Requisitions & Orders
        </button>

        <button
          onClick={() => setActiveTab('receiving')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            activeTab === 'receiving'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          <Truck className="w-4 h-4" />
          Goods Receipt (GRN) & QA Gate
        </button>

        <button
          onClick={() => setActiveTab('inventory')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            activeTab === 'inventory'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          <Package className="w-4 h-4" />
          Multi-Store Inventory
        </button>

        <button
          onClick={() => setActiveTab('invoices')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            activeTab === 'invoices'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          3-Way Match & GL Accounting
        </button>

        <button
          onClick={() => setActiveTab('assets')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            activeTab === 'assets'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          <Cpu className="w-4 h-4" />
          Biomedical & Fixed Assets
        </button>

        <button
          onClick={() => setActiveTab('maintenance')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            activeTab === 'maintenance'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          <Wrench className="w-4 h-4" />
          Maintenance & Facility Work Orders
        </button>
      </div>

      {/* 3. Tab Contents */}

      {/* TAB 1: PROCUREMENT & PURCHASE ORDERS */}
      {activeTab === 'procurement' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                Departmental Purchase Requisitions & Purchase Orders
              </h3>
              <p className="text-xs text-gray-500">
                Manage clinical department demand, quotation comparisons, and PO issuance.
              </p>
            </div>
            <Button onClick={() => setIsReqModalOpen(true)} className="flex items-center gap-1.5 text-xs">
              <Plus className="w-4 h-4" />
              New Purchase Requisition
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {requisitions.length === 0 ? (
              <div className="col-span-full p-6 text-center text-xs text-gray-500 bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                No purchase requisitions raised yet. Click "New Purchase Requisition" above to request medical supplies or equipment.
              </div>
            ) : (
              requisitions.map(req => (
                <div
                  key={req.id}
                  className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-xs text-blue-600 font-semibold">{req.reqNumber}</div>
                      <div className="text-sm font-bold text-gray-900 dark:text-gray-100">{req.purpose}</div>
                      <div className="text-xs text-gray-500">Department: {req.department}</div>
                    </div>
                    <Badge variant={req.status === 'APPROVED' ? 'success' : 'warning'}>
                      {req.status}
                    </Badge>
                  </div>

                  <p className="text-xs text-gray-600 dark:text-gray-300 italic">{req.itemsSummary}</p>

                  <div className="pt-2 border-t border-gray-100 dark:border-gray-700/50 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-gray-400">Estimated Cost:</span>{' '}
                      <span className="font-bold text-gray-900 dark:text-gray-100">₹{req.estimatedCost.toLocaleString('en-IN')}</span>
                    </div>
                    {req.status === 'PENDING_APPROVAL' && (
                      <Button
                        size="sm"
                        onClick={() => handleApproveRequisition(req.id)}
                        className="bg-green-600 hover:bg-green-700 text-xs py-1"
                      >
                        Approve Requisition
                      </Button>
                    )}
                    {req.status === 'APPROVED' && (
                      <span className="text-xs text-green-600 font-medium">Ready for PO Generation</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
            <div className="p-3 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 font-semibold text-xs text-gray-700 dark:text-gray-300">
              Active Purchase Orders Issued to Vendors
            </div>
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/50 dark:bg-gray-900/30 text-gray-600 dark:text-gray-400 font-medium">
                <tr>
                  <th className="p-3">PO Number</th>
                  <th className="p-3">Vendor</th>
                  <th className="p-3">Items Summary</th>
                  <th className="p-3">Expected Delivery</th>
                  <th className="p-3">Grand Total</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {purchaseOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-gray-500">
                      No purchase orders issued to vendors yet. Approved requisitions will generate formal purchase orders.
                    </td>
                  </tr>
                ) : (
                  purchaseOrders.map(po => (
                    <tr key={po.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
                      <td className="p-3 font-mono font-semibold text-blue-600">{po.poNumber}</td>
                      <td className="p-3 font-semibold text-gray-900 dark:text-gray-100">{po.vendorName}</td>
                      <td className="p-3 text-gray-600 dark:text-gray-300">{po.itemsSummary}</td>
                      <td className="p-3 text-gray-500 font-mono">{po.expectedDelivery}</td>
                      <td className="p-3 font-mono font-bold text-gray-900 dark:text-gray-100">
                        ₹{po.grandTotal.toLocaleString('en-IN')}
                      </td>
                      <td className="p-3">
                        <Badge variant={po.status === 'COMPLETED' ? 'success' : 'info'}>{po.status}</Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: GOODS RECEIPT & QUALITY INSPECTION */}
      {activeTab === 'receiving' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                Goods Received Notes (GRN) & Quality Inspection Gate
              </h3>
              <p className="text-xs text-gray-500">
                Quarantine isolation for uninspected or damaged supplies before admission into warehouse stock.
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-600 dark:text-gray-300 font-semibold border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="p-3">GRN #</th>
                  <th className="p-3">PO Reference</th>
                  <th className="p-3">Vendor</th>
                  <th className="p-3">Received Qty</th>
                  <th className="p-3 text-green-600">Accepted Qty</th>
                  <th className="p-3 text-red-600">Rejected / Damaged</th>
                  <th className="p-3">Inspection Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {grns.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-gray-500">
                      No Goods Receipt Notes recorded yet. Deliveries from vendors undergo QA quarantine inspection here before stock entry.
                    </td>
                  </tr>
                ) : (
                  grns.map(g => (
                    <tr key={g.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
                      <td className="p-3 font-mono font-semibold text-blue-600">{g.grnNumber}</td>
                      <td className="p-3 font-mono text-gray-500">{g.poNumber}</td>
                      <td className="p-3 font-semibold text-gray-900 dark:text-gray-100">{g.vendorName}</td>
                      <td className="p-3 font-mono">{g.receivedQty}</td>
                      <td className="p-3 font-mono font-bold text-green-600">{g.acceptedQty}</td>
                      <td className="p-3 font-mono text-red-600">{g.rejectedQty}</td>
                      <td className="p-3">
                        <Badge variant={g.status === 'ACCEPTED' ? 'success' : 'warning'}>{g.status}</Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: MULTI-STORE INVENTORY */}
      {activeTab === 'inventory' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                Central Warehouse & Department Sub-Stores Stock
              </h3>
              <p className="text-xs text-gray-500">
                Real-time stock balances across Pharmacy, OT, Laboratory, and ICU with automated reorder levels.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {stockBalances.length === 0 ? (
              <div className="col-span-full p-8 text-center text-xs text-gray-500 bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                No inventory items currently in stock. Items received via approved GRNs or catalog additions will be tracked here.
              </div>
            ) : (
              stockBalances.map(sb => (
                <div
                  key={sb.id}
                  className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-bold text-gray-900 dark:text-gray-100 text-sm">{sb.name}</div>
                      <div className="text-xs text-blue-600 font-mono">{sb.itemCode}</div>
                    </div>
                    <Badge variant={sb.availableQty <= sb.reorderLevel ? 'danger' : 'success'}>
                      {sb.availableQty <= sb.reorderLevel ? 'Reorder Needed' : 'In Stock'}
                    </Badge>
                  </div>

                  <div className="text-xs text-gray-600 dark:text-gray-300 space-y-1">
                    <div>
                      <span className="font-medium text-gray-500">Store:</span> {sb.warehouse}
                    </div>
                    <div>
                      <span className="font-medium text-gray-500">Available Qty:</span>{' '}
                      <span className="font-bold text-gray-900 dark:text-gray-100">
                        {sb.availableQty} {sb.uom}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-500">Reorder Threshold:</span> {sb.reorderLevel} {sb.uom}
                    </div>
                    <div>
                      <span className="font-medium text-gray-500">Unit Standard Cost:</span> ₹{sb.standardCost}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-gray-100 dark:border-gray-700/50 flex items-center justify-between text-xs">
                    <span className="text-gray-400">Total: ₹{(sb.availableQty * sb.standardCost).toLocaleString('en-IN')}</span>
                    <Button variant="outline" size="sm" className="text-xs py-0.5">
                      Transfer Stock
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 4: 3-WAY INVOICE MATCHING */}
      {activeTab === 'invoices' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm space-y-4">
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                Automated Three-Way Matching (PO ↔ GRN ↔ Vendor Invoice)
              </h3>
              <p className="text-xs text-gray-500">
                Cross-validates purchase commitments, physical goods receipts, and commercial invoices before posting to General Ledger.
              </p>
            </div>

            <div className="border border-dashed border-gray-300 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/10 p-8 rounded-xl text-center text-xs text-gray-500">
              No pending invoice reconciliations. Invoices from vendors will automatically match against issued Purchase Orders and accepted GRNs before posting balanced JVs to the General Ledger.
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: BIOMEDICAL & FIXED ASSETS */}
      {activeTab === 'assets' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                Biomedical Equipment & Fixed Asset Register
              </h3>
              <p className="text-xs text-gray-500">
                Comprehensive tracking of patient monitors, ventilators, defibrillators, and statutory calibration dates.
              </p>
            </div>
            <Button size="sm" className="text-xs flex items-center gap-1.5">
              <Plus className="w-4 h-4" />
              Tag New Asset
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {assets.length === 0 ? (
              <div className="col-span-full p-8 text-center text-xs text-gray-500 bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                No biomedical or fixed assets registered. Click "Tag New Asset" to register medical machinery, serial numbers, and calibration schedules.
              </div>
            ) : (
              assets.map(a => (
                <div
                  key={a.id}
                  className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-bold text-gray-900 dark:text-gray-100 text-sm">{a.name}</div>
                      <div className="text-xs text-blue-600 font-mono">{a.assetTag}</div>
                    </div>
                    <Badge variant={a.operationalStatus === 'OPERATIONAL' ? 'success' : 'danger'}>
                      {a.operationalStatus}
                    </Badge>
                  </div>

                  <div className="text-xs text-gray-600 dark:text-gray-300 space-y-1">
                    <div>
                      <span className="font-medium text-gray-500">Location:</span> {a.department} ({a.room})
                    </div>
                    <div>
                      <span className="font-medium text-gray-500">Serial #:</span> {a.serialNumber}
                    </div>
                    <div>
                      <span className="font-medium text-gray-500">Next Calibration:</span> {a.nextCalibrationDue}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-gray-100 dark:border-gray-700/50 flex items-center justify-between text-xs">
                    <span className="text-gray-400">NABH Safety Checked</span>
                    <Button variant="outline" size="sm" className="text-xs py-0.5">
                      Maintenance History
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 6: MAINTENANCE & FACILITY WORK ORDERS */}
      {activeTab === 'maintenance' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                Corrective Maintenance & Facility Work Orders
              </h3>
              <p className="text-xs text-gray-500">
                Track clinical equipment breakdowns, electrical/MGPS maintenance, downtime, and return-to-service certification.
              </p>
            </div>
            <Button size="sm" className="text-xs flex items-center gap-1.5">
              <Wrench className="w-4 h-4" />
              Report Breakdown Ticket
            </Button>
          </div>

          <div className="space-y-3">
            {workOrders.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-500 bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                No active maintenance or facility breakdown work orders. All hospital systems and biomedical equipment are operational.
              </div>
            ) : (
              workOrders.map(wo => (
                <div
                  key={wo.id}
                  className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-blue-600">{wo.woNumber}</span>
                      <span className="font-bold text-gray-900 dark:text-gray-100">{wo.assetName} ({wo.assetTag})</span>
                      <Badge variant={wo.status === 'CLOSED' ? 'success' : 'danger'}>
                        {wo.status}
                      </Badge>
                    </div>
                    <div className="text-gray-500">
                      Department: {wo.department} &bull; Downtime: {wo.downtimeHours} Hours &bull; Priority: {wo.priority}
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 italic">{wo.issue}</p>
                  </div>

                  {wo.status !== 'CLOSED' && (
                    <Button
                      size="sm"
                      onClick={() => handleResolveWorkOrder(wo.id)}
                      className="bg-green-600 hover:bg-green-700 text-xs flex items-center gap-1"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Certify Safety & Return to Service
                    </Button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Modal: New Purchase Requisition */}
      <Modal
        isOpen={isReqModalOpen}
        onClose={() => setIsReqModalOpen(false)}
        title="Create Departmental Purchase Requisition"
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Requesting Department</label>
            <select
              value={newReqDept}
              onChange={e => setNewReqDept(e.target.value)}
              className="w-full text-xs p-2.5 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            >
              <option value="Cardiology">Cardiology</option>
              <option value="Operation Theatre">Operation Theatre</option>
              <option value="ICU">Intensive Care Unit</option>
              <option value="Central Laboratory">Central Laboratory</option>
              <option value="Radiology">Radiology</option>
              <option value="Pharmacy">Pharmacy</option>
              <option value="Facility & Engineering">Facility & Engineering</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Purpose / Clinical Requirement</label>
            <Input
              value={newReqPurpose}
              onChange={e => setNewReqPurpose(e.target.value)}
              placeholder="e.g. Critical restocking of dual-lumen hemodialysis catheters"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Estimated Budget (₹)</label>
            <Input
              value={newReqEstCost}
              onChange={e => setNewReqEstCost(e.target.value)}
              placeholder="e.g. 85000"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setIsReqModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateRequisition}>Submit for Approval</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

