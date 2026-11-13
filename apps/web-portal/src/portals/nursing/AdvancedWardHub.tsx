import React, { useState, useEffect } from 'react';
import {
  BedDouble,
  Building2,
  Layers,
  CheckCircle2,
  Clock,
  Sparkles,
  AlertTriangle,
  UserCheck,
  Search,
  Filter,
  Plus,
  RefreshCw,
  Eye,
  Check,
  ChevronRight,
  ShieldAlert,
  Thermometer,
  Activity,
  Heart,
  Droplets,
  FileText,
  Trash2,
  Users
} from 'lucide-react';
import { Button, Input, Badge, useToast, Modal } from '../../components/ui';
import { useHospital } from '../../context/HospitalContext';

interface BedItem {
  id: string;
  bedNumber: string;
  roomNumber: string;
  wardName: string;
  wardType: string;
  dailyRate: number;
  status: 'available' | 'reserved' | 'occupied' | 'cleaning_required' | 'cleaning_in_progress' | 'maintenance' | 'blocked';
  currentPatientName?: string;
  currentUhid?: string;
  genderRestriction: string;
  hasOxygen: boolean;
  hasVentilator: boolean;
  hasCardiacMonitor: boolean;
  isIsolation: boolean;
}

interface AdmissionRequestItem {
  id: string;
  patientName: string;
  uhid: string;
  source: string;
  priority: 'ROUTINE' | 'URGENT' | 'STAT_EMERGENCY';
  requiredWardType: string;
  diagnosis: string;
  isolationRequired: boolean;
  requestedAt: string;
  status: 'REQUESTED' | 'APPROVED' | 'WAITLISTED';
}

interface HousekeepingTaskItem {
  id: string;
  bedNumber: string;
  roomNumber: string;
  wardName: string;
  taskType: 'ROUTINE' | 'TERMINAL' | 'ISOLATION';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  assignedStaff?: string;
  requestedAt: string;
}

export const AdvancedWardHub: React.FC = () => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'grid' | 'requests' | 'housekeeping' | 'discharge' | 'visitors'>('grid');
  const [wardFilter, setWardFilter] = useState('ALL');

  const { beds: hospitalBeds } = useHospital();
  // Beds State
  const [beds, setBeds] = useState<BedItem[]>([]);

  useEffect(() => {
    if (hospitalBeds && hospitalBeds.length > 0) {
      setBeds(
        hospitalBeds.map((b) => ({
          id: b.id,
          bedNumber: b.bedNumber,
          roomNumber: b.wardName,
          wardName: b.wardName,
          wardType: b.wardName.toUpperCase().includes('ICU') ? 'ICU' : 'MEDICAL',
          dailyRate: b.dailyRate || 2500,
          status: b.status.toLowerCase() as any,
          currentPatientName: b.patient?.name,
          currentUhid: b.patient?.uhid,
          genderRestriction: 'ANY',
          hasOxygen: true,
          hasVentilator: b.wardName.toUpperCase().includes('ICU'),
          hasCardiacMonitor: b.wardName.toUpperCase().includes('ICU'),
          isIsolation: false,
        }))
      );
    } else {
      setBeds([]);
    }
  }, [hospitalBeds]);

  // Admission Requests
  const [requests, setRequests] = useState<AdmissionRequestItem[]>([]);

  // Housekeeping Tasks
  const [cleaningTasks, setCleaningTasks] = useState<HousekeepingTaskItem[]>([]);

  // Computed Metrics
  const totalBeds = beds.length;
  const availableBeds = beds.filter((b) => b.status === 'available').length;
  const occupiedBeds = beds.filter((b) => b.status === 'occupied').length;
  const reservedBeds = beds.filter((b) => b.status === 'reserved').length;
  const cleaningBeds = beds.filter((b) => b.status.includes('cleaning')).length;
  const icuAvailable = beds.filter((b) => b.wardType === 'ICU' && b.status === 'available').length;

  // Actions
  const handleApproveInspection = (taskId: string, bedNumber: string) => {
    setCleaningTasks((prev) => prev.filter((t) => t.id !== taskId));
    setBeds((prev) =>
      prev.map((b) => (b.bedNumber === bedNumber ? { ...b, status: 'available' } : b))
    );
    showToast({
      type: 'success',
      title: 'Supervisor Inspection Approved',
      message: `${bedNumber} terminal sanitization verified and bed released to Available on live grid.`,
    });
  };

  const filteredBeds = wardFilter === 'ALL' ? beds : beds.filter((b) => b.wardType === wardFilter);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white p-5 rounded-2xl shadow-md border border-teal-800/40">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-teal-500/20 text-teal-300 border border-teal-500/30 flex items-center space-x-1">
                <BedDouble className="w-3 h-3" />
                <span>Enterprise Inpatient & Ward Operations Suite</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                NABH / JCI Inpatient Standard
              </span>
            </div>
            <h2 className="text-xl font-bold mt-2 tracking-tight">Complete Ward, Bed & Patient Flow Management</h2>
            <p className="text-xs text-slate-300 mt-0.5">
              Live bed matrix, anti-collision allocation locks, transfer handovers, housekeeping turnover & discharge planning.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="px-3 py-1.5 bg-slate-800/80 rounded-lg border border-slate-700 text-xs">
              <span className="text-slate-400">Total Inpatient Beds: </span>
              <span className="font-mono font-bold text-teal-300">{totalBeds} Beds</span>
            </div>
            <div className="px-3 py-1.5 bg-slate-800/80 rounded-lg border border-slate-700 text-xs">
              <span className="text-slate-400">Live Occupancy: </span>
              <span className="font-mono font-bold text-emerald-300">
                {Math.round((occupiedBeds / totalBeds) * 100)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-medium block">Available Beds</span>
          <div className="text-2xl font-bold text-emerald-600 font-mono mt-0.5">{availableBeds}</div>
          <span className="text-[10px] text-emerald-700">Ready for intake</span>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-medium block">Occupied Beds</span>
          <div className="text-2xl font-bold text-slate-900 font-mono mt-0.5">{occupiedBeds}</div>
          <span className="text-[10px] text-slate-500">Active inpatients</span>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-medium block">Reserved Beds</span>
          <div className="text-2xl font-bold text-amber-600 font-mono mt-0.5">{reservedBeds}</div>
          <span className="text-[10px] text-amber-700">Holding with expiry</span>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-medium block">Awaiting Cleaning</span>
          <div className="text-2xl font-bold text-rose-600 font-mono mt-0.5">{cleaningBeds}</div>
          <span className="text-[10px] text-rose-700">Housekeeping queued</span>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-medium block">ICU Availability</span>
          <div className="text-2xl font-bold text-indigo-700 font-mono mt-0.5">{icuAvailable}</div>
          <span className="text-[10px] text-indigo-800">Critical care ready</span>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-medium block">Pending Requests</span>
          <div className="text-2xl font-bold text-teal-700 font-mono mt-0.5">{requests.length}</div>
          <span className="text-[10px] text-teal-800">OPD & ED queue</span>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('grid')}
          className={`px-3 py-2 text-xs font-semibold rounded-lg transition flex items-center space-x-1.5 ${
            activeTab === 'grid' ? 'bg-teal-700 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Visual Bed Matrix ({beds.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`px-3 py-2 text-xs font-semibold rounded-lg transition flex items-center space-x-1.5 ${
            activeTab === 'requests' ? 'bg-teal-700 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Admission Requests ({requests.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('housekeeping')}
          className={`px-3 py-2 text-xs font-semibold rounded-lg transition flex items-center space-x-1.5 ${
            activeTab === 'housekeeping' ? 'bg-teal-700 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Housekeeping Turnover ({cleaningTasks.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('discharge')}
          className={`px-3 py-2 text-xs font-semibold rounded-lg transition flex items-center space-x-1.5 ${
            activeTab === 'discharge' ? 'bg-teal-700 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Discharge Planning & Release</span>
        </button>
        <button
          onClick={() => setActiveTab('visitors')}
          className={`px-3 py-2 text-xs font-semibold rounded-lg transition flex items-center space-x-1.5 ${
            activeTab === 'visitors' ? 'bg-teal-700 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Visitor Passes</span>
        </button>
      </div>

      {/* Tab 1: Visual Bed Matrix */}
      {activeTab === 'grid' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-slate-600">Filter Ward:</span>
              <select
                value={wardFilter}
                onChange={(e) => setWardFilter(e.target.value)}
                className="bg-white border border-slate-200 text-xs font-semibold px-3 py-1.5 rounded-lg text-slate-700 shadow-sm"
              >
                <option value="ALL">All Ward Categories</option>
                <option value="ICU">Intensive Care Unit (ICU)</option>
                <option value="MEDICAL">Medical Wards</option>
                <option value="PRIVATE">Private Deluxe Suites</option>
                <option value="ISOLATION">Infectious Isolation</option>
              </select>
            </div>
            <span className="text-xs text-slate-500">Live Concurrency Row-Locks Active</span>
          </div>

          {filteredBeds.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-xl border border-slate-200 shadow-sm">
              <BedDouble className="w-12 h-12 mx-auto mb-3 text-teal-600 opacity-50" />
              <h3 className="text-base font-bold text-slate-800">No Inpatient Beds Configured</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                Hospital beds can be configured and managed in the Hospital Admin Wards &amp; Beds station. Once added, live bed status and patient allocations will appear here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {filteredBeds.map((bed) => (
                <div
                  key={bed.id}
                  className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:border-teal-400 transition space-y-3"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-900 text-sm">{bed.bedNumber}</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                          {bed.roomNumber}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{bed.wardName}</div>
                    </div>
                    <Badge
                      variant={
                        bed.status === 'available'
                          ? 'success'
                          : bed.status === 'occupied'
                          ? 'neutral'
                          : bed.status === 'reserved'
                          ? 'brand'
                          : 'danger'
                      }
                      size="sm"
                    >
                      {bed.status.replace(/_/g, ' ')}
                    </Badge>
                  </div>

                  {bed.status === 'occupied' ? (
                    <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-0.5">
                      <div className="font-bold text-slate-900">{bed.currentPatientName}</div>
                      <div className="text-[11px] font-mono text-slate-500">{bed.currentUhid}</div>
                    </div>
                  ) : bed.status === 'reserved' ? (
                    <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs space-y-0.5 text-amber-900">
                      <div className="font-bold">Holding for {bed.currentPatientName}</div>
                      <div className="text-[10px] text-amber-700">Reservation active for 45 mins</div>
                    </div>
                  ) : bed.status === 'cleaning_required' ? (
                    <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs space-y-0.5 text-rose-900">
                      <div className="font-bold">Terminal Cleaning Required</div>
                      <div className="text-[10px] text-rose-700">Awaiting sanitization & inspection</div>
                    </div>
                  ) : (
                    <div className="p-2.5 bg-emerald-50/60 border border-emerald-200 rounded-lg text-xs text-emerald-900 font-medium">
                      Clean, inspected and ready for immediate intake.
                    </div>
                  )}

                  <div className="flex flex-wrap gap-1 text-[10px] font-medium text-slate-600 pt-2 border-t border-slate-100">
                    {bed.hasOxygen && <span className="px-1.5 py-0.2 bg-slate-100 rounded">O2 Port</span>}
                    {bed.hasVentilator && <span className="px-1.5 py-0.2 bg-indigo-50 text-indigo-700 font-bold rounded">Ventilator</span>}
                    {bed.hasCardiacMonitor && <span className="px-1.5 py-0.2 bg-teal-50 text-teal-700 rounded">Cardiac Monitor</span>}
                    {bed.isIsolation && <span className="px-1.5 py-0.2 bg-rose-50 text-rose-700 font-bold rounded">Negative Pressure</span>}
                    <span className="ml-auto font-mono text-slate-500">₹{bed.dailyRate}/day</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Admission Requests */}
      {activeTab === 'requests' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Inpatient Admission Requests Queue</h3>
              <p className="text-xs text-slate-500">
                Submitted by OPD and Emergency clinicians. Bed allocation checks isolation and clinical equipment needs.
              </p>
            </div>
          </div>

          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Priority & Source</th>
                <th className="py-3 px-3">Patient Details</th>
                <th className="py-3 px-4">Provisional Diagnosis</th>
                <th className="py-3 px-3">Required Unit</th>
                <th className="py-3 px-3">Isolation Need</th>
                <th className="py-3 px-4 text-right">Triage Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              {requests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400">
                    <UserCheck className="w-8 h-8 mx-auto mb-2 text-teal-600 opacity-50" />
                    <p className="font-semibold text-slate-700">No Admission Requests Pending</p>
                    <p className="text-xs text-slate-400 mt-0.5">Admissions requested by OPD or Emergency clinicians will appear here for ward bed assignment.</p>
                  </td>
                </tr>
              ) : (
                requests.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/60">
                    <td className="py-3.5 px-4">
                      <span
                        className={`font-bold px-2 py-0.5 rounded text-[10px] block w-fit mb-1 ${
                          r.priority === 'STAT_EMERGENCY'
                            ? 'bg-rose-100 text-rose-800 border border-rose-200 animate-pulse'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {r.priority.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">{r.source} · {r.requestedAt}</span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900">{r.patientName}</div>
                      <div className="text-[11px] font-mono text-slate-400">{r.uhid}</div>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{r.diagnosis}</td>
                    <td className="py-3 px-3 font-medium text-teal-900">{r.requiredWardType}</td>
                    <td className="py-3 px-3">
                      {r.isolationRequired ? (
                        <span className="text-rose-600 font-bold flex items-center">
                          <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                          Isolation Required
                        </span>
                      ) : (
                        <span className="text-slate-500">Standard</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <Button size="sm" variant="primary">
                        Allocate Bed
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 3: Housekeeping Turnover */}
      {activeTab === 'housekeeping' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Bed Turnover & Housekeeping Inspection Board</h3>
              <p className="text-xs text-slate-500">
                Vacated beds remain in sanitization until a supervisor completes inspection and signs off on release.
              </p>
            </div>
          </div>

          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Bed & Room</th>
                <th className="py-3 px-3">Ward Location</th>
                <th className="py-3 px-3">Cleaning Type</th>
                <th className="py-3 px-3">Assigned Housekeeper</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-right">Supervisor Inspection</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              {cleaningTasks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400">
                    <Sparkles className="w-8 h-8 mx-auto mb-2 text-teal-600 opacity-50" />
                    <p className="font-semibold text-slate-700">All Beds Sanitized & Ready</p>
                    <p className="text-xs text-slate-400 mt-0.5">Terminal sanitization tasks triggered on patient discharge will appear here for housekeeping inspection.</p>
                  </td>
                </tr>
              ) : (
                cleaningTasks.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/60">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{t.bedNumber}</div>
                      <div className="text-[11px] text-slate-400">{t.roomNumber}</div>
                    </td>
                    <td className="py-3 px-3 text-slate-800 font-medium">{t.wardName}</td>
                    <td className="py-3 px-3">
                      <span className="font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded text-[10px]">
                        {t.taskType} TURNOVER
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-700">{t.assignedStaff}</td>
                    <td className="py-3 px-3">
                      <Badge variant="warning" size="sm">
                        {t.status}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleApproveInspection(t.id, t.bedNumber)}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                        Approve & Release to Available
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 4: Discharge Planning */}
      {activeTab === 'discharge' && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="border-b border-slate-200 pb-3 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Discharge Readiness & Barrier Tracking</h3>
              <p className="text-xs text-slate-500">
                Proactive multidisciplinary discharge planning initiated upon day 1 of admission.
              </p>
            </div>
            <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
              Financial Collection Decoupled from Clinical Summary
            </span>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="font-bold text-slate-900">Ramesh Verma (APEX-2026-00084)</span>
              <span className="font-mono text-slate-500">Estimated Discharge: Tomorrow, 11:00 AM</span>
            </div>
            <div className="text-slate-600">Diagnosis: CABG Off-Pump Recovery · Bed: ICU-Bed 01</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-2 border-t border-slate-200">
              <label className="flex items-center space-x-2">
                <input type="checkbox" checked={true} readOnly className="rounded text-teal-600" />
                <span>Medication Reconciliation Completed</span>
              </label>
              <label className="flex items-center space-x-2">
                <input type="checkbox" checked={true} readOnly className="rounded text-teal-600" />
                <span>Wound Dressing & Drain Care Taught</span>
              </label>
              <label className="flex items-center space-x-2">
                <input type="checkbox" checked={false} readOnly className="rounded text-teal-600" />
                <span>Pending Final Echocardiogram</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Visitor Passes */}
      {activeTab === 'visitors' && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="border-b border-slate-200 pb-3 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Ward Visitor & Attendant Security Passes</h3>
              <p className="text-xs text-slate-500">
                Time-windowed gate passes enforcing hospital visiting hour policies and ward security limits.
              </p>
            </div>
            <Button size="sm" variant="outline">
              <Plus className="w-3.5 h-3.5 mr-1" />
              Issue Visitor Pass
            </Button>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="font-mono font-bold text-teal-800">Pass # VP-2026-8912</span>
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px]">ACTIVE PASS</span>
            </div>
            <div className="font-semibold text-slate-900">Visitor: Manisha Verma (Spouse)</div>
            <div className="text-slate-500">Inpatient: Ramesh Verma · Bed: ICU-Bed 01</div>
            <div className="text-[11px] text-slate-400 font-mono">Visiting Hours: 04:00 PM – 07:00 PM · Authorized Bay Access Only</div>
          </div>
        </div>
      )}
    </div>
  );
};

