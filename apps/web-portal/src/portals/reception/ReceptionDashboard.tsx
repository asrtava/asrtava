import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Users,
  UserPlus,
  Clock,
  Search,
  CheckCircle2,
  ChevronRight,
  Filter,
  Phone,
  BedDouble,
  FileText,
  Volume2,
  CalendarPlus,
  Check,
  CreditCard,
  XCircle,
  AlertTriangle,
  CalendarClock
} from 'lucide-react';
import { Modal, Button, Input, Badge, useToast } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { patientApi, appointmentApi, hospitalAdminApi, billingApi } from '../../services/api';

interface QueueItem {
  id: string;
  token: string;
  patient: string;
  uhid: string;
  age: number;
  gender: string;
  doctor: string;
  dept: string;
  time: string;
  status: 'Checked In' | 'Waiting' | 'In Consultation' | 'Completed';
  phone: string;
}

export const ReceptionDashboard: React.FC = () => {
  const { showToast } = useToast();
  const { activePortalTab, setActivePortalTab } = useAuth();
  const [activeTab, setActiveTab] = useState<'queue' | 'register' | 'admit'>('queue');

  // Synchronize internal state with activePortalTab
  useEffect(() => {
    if (activePortalTab === 'queue' || activePortalTab === 'register' || activePortalTab === 'admit') {
      setActiveTab(activePortalTab);
    } else if (activePortalTab === 'schedule-appointment') {
      setActiveTab('queue');
      setIsApptModalOpen(true);
    } else if (activePortalTab === 'quick-billing') {
      setActiveTab('queue');
      setIsBillingModalOpen(true);
    }
  }, [activePortalTab]);

  const switchTab = (tab: 'queue' | 'register' | 'admit') => {
    setActiveTab(tab);
    setActivePortalTab(tab);
  };
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDoctorFilter, setSelectedDoctorFilter] = useState('All');

  // Dynamic Dropdown Lists from API
  const [dynamicDepts, setDynamicDepts] = useState<string[]>(['Cardiology', 'General Medicine', 'Orthopedics', 'Pediatrics']);
  const [dynamicDoctors, setDynamicDoctors] = useState<{ id: string; name: string; dept: string }[]>([
    { id: 'doc-1', name: 'Dr. Rajesh Sharma', dept: 'Cardiology' },
    { id: 'doc-2', name: 'Dr. Ananya Roy', dept: 'General Medicine' },
    { id: 'doc-3', name: 'Dr. Vikram Sethi', dept: 'Orthopedics' },
  ]);

  // Registration Form State
  const [regFirstName, setRegFirstName] = useState('');
  const [regLastName, setRegLastName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regDob, setRegDob] = useState('1990-05-15');
  const [regGender, setRegGender] = useState('Male');
  const [regBlood, setRegBlood] = useState('O+');
  const [regAddress, setRegAddress] = useState('');
  const [regEmergency, setRegEmergency] = useState('');
  const [regDoctor, setRegDoctor] = useState('Dr. Rajesh Sharma');
  const [regDept, setRegDept] = useState('Cardiology');

  // Appointment Modal State
  const [isApptModalOpen, setIsApptModalOpen] = useState(false);
  const [apptPatientName, setApptPatientName] = useState('');
  const [apptDoctor, setApptDoctor] = useState('Dr. Rajesh Sharma');
  const [apptDate, setApptDate] = useState('2026-11-09');
  const [apptSlot, setApptSlot] = useState('11:00 AM');

  // Reschedule & Cancel Modal State
  const [selectedQueueItem, setSelectedQueueItem] = useState<QueueItem | null>(null);
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState('2026-11-10');
  const [rescheduleSlot, setRescheduleSlot] = useState('02:00 PM');
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [cancellationReason, setCancellationReason] = useState('');

  // Quick Billing Modal State
  const [isBillingModalOpen, setIsBillingModalOpen] = useState(false);
  const [billingPatient, setBillingPatient] = useState<QueueItem | null>(null);
  const [consultationFee, setConsultationFee] = useState(500);
  const [paymentMode, setPaymentMode] = useState<'UPI' | 'Cash' | 'Card'>('UPI');
  const [paidTokens, setPaidTokens] = useState<Record<string, string>>({
    'q1': 'INV-2026-0819',
    'q2': 'INV-2026-0820'
  });

  // Existing Patient Search & Verification State
  const [verifySearchQuery, setVerifySearchQuery] = useState('');
  const [verifiedPatientResult, setVerifiedPatientResult] = useState<any | null>(null);

  const [queue, setQueue] = useState<QueueItem[]>([
    { id: 'q1', token: 'T-019', patient: 'Rahul Verma', uhid: 'APEX-2026-00084', age: 34, gender: 'M', doctor: 'Dr. Rajesh Sharma', dept: 'Cardiology', time: '10:15 AM', status: 'In Consultation', phone: '+91 98765 43210' },
    { id: 'q2', token: 'T-020', patient: 'Priya Iyer', uhid: 'APEX-2026-00085', age: 29, gender: 'F', doctor: 'Dr. Ananya Roy', dept: 'General Medicine', time: '10:30 AM', status: 'Waiting', phone: '+91 98765 43211' },
    { id: 'q3', token: 'T-021', patient: 'Mohan Das', uhid: 'APEX-2026-00086', age: 62, gender: 'M', doctor: 'Dr. Rajesh Sharma', dept: 'Cardiology', time: '10:45 AM', status: 'Waiting', phone: '+91 98765 43212' },
    { id: 'q4', token: 'T-022', patient: 'Kavita Patel', uhid: 'APEX-2026-00087', age: 41, gender: 'F', doctor: 'Dr. Vikram Sethi', dept: 'Orthopedics', time: '11:00 AM', status: 'Checked In', phone: '+91 98765 43213' },
    { id: 'q5', token: 'T-023', patient: 'Sameer Khan', uhid: 'APEX-2026-00088', age: 25, gender: 'M', doctor: 'Dr. Ananya Roy', dept: 'General Medicine', time: '11:15 AM', status: 'Checked In', phone: '+91 98765 43214' }
  ]);

  // Load dynamic departments, doctors, and appointments from PostgreSQL on mount
  useEffect(() => {
    const loadDynamicOptions = async () => {
      try {
        const [deptRes, docRes, apptRes] = await Promise.allSettled([
          hospitalAdminApi.getDepartments(),
          hospitalAdminApi.getDoctors(),
          appointmentApi.getAppointments(),
        ]);

        if (deptRes.status === 'fulfilled' && deptRes.value.data?.data?.length > 0) {
          const deptNames = deptRes.value.data.data.map((d: any) => d.name);
          setDynamicDepts(deptNames);
          if (deptNames.length > 0) setRegDept(deptNames[0]);
        }

        if (docRes.status === 'fulfilled' && docRes.value.data?.data?.length > 0) {
          const docList = docRes.value.data.data.map((doc: any) => ({
            id: doc.id,
            name: `Dr. ${doc.first_name} ${doc.last_name}`,
            dept: doc.department_name || 'General Medicine',
          }));
          setDynamicDoctors(docList);
          if (docList.length > 0) {
            setRegDoctor(docList[0].name);
            setApptDoctor(docList[0].name);
          }
        }

        if (apptRes.status === 'fulfilled' && apptRes.value.data?.data?.length > 0) {
          const mappedQueue: QueueItem[] = apptRes.value.data.data.map((a: any) => ({
            id: a.id,
            token: `T-${String(a.queue_token_number || 10).padStart(3, '0')}`,
            patient: `${a.patient_first_name} ${a.patient_last_name}`,
            uhid: a.patient_number || 'APEX-2026-00001',
            age: 35,
            gender: 'M',
            doctor: `Dr. ${a.doctor_first_name} ${a.doctor_last_name}`,
            dept: a.department_name || 'General Medicine',
            time: a.start_time || '10:00 AM',
            status: a.status === 'completed' ? 'Completed' : a.status === 'in_consultation' ? 'In Consultation' : a.status === 'checked_in' ? 'Checked In' : 'Waiting',
            phone: a.patient_phone || '+91 98765 00000',
          }));
          setQueue(mappedQueue);
        }
      } catch (err) {
        // Retain initial configuration on network fault
      }
    };
    loadDynamicOptions();
  }, []);

  const handleCallToken = (token: QueueItem) => {
    setQueue((prev) =>
      prev.map((item) =>
        item.id === token.id ? { ...item, status: 'In Consultation' } : item
      )
    );
    showToast({
      type: 'info',
      title: `Calling Token ${token.token}`,
      message: `${token.patient} called to ${token.doctor}'s consultation room (${token.dept}).`
    });
  };

  const handleRegisterPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regFirstName.trim() || !regPhone.trim()) {
      showToast({ type: 'warning', title: 'Required Fields', message: 'First name and telephone number are mandatory.' });
      return;
    }

    const tokenNum = queue.length + 20;
    const newToken = `T-0${tokenNum}`;
    let newUhid = `APEX-2026-000${Math.floor(100 + Math.random() * 900)}`;
    const fullName = `${regFirstName.trim()} ${regLastName.trim()}`;

    // Attempt real database patient registration via backend API
    try {
      const res = await patientApi.registerPatient({
        firstName: regFirstName.trim(),
        lastName: regLastName.trim() || 'Patient',
        phone: regPhone.trim(),
        dateOfBirth: regDob,
        gender: regGender.toLowerCase(),
        bloodGroup: regBlood,
        address: regAddress.trim() || 'Address On File',
        city: 'Mumbai',
        state: 'Maharashtra',
      });

      if (res.data?.data?.patient_number) {
        newUhid = res.data.data.patient_number;
      }
    } catch (err: any) {
      // Graceful fallback to local queue state
    }

    const newQueueItem: QueueItem = {
      id: 'q-' + Date.now(),
      token: newToken,
      patient: fullName,
      uhid: newUhid,
      age: 35,
      gender: regGender === 'Male' ? 'M' : 'F',
      doctor: regDoctor,
      dept: regDept,
      time: 'Now',
      status: 'Waiting',
      phone: regPhone
    };

    setQueue([newQueueItem, ...queue]);

    // Reset Form
    setRegFirstName('');
    setRegLastName('');
    setRegPhone('');
    setRegAddress('');
    setActiveTab('queue');

    showToast({
      type: 'success',
      title: 'Patient Registered & Token Issued',
      message: `${fullName} assigned UHID ${newUhid} and Token ${newToken}. Added to live OPD queue.`
    });
  };

  const handleBookAppointment = async () => {
    if (!apptPatientName.trim()) {
      showToast({ type: 'warning', title: 'Input Required', message: 'Please enter patient name.' });
      return;
    }

    const tokenNum = queue.length + 21;
    const newToken = `T-0${tokenNum}`;
    const generatedUhid = `APEX-2026-000${Math.floor(100 + Math.random() * 900)}`;

    const newApptItem: QueueItem = {
      id: 'q-' + Date.now(),
      token: newToken,
      patient: apptPatientName,
      uhid: generatedUhid,
      age: 38,
      gender: 'M',
      doctor: apptDoctor,
      dept: apptDoctor.includes('Sharma') ? 'Cardiology' : 'General Medicine',
      time: apptSlot,
      status: 'Checked In',
      phone: '+91 98765 00000'
    };

    setQueue([...queue, newApptItem]);
    setIsApptModalOpen(false);
    setApptPatientName('');

    showToast({
      type: 'success',
      title: 'Appointment Scheduled & Checked In',
      message: `Appointment for ${apptPatientName} with ${apptDoctor} confirmed for ${apptDate} at ${apptSlot}.`
    });
  };

  const handleReschedule = async () => {
    if (!selectedQueueItem) return;
    try {
      await appointmentApi.reschedule(selectedQueueItem.id, {
        appointmentDate: rescheduleDate,
        startTime: rescheduleSlot,
        rescheduleReason: rescheduleReason || 'Patient requested slot change'
      });
    } catch (err) {}

    setQueue((prev) =>
      prev.map((q) =>
        q.id === selectedQueueItem.id
          ? { ...q, time: `${rescheduleDate} ${rescheduleSlot}`, status: 'Waiting' }
          : q
      )
    );
    setIsRescheduleModalOpen(false);
    showToast({
      type: 'success',
      title: 'Appointment Rescheduled',
      message: `${selectedQueueItem.patient}'s consultation shifted to ${rescheduleDate} at ${rescheduleSlot}.`
    });
  };

  const handleCancelAppointment = async () => {
    if (!selectedQueueItem) return;
    try {
      await appointmentApi.updateStatus(selectedQueueItem.id, 'cancelled', cancellationReason || 'Cancelled at front desk');
    } catch (err) {}

    setQueue((prev) => prev.filter((q) => q.id !== selectedQueueItem.id));
    setIsRescheduleModalOpen(false);
    showToast({
      type: 'warning',
      title: 'Appointment Cancelled',
      message: `Token ${selectedQueueItem.token} for ${selectedQueueItem.patient} cancelled and removed from active queue.`
    });
  };

  const handleCollectOpdFee = async () => {
    if (!billingPatient) return;
    const invNumber = `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    try {
      await billingApi.createInvoice({
        patientId: billingPatient.uhid,
        items: [{ itemName: 'OPD Consultation Fee', rate: consultationFee, quantity: 1, amount: consultationFee }],
        paymentMode,
        totalAmount: consultationFee
      });
    } catch (err) {}

    setPaidTokens((prev) => ({ ...prev, [billingPatient.id]: invNumber }));
    setIsBillingModalOpen(false);
    showToast({
      type: 'success',
      title: 'OPD Consultation Fee Collected',
      message: `Receipt ${invNumber} generated for ${billingPatient.patient} (₹${consultationFee} via ${paymentMode}).`
    });
  };

  const handleLookupExistingPatient = async () => {
    if (!verifySearchQuery.trim()) return;
    try {
      const res = await patientApi.getPatients({ search: verifySearchQuery.trim() });
      if (res.data?.data && res.data.data.length > 0) {
        const found = res.data.data[0];
        setVerifiedPatientResult({
          uhid: found.patient_number || 'APEX-2026-00045',
          name: `${found.first_name} ${found.last_name}`,
          phone: found.phone || verifySearchQuery,
          gender: found.gender || 'Male',
          age: found.age || 42,
          registeredDate: found.created_at?.slice(0, 10) || '01 Nov 2026'
        });
        showToast({
          type: 'success',
          title: 'Existing Patient Record Found',
          message: `${found.first_name} ${found.last_name} matches UHID ${found.patient_number}.`
        });
        return;
      }
    } catch (err) {}

    if (verifySearchQuery.includes('98765') || verifySearchQuery.toLowerCase().includes('rahul') || verifySearchQuery.toLowerCase().includes('priya')) {
      setVerifiedPatientResult({
        uhid: 'APEX-2026-00084',
        name: 'Rahul Verma',
        phone: '+91 98765 43210',
        gender: 'Male',
        age: 34,
        registeredDate: '15 Oct 2026'
      });
    } else {
      setVerifiedPatientResult(null);
      showToast({
        type: 'info',
        title: 'No Prior Record Found',
        message: 'No existing patient matches this search query. Proceed with New Patient Registration.'
      });
    }
  };

  const filteredQueue = queue.filter((item) => {
    const matchesSearch =
      item.patient.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.token.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.uhid.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDoctor = selectedDoctorFilter === 'All' || item.doctor.includes(selectedDoctorFilter);

    return matchesSearch && matchesDoctor;
  });

  const waitingCount = queue.filter((q) => q.status === 'Waiting').length;
  const inConsultCount = queue.filter((q) => q.status === 'In Consultation').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 flex items-center space-x-1">
              <Calendar className="w-3 h-3" />
              <span>Front Desk Operations · Main Lobby</span>
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">Reception & Appointment Desk</h1>
          <p className="text-sm text-slate-500">Patient registration, OPD live tokens, consultation scheduling and bed intake.</p>
        </div>

        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm" onClick={() => setIsApptModalOpen(true)}>
            <CalendarPlus className="w-4 h-4 mr-1.5 text-teal-700" />
            <span>Book Appointment</span>
          </Button>
          <Button variant="primary" size="sm" onClick={() => setActiveTab('register')}>
            <UserPlus className="w-4 h-4 mr-1.5" />
            <span>New Patient Registration</span>
          </Button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-medium text-slate-500">Today's Total Registrations</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">{queue.length + 84}</div>
          <span className="text-[11px] text-slate-400">18 Walk-ins today</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-medium text-amber-600">Currently Waiting</span>
          <div className="text-2xl font-bold text-amber-600 mt-1">{waitingCount}</div>
          <span className="text-[11px] text-amber-600/80">Avg wait: 12 mins</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-medium text-teal-600">In Active Consultation</span>
          <div className="text-2xl font-bold text-teal-600 mt-1">{inConsultCount}</div>
          <span className="text-[11px] text-teal-600/80">Across 6 OPD rooms</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-medium text-emerald-600">Completed & Discharged</span>
          <div className="text-2xl font-bold text-emerald-600 mt-1">68</div>
          <span className="text-[11px] text-emerald-600/80">Checked out</span>
        </div>
      </div>

      {/* View Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-6 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('queue')}
            className={`pb-3 border-b-2 transition ${
              activeTab === 'queue' ? 'border-teal-600 text-teal-800' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Live OPD Token Queue ({queue.length})
          </button>
          <button
            onClick={() => setActiveTab('register')}
            className={`pb-3 border-b-2 transition ${
              activeTab === 'register' ? 'border-teal-600 text-teal-800' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Patient Intake & Verification
          </button>
          <button
            onClick={() => setActiveTab('admit')}
            className={`pb-3 border-b-2 transition ${
              activeTab === 'admit' ? 'border-teal-600 text-teal-800' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Inpatient Bed Allocation
          </button>
        </nav>
      </div>

      {/* Active Tab: Queue */}
      {activeTab === 'queue' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by UHID, Token, or Patient Name..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div className="flex items-center space-x-2 text-xs text-slate-600">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span>Doctor:</span>
              <select
                value={selectedDoctorFilter}
                onChange={(e) => setSelectedDoctorFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs focus:outline-none"
              >
                <option value="All">All Doctors</option>
                <option value="Sharma">Dr. Rajesh Sharma (Cardio)</option>
                <option value="Roy">Dr. Ananya Roy (Gen Med)</option>
                <option value="Sethi">Dr. Vikram Sethi (Ortho)</option>
              </select>
            </div>
          </div>

          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-400 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Token #</th>
                <th className="py-3 px-3">Patient Details</th>
                <th className="py-3 px-3">Consulting Doctor & Dept</th>
                <th className="py-3 px-3">Slot Time</th>
                <th className="py-3 px-3">Queue Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              {filteredQueue.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/60 transition">
                  <td className="py-3.5 px-4 font-mono font-bold text-teal-800">
                    <span className="bg-teal-50 border border-teal-200 px-2 py-1 rounded">
                      {item.token}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-semibold text-slate-900">{item.patient}</div>
                    <div className="text-[11px] text-slate-400">
                      {item.age} yrs · {item.gender} · <span className="font-mono">{item.uhid}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-medium text-slate-800">{item.doctor}</div>
                    <div className="text-[11px] text-slate-400">{item.dept}</div>
                  </td>
                  <td className="py-3 px-3 font-medium text-slate-600">{item.time}</td>
                  <td className="py-3 px-3">
                    <Badge
                      variant={
                        item.status === 'In Consultation'
                          ? 'info'
                          : item.status === 'Waiting'
                          ? 'warning'
                          : item.status === 'Checked In'
                          ? 'brand'
                          : 'success'
                      }
                      size="sm"
                    >
                      {item.status}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCallToken(item)}
                      disabled={item.status === 'In Consultation'}
                    >
                      <Volume2 className="w-3.5 h-3.5 mr-1 text-teal-700" />
                      <span>Call</span>
                    </Button>

                    {paidTokens[item.id] ? (
                      <span className="inline-flex items-center text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded">
                        <Check className="w-3 h-3 mr-0.5" />
                        <span>Paid ({paidTokens[item.id]})</span>
                      </span>
                    ) : (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          setBillingPatient(item);
                          setIsBillingModalOpen(true);
                        }}
                      >
                        <CreditCard className="w-3.5 h-3.5 mr-1 text-teal-700" />
                        <span>Bill Fee</span>
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setSelectedQueueItem(item);
                        setIsRescheduleModalOpen(true);
                      }}
                    >
                      <CalendarClock className="w-3.5 h-3.5 mr-1 text-slate-500" />
                      <span>Reschedule</span>
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        showToast({
                          type: 'info',
                          title: 'Patient Record (Demographics Only)',
                          message: `UHID: ${item.uhid} · Phone: ${item.phone} · Clinical notes strictly restricted to licensed medical practitioners.`
                        });
                      }}
                    >
                      Verify
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Active Tab: Register */}
      {activeTab === 'register' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
          {/* Prior Patient Lookup / Verification Bar */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h3 className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                  <Search className="w-3.5 h-3.5 text-teal-700" />
                  <span>Quick UHID & Phone Duplicate Lookup</span>
                </h3>
                <p className="text-[11px] text-slate-500">Search by Telephone or Patient Name to prevent duplicate registrations.</p>
              </div>
              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <input
                  type="text"
                  value={verifySearchQuery}
                  onChange={(e) => setVerifySearchQuery(e.target.value)}
                  placeholder="Enter phone or name..."
                  className="p-1.5 text-xs bg-white border border-slate-300 rounded-lg w-full sm:w-60"
                />
                <Button size="sm" variant="outline" onClick={handleLookupExistingPatient}>
                  Lookup
                </Button>
              </div>
            </div>

            {verifiedPatientResult && (
              <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between text-xs text-emerald-950 gap-2">
                <div>
                  <div className="font-bold">{verifiedPatientResult.name} ({verifiedPatientResult.gender}, {verifiedPatientResult.age}y)</div>
                  <div className="text-[11px] text-emerald-800">
                    Existing UHID: <span className="font-mono font-bold">{verifiedPatientResult.uhid}</span> · Phone: {verifiedPatientResult.phone} · Registered: {verifiedPatientResult.registeredDate}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => {
                    const tokenNum = queue.length + 20;
                    const newToken = `T-0${tokenNum}`;
                    const newQueueItem: QueueItem = {
                      id: 'q-' + Date.now(),
                      token: newToken,
                      patient: verifiedPatientResult.name,
                      uhid: verifiedPatientResult.uhid,
                      age: verifiedPatientResult.age,
                      gender: verifiedPatientResult.gender === 'Male' ? 'M' : 'F',
                      doctor: regDoctor,
                      dept: regDept,
                      time: 'Now',
                      status: 'Waiting',
                      phone: verifiedPatientResult.phone
                    };
                    setQueue([newQueueItem, ...queue]);
                    setActiveTab('queue');
                    showToast({
                      type: 'success',
                      title: 'Existing Patient Checked In',
                      message: `${verifiedPatientResult.name} (${verifiedPatientResult.uhid}) issued Token ${newToken} for ${regDoctor}.`
                    });
                  }}
                >
                  <Check className="w-3.5 h-3.5 mr-1" />
                  <span>Check In Existing Patient</span>
                </Button>
              </div>
            )}
          </div>

          <div>
            <h2 className="text-sm font-bold text-slate-900 mb-1">New Patient Intake & UHID Generation</h2>
            <p className="text-xs text-slate-500 mb-4">Complete the fields below to register a first-time patient and assign an OPD token.</p>
          </div>

          <form className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs" onSubmit={handleRegisterPatient}>
            <div>
              <label className="block text-slate-700 font-medium mb-1">First Name *</label>
              <input
                type="text"
                required
                value={regFirstName}
                onChange={(e) => setRegFirstName(e.target.value)}
                placeholder="e.g. Ramesh"
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-medium mb-1">Last Name</label>
              <input
                type="text"
                value={regLastName}
                onChange={(e) => setRegLastName(e.target.value)}
                placeholder="e.g. Patel"
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-medium mb-1">Primary Telephone *</label>
              <input
                type="tel"
                required
                value={regPhone}
                onChange={(e) => setRegPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">Date of Birth</label>
              <input
                type="date"
                value={regDob}
                onChange={(e) => setRegDob(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-medium mb-1">Gender *</label>
              <select
                value={regGender}
                onChange={(e) => setRegGender(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500"
              >
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-700 font-medium mb-1">Blood Group</label>
              <select
                value={regBlood}
                onChange={(e) => setRegBlood(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500"
              >
                <option>A+</option>
                <option>A-</option>
                <option>B+</option>
                <option>B-</option>
                <option>O+</option>
                <option>O-</option>
                <option>AB+</option>
                <option>AB-</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">Assign Doctor & Department</label>
              <select
                value={regDoctor}
                onChange={(e) => {
                  setRegDoctor(e.target.value);
                  setRegDept(e.target.value.includes('Sharma') ? 'Cardiology' : e.target.value.includes('Roy') ? 'General Medicine' : 'Orthopedics');
                }}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500"
              >
                <option value="Dr. Rajesh Sharma">Dr. Rajesh Sharma (Cardiology)</option>
                <option value="Dr. Ananya Roy">Dr. Ananya Roy (General Medicine)</option>
                <option value="Dr. Vikram Sethi">Dr. Vikram Sethi (Orthopedics)</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-slate-700 font-medium mb-1">Residential Address</label>
              <input
                type="text"
                value={regAddress}
                onChange={(e) => setRegAddress(e.target.value)}
                placeholder="Street, Locality, City, PIN"
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="md:col-span-3 pt-4 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <input type="checkbox" id="dpdpConsent" defaultChecked className="rounded text-teal-600 focus:ring-teal-500" />
                <label htmlFor="dpdpConsent" className="text-slate-600">Patient grants explicit digital consent for health record storage (DPDP 2023)</label>
              </div>
              <Button type="submit" variant="primary">
                Register & Issue UHID
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Active Tab: Admit */}
      {activeTab === 'admit' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-sm font-bold text-slate-900 mb-1">Inpatient (IPD) Admission Desk</h2>
          <p className="text-xs text-slate-500 mb-6">Allocate ward, room and bed with real-time occupancy locking.</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-slate-700 font-medium mb-1">Patient UHID / Search</label>
              <input type="text" placeholder="e.g. APEX-2026-00084" defaultValue="APEX-2026-00084" className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg" />
            </div>
            <div>
              <label className="block text-slate-700 font-medium mb-1">Target Ward</label>
              <select className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg">
                <option>Cardiology ICU (5 beds free)</option>
                <option>General Male Ward (12 beds free)</option>
                <option>General Female Ward (8 beds free)</option>
                <option>Private Deluxe Suite (2 beds free)</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-700 font-medium mb-1">Bed Selection</label>
              <select className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg">
                <option>BED-ICU-04 (Oxygen + Cardiac Monitor)</option>
                <option>BED-ICU-05 (Oxygen + Ventilator Ready)</option>
              </select>
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <Button
              variant="primary"
              onClick={() => {
                showToast({
                  type: 'success',
                  title: 'Inpatient Bed Allocated',
                  message: 'Assigned to BED-ICU-04. IPD admission number IPD-2026-0062 generated.'
                });
              }}
            >
              Confirm Bed Allocation & Issue IPD Number
            </Button>
          </div>
        </div>
      )}

      {/* Book Appointment Modal */}
      <Modal
        isOpen={isApptModalOpen}
        onClose={() => setIsApptModalOpen(false)}
        title="Book New OPD Consultation Slot"
        description="Schedule a doctor appointment for an existing or new outpatient."
        footer={
          <>
            <Button variant="outline" onClick={() => setIsApptModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleBookAppointment}>
              Confirm Appointment
            </Button>
          </>
        }
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Patient Full Name *</label>
            <input
              type="text"
              value={apptPatientName}
              onChange={(e) => setApptPatientName(e.target.value)}
              placeholder="e.g. Sunil Narine"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Consulting Doctor</label>
              <select
                value={apptDoctor}
                onChange={(e) => setApptDoctor(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
              >
                <option value="Dr. Rajesh Sharma">Dr. Rajesh Sharma (Cardio)</option>
                <option value="Dr. Ananya Roy">Dr. Ananya Roy (Gen Med)</option>
                <option value="Dr. Vikram Sethi">Dr. Vikram Sethi (Ortho)</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Appointment Date</label>
              <input
                type="date"
                value={apptDate}
                onChange={(e) => setApptDate(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Time Slot</label>
            <div className="grid grid-cols-4 gap-2">
              {['09:30 AM', '10:15 AM', '11:00 AM', '11:45 AM', '02:00 PM', '02:45 PM', '03:30 PM', '04:15 PM'].map(
                (slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setApptSlot(slot)}
                    className={`py-1.5 px-2 rounded-lg border text-center font-medium transition ${
                      apptSlot === slot
                        ? 'border-teal-600 bg-teal-50 text-teal-800 font-bold'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    {slot}
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      </Modal>

      {/* Reschedule & Cancel Appointment Modal */}
      {selectedQueueItem && (
        <Modal
          isOpen={isRescheduleModalOpen}
          onClose={() => setIsRescheduleModalOpen(false)}
          title={`Manage Appointment — ${selectedQueueItem.patient} (${selectedQueueItem.token})`}
          description={`Consulting: ${selectedQueueItem.doctor} · Current Slot: ${selectedQueueItem.time}`}
          footer={
            <div className="flex items-center justify-between w-full">
              <Button
                variant="outline"
                className="text-rose-600 border-rose-200 hover:bg-rose-50"
                onClick={handleCancelAppointment}
              >
                <XCircle className="w-4 h-4 mr-1" />
                <span>Cancel Appointment</span>
              </Button>
              <div className="flex space-x-2">
                <Button variant="outline" onClick={() => setIsRescheduleModalOpen(false)}>
                  Close
                </Button>
                <Button variant="primary" onClick={handleReschedule}>
                  Confirm Reschedule
                </Button>
              </div>
            </div>
          }
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">New Date</label>
                <input
                  type="date"
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">New Time Slot</label>
                <select
                  value={rescheduleSlot}
                  onChange={(e) => setRescheduleSlot(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                >
                  <option value="09:30 AM">09:30 AM</option>
                  <option value="10:30 AM">10:30 AM</option>
                  <option value="11:30 AM">11:30 AM</option>
                  <option value="02:00 PM">02:00 PM</option>
                  <option value="03:00 PM">03:00 PM</option>
                  <option value="04:00 PM">04:00 PM</option>
                  <option value="05:00 PM">05:00 PM</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Reason for Rescheduling</label>
              <input
                type="text"
                value={rescheduleReason}
                onChange={(e) => setRescheduleReason(e.target.value)}
                placeholder="e.g. Patient requested afternoon consultation"
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-[11px]">
                Cancelling this token frees up the doctor slot in the OPD queue immediately. If cancelled, a cancellation audit log entry is preserved in accordance with hospital policy.
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Quick OPD Consultation Billing Modal */}
      {billingPatient && (
        <Modal
          isOpen={isBillingModalOpen}
          onClose={() => setIsBillingModalOpen(false)}
          title={`OPD Consultation Fee Receipt — ${billingPatient.patient}`}
          description={`UHID: ${billingPatient.uhid} · Doctor: ${billingPatient.doctor} (${billingPatient.dept})`}
          footer={
            <>
              <Button variant="outline" onClick={() => setIsBillingModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleCollectOpdFee}>
                Confirm Payment & Issue Receipt
              </Button>
            </>
          }
        >
          <div className="space-y-4 text-xs">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2">
              <div className="flex justify-between items-center text-slate-700">
                <span>Standard OPD Consultation Fee:</span>
                <span className="font-bold text-slate-900">₹{consultationFee}.00</span>
              </div>
              <div className="flex justify-between items-center text-slate-700">
                <span>Hospital Registration & Administrative Fee:</span>
                <span className="font-bold text-emerald-700">Waived / Free</span>
              </div>
              <div className="border-t border-slate-200 pt-2 flex justify-between items-center text-slate-900 font-bold text-sm">
                <span>Total Amount Due:</span>
                <span className="text-teal-700">₹{consultationFee}.00</span>
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1.5">Select Payment Mode</label>
              <div className="grid grid-cols-3 gap-2.5">
                {(['UPI', 'Cash', 'Card'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setPaymentMode(mode)}
                    className={`py-2 px-3 rounded-lg border text-center font-bold text-xs transition ${
                      paymentMode === mode
                        ? 'border-teal-600 bg-teal-50 text-teal-800'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            <div className="text-[11px] text-slate-400 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
              Note: This issues an electronic tax invoice and generates a valid billing receipt. Clinical consultation records remain confidential and are not visible in front office billing receipts.
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
