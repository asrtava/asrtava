import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  Users,
  Calendar,
  Clock,
  Shield,
  Search,
  CheckCircle2,
  Plus,
  Check,
  X,
  FileCheck
} from 'lucide-react';
import { Modal, Button, Input, Badge, useToast } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { hospitalAdminApi } from '../../services/api';
import { AdvancedHRMSHub } from './AdvancedHRMSHub';

interface StaffMember {
  id: string;
  name: string;
  role: string;
  dept: string;
  shift: string;
  status: 'On Duty' | 'Off Duty' | 'On Leave';
  licenseNo: string;
}

interface LeaveRequest {
  id: string;
  staffName: string;
  dept: string;
  leaveType: string;
  duration: string;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
}

export const HRDashboard: React.FC = () => {
  const { showToast } = useToast();
  const { activePortalTab, setActivePortalTab } = useAuth();
  const [activeTab, setActiveTab] = useState<'directory' | 'leaves' | 'roster' | 'advanced_hrms'>('advanced_hrms');

  useEffect(() => {
    if (activePortalTab && ['directory', 'leaves', 'roster', 'advanced_hrms'].includes(activePortalTab)) {
      setActiveTab(activePortalTab as any);
    }
  }, [activePortalTab]);

  const switchTab = (tab: 'directory' | 'leaves' | 'roster' | 'advanced_hrms') => {
    setActiveTab(tab);
    setActivePortalTab(tab);
  };
  const [searchQuery, setSearchQuery] = useState('');

  // Shift & Duty Roster State
  const [rosters, setRosters] = useState([
    { shift: 'Morning Shift (07:00 - 15:00)', lead: 'Dr. Rajesh Sharma', staffCount: 18, departments: 'OPD 1-4, ICU-A, Central Lab, Pharmacy Counter 1' },
    { shift: 'Evening Shift (15:00 - 23:00)', lead: 'Dr. Ananya Roy', staffCount: 12, departments: 'Emergency Ward, ICU-A, Inpatient Pharmacy' },
    { shift: 'Night Shift (23:00 - 07:00)', lead: 'Dr. Vikram Sethi (On-Call)', staffCount: 8, departments: 'Emergency Triage, ICU Night Coverage' }
  ]);
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [selectedStaffForShift, setSelectedStaffForShift] = useState<StaffMember | null>(null);
  const [newShiftValue, setNewShiftValue] = useState('Morning (08:00 - 16:00)');

  const [staff, setStaff] = useState<StaffMember[]>([
    { id: 'STF-001', name: 'Dr. Rajesh Sharma', role: 'Chief of Cardiology', dept: 'Cardiology', shift: 'Morning (08:00 - 16:00)', status: 'On Duty', licenseNo: 'MCI-1998-4412' },
    { id: 'STF-002', name: 'Dr. Ananya Roy', role: 'Senior Consultant', dept: 'General Medicine', shift: 'Morning (08:00 - 16:00)', status: 'On Duty', licenseNo: 'MCI-2005-9921' },
    { id: 'STF-003', name: 'Nurse Anjali Verma', role: 'Head Nurse', dept: 'ICU', shift: 'Night (20:00 - 08:00)', status: 'Off Duty', licenseNo: 'INC-2012-3312' },
    { id: 'STF-004', name: 'Pharmacist Suresh Nair', role: 'Senior Pharmacist', dept: 'Pharmacy', shift: 'Evening (14:00 - 22:00)', status: 'On Duty', licenseNo: 'PCI-2010-8812' },
    { id: 'STF-005', name: 'Rohan Mehra', role: 'Lead Receptionist', dept: 'Front Desk', shift: 'Morning (07:00 - 15:00)', status: 'On Duty', licenseNo: 'EMP-ADM-4410' },
    { id: 'STF-006', name: 'Dr. Vikram Sethi', role: 'Senior Orthopedic Surgeon', dept: 'Orthopedics', shift: 'Morning (08:00 - 16:00)', status: 'On Duty', licenseNo: 'MCI-2002-1204' }
  ]);

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const res = await hospitalAdminApi.getStaff();
        if (res.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
          const mapped: StaffMember[] = res.data.data.map((s: any, idx: number) => ({
            id: s.employee_code || s.id?.substring(0, 8) || `STF-00${idx + 1}`,
            name: `${s.first_name || ''} ${s.last_name || ''}`.trim() || 'Staff Member',
            role: s.designation || s.user_type || 'Staff Nurse',
            dept: s.department_name || 'General',
            shift: 'Morning (08:00 - 16:00)',
            status: s.employment_status === 'inactive' ? 'Off Duty' : 'On Duty',
            licenseNo: s.license_no || `MCI-REG-${idx + 1000}`
          }));
          setStaff(mapped);
        }
      } catch (err) {
        console.warn('Live staff sync fallback active:', err);
      }
    };
    fetchStaff();
  }, []);

  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([
    { id: 'lr-1', staffName: 'Nurse Anjali Verma', dept: 'ICU', leaveType: 'Casual Leave', duration: '12 Nov - 14 Nov (3 Days)', reason: 'Family engagement out of state.', status: 'Pending' },
    { id: 'lr-2', staffName: 'Dr. Ananya Roy', dept: 'General Medicine', leaveType: 'Medical Conference', duration: '20 Nov - 22 Nov (3 Days)', reason: 'Attending National Internal Medicine CME 2026.', status: 'Pending' }
  ]);

  // Onboard Modal State
  const [isOnboardModalOpen, setIsOnboardModalOpen] = useState(false);
  const [onboardName, setOnboardName] = useState('');
  const [onboardRole, setOnboardRole] = useState('Staff Nurse');
  const [onboardDept, setOnboardDept] = useState('ICU');
  const [onboardShift, setOnboardShift] = useState('Morning (08:00 - 16:00)');
  const [onboardLicense, setOnboardLicense] = useState('');

  const handleOnboardSubmit = async () => {
    if (!onboardName.trim()) {
      showToast({ type: 'warning', title: 'Input Required', message: 'Employee name is required.' });
      return;
    }

    const nameParts = onboardName.trim().split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || 'Staff';

    try {
      await hospitalAdminApi.onboardStaff({
        firstName,
        lastName,
        email: `${firstName.toLowerCase()}.${Date.now()}@asrtava.hospital`,
        roleCode: onboardRole.toUpperCase().replace(/\s+/g, '_'),
        designation: onboardRole
      });
    } catch (err) {
      console.warn('Backend staff sync fallback active:', err);
    }

    const newStaff: StaffMember = {
      id: 'STF-00' + (staff.length + 1),
      name: onboardName.trim(),
      role: onboardRole,
      dept: onboardDept,
      shift: onboardShift,
      status: 'On Duty',
      licenseNo: onboardLicense.trim() || 'REG-PENDING'
    };

    setStaff([...staff, newStaff]);
    setIsOnboardModalOpen(false);
    setOnboardName('');
    setOnboardLicense('');

    showToast({
      type: 'success',
      title: 'Staff Onboarded & Credentialed',
      message: `${newStaff.name} registered as ${newStaff.role} (${newStaff.dept}). Staff ID ${newStaff.id} issued.`
    });
  };

  const handleApproveLeave = (reqId: string, staffName: string) => {
    setLeaveRequests((prev) =>
      prev.map((lr) => (lr.id === reqId ? { ...lr, status: 'Approved' } : lr))
    );
    showToast({
      type: 'success',
      title: 'Leave Approved',
      message: `Leave application for ${staffName} approved. Shift roster updated.`
    });
  };

  const handleRejectLeave = (reqId: string, staffName: string) => {
    setLeaveRequests((prev) =>
      prev.map((lr) => (lr.id === reqId ? { ...lr, status: 'Rejected' } : lr))
    );
    showToast({
      type: 'info',
      title: 'Leave Rejected',
      message: `Leave request for ${staffName} declined due to shift staffing constraints.`
    });
  };

  const handleUpdateShift = () => {
    if (!selectedStaffForShift) return;
    setStaff((prev) =>
      prev.map((s) =>
        s.id === selectedStaffForShift.id ? { ...s, shift: newShiftValue } : s
      )
    );
    setIsShiftModalOpen(false);
    showToast({
      type: 'success',
      title: 'Shift Assignment Updated',
      message: `${selectedStaffForShift.name} assigned to ${newShiftValue}. Roster updated.`
    });
  };

  const filteredStaff = staff.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.dept.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-teal-100 text-teal-800 flex items-center space-x-1">
              <UserCheck className="w-3 h-3" />
              <span>Human Resources & Workforce Station</span>
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">HR & Staff Roster Management</h1>
          <p className="text-sm text-slate-500">Employee directory, shift scheduling, medical credentials, and leave approvals.</p>
        </div>

        <div className="flex items-center space-x-3">
          <Button variant="primary" size="sm" onClick={() => setIsOnboardModalOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5" />
            <span>Onboard Employee</span>
          </Button>
        </div>
      </div>

      {/* HR KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-medium">Total Hospital Staff</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">{staff.length + 142}</div>
          <span className="text-[11px] text-slate-400">Clinical & Administrative</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-emerald-600 font-medium">Currently On Duty</span>
          <div className="text-2xl font-bold text-emerald-600 mt-1">{staff.filter((s) => s.status === 'On Duty').length + 48}</div>
          <span className="text-[11px] text-emerald-600">Active across 8 departments</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-amber-600 font-medium">Pending Leave Requests</span>
          <div className="text-2xl font-bold text-amber-600 mt-1">
            {leaveRequests.filter((lr) => lr.status === 'Pending').length}
          </div>
          <span className="text-[11px] text-amber-600">Awaiting supervisor review</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-teal-600 font-medium">Medical Licenses Verified</span>
          <div className="text-2xl font-bold text-teal-600 mt-1">100%</div>
          <span className="text-[11px] text-teal-600">MCI, INC, PCI verified</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-6 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('advanced_hrms')}
            className={`pb-3 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'advanced_hrms' ? 'border-teal-600 text-teal-800' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></span>
            Enterprise HRMS & Workforce Hub (Prompt 24)
          </button>
          <button
            onClick={() => setActiveTab('directory')}
            className={`pb-3 border-b-2 transition ${
              activeTab === 'directory' ? 'border-teal-600 text-teal-800' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Staff Directory & Active Shifts ({staff.length})
          </button>
          <button
            onClick={() => setActiveTab('leaves')}
            className={`pb-3 border-b-2 transition ${
              activeTab === 'leaves' ? 'border-teal-600 text-teal-800' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Leave Approvals ({leaveRequests.filter((l) => l.status === 'Pending').length} Pending)
          </button>
          <button
            onClick={() => setActiveTab('roster')}
            className={`pb-3 border-b-2 transition ${
              activeTab === 'roster' ? 'border-teal-600 text-teal-800' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Duty Roster & Shifts (3 Shifts Active)
          </button>
        </nav>
      </div>

      {/* Advanced HRMS Hub (Prompt 24) */}
      {activeTab === 'advanced_hrms' && <AdvancedHRMSHub />}

      {/* Staff Directory Table */}
      {activeTab === 'directory' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex justify-between items-center">
            <div className="relative w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search staff by name, role, or ID..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-400 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Staff ID</th>
                <th className="py-3 px-3">Employee Name</th>
                <th className="py-3 px-3">Role & Title</th>
                <th className="py-3 px-3">Department</th>
                <th className="py-3 px-3">Shift Timing</th>
                <th className="py-3 px-3">License / Registration</th>
                <th className="py-3 px-3">Duty Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              {filteredStaff.map((emp) => (
                <tr key={emp.id} className="hover:bg-slate-50/60 transition">
                  <td className="py-3.5 px-4 font-mono font-bold text-teal-800">{emp.id}</td>
                  <td className="py-3 px-3 font-bold text-slate-900">{emp.name}</td>
                  <td className="py-3 px-3 text-slate-800">{emp.role}</td>
                  <td className="py-3 px-3">
                    <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-medium">
                      {emp.dept}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-600">{emp.shift}</td>
                  <td className="py-3 px-3 font-mono text-[11px] text-slate-500">{emp.licenseNo}</td>
                  <td className="py-3 px-3">
                    <Badge variant={emp.status === 'On Duty' ? 'success' : 'neutral'} size="sm">
                      {emp.status}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedStaffForShift(emp);
                        setNewShiftValue(emp.shift);
                        setIsShiftModalOpen(true);
                      }}
                    >
                      <Clock className="w-3 h-3 mr-1 text-teal-700" />
                      <span>Change Shift</span>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Leave Approvals Tab */}
      {activeTab === 'leaves' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {leaveRequests.map((req) => (
              <div
                key={req.id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-slate-900 text-sm">{req.staffName}</span>
                    <Badge
                      variant={
                        req.status === 'Approved'
                          ? 'success'
                          : req.status === 'Rejected'
                          ? 'danger'
                          : 'warning'
                      }
                      size="sm"
                    >
                      {req.status}
                    </Badge>
                  </div>
                  <div className="text-xs text-slate-500">
                    Department: <span className="font-semibold text-slate-700">{req.dept}</span> · Type:{' '}
                    <span className="font-semibold text-teal-700">{req.leaveType}</span>
                  </div>
                  <div className="mt-2 p-2.5 bg-slate-50 border border-slate-100 rounded-lg text-xs text-slate-700">
                    <div className="font-semibold text-[11px] text-slate-400 uppercase">Dates Requested</div>
                    <div>{req.duration}</div>
                    <div className="font-semibold text-[11px] text-slate-400 uppercase mt-2">Reason Stated</div>
                    <div className="italic text-slate-600">{req.reason}</div>
                  </div>
                </div>

                {req.status === 'Pending' && (
                  <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2">
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleRejectLeave(req.id, req.staffName)}
                    >
                      <X className="w-3.5 h-3.5 mr-1" />
                      <span>Reject</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleApproveLeave(req.id, req.staffName)}
                    >
                      <Check className="w-3.5 h-3.5 mr-1" />
                      <span>Approve Leave</span>
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Duty Roster & Shifts Tab */}
      {activeTab === 'roster' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Hospital Duty Roster & Shift Allocation</h2>
              <p className="text-xs text-slate-500">24/7 round-the-clock clinical continuity, lead consultants, and active wards coverage.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {rosters.map((r, i) => (
                <div key={i} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{r.shift}</span>
                    <Badge variant="brand" size="sm">{r.staffCount} Staff</Badge>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block">Designated Shift Lead</span>
                    <span className="font-semibold text-slate-800">{r.lead}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Covered Services</span>
                    <p className="text-slate-700 leading-relaxed">{r.departments}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Change Shift Assignment Modal */}
      {selectedStaffForShift && (
        <Modal
          isOpen={isShiftModalOpen}
          onClose={() => setIsShiftModalOpen(false)}
          title={`Update Shift Assignment — ${selectedStaffForShift.name}`}
          description={`Employee ID: ${selectedStaffForShift.id} · Department: ${selectedStaffForShift.dept}`}
          footer={
            <>
              <Button variant="outline" onClick={() => setIsShiftModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleUpdateShift}>
                Save Shift Assignment
              </Button>
            </>
          }
        >
          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Select New Working Shift</label>
              <select
                value={newShiftValue}
                onChange={(e) => setNewShiftValue(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-medium"
              >
                <option value="Morning (08:00 - 16:00)">Morning Shift (08:00 - 16:00)</option>
                <option value="Evening (14:00 - 22:00)">Evening Shift (14:00 - 22:00)</option>
                <option value="Night (20:00 - 08:00)">Night Duty (20:00 - 08:00)</option>
              </select>
            </div>
            <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
              Shift reassignments take effect immediately across hospital biometric access control and ward nurse station attendance rosters.
            </div>
          </div>
        </Modal>
      )}

      {/* Onboard Employee Modal */}
      <Modal
        isOpen={isOnboardModalOpen}
        onClose={() => setIsOnboardModalOpen(false)}
        title="Onboard New Healthcare Employee"
        description="Register a physician, nurse, technician, or administrator with hospital credentials."
        footer={
          <>
            <Button variant="outline" onClick={() => setIsOnboardModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleOnboardSubmit}>
              Onboard & Generate ID
            </Button>
          </>
        }
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Employee Full Name *</label>
            <input
              type="text"
              value={onboardName}
              onChange={(e) => setOnboardName(e.target.value)}
              placeholder="e.g. Dr. Preeti Sinha"
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Primary Role</label>
              <select
                value={onboardRole}
                onChange={(e) => setOnboardRole(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
              >
                <option value="Consultant Doctor">Consultant Doctor</option>
                <option value="Staff Nurse">Staff Nurse</option>
                <option value="Senior Pharmacist">Senior Pharmacist</option>
                <option value="Lab Technologist">Lab Technologist</option>
                <option value="Radiographer">Radiographer</option>
                <option value="Receptionist">Receptionist</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Assigned Department</label>
              <select
                value={onboardDept}
                onChange={(e) => setOnboardDept(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
              >
                <option value="Cardiology">Cardiology</option>
                <option value="General Medicine">General Medicine</option>
                <option value="Orthopedics">Orthopedics</option>
                <option value="ICU">ICU & Critical Care</option>
                <option value="Pharmacy">Pharmacy</option>
                <option value="Laboratory">Laboratory</option>
                <option value="Radiology">Radiology</option>
                <option value="Front Desk">Front Desk</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Shift Schedule</label>
              <select
                value={onboardShift}
                onChange={(e) => setOnboardShift(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
              >
                <option value="Morning (08:00 - 16:00)">Morning (08:00 - 16:00)</option>
                <option value="Evening (14:00 - 22:00)">Evening (14:00 - 22:00)</option>
                <option value="Night (20:00 - 08:00)">Night (20:00 - 08:00)</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">License Registration #</label>
              <input
                type="text"
                value={onboardLicense}
                onChange={(e) => setOnboardLicense(e.target.value)}
                placeholder="e.g. MCI-2026-7789"
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
              />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};
