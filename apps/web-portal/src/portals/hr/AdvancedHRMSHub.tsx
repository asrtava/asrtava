import React, { useState } from 'react';
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
  const [activeTab, setActiveTab] = useState<
    'workforce' | 'recruitment' | 'attendance' | 'rostering' | 'leaves' | 'payroll' | 'credentials' | 'separation'
  >('workforce');

  // 1. Workforce Directory State
  const [employees, setEmployees] = useState<EmployeeRecord[]>([
    {
      id: 'emp-101',
      employeeNumber: 'EMP-DOC-101',
      name: 'Dr. Rajesh Sharma',
      department: 'Cardiology',
      designation: 'Chief of Cardiology',
      employmentType: 'FULL_TIME',
      employmentStatus: 'ACTIVE',
      dateOfJoining: '2020-03-15',
      phone: '+91 98765 43210',
      email: 'rajesh.sharma@asrtava-health.in',
      bloodGroup: 'B+',
      emergencyContact: 'Sunita Sharma (+91 98765 43211)',
      isAccountLinked: true,
    },
    {
      id: 'emp-102',
      employeeNumber: 'EMP-NUR-204',
      name: 'Nurse Anjali Verma',
      department: 'ICU',
      designation: 'Head Critical Care Nurse',
      employmentType: 'FULL_TIME',
      employmentStatus: 'ACTIVE',
      dateOfJoining: '2022-06-01',
      phone: '+91 98111 22334',
      email: 'anjali.verma@asrtava-health.in',
      bloodGroup: 'O+',
      emergencyContact: 'Kavita Verma (+91 98111 22335)',
      isAccountLinked: true,
    },
    {
      id: 'emp-103',
      employeeNumber: 'EMP-PHM-301',
      name: 'Suresh Nair',
      department: 'Pharmacy',
      designation: 'Senior Clinical Pharmacist',
      employmentType: 'FULL_TIME',
      employmentStatus: 'ACTIVE',
      dateOfJoining: '2023-01-10',
      phone: '+91 98222 33445',
      email: 'suresh.nair@asrtava-health.in',
      bloodGroup: 'A+',
      emergencyContact: 'Meera Nair (+91 98222 33446)',
      isAccountLinked: true,
    },
    {
      id: 'emp-104',
      employeeNumber: 'EMP-TRA-405',
      name: 'Rohan Mehra',
      department: 'Front Desk',
      designation: 'Patient Reception Executive',
      employmentType: 'TRAINEE',
      employmentStatus: 'PROBATION',
      dateOfJoining: '2026-10-01',
      phone: '+91 98333 44556',
      email: 'rohan.mehra@asrtava-health.in',
      bloodGroup: 'AB+',
      emergencyContact: 'Vijay Mehra (+91 98333 44557)',
      isAccountLinked: false,
    },
  ]);

  // 2. Recruitment State
  const [requisitions, setRequisitions] = useState<RequisitionRecord[]>([
    {
      id: 'req-01',
      requisitionNumber: 'REQ-2026-CARDIO-02',
      department: 'Cardiology',
      designation: 'Consultant Interventional Cardiologist',
      vacancies: 2,
      priority: 'HIGH',
      status: 'OPEN',
      appliedCount: 8,
    },
    {
      id: 'req-02',
      requisitionNumber: 'REQ-2026-ICU-05',
      department: 'ICU',
      designation: 'Staff Nurse (Critical Care)',
      vacancies: 5,
      priority: 'URGENT',
      status: 'OPEN',
      appliedCount: 14,
    },
  ]);

  // 3. Attendance Punch Log State
  const [punches, setPunches] = useState<AttendancePunch[]>([
    {
      id: 'p-1',
      employeeName: 'Dr. Rajesh Sharma',
      time: '07:54 AM',
      punchType: 'CHECK_IN',
      source: 'BIOMETRIC_DEVICE',
      verificationMode: 'FINGERPRINT (Bio-Device North Tower)',
      status: 'NORMAL',
    },
    {
      id: 'p-2',
      employeeName: 'Nurse Anjali Verma',
      time: '07:48 AM',
      punchType: 'CHECK_IN',
      source: 'BIOMETRIC_DEVICE',
      verificationMode: 'FACIAL_SCAN (ICU Gate A)',
      status: 'NORMAL',
    },
    {
      id: 'p-3',
      employeeName: 'Suresh Nair',
      time: '08:02 AM',
      punchType: 'CHECK_IN',
      source: 'WEB_PORTAL',
      verificationMode: 'MFA_PORTAL_OVERRIDE',
      status: 'NORMAL',
    },
  ]);

  // 4. Shift Rostering State
  const [rosters, setRosters] = useState<DutyRosterItem[]>([
    {
      id: 'ros-1',
      date: '2026-11-09',
      employeeName: 'Dr. Rajesh Sharma',
      department: 'Cardiology',
      shiftName: 'Morning Specialist (OPD & CathLab)',
      shiftHours: '08:00 - 16:00',
      role: 'PRIMARY_CONSULTANT',
    },
    {
      id: 'ros-2',
      date: '2026-11-09',
      employeeName: 'Nurse Anjali Verma',
      department: 'ICU',
      shiftName: 'Morning Intensive Coverage',
      shiftHours: '07:00 - 15:00',
      role: 'HEAD_NURSE',
    },
    {
      id: 'ros-3',
      date: '2026-11-09',
      employeeName: 'Dr. Vikram Sethi',
      department: 'Emergency & Trauma',
      shiftName: '24/7 On-Call Trauma Lead',
      shiftHours: 'ON_CALL (24 Hours)',
      role: 'ON_CALL_SURGEON',
    },
  ]);

  // 5. Leave Applications State
  const [leaves, setLeaves] = useState<LeaveRecord[]>([
    {
      id: 'lv-01',
      employeeName: 'Nurse Anjali Verma',
      leaveType: 'Casual Leave (CL)',
      dates: '14 Nov - 16 Nov 2026',
      days: 3,
      reason: 'Family wedding out of state. Ward handoff arranged with Nurse Kavita.',
      status: 'PENDING',
    },
    {
      id: 'lv-02',
      employeeName: 'Dr. Rajesh Sharma',
      leaveType: 'Conference / Academic (CME)',
      dates: '22 Nov - 24 Nov 2026',
      days: 3,
      reason: 'Keynote Speaker at National Cardiology Congress 2026.',
      status: 'APPROVED',
    },
  ]);

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
    status: 'APPROVED',
    totalGross: 485000,
    totalDeductions: 54600,
    totalNet: 430400,
  });

  const [payslips] = useState<PayslipSummary[]>([
    {
      id: 'ps-101',
      employeeNumber: 'EMP-DOC-101',
      employeeName: 'Dr. Rajesh Sharma',
      basicEarned: 150000,
      hraEarned: 60000,
      allowances: 40000,
      pfDeduction: 18000,
      ptDeduction: 200,
      tdsDeduction: 15000,
      netPayable: 216800,
      status: 'APPROVED',
    },
    {
      id: 'ps-102',
      employeeNumber: 'EMP-NUR-204',
      employeeName: 'Nurse Anjali Verma',
      basicEarned: 45000,
      hraEarned: 18000,
      allowances: 12000,
      pfDeduction: 5400,
      ptDeduction: 200,
      tdsDeduction: 2000,
      netPayable: 67400,
      status: 'APPROVED',
    },
    {
      id: 'ps-103',
      employeeNumber: 'EMP-PHM-301',
      employeeName: 'Suresh Nair',
      basicEarned: 35000,
      hraEarned: 14000,
      allowances: 9000,
      pfDeduction: 4200,
      ptDeduction: 200,
      tdsDeduction: 1200,
      netPayable: 52400,
      status: 'APPROVED',
    },
  ]);

  // 7. Professional Credentials State
  const [credentials, setCredentials] = useState<CredentialRecord[]>([
    {
      id: 'c-1',
      employeeName: 'Dr. Rajesh Sharma',
      type: 'NMC / State Medical Council Registration',
      licenseNumber: 'MCI-1998-44120',
      authority: 'National Medical Commission',
      expiryDate: '2028-04-30',
      daysRemaining: 538,
      status: 'VERIFIED',
    },
    {
      id: 'c-2',
      employeeName: 'Nurse Anjali Verma',
      type: 'Indian Nursing Council (INC) & BLS/ACLS',
      licenseNumber: 'INC-RN-2012-881',
      authority: 'State Nursing Council & AHA',
      expiryDate: '2026-12-05',
      daysRemaining: 26,
      status: 'EXPIRING_SOON',
    },
    {
      id: 'c-3',
      employeeName: 'Suresh Nair',
      type: 'Pharmacy Council of India (PCI) Reg',
      licenseNumber: 'PCI-PHARM-2010-992',
      authority: 'State Pharmacy Council',
      expiryDate: '2027-09-15',
      daysRemaining: 310,
      status: 'VERIFIED',
    },
  ]);

  // 8. Employee Separation State
  const [separations, setSeparations] = useState<SeparationRecord[]>([
    {
      id: 'sep-01',
      employeeName: 'Pooja Iyer (Staff Nurse)',
      resignationDate: '2026-10-15',
      relievingDate: '2026-11-15',
      handoverDone: true,
      assetsReturned: true,
      accessRevoked: false,
      status: 'IN_CLEARANCE',
    },
  ]);

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
                3 Biometric Terminals Online
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
                {punches.map(p => (
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
                ))}
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
                {payslips.map(ps => (
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
                ))}
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

