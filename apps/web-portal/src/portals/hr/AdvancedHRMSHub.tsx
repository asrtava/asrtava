import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Briefcase,
  Clock,
  Calendar,
  DollarSign,
  Award,
  LogOut,
  CheckCircle2,
  AlertTriangle,
  FileText,
  ShieldCheck,
  Building2,
  Check,
  X,
  Plus,
  ArrowRight,
  TrendingUp,
  Cpu
} from 'lucide-react';
import { Button, Badge, Modal, Input, useToast } from '../../components/ui';
import { useHospital } from '../../context/HospitalContext';

interface EmployeeRecord {
  id: string;
  employeeNumber: string;
  name: string;
  department: string;
  designation: string;
  employmentType: string;
  employmentStatus: 'ACTIVE' | 'PROBATION' | 'SUSPENDED' | 'RESIGNED';
  dateOfJoining: string;
  phone: string;
  email: string;
  bloodGroup: string;
  emergencyContact: string;
  isAccountLinked: boolean;
}

interface RequisitionRecord {
  id: string;
  requisitionNumber: string;
  department: string;
  designation: string;
  vacancies: number;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'OPEN' | 'PENDING_APPROVAL' | 'FULFILLED';
  appliedCount: number;
}

interface AttendancePunch {
  id: string;
  employeeName: string;
  time: string;
  punchType: 'CHECK_IN' | 'CHECK_OUT';
  source: 'BIOMETRIC_DEVICE' | 'WEB_PORTAL' | 'MOBILE';
  verificationMode: string;
  status: 'NORMAL' | 'ANOMALY';
}

interface DutyRosterItem {
  id: string;
  date: string;
  employeeName: string;
  department: string;
  shiftName: string;
  shiftHours: string;
  role: string;
}

interface LeaveRecord {
  id: string;
  employeeName: string;
  leaveType: string;
  dates: string;
  days: number;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

interface PayslipSummary {
  id: string;
  employeeNumber: string;
  employeeName: string;
  basicEarned: number;
  hraEarned: number;
  allowances: number;
  pfDeduction: number;
  ptDeduction: number;
  tdsDeduction: number;
  netPayable: number;
  status: 'CALCULATED' | 'APPROVED' | 'PAID';
}

interface CredentialRecord {
  id: string;
  employeeName: string;
  type: string;
  licenseNumber: string;
  authority: string;
  expiryDate: string;
  daysRemaining: number;
  status: 'VERIFIED' | 'EXPIRING_SOON' | 'EXPIRED';
}

interface SeparationRecord {
  id: string;
  employeeName: string;
  resignationDate: string;
  relievingDate: string;
  handoverDone: boolean;
  assetsReturned: boolean;
  accessRevoked: boolean;
  status: 'IN_CLEARANCE' | 'CLOSED';
}

export const AdvancedHRMSHub: React.FC = () => {
  const { showToast } = useToast();
  const { staff } = useHospital();
  const [activeTab, setActiveTab] = useState<
    'workforce' | 'recruitment' | 'attendance' | 'rostering' | 'leaves' | 'payroll' | 'credentials' | 'separation'
  >('workforce');

  // 1. Workforce Directory State
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);

  useEffect(() => {
    if (staff && staff.length > 0) {
      setEmployees(
        staff.map((s, idx) => ({
          id: s.id || `emp-${idx + 101}`,
          employeeNumber: `EMP-${(s.role || 'STF').slice(0, 3).toUpperCase()}-${idx + 101}`,
          name: s.name,
          department: s.department || 'General',
          designation: s.role || 'Staff Member',
          employmentType: 'FULL_TIME',
          employmentStatus: s.status === 'On Duty' ? 'ACTIVE' : s.status === 'On Leave' ? 'PROBATION' : 'ACTIVE',
          dateOfJoining: '2026-01-01',
          phone: s.phone || '+91 98000 00000',
          email: s.email || `${s.name.toLowerCase().replace(/[^a-z]/g, '')}@asrtava-health.in`,
          bloodGroup: 'B+',
          emergencyContact: 'Family Contact',
          isAccountLinked: true,
        }))
      );
    }
  }, [staff]);

  // 2. Recruitment State
  const [requisitions, setRequisitions] = useState<RequisitionRecord[]>([]);

  // 3. Attendance Punch Log State
  const [punches, setPunches] = useState<AttendancePunch[]>([]);

  // 4. Shift Rostering State
  const [rosters, setRosters] = useState<DutyRosterItem[]>([]);

  // 5. Leave Applications State
  const [leaves, setLeaves] = useState<LeaveRecord[]>([]);

  // 6. Monthly Payroll Batch State
  const [payrollBatch, setPayrollBatch] = useState<{
    batchCode: string;
    periodMonth: string;
    status: 'DRAFT' | 'CALCULATED' | 'APPROVED' | 'POSTED_TO_GL';
    totalGross: number;
    totalDeductions: number;
    totalNet: number;
  }>({
    batchCode: 'PAY-2026-11-CORP',
    periodMonth: '2026-11',
    status: 'DRAFT',
    totalGross: 0,
    totalDeductions: 0,
    totalNet: 0,
  });

  const [payslips] = useState<PayslipSummary[]>([]);

  // 7. Professional Credentials State
  const [credentials, setCredentials] = useState<CredentialRecord[]>([]);

  // 8. Employee Separation State
  const [separations, setSeparations] = useState<SeparationRecord[]>([]);

  // Modal Handlers
  const [isAddEmpModalOpen, setIsAddEmpModalOpen] = useState(false);
  const [newEmpName, setNewEmpName] = useState('');
  const [newEmpDept, setNewEmpDept] = useState('Cardiology');
  const [newEmpDesig, setNewEmpDesig] = useState('Junior Resident');
  const [newEmpSalary, setNewEmpSalary] = useState('65000');

  const handleAddEmployee = () => {
    if (!newEmpName.trim()) {
      showToast({ type: 'warning', title: 'Input Required', message: 'Employee name is required.' });
      return;
    }
    const newEmp: EmployeeRecord = {
      id: `emp-${Date.now()}`,
      employeeNumber: `EMP-${Math.floor(100 + Math.random() * 900)}`,
      name: newEmpName,
      department: newEmpDept,
      designation: newEmpDesig,
      employmentType: 'FULL_TIME',
      employmentStatus: 'PROBATION',
      dateOfJoining: new Date().toISOString().split('T')[0],
      phone: '+91 99999 88888',
      email: `${newEmpName.toLowerCase().replace(/\s+/g, '.')}@asrtava-health.in`,
      bloodGroup: 'B+',
      emergencyContact: 'Next of Kin (+91 99999 77777)',
      isAccountLinked: false,
    };
    setEmployees([...employees, newEmp]);
    setIsAddEmpModalOpen(false);
    setNewEmpName('');
    showToast({
      type: 'success',
      title: 'Employee Registered',
      message: `${newEmp.name} (${newEmp.employeeNumber}) added to HR Master.`,
    });
  };

  const handleApproveLeave = (leaveId: string, approved: boolean) => {
    setLeaves(
      leaves.map(l => (l.id === leaveId ? { ...l, status: approved ? 'APPROVED' : 'REJECTED' } : l))
    );
    showToast({
      type: approved ? 'success' : 'info',
      title: approved ? 'Leave Approved' : 'Leave Rejected',
      message: `Leave application marked as ${approved ? 'APPROVED' : 'REJECTED'}. Balance deducted.`,
    });
  };

  const handlePostPayrollGL = () => {
    if (payrollBatch.status === 'POSTED_TO_GL') {
      showToast({ type: 'warning', title: 'Duplicate Guard', message: 'Batch already posted to General Ledger.' });
      return;
    }
    setPayrollBatch({ ...payrollBatch, status: 'POSTED_TO_GL' });
    showToast({
      type: 'success',
      title: 'General Ledger Posted',
      message: `Balanced Double-Entry JV posted (Debits: ₹${payrollBatch.totalGross} == Credits: ₹${payrollBatch.totalGross}).`,
    });
  };

  const handleRevokeAccessAndCloseSeparation = (sepId: string) => {
    setSeparations(
      separations.map(s => (s.id === sepId ? { ...s, accessRevoked: true, status: 'CLOSED' } : s))
    );
    showToast({
      type: 'info',
      title: 'Access Revoked & Separation Closed',
      message: 'System login deactivated immediately and session tokens invalidated.',
    });
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Metrics Strip */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-gray-900 dark:text-gray-100">{employees.length}</div>
            <div className="text-xs text-gray-500">Total Workforce</div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-50 dark:bg-green-900/30 text-green-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {employees.filter(e => e.employmentStatus === 'ACTIVE').length}
            </div>
            <div className="text-xs text-gray-500">Active Staff</div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-900/30 text-amber-600 flex items-center justify-center">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-gray-900 dark:text-gray-100">{requisitions.length}</div>
            <div className="text-xs text-gray-500">Open Requisitions</div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-900/30 text-purple-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-gray-900 dark:text-gray-100">{punches.length}</div>
            <div className="text-xs text-gray-500">Today's Check-ins</div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-rose-50 dark:bg-rose-900/30 text-rose-600 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {credentials.filter(c => c.status === 'EXPIRING_SOON').length}
            </div>
            <div className="text-xs text-gray-500">Expiring Licenses</div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-gray-900 dark:text-gray-100">₹{(payrollBatch.totalNet / 1000).toFixed(0)}k</div>
            <div className="text-xs text-gray-500">Monthly Net Payroll</div>
          </div>
        </div>
      </div>

      {/* 2. Navigation Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 flex flex-wrap gap-2 pb-2">
        <button
          onClick={() => setActiveTab('workforce')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            activeTab === 'workforce'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          <Users className="w-4 h-4" />
          Workforce Directory
        </button>

        <button
          onClick={() => setActiveTab('recruitment')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            activeTab === 'recruitment'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          Recruitment (ATS)
        </button>

        <button
          onClick={() => setActiveTab('attendance')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            activeTab === 'attendance'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          Biometric Attendance
        </button>

        <button
          onClick={() => setActiveTab('rostering')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            activeTab === 'rostering'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Shift Rostering
        </button>

        <button
          onClick={() => setActiveTab('leaves')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            activeTab === 'leaves'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          Leave Management
        </button>

        <button
          onClick={() => setActiveTab('payroll')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            activeTab === 'payroll'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          Payroll & GL
        </button>

        <button
          onClick={() => setActiveTab('credentials')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            activeTab === 'credentials'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          <Award className="w-4 h-4" />
          Credentials & Licenses
        </button>

        <button
          onClick={() => setActiveTab('separation')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            activeTab === 'separation'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          <LogOut className="w-4 h-4" />
          Exit & Access Revocation
        </button>
      </div>

      {/* 3. Tab Contents */}

      {/* TAB 1: WORKFORCE DIRECTORY */}
      {activeTab === 'workforce' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                Hospital Workforce Directory
              </h3>
              <p className="text-xs text-gray-500">
                Centralized master profile, demographics, department, and identity account linking.
              </p>
            </div>
            <Button onClick={() => setIsAddEmpModalOpen(true)} className="flex items-center gap-1.5 text-xs">
              <UserPlus className="w-4 h-4" />
              Onboard Employee
            </Button>
          </div>

          {employees.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 p-10 rounded-xl border border-gray-200 dark:border-gray-700 text-center shadow-sm">
              <Users className="w-10 h-10 mx-auto mb-2 text-blue-500 opacity-50" />
              <p className="font-semibold text-gray-800 dark:text-gray-200">No workforce personnel registered yet</p>
              <p className="text-xs text-gray-400 mt-1">Click &apos;Onboard Employee&apos; to register doctors, nurses, and administrative staff into the HR master.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {employees.map(emp => (
                <div
                  key={emp.id}
                  className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{emp.name}</div>
                      <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">{emp.employeeNumber}</div>
                    </div>
                    <Badge variant={emp.employmentStatus === 'ACTIVE' ? 'success' : 'warning'}>
                      {emp.employmentStatus}
                    </Badge>
                  </div>

                  <div className="text-xs text-gray-600 dark:text-gray-300 space-y-1">
                    <div>
                      <span className="font-medium text-gray-500">Dept:</span> {emp.department}
                    </div>
                    <div>
                      <span className="font-medium text-gray-500">Designation:</span> {emp.designation}
                    </div>
                    <div>
                      <span className="font-medium text-gray-500">Phone:</span> {emp.phone}
                    </div>
                    <div>
                      <span className="font-medium text-gray-500">Blood Group:</span> {emp.bloodGroup}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-gray-100 dark:border-gray-700/50 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-gray-500">
                      <ShieldCheck className={`w-3.5 h-3.5 ${emp.isAccountLinked ? 'text-green-500' : 'text-gray-400'}`} />
                      {emp.isAccountLinked ? 'Account Active' : 'Unlinked Profile'}
                    </div>
                    <span className="text-gray-400">Joined {emp.dateOfJoining}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: RECRUITMENT & ATS */}
      {activeTab === 'recruitment' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                Applicant Tracking System (ATS)
              </h3>
              <p className="text-xs text-gray-500">
                Manage clinical job requisitions, candidate evaluation rounds, and offer approvals.
              </p>
            </div>
            <Button className="flex items-center gap-1.5 text-xs">
              <Plus className="w-4 h-4" />
              New Requisition
            </Button>
          </div>

          {requisitions.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 p-10 rounded-xl border border-gray-200 dark:border-gray-700 text-center shadow-sm">
              <Briefcase className="w-10 h-10 mx-auto mb-2 text-amber-500 opacity-50" />
              <p className="font-semibold text-gray-800 dark:text-gray-200">No active job requisitions</p>
              <p className="text-xs text-gray-400 mt-1">Click &apos;New Requisition&apos; to initiate recruitment for open department vacancies.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {requisitions.map(req => (
                <div
                  key={req.id}
                  className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-xs text-blue-600 font-semibold">{req.requisitionNumber}</div>
                      <div className="text-base font-bold text-gray-900 dark:text-gray-100">{req.designation}</div>
                      <div className="text-xs text-gray-500">Department: {req.department}</div>
                    </div>
                    <Badge variant={req.priority === 'URGENT' ? 'danger' : 'warning'}>
                      {req.priority} PRIORITY
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-3 border-t border-gray-100 dark:border-gray-700/50">
                    <div className="text-gray-600 dark:text-gray-300">
                      <span className="font-semibold text-gray-900 dark:text-gray-100">{req.vacancies}</span> Vacancies &bull;{' '}
                      <span className="font-semibold text-blue-600">{req.appliedCount}</span> Applied
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" className="text-xs">
                        View Pipeline
                      </Button>
                      <Button size="sm" className="text-xs">
                        Schedule Interview
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: ATTENDANCE & BIOMETRIC */}
      {activeTab === 'attendance' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                Biometric Punch Events & Anomaly Monitoring
              </h3>
              <p className="text-xs text-gray-500">
                Live stream of biometric hardware sync, RFID punches, and manual correction requests.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="success" className="flex items-center gap-1">
                <Cpu className="w-3 h-3" />
                Biometric Terminals Connected
              </Badge>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-600 dark:text-gray-300 font-semibold border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="p-3">Staff Name</th>
                  <th className="p-3">Punch Type</th>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Source & Hardware Terminal</th>
                  <th className="p-3">Verification Mode</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {punches.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-400">
                      <Clock className="w-8 h-8 mx-auto mb-2 text-purple-400 opacity-50" />
                      <p className="font-medium text-gray-700 dark:text-gray-300">No Biometric Punch Logs Today</p>
                      <p className="text-xs text-gray-400 mt-0.5">Biometric terminals and web check-ins will display employee timestamp records here in real-time.</p>
                    </td>
                  </tr>
                ) : (
                  punches.map(p => (
                    <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
                      <td className="p-3 font-semibold text-gray-900 dark:text-gray-100">{p.employeeName}</td>
                      <td className="p-3">
                        <Badge variant={p.punchType === 'CHECK_IN' ? 'success' : 'info'}>
                          {p.punchType}
                        </Badge>
                      </td>
                      <td className="p-3 text-gray-600 dark:text-gray-300 font-mono">{p.time}</td>
                      <td className="p-3 text-gray-600 dark:text-gray-300">{p.source}</td>
                      <td className="p-3 text-gray-500">{p.verificationMode}</td>
                      <td className="p-3">
                        <span className="text-green-600 font-medium">Verified</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: SHIFT ROSTERING */}
      {activeTab === 'rostering' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                24/7 Clinical Duty Rosters & Conflict Engine
              </h3>
              <p className="text-xs text-gray-500">
                Prevent double-booking, enforce mandatory rest periods, and schedule on-call emergency duty.
              </p>
            </div>
            <Button size="sm" className="text-xs flex items-center gap-1.5">
              <Plus className="w-4 h-4" />
              Assign Duty Shift
            </Button>
          </div>

          {rosters.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 p-10 rounded-xl border border-gray-200 dark:border-gray-700 text-center shadow-sm">
              <Calendar className="w-10 h-10 mx-auto mb-2 text-indigo-500 opacity-50" />
              <p className="font-semibold text-gray-800 dark:text-gray-200">No shift rosters assigned for current period</p>
              <p className="text-xs text-gray-400 mt-1">Click &apos;Assign Duty Shift&apos; to schedule clinical coverage across wards and departments.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {rosters.map(ros => (
                <div
                  key={ros.id}
                  className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-bold text-gray-900 dark:text-gray-100 text-sm">{ros.shiftName}</div>
                      <div className="text-xs text-blue-600 font-medium">{ros.department}</div>
                    </div>
                    <Badge variant="info">{ros.shiftHours}</Badge>
                  </div>

                  <div className="text-xs text-gray-600 dark:text-gray-300 space-y-1">
                    <div>
                      <span className="font-medium text-gray-500">Assigned To:</span> {ros.employeeName}
                    </div>
                    <div>
                      <span className="font-medium text-gray-500">Roster Role:</span> {ros.role}
                    </div>
                    <div>
                      <span className="font-medium text-gray-500">Date:</span> {ros.date}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-gray-100 dark:border-gray-700/50 flex items-center justify-between text-xs text-green-600 font-medium">
                    <div className="flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Conflict Check Passed
                    </div>
                    <Button variant="outline" size="sm" className="text-xs py-0.5">
                      Duty Swap
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: LEAVE MANAGEMENT */}
      {activeTab === 'leaves' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                Staff Leave Applications & Approval Ledger
              </h3>
              <p className="text-xs text-gray-500">
                Dynamic balance tracking based on approved transactions with automatic carry-forward rules.
              </p>
            </div>
            <Button size="sm" className="text-xs flex items-center gap-1.5">
              <Plus className="w-4 h-4" />
              Apply Leave
            </Button>
          </div>

          {leaves.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 p-10 rounded-xl border border-gray-200 dark:border-gray-700 text-center shadow-sm">
              <FileText className="w-10 h-10 mx-auto mb-2 text-teal-500 opacity-50" />
              <p className="font-semibold text-gray-800 dark:text-gray-200">No pending leave requests</p>
              <p className="text-xs text-gray-400 mt-1">Employee leave applications and supervisor sign-offs will appear here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {leaves.map(lv => (
                <div
                  key={lv.id}
                  className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900 dark:text-gray-100 text-sm">{lv.employeeName}</span>
                      <Badge variant={lv.status === 'APPROVED' ? 'success' : lv.status === 'PENDING' ? 'warning' : 'danger'}>
                        {lv.status}
                      </Badge>
                    </div>
                    <div className="text-xs text-blue-600 font-medium">
                      {lv.leaveType} &bull; {lv.dates} ({lv.days} Days)
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-300 italic">{lv.reason}</p>
                  </div>

                  {lv.status === 'PENDING' && (
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleApproveLeave(lv.id, true)}
                        className="bg-green-600 hover:bg-green-700 text-xs flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Approve & Deduct
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleApproveLeave(lv.id, false)}
                        className="text-red-600 hover:bg-red-50 text-xs flex items-center gap-1"
                      >
                        <X className="w-3.5 h-3.5" />
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 6: PAYROLL & GENERAL LEDGER */}
      {activeTab === 'payroll' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 dark:border-gray-700 pb-4">
              <div>
                <div className="text-xs text-blue-600 font-semibold">{payrollBatch.batchCode}</div>
                <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  Monthly Payroll Run — {payrollBatch.periodMonth}
                </div>
                <div className="text-xs text-gray-500">
                  Status: <Badge variant={payrollBatch.status === 'POSTED_TO_GL' ? 'success' : 'info'}>{payrollBatch.status}</Badge>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  onClick={handlePostPayrollGL}
                  disabled={payrollBatch.status === 'POSTED_TO_GL'}
                  className="bg-emerald-600 hover:bg-emerald-700 text-xs flex items-center gap-1.5"
                >
                  <TrendingUp className="w-4 h-4" />
                  {payrollBatch.status === 'POSTED_TO_GL' ? 'Posted to General Ledger' : 'Post Balanced JV to General Ledger'}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-gray-50 dark:bg-gray-900/40 rounded-lg">
                <div className="text-xs text-gray-500">Total Gross Earned</div>
                <div className="text-lg font-bold text-gray-900 dark:text-gray-100">₹{payrollBatch.totalGross.toLocaleString('en-IN')}</div>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-900/40 rounded-lg">
                <div className="text-xs text-gray-500">Statutory Deductions (PF/PT/TDS)</div>
                <div className="text-lg font-bold text-red-600">₹{payrollBatch.totalDeductions.toLocaleString('en-IN')}</div>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-900/40 rounded-lg">
                <div className="text-xs text-gray-500">Net Payable Salaries</div>
                <div className="text-lg font-bold text-green-600">₹{payrollBatch.totalNet.toLocaleString('en-IN')}</div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
            <div className="p-3 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 font-semibold text-xs text-gray-700 dark:text-gray-300">
              Employee Payslip Summary (Batch {payrollBatch.batchCode})
            </div>
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/50 dark:bg-gray-900/30 text-gray-600 dark:text-gray-400 font-medium">
                <tr>
                  <th className="p-3">Employee</th>
                  <th className="p-3">Basic Pay</th>
                  <th className="p-3">HRA + Allowances</th>
                  <th className="p-3">PF (12%)</th>
                  <th className="p-3">Prof Tax</th>
                  <th className="p-3">TDS (IT)</th>
                  <th className="p-3">Net Disbursable</th>
                  <th className="p-3">Payslip</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {payslips.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-gray-400">
                      <DollarSign className="w-8 h-8 mx-auto mb-2 text-emerald-400 opacity-50" />
                      <p className="font-medium text-gray-700 dark:text-gray-300">No Payslips Generated</p>
                      <p className="text-xs text-gray-400 mt-0.5">Calculated payroll slips for active employees will appear here upon monthly cycle processing.</p>
                    </td>
                  </tr>
                ) : (
                  payslips.map(ps => (
                    <tr key={ps.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
                      <td className="p-3">
                        <div className="font-semibold text-gray-900 dark:text-gray-100">{ps.employeeName}</div>
                        <div className="text-xs text-gray-400">{ps.employeeNumber}</div>
                      </td>
                      <td className="p-3 font-mono">₹{ps.basicEarned.toLocaleString('en-IN')}</td>
                      <td className="p-3 font-mono">₹{(ps.hraEarned + ps.allowances).toLocaleString('en-IN')}</td>
                      <td className="p-3 font-mono text-red-600">₹{ps.pfDeduction.toLocaleString('en-IN')}</td>
                      <td className="p-3 font-mono text-red-600">₹{ps.ptDeduction.toLocaleString('en-IN')}</td>
                      <td className="p-3 font-mono text-red-600">₹{ps.tdsDeduction.toLocaleString('en-IN')}</td>
                      <td className="p-3 font-mono font-bold text-green-600">₹{ps.netPayable.toLocaleString('en-IN')}</td>
                      <td className="p-3">
                        <Button variant="outline" size="sm" className="text-xs py-0.5">
                          Download PDF
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 7: CREDENTIALS & LICENSES */}
      {activeTab === 'credentials' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                Medical & Nursing Professional Registrations
              </h3>
              <p className="text-xs text-gray-500">
                Monitor statutory license renewals, medical council registrations, and ACLS/BLS certifications.
              </p>
            </div>
            <Button size="sm" className="text-xs flex items-center gap-1.5">
              <Plus className="w-4 h-4" />
              Register Credential
            </Button>
          </div>

          {credentials.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 p-10 rounded-xl border border-gray-200 dark:border-gray-700 text-center shadow-sm">
              <Award className="w-10 h-10 mx-auto mb-2 text-rose-500 opacity-50" />
              <p className="font-semibold text-gray-800 dark:text-gray-200">No medical credentials logged yet</p>
              <p className="text-xs text-gray-400 mt-1">Click &apos;Register Credential&apos; to record NMC/State Medical Council and Nursing registrations.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {credentials.map(c => (
                <div
                  key={c.id}
                  className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{c.employeeName}</div>
                      <div className="text-xs text-gray-500">{c.type}</div>
                    </div>
                    <Badge variant={c.status === 'VERIFIED' ? 'success' : 'danger'}>
                      {c.status === 'EXPIRING_SOON' ? `${c.daysRemaining} Days Left` : c.status}
                    </Badge>
                  </div>

                  <div className="text-xs text-gray-600 dark:text-gray-300 space-y-1">
                    <div>
                      <span className="font-medium text-gray-500">License #:</span> {c.licenseNumber}
                    </div>
                    <div>
                      <span className="font-medium text-gray-500">Authority:</span> {c.authority}
                    </div>
                    <div>
                      <span className="font-medium text-gray-500">Expiry Date:</span> {c.expiryDate}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-gray-100 dark:border-gray-700/50 flex items-center justify-between text-xs">
                    <span className="text-gray-500">Mandatory for Clinical Practice</span>
                    <Button variant="outline" size="sm" className="text-xs py-0.5">
                      Verify Certificate
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 8: SEPARATION & ACCESS REVOCATION */}
      {activeTab === 'separation' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                Employee Separation & Instant Access Revocation
              </h3>
              <p className="text-xs text-gray-500">
                Departmental clearance sign-offs, asset return, and automated identity token deactivation.
              </p>
            </div>
            <Button size="sm" className="text-xs flex items-center gap-1.5">
              <LogOut className="w-4 h-4" />
              Initiate Resignation
            </Button>
          </div>

          {separations.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 p-10 rounded-xl border border-gray-200 dark:border-gray-700 text-center shadow-sm">
              <LogOut className="w-10 h-10 mx-auto mb-2 text-slate-400 opacity-50" />
              <p className="font-semibold text-gray-800 dark:text-gray-200">No active separation cases</p>
              <p className="text-xs text-gray-400 mt-1">Resignations, clearances, and identity deactivations will appear here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {separations.map(sep => (
                <div
                  key={sep.id}
                  className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900 dark:text-gray-100 text-sm">{sep.employeeName}</span>
                      <Badge variant={sep.status === 'CLOSED' ? 'success' : 'warning'}>
                        {sep.status}
                      </Badge>
                    </div>
                    <div className="text-xs text-gray-500">
                      Relieving Date: {sep.relievingDate} &bull; Handover:{' '}
                      <span className={sep.handoverDone ? 'text-green-600 font-medium' : 'text-amber-600'}>
                        {sep.handoverDone ? 'Completed' : 'Pending'}
                      </span>{' '}
                      &bull; Assets:{' '}
                      <span className={sep.assetsReturned ? 'text-green-600 font-medium' : 'text-amber-600'}>
                        {sep.assetsReturned ? 'Returned' : 'Pending'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      disabled={sep.accessRevoked}
                      onClick={() => handleRevokeAccessAndCloseSeparation(sep.id)}
                      className="bg-red-600 hover:bg-red-700 text-xs flex items-center gap-1.5 text-white"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      {sep.accessRevoked ? 'Access Revoked' : 'Revoke System Access & Close'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal: Add Employee */}
      <Modal
        isOpen={isAddEmpModalOpen}
        onClose={() => setIsAddEmpModalOpen(false)}
        title="Onboard New Hospital Employee"
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Full Name</label>
            <Input
              value={newEmpName}
              onChange={e => setNewEmpName(e.target.value)}
              placeholder="e.g. Dr. Sunita Kulkarni"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Department</label>
              <select
                value={newEmpDept}
                onChange={e => setNewEmpDept(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              >
                <option value="Cardiology">Cardiology</option>
                <option value="ICU">ICU</option>
                <option value="Orthopaedics">Orthopaedics</option>
                <option value="General Medicine">General Medicine</option>
                <option value="Emergency">Emergency</option>
                <option value="Pharmacy">Pharmacy</option>
                <option value="Nursing">Nursing</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Designation</label>
              <Input
                value={newEmpDesig}
                onChange={e => setNewEmpDesig(e.target.value)}
                placeholder="e.g. Senior Registrar"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Monthly Base Salary (₹)</label>
            <Input
              value={newEmpSalary}
              onChange={e => setNewEmpSalary(e.target.value)}
              placeholder="e.g. 75000"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setIsAddEmpModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddEmployee}>Create Master Record</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

