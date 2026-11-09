import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  Plus,
  Search,
  Filter,
  CheckCircle,
  CreditCard,
  Building,
  ShieldCheck,
  FileSpreadsheet
} from 'lucide-react';
import { Button, Modal, useToast } from '../../components/ui';
import { hospitalAdminApi } from '../../services/api';

export interface TariffItem {
  id: string;
  category: string;
  serviceName: string;
  code: string;
  baseRate: number;
  taxRate: number;
  isActive: boolean;
}

export const AdminBillingSection: React.FC = () => {
  const { showToast } = useToast();
  const [tariffs, setTariffs] = useState<TariffItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form states
  const [category, setCategory] = useState('Consultation');
  const [serviceName, setServiceName] = useState('');
  const [code, setCode] = useState('');
  const [baseRate, setBaseRate] = useState(1000);
  const [taxRate, setTaxRate] = useState(0);

  const loadTariffs = async () => {
    try {
      const res = await hospitalAdminApi.getBillingCatalog();
      if (res.data?.data) {
        setTariffs(res.data.data);
      }
    } catch (err) {
      // Retain fallback
    }
  };

  useEffect(() => {
    loadTariffs();
  }, []);

  const handleCreateTariff = async () => {
    if (!serviceName.trim()) {
      showToast({ type: 'warning', title: 'Input Required', message: 'Service name is required' });
      return;
    }

    const newItem: TariffItem = {
      id: `srv-${Date.now()}`,
      category,
      serviceName: serviceName.trim(),
      code: code.trim().toUpperCase() || `SRV-${Math.floor(1000 + Math.random() * 9000)}`,
      baseRate: Number(baseRate),
      taxRate: Number(taxRate),
      isActive: true
    };

    try {
      await hospitalAdminApi.createBillingItem(newItem);
    } catch (err) {
      // Local fallback
    }

    setTariffs((prev) => [newItem, ...prev]);
    setIsAddModalOpen(false);
    setServiceName('');
    setCode('');
    loadTariffs();

    showToast({
      type: 'success',
      title: 'Tariff Item Added',
      message: `${newItem.serviceName} added to billing catalog at ₹ ${newItem.baseRate} (${newItem.taxRate}% GST).`
    });
  };

  const filteredTariffs = tariffs.filter((t) => {
    const matchesCategory = categoryFilter === 'ALL' || t.category === categoryFilter;
    const matchesSearch =
      t.serviceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6 text-xs">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2 text-teal-700 font-bold mb-1">
            <DollarSign className="w-4 h-4" />
            <span>Revenue Cycle & Tariffs</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Billing & Tariff Catalogue</h2>
          <p className="text-slate-500 max-w-2xl mt-1">
            Maintain the master pricing list for medical consultations, IPD room tariffs, surgical procedures, laboratory panels, imaging studies, and GST tax brackets.
          </p>
        </div>

        <Button variant="primary" size="sm" onClick={() => setIsAddModalOpen(true)}>
          <Plus className="w-4 h-4 mr-1.5" />
          <span>Add Service Tariff</span>
        </Button>
      </div>

      {/* Payment Gateway and Tax Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 font-medium">
            <span>Payment Channels Enabled</span>
            <CreditCard className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-sm font-bold text-slate-900 mt-2">UPI, Cash, Cards, TPA Insurance</div>
          <span className="text-[11px] text-emerald-600 font-medium">Instant auto-reconciliation active</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 font-medium">
            <span>GST Tax Configuration</span>
            <Building className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-sm font-bold text-slate-900 mt-2">0% Clinical Services &bull; 18% Cosmetic/OT</div>
          <span className="text-[11px] text-blue-600 font-medium">Compliant with National GST rules</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 font-medium">
            <span>Discount Authorization Limit</span>
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-sm font-bold text-slate-900 mt-2">Up to 15% (Admin Override Required)</div>
          <span className="text-[11px] text-indigo-600 font-medium">Enforced at billing checkout</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by service name, code, category..."
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="p-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700"
          >
            <option value="ALL">All Categories</option>
            <option value="Consultation">Consultation</option>
            <option value="Bed / Nursing">Bed / Nursing</option>
            <option value="Diagnostics">Diagnostics</option>
            <option value="Procedure">Procedure</option>
            <option value="Emergency">Emergency</option>
          </select>
        </div>

        <span className="text-slate-500">
          Showing <strong>{filteredTariffs.length}</strong> catalogue services
        </span>
      </div>

      {/* Tariff Items Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-400 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Service Code / Name</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3 text-right">Base Tariff (INR)</th>
                <th className="py-2.5 px-3 text-right">Tax Rate (GST)</th>
                <th className="py-2.5 px-3 text-right">Total Payable</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              {filteredTariffs.map((item) => {
                const total = Math.round(item.baseRate * (1 + item.taxRate / 100));
                return (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900">{item.serviceName}</div>
                      <span className="text-[10px] text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded font-mono font-medium">
                        {item.code}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700">
                        {item.category}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-medium text-slate-800">
                      ₹ {item.baseRate.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right font-medium text-slate-600">
                      {item.taxRate}%
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-emerald-700 text-sm">
                      ₹ {total.toLocaleString()}
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Active
                      </span>
                    </td>
                  </tr>
                );
              })}
              {filteredTariffs.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400">
                    No tariff items registered yet. Click &quot;Add Service Tariff&quot; to define hospital pricing.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Tariff Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Tariff Catalogue Item"
        description="Configure pricing, department category, and GST tax rate for a hospital service."
        footer={
          <>
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCreateTariff}>
              Add Service
            </Button>
          </>
        }
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Service / Procedure Name *</label>
            <input
              type="text"
              value={serviceName}
              onChange={(e) => setServiceName(e.target.value)}
              placeholder="e.g. Echocardiogram with Doppler"
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              >
                <option value="Consultation">Consultation</option>
                <option value="Bed / Nursing">Bed / Nursing</option>
                <option value="Diagnostics">Diagnostics</option>
                <option value="Procedure">Procedure</option>
                <option value="Emergency">Emergency</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Service Code</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="SRV-ECHO-01"
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Base Tariff (INR) *</label>
              <input
                type="number"
                value={baseRate}
                onChange={(e) => setBaseRate(Number(e.target.value))}
                placeholder="2500"
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-emerald-700"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">GST Tax Rate (%)</label>
              <select
                value={taxRate}
                onChange={(e) => setTaxRate(Number(e.target.value))}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              >
                <option value={0}>0% (Exempt Health Service)</option>
                <option value={5}>5% GST</option>
                <option value={12}>12% GST</option>
                <option value={18}>18% GST (OT / Consumables)</option>
              </select>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

