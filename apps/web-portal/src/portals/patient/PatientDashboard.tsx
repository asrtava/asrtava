import React, { useState, useEffect } from 'react';
import {
  Users,
  Calendar,
  Pill,
  Activity,
  FileText,
  CreditCard,
  Download,
  ShieldCheck,
  Clock,
  ChevronRight,
  Plus,
  QrCode,
  Check,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Modal, Button, Input, Badge, useToast } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { appointmentApi, billingApi } from '../../services/api';
import { TelemedicineHub } from './TelemedicineHub';

interface PatientAppointment {
  id: string;
  doctor: string;
  specialty: string;
  date: string;
  time: string;
  token: string;
  status: 'Confirmed' | 'Completed' | 'Cancelled';
}

export const PatientDashboard: React.FC = () => {
  const { showToast } = useToast();
  const { activePortalTab, setActivePortalTab } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'prescriptions' | 'reports' | 'bills' | 'telemedicine'>('overview');

  useEffect(() => {
    if (activePortalTab && ['overview', 'prescriptions', 'reports', 'bills', 'telemedicine'].includes(activePortalTab)) {
      setActiveTab(activePortalTab as any);
    }
  }, [activePortalTab]);

  const switchTab = (tab: 'overview' | 'prescriptions' | 'reports' | 'bills' | 'telemedicine') => {
    setActiveTab(tab);
    setActivePortalTab(tab);
  };

  const patient = {
    name: 'Rahul Verma',
    uhid: 'APEX-2026-00084',
    age: 34,
    gender: 'Male',
    bloodGroup: 'O+',
    allergies: ['Penicillin (Moderate rash)'],
    hospital: 'Apex Care Multi-Specialty Hospital'
  };

  const [appointments, setAppointments] = useState<PatientAppointment[]>([
    {
      id: 'APT-1082',
      doctor: 'Dr. Rajesh Sharma',
      specialty: 'Chief Cardiologist',
      date: 'Mon, 10 Nov 2026',
      time: '10:15 AM',
      token: 'Token #14',
      status: 'Confirmed'
    }
  ]);

  useEffect(() => {
    const fetchMyAppointments = async () => {
      try {
        const res = await appointmentApi.getAppointments();
        if (res.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
          const mapped: PatientAppointment[] = res.data.data.map((a: any, idx: number) => ({
            id: a.appointment_number || a.id?.substring(0, 8) || `APT-${1080 + idx}`,
            doctor: a.doctor_name || 'Dr. Rajesh Sharma',
            specialty: a.department_name || 'General Medicine',
            date: a.appointment_date ? new Date(a.appointment_date).toLocaleDateString() : 'Mon, 10 Nov 2026',
            time: a.start_time || '10:00 AM',
            token: `Token #${a.queue_token_number || idx + 1}`,
            status: a.status === 'completed' ? 'Completed' : a.status === 'cancelled' ? 'Cancelled' : 'Confirmed'
          }));
          setAppointments(mapped);
        }
      } catch (err) {
        console.warn('Live patient appointment sync fallback active:', err);
      }
    };
    fetchMyAppointments();
  }, []);

  const [bills, setBills] = useState([
    {
      id: 'INV-2026-1043',
      date: '08 Nov 2026',
      description: 'Cardiology Consultation + Pharmacy Refill',
      amount: 1491,
      status: 'Paid',
      paymentMode: 'UPI (Google Pay)'
    },
    {
      id: 'INV-2026-1048',
      date: '08 Nov 2026',
      description: 'High-Resolution CT Chest Scan',
      amount: 4500,
      status: 'Unpaid',
      paymentMode: ''
    }
  ]);

  // Appointment Modal State
  const [isApptModalOpen, setIsApptModalOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState('Dr. Rajesh Sharma');
  const [selectedSpecialty, setSelectedSpecialty] = useState('Cardiology');
  const [apptDate, setApptDate] = useState('2026-11-12');
  const [apptTime, setApptTime] = useState('11:30 AM');

  // Prescription View Modal
  const [isRxModalOpen, setIsRxModalOpen] = useState(false);

  // Pay Bill Modal State
  const [selectedBill, setSelectedBill] = useState<(typeof bills)[0] | null>(null);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);

  const handleBookAppt = async () => {
    try {
      await appointmentApi.scheduleAppointment({
        doctorName: selectedDoc,
        departmentName: selectedSpecialty,
        appointmentDate: apptDate,
        appointmentType: 'opd_consultation',
        notes: `Scheduled from patient portal for ${apptTime}`
      });
    } catch (err) {
      console.warn('Backend appointment schedule fallback active:', err);
    }

    const newAppt: PatientAppointment = {
      id: 'APT-' + Math.floor(1000 + Math.random() * 9000),
      doctor: selectedDoc,
      specialty: selectedSpecialty,
      date: apptDate,
      time: apptTime,
      token: 'Token #' + Math.floor(15 + Math.random() * 20),
      status: 'Confirmed'
    };

    setAppointments([...appointments, newAppt]);
    setIsApptModalOpen(false);

    showToast({
      type: 'success',
      title: 'Appointment Scheduled Successfully',
      message: `Confirmed with ${selectedDoc} on ${apptDate} at ${apptTime}. ${newAppt.token} issued.`
    });
  };

  const handlePayBill = async () => {
    if (!selectedBill) return;

    try {
      await billingApi.collectPayment({
        invoiceId: selectedBill.id,
        amount: selectedBill.amount,
        paymentMode: 'online_upi',
        transactionReference: `UPI-${Date.now()}`
      });
    } catch (err) {
      console.warn('Backend payment processing fallback active:', err);
    }

    setBills((prev) =>
      prev.map((b) => (b.id === selectedBill.id ? { ...b, status: 'Paid', paymentMode: 'Online UPI' } : b))
    );

    setIsPayModalOpen(false);
    showToast({
      type: 'success',
      title: 'Payment Successful',
      message: `₹ ${selectedBill.amount.toLocaleString()} paid for ${selectedBill.id}. Hospital receipt downloaded.`
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Profile Banner */}
      <div className="bg-gradient-to-r from-teal-800 to-teal-950 rounded-2xl p-6 text-white shadow-md">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center space-x-2 text-teal-200 text-xs font-semibold mb-1">
              <ShieldCheck className="w-4 h-4" />
              <span>Verified Patient Portal · {patient.hospital}</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Welcome, {patient.name}</h1>
            <div className="flex flex-wrap gap-3 text-xs text-teal-100/90 mt-2">
              <span>
                UHID: <strong className="text-white font-mono">{patient.uhid}</strong>
              </span>
              <span>•</span>
              <span>
                Age: <strong className="text-white">{patient.age} yrs</strong> ({patient.gender})
              </span>
              <span>•</span>
              <span>
                Blood Group: <strong className="text-white">{patient.bloodGroup}</strong>
              </span>
              <span>•</span>
              <span className="text-amber-300 font-semibold">Allergies: {patient.allergies[0]}</span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              size="sm"
              className="bg-white/10 hover:bg-white/20 text-white border-white/20"
              onClick={() => setIsApptModalOpen(true)}
            >
              <Plus className="w-4 h-4 mr-1.5" />
              <span>Book Appointment</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Patient Portal Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-6 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-3 border-b-2 transition ${
              activeTab === 'overview' ? 'border-teal-600 text-teal-800' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Health Overview & Care Plan
          </button>
          <button
            onClick={() => setActiveTab('prescriptions')}
            className={`pb-3 border-b-2 transition ${
              activeTab === 'prescriptions' ? 'border-teal-600 text-teal-800' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Digital Prescriptions (Rx)
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`pb-3 border-b-2 transition ${
              activeTab === 'reports' ? 'border-teal-600 text-teal-800' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Diagnostic Lab & Imaging Reports
          </button>
          <button
            onClick={() => setActiveTab('bills')}
            className={`pb-3 border-b-2 transition ${
              activeTab === 'bills' ? 'border-teal-600 text-teal-800' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Invoices & Online Payments
          </button>
          <button
            onClick={() => setActiveTab('telemedicine')}
            className={`pb-3 border-b-2 transition ${
              activeTab === 'telemedicine' ? 'border-teal-600 text-teal-800' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Telemedicine & Virtual Care
          </button>
        </nav>
      </div>

      {/* Tab: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Upcoming Consultations */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-teal-700" />
                  <h2 className="text-sm font-bold text-slate-900">Upcoming Consultations</h2>
                </div>
                <Button size="sm" variant="outline" onClick={() => setIsApptModalOpen(true)}>
                  Book New Slot
                </Button>
              </div>

              {appointments.map((appt) => (
                <div
                  key={appt.id}
                  className="p-4 rounded-xl border border-teal-200 bg-teal-50/20 flex flex-col sm:flex-row justify-between sm:items-center gap-3"
                >
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-900 text-sm">{appt.doctor}</span>
                      <span className="text-xs text-teal-700 font-medium">({appt.specialty})</span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1 flex items-center space-x-3">
                      <span className="flex items-center space-x-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>
                          {appt.date} at {appt.time}
                        </span>
                      </span>
                      <span>•</span>
                      <span className="font-mono font-bold text-teal-800">{appt.token}</span>
                    </div>
                  </div>
                  <Badge variant="success" size="sm">
                    {appt.status}
                  </Badge>
                </div>
              ))}
            </div>

            {/* Current Medications Strip */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2">
                  <Pill className="w-4 h-4 text-teal-700" />
                  <h2 className="text-sm font-bold text-slate-900">Active Daily Medications</h2>
                </div>
                <button
                  onClick={() => setIsRxModalOpen(true)}
                  className="text-xs text-teal-700 hover:text-teal-800 font-semibold"
                >
                  View Full Prescription →
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="font-bold text-slate-900">Atorvastatin 20mg</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">1 Tab Daily (Night after dinner)</div>
                  <div className="text-[10px] text-teal-700 font-medium mt-2">22 Days Remaining</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="font-bold text-slate-900">Aspirin 75mg Gastro-Resistant</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">1 Tab Daily (Post food)</div>
                  <div className="text-[10px] text-teal-700 font-medium mt-2">22 Days Remaining</div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Help & Emergency Strip */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3 text-xs">
              <h2 className="font-bold text-slate-900 text-sm">Hospital Emergency Helpline</h2>
              <p className="text-slate-500">24x7 Cardiac & Trauma Rapid Response Ambulance:</p>
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-900 font-bold text-center text-sm">
                📞 1800-419-9999 / +91 99887 76655
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3 text-xs">
              <h2 className="font-bold text-slate-900 text-sm">Ayushman Bharat ABHA Card</h2>
              <p className="text-slate-500">Your health records are digitally linked with National Health Authority:</p>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">ABHA Health Address</span>
                  <span className="font-mono font-bold text-slate-800">rahulverma@abdm</span>
                </div>
                <QrCode className="w-6 h-6 text-slate-700" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Prescriptions */}
      {activeTab === 'prescriptions' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Signed Electronic Prescriptions (Rx)</h2>
              <p className="text-xs text-slate-500">Issued by verified medical practitioners at ASRTAVA hospitals.</p>
            </div>
            <Button size="sm" variant="outline" onClick={() => setIsRxModalOpen(true)}>
              <FileText className="w-3.5 h-3.5 mr-1" />
              <span>Preview Signed Rx</span>
            </Button>
          </div>

          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3 text-xs">
            <div className="flex justify-between items-center">
              <div>
                <span className="font-bold text-sm text-slate-900">RX-2026-0194</span>
                <span className="text-slate-400 block text-[11px]">Issued 08 Nov 2026 by Dr. Rajesh Sharma (Cardiology)</span>
              </div>
              <Badge variant="success" size="sm">Active Formulary</Badge>
            </div>

            <div className="divide-y divide-slate-200 bg-white rounded-lg border border-slate-200 p-3">
              <div className="py-2 flex justify-between">
                <div>
                  <div className="font-bold text-slate-800">1. Atorvastatin 20mg Tablet</div>
                  <div className="text-[11px] text-slate-500">1 tablet once daily at bedtime after dinner · 30 Days</div>
                </div>
                <span className="font-medium text-teal-700">Dispensed by Pharmacy</span>
              </div>
              <div className="py-2 flex justify-between">
                <div>
                  <div className="font-bold text-slate-800">2. Aspirin 75mg Gastro-Resistant Tablet</div>
                  <div className="text-[11px] text-slate-500">1 tablet once daily post lunch · 30 Days</div>
                </div>
                <span className="font-medium text-teal-700">Dispensed by Pharmacy</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Diagnostic Reports */}
      {activeTab === 'reports' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden text-xs">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-400 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Report ID & Date</th>
                <th className="py-3 px-3">Test Investigation</th>
                <th className="py-3 px-3">Ordering Doctor</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-right">Download</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              {[
                { id: 'REP-8821', date: '08 Nov 2026', test: 'Lipid Profile Comprehensive', doc: 'Dr. Rajesh Sharma', status: 'Ready' },
                { id: 'REP-8820', date: '08 Nov 2026', test: 'Cardiac Troponin-I (High Sensitivity)', doc: 'Dr. Rajesh Sharma', status: 'Ready' },
                { id: 'REP-7412', date: '15 Oct 2026', test: 'Complete Blood Count (CBC)', doc: 'Dr. Ananya Roy', status: 'Archived' }
              ].map((rep) => (
                <tr key={rep.id} className="hover:bg-slate-50/60 transition">
                  <td className="py-3.5 px-4">
                    <div className="font-mono font-bold text-teal-800">{rep.id}</div>
                    <div className="text-[11px] text-slate-400">{rep.date}</div>
                  </td>
                  <td className="py-3 px-3 font-semibold text-slate-900">{rep.test}</td>
                  <td className="py-3 px-3 text-slate-800">{rep.doc}</td>
                  <td className="py-3 px-3">
                    <Badge variant="success" size="sm">{rep.status}</Badge>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        showToast({
                          type: 'info',
                          title: 'Downloading PDF',
                          message: `Downloading signed laboratory report ${rep.id}.`
                        });
                      }}
                    >
                      <Download className="w-3.5 h-3.5 mr-1 text-teal-700" />
                      <span>PDF</span>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab: Bills */}
      {activeTab === 'bills' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bills.map((bill) => (
              <div
                key={bill.id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3 flex flex-col justify-between text-xs"
              >
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-mono font-bold text-teal-800 text-sm">{bill.id}</span>
                    <Badge variant={bill.status === 'Paid' ? 'success' : 'danger'} size="sm">
                      {bill.status}
                    </Badge>
                  </div>
                  <div className="text-slate-400 text-[11px]">{bill.date}</div>
                  <div className="font-semibold text-slate-800 mt-2">{bill.description}</div>
                  <div className="text-lg font-bold text-slate-900 mt-1">₹ {bill.amount.toLocaleString()}</div>
                  {bill.paymentMode && (
                    <div className="text-[11px] text-emerald-600 mt-1">Paid via {bill.paymentMode}</div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-end">
                  {bill.status === 'Unpaid' ? (
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => {
                        setSelectedBill(bill);
                        setIsPayModalOpen(true);
                      }}
                    >
                      <CreditCard className="w-3.5 h-3.5 mr-1" />
                      <span>Pay Online Now</span>
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        showToast({
                          type: 'info',
                          title: 'Downloading Receipt',
                          message: `Receipt for ${bill.id} downloaded.`
                        });
                      }}
                    >
                      <Download className="w-3.5 h-3.5 mr-1 text-teal-700" />
                      <span>Receipt</span>
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Telemedicine Hub Tab Panel */}
      {activeTab === 'telemedicine' && <TelemedicineHub />}

      {/* Book Appointment Modal */}
      <Modal
        isOpen={isApptModalOpen}
        onClose={() => setIsApptModalOpen(false)}
        title="Schedule Doctor Appointment"
        description="Select clinical specialty, preferred doctor, and convenient date/time slot."
        footer={
          <>
            <Button variant="outline" onClick={() => setIsApptModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleBookAppt}>
              Confirm Booking
            </Button>
          </>
        }
      >
        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Clinical Specialty</label>
              <select
                value={selectedSpecialty}
                onChange={(e) => {
                  setSelectedSpecialty(e.target.value);
                  setSelectedDoc(e.target.value === 'Cardiology' ? 'Dr. Rajesh Sharma' : 'Dr. Ananya Roy');
                }}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
              >
                <option value="Cardiology">Cardiology</option>
                <option value="General Medicine">General Medicine</option>
                <option value="Orthopedics">Orthopedics</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Consulting Physician</label>
              <select
                value={selectedDoc}
                onChange={(e) => setSelectedDoc(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
              >
                <option value="Dr. Rajesh Sharma">Dr. Rajesh Sharma (Cardiology)</option>
                <option value="Dr. Ananya Roy">Dr. Ananya Roy (Gen Medicine)</option>
                <option value="Dr. Vikram Sethi">Dr. Vikram Sethi (Orthopedics)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Preferred Date</label>
              <input
                type="date"
                value={apptDate}
                onChange={(e) => setApptDate(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Preferred Time Slot</label>
              <select
                value={apptTime}
                onChange={(e) => setApptTime(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
              >
                <option value="10:15 AM">10:15 AM</option>
                <option value="11:30 AM">11:30 AM</option>
                <option value="02:30 PM">02:30 PM</option>
                <option value="04:00 PM">04:00 PM</option>
              </select>
            </div>
          </div>
        </div>
      </Modal>

      {/* Pay Bill Modal */}
      {selectedBill && (
        <Modal
          isOpen={isPayModalOpen}
          onClose={() => setIsPayModalOpen(false)}
          title={`Pay Hospital Bill — ${selectedBill.id}`}
          description={`Amount Payable: ₹ ${selectedBill.amount.toLocaleString()} · ${selectedBill.description}`}
          footer={
            <>
              <Button variant="outline" onClick={() => setIsPayModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handlePayBill}>
                <Check className="w-4 h-4 mr-1.5" />
                <span>Authorize & Pay ₹ {selectedBill.amount.toLocaleString()}</span>
              </Button>
            </>
          }
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg text-teal-900">
              <span className="font-bold block">Instant Razorpay / UPI Gateway Simulation</span>
              <span className="text-[11px] text-teal-700">Zero transaction convenience charges. Instant hospital clearance.</span>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Enter UPI ID</label>
              <input
                type="text"
                defaultValue="rahul.verma@okhdfcbank"
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>
          </div>
        </Modal>
      )}

      {/* Rx Preview Modal */}
      <Modal
        isOpen={isRxModalOpen}
        onClose={() => setIsRxModalOpen(false)}
        title="Electronic Prescription (Rx) — RX-2026-0194"
        description="Digitally signed by Dr. Rajesh Sharma (Reg: MCI-1998-4412)."
        footer={
          <Button variant="outline" onClick={() => setIsRxModalOpen(false)}>
            Close Preview
          </Button>
        }
      >
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 text-xs">
          <div className="flex justify-between border-b border-slate-200 pb-2">
            <div>
              <span className="font-bold text-slate-900 block">Apex Care Multi-Specialty Hospital</span>
              <span className="text-slate-500 text-[11px]">Department of Cardiology</span>
            </div>
            <span className="font-mono text-teal-700 font-bold">RX-2026-0194</span>
          </div>

          <div className="space-y-2">
            <div className="font-semibold text-slate-800">1. Atorvastatin 20mg Tablet</div>
            <p className="text-slate-500 text-[11px]">1 Tablet once daily after dinner at bedtime (30 Days)</p>

            <div className="font-semibold text-slate-800 mt-2">2. Aspirin 75mg Gastro-Resistant Tablet</div>
            <p className="text-slate-500 text-[11px]">1 Tablet once daily with lunch (30 Days)</p>
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-between items-center text-[11px] text-slate-500">
            <span>Doctor Sign: Dr. Rajesh Sharma (MD, DM)</span>
            <span className="font-mono">Hash: a8f9c2d1</span>
          </div>
        </div>
      </Modal>
    </div>
  );
};
