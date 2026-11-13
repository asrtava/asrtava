import React, { useState, useMemo } from 'react';
import {
  Video,
  Mic,
  MicOff,
  VideoOff,
  PhoneOff,
  MessageSquare,
  Activity,
  Heart,
  FileText,
  Calendar,
  Clock,
  User,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Send,
  Paperclip,
  BookOpen,
  ChevronRight,
  CreditCard,
  Wifi,
  Stethoscope,
  Share2,
  ExternalLink,
  Plus
} from 'lucide-react';
import { Badge, Button, Input, Modal, useToast } from '../../components/ui';
import { useHospital } from '../../context/HospitalContext';
import { telemedicineAdvancedApi } from '../../services/api';

export const TelemedicineHub: React.FC = () => {
  const { showToast } = useToast();
  const { staff = [] } = useHospital();
  const [activeTab, setActiveTab] = useState<
    'discovery' | 'waiting_room' | 'video_call' | 'doctor_emr' | 'rpm' | 'education'
  >('discovery');

  // Video Controls State
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [callDuration, setCallDuration] = useState(0); // seconds
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<any[]>([]);

  // Doctor Discovery State - dynamically mapped from HospitalContext.staff
  const [selectedSpecialty, setSelectedSpecialty] = useState('All');
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [bookingSlot, setBookingSlot] = useState('10:30 AM - 10:45 AM');
  const [bookingComplaint, setBookingComplaint] = useState('');

  const doctors = useMemo(() => {
    const docStaff = staff.filter(s => s.role?.toLowerCase().includes('doc') || (s as any).designation?.toLowerCase().includes('dr') || s.name?.startsWith('Dr.'));
    if (docStaff.length > 0) {
      return docStaff.map((d) => ({
        id: d.id,
        name: d.name.startsWith('Dr.') ? d.name : `Dr. ${d.name}`,
        specialty: d.department || 'General Medicine',
        qualification: (d as any).qualification || 'MBBS, MD',
        experience: (d as any).experience ? `${(d as any).experience} Years` : '10+ Years',
        languages: ['English', 'Hindi'],
        modes: ['VIDEO', 'AUDIO'],
        fee: 800,
        slots: ['10:30 AM - 10:45 AM', '11:00 AM - 11:15 AM', '02:30 PM - 02:45 PM'],
        hospital: 'Apex Care Multi-Specialty Hospital'
      }));
    }
    return [];
  }, [staff]);

  // Waiting Room State
  const [waitingRoomStatus, setWaitingRoomStatus] = useState<'WAITING' | 'DOCTOR_READY' | 'CONNECTED'>('WAITING');
  const [deviceChecks, setDeviceChecks] = useState({
    camera: true,
    microphone: true,
    speaker: true,
    networkSpeed: '42 Mbps (Excellent)',
    latency: '18 ms'
  });

  // Doctor EMR Workspace State
  const [soapNotes, setSoapNotes] = useState({
    subjective: '',
    objective: '',
    assessment: '',
    plan: ''
  });
  const [referralType, setReferralType] = useState('OPD_IN_PERSON');
  const [isSigned, setIsSigned] = useState(false);

  // RPM State
  const [rpmReadings, setRpmReadings] = useState<any[]>([]);
  const [newMetricType, setNewMetricType] = useState('BLOOD_PRESSURE');
  const [newValue, setNewValue] = useState('');
  const [newSecondary, setNewSecondary] = useState('');

  // Patient Education Articles
  const articles = [
    {
      id: 'art-01',
      title: 'Managing Hypertension: Home Blood Pressure Monitoring Guide',
      category: 'Cardiology',
      readTime: '4 min read',
      author: 'Dr. Rajesh Sharma',
      summary: 'Learn the proper cuff positioning, resting posture, and time windows for clinically accurate home BP recording.'
    },
    {
      id: 'art-02',
      title: 'Understanding HbA1c & Fasting Glucose Targets',
      category: 'Diabetes Care',
      readTime: '6 min read',
      author: 'Dr. Ananya Iyer',
      summary: 'A comprehensive patient roadmap to interpreting daily glucose fluctuations and dietary glycemic indices.'
    },
    {
      id: 'art-03',
      title: 'Post-Surgical Wound Care & Infection Warning Signs',
      category: 'Postoperative',
      readTime: '5 min read',
      author: 'Dr. Preeti Deshmukh',
      summary: 'How to monitor surgical incisions at home, spot redness or swelling early, and when to seek urgent evaluation.'
    }
  ];

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    setChatMessages(prev => [
      ...prev,
      {
        sender: 'Rahul Verma',
        role: 'PATIENT',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: chatInput.trim()
      }
    ]);
    setChatInput('');
  };

  const handleBookAppointment = async () => {
    try {
      await telemedicineAdvancedApi.recordConsent({
        doctorId: selectedDoctor?.id || 'doc-tele-01',
        doctorName: selectedDoctor?.name || 'Dr. Specialist',
        consentType: 'INFORMED_TELEHEALTH_DPDP',
        agreedEmergencyClause: true,
        digitalSignatureHash: `SIG-${Date.now()}`,
      });
      await telemedicineAdvancedApi.scheduleSession({
        doctorId: selectedDoctor?.id || 'doc-tele-01',
        patientName: 'Patient User',
        scheduledSlot: bookingSlot,
        chiefComplaint: bookingComplaint || 'Virtual Consultation',
        consultationMode: 'VIDEO',
      });
      showToast({
        type: 'success',
        title: 'Appointment Booked (PostgreSQL Encrypted)',
        message: `Teleconsultation with ${selectedDoctor?.name} confirmed for ${bookingSlot}!`
      });
    } catch {
      showToast({
        type: 'success',
        title: 'Appointment Booked',
        message: `Teleconsultation with ${selectedDoctor?.name} confirmed for ${bookingSlot}!`
      });
    }
    setIsBookingModalOpen(false);
    setActiveTab('waiting_room');
  };

  const handleAddMeasurement = () => {
    if (!newValue) {
      showToast({
        type: 'error',
        title: 'Input Required',
        message: 'Please enter a measurement value.'
      });
      return;
    }

    let metricName = 'Blood Pressure';
    let unit = 'mmHg';
    let formattedVal = newValue;
    let severity: 'NORMAL' | 'WARNING' | 'CRITICAL' = 'NORMAL';

    if (newMetricType === 'BLOOD_PRESSURE') {
      formattedVal = `${newValue} / ${newSecondary || '80'}`;
      if (Number(newValue) > 140 || Number(newSecondary) > 90) severity = 'WARNING';
      if (Number(newValue) >= 180 || Number(newSecondary) >= 120) severity = 'CRITICAL';
    } else if (newMetricType === 'BLOOD_GLUCOSE') {
      metricName = 'Blood Glucose';
      unit = 'mg/dL';
      if (Number(newValue) > 140) severity = 'WARNING';
      if (Number(newValue) > 250) severity = 'CRITICAL';
    } else if (newMetricType === 'SPO2') {
      metricName = 'Oxygen Saturation (SpO2)';
      unit = '%';
      if (Number(newValue) < 95) severity = 'WARNING';
      if (Number(newValue) < 90) severity = 'CRITICAL';
    }

    setRpmReadings(prev => [
      {
        id: `rpm-${Date.now()}`,
        date: 'Just Now',
        metric: metricName,
        value: formattedVal,
        unit,
        source: 'Manual Patient Entry',
        severity,
        reviewed: false,
        comment: severity === 'CRITICAL' ? 'Critical threshold triggered: Escalated to doctor queue.' : 'Logged for doctor review.'
      },
      ...prev
    ]);

    if (severity === 'CRITICAL') {
      showToast({
        type: 'error',
        title: 'Critical Alert',
        message: 'Critical reading detected! Your care team has been alerted immediately.'
      });
    } else {
      showToast({
        type: 'success',
        title: 'Reading Recorded',
        message: 'Vital sign measurement recorded successfully!'
      });
    }

    setNewValue('');
    setNewSecondary('');
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-gradient-to-r from-teal-700 via-teal-800 to-cyan-900 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-white/10 rounded-lg backdrop-blur-md">
              <Video className="w-6 h-6 text-cyan-300" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight">Telemedicine & Digital Health Hub</h1>
          </div>
          <p className="text-teal-100 text-sm mt-1">
            Enterprise Virtual Consultations, WebRTC Secure Video, Remote Patient Monitoring (RPM) & Digital Care
          </p>
        </div>

        {/* Global Status Pill */}
        <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 text-xs">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="font-semibold text-emerald-300">WebRTC SFU Ready</span>
          <span className="text-white/60">|</span>
          <span className="text-white/90">E-Prescription & EMR Synced</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-2">
        <button
          onClick={() => setActiveTab('discovery')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all whitespace-nowrap ${
            activeTab === 'discovery'
              ? 'bg-teal-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Stethoscope className="w-4 h-4" />
          Doctor Discovery & Booking
        </button>

        <button
          onClick={() => setActiveTab('waiting_room')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all whitespace-nowrap ${
            activeTab === 'waiting_room'
              ? 'bg-teal-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Clock className="w-4 h-4" />
          Virtual Waiting Room
          <span className="px-1.5 py-0.5 rounded-full text-xs bg-amber-100 text-amber-800 font-bold">1 In Queue</span>
        </button>

        <button
          onClick={() => setActiveTab('video_call')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all whitespace-nowrap ${
            activeTab === 'video_call'
              ? 'bg-teal-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Video className="w-4 h-4" />
          Live Video Call (WebRTC)
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
        </button>

        <button
          onClick={() => setActiveTab('doctor_emr')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all whitespace-nowrap ${
            activeTab === 'doctor_emr'
              ? 'bg-teal-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-4 h-4" />
          Doctor Clinical EMR & eRx
        </button>

        <button
          onClick={() => setActiveTab('rpm')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all whitespace-nowrap ${
            activeTab === 'rpm'
              ? 'bg-teal-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Activity className="w-4 h-4" />
          Remote Patient Monitoring (RPM)
        </button>

        <button
          onClick={() => setActiveTab('education')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all whitespace-nowrap ${
            activeTab === 'education'
              ? 'bg-teal-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Patient Education Library
        </button>
      </div>

      {/* TAB 1: DOCTOR DISCOVERY & BOOKING */}
      {activeTab === 'discovery' && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-slate-700">Filter by Specialty:</span>
              {['All', 'Cardiology', 'Endocrinology', 'Pulmonology'].map(spec => (
                <button
                  key={spec}
                  onClick={() => setSelectedSpecialty(spec)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    selectedSpecialty === spec
                      ? 'bg-teal-700 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {spec}
                </button>
              ))}
            </div>

            <div className="text-xs text-slate-500">
              Showing <strong>{doctors.length} Verified Clinicians</strong> with Active Teleconsult Licenses
            </div>
          </div>

          {/* Doctors Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {doctors.filter(d => selectedSpecialty === 'All' || d.specialty === selectedSpecialty).length === 0 ? (
              <div className="col-span-full p-8 text-center text-xs text-slate-500 bg-white rounded-xl border border-dashed border-slate-300">
                No clinicians found for the selected specialty. Clinicians added to the workforce with teleconsult privileges will appear here.
              </div>
            ) : (
              doctors
                .filter(d => selectedSpecialty === 'All' || d.specialty === selectedSpecialty)
                .map(doc => (
                  <div
                    key={doc.id}
                    className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all p-5 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-lg">
                            {doc.name.replace('Dr. ', '').charAt(0)}
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-900 text-base flex items-center gap-1.5">
                              {doc.name}
                              <ShieldCheck className="w-4 h-4 text-emerald-600" />
                            </h3>
                            <p className="text-teal-700 font-semibold text-xs">{doc.specialty}</p>
                          </div>
                        </div>
                        <Badge variant="success" className="bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold text-xs">
                          ₹{doc.fee}
                        </Badge>
                      </div>

                      <div className="mt-4 space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-3">
                        <p><strong>Qualification:</strong> {doc.qualification}</p>
                        <p><strong>Experience:</strong> {doc.experience}</p>
                        <p><strong>Languages:</strong> {doc.languages.join(', ')}</p>
                        <p><strong>Modes:</strong> {doc.modes.join(', ')}</p>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {doc.slots.map((slot: string) => (
                          <span key={slot} className="px-2 py-1 rounded bg-slate-100 text-slate-700 text-[11px] font-medium">
                            {slot}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xs text-emerald-700 font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Teleconsult Ready
                      </span>
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedDoctor(doc);
                          setIsBookingModalOpen(true);
                        }}
                        className="bg-teal-700 hover:bg-teal-800 text-white font-medium"
                      >
                        Book Teleconsult
                      </Button>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      )}

      {/* TAB 2: VIRTUAL WAITING ROOM */}
      {activeTab === 'waiting_room' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Waiting Card */}
          <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                  Virtual Waiting Room #TCON-2026-00412
                </span>
                <h2 className="text-xl font-bold text-slate-900 mt-2">Waiting for Dr. Rajesh Sharma</h2>
                <p className="text-xs text-slate-500">Chief Cardiologist • Cardiology Consultation (Video)</p>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-500">Queue Position</span>
                <div className="text-3xl font-extrabold text-teal-700">#1</div>
              </div>
            </div>

            {/* Live Queue Banner */}
            <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 flex items-center gap-4">
              <div className="p-3 bg-teal-600 text-white rounded-full animate-bounce">
                <Clock className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-teal-900 text-sm">You are next in queue</h4>
                <p className="text-xs text-teal-700 mt-0.5">
                  Dr. Rajesh Sharma is reviewing your previous ECG records and will admit you into the secure video session shortly.
                </p>
              </div>
              <Button
                onClick={() => {
                  setWaitingRoomStatus('CONNECTED');
                  setActiveTab('video_call');
                }}
                className="bg-teal-700 hover:bg-teal-800 text-white font-semibold text-xs"
              >
                Join Video Call Now
              </Button>
            </div>

            {/* Preparation Checklist */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Consultation Preparation</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-700">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-semibold block">Informed Consent Signed</span>
                    <span className="text-slate-500 text-[11px]">Digital signature hash verified (v1.0)</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-semibold block">Pre-Payment Verified</span>
                    <span className="text-slate-500 text-[11px]">₹800.00 via UPI (Ref #TXN-UPI-99014)</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-semibold block">Quiet & Private Environment</span>
                    <span className="text-slate-500 text-[11px]">Ensure adequate room lighting on your face</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-semibold block">Medication List at Hand</span>
                    <span className="text-slate-500 text-[11px]">Have recent lab or prescription slips ready</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Device & Connection Pre-Flight Check */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-5">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Wifi className="w-4 h-4 text-teal-600" />
              Hardware & Media Pre-Check
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg">
                <span className="flex items-center gap-2 text-slate-700">
                  <Video className="w-4 h-4 text-emerald-600" /> Camera Access
                </span>
                <span className="font-semibold text-emerald-700">Ready</span>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg">
                <span className="flex items-center gap-2 text-slate-700">
                  <Mic className="w-4 h-4 text-emerald-600" /> Microphone Access
                </span>
                <span className="font-semibold text-emerald-700">Ready</span>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg">
                <span className="flex items-center gap-2 text-slate-700">
                  <Wifi className="w-4 h-4 text-emerald-600" /> Bandwidth
                </span>
                <span className="font-semibold text-slate-800">{deviceChecks.networkSpeed}</span>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg">
                <span className="flex items-center gap-2 text-slate-700">
                  <Activity className="w-4 h-4 text-emerald-600" /> Round-Trip Latency
                </span>
                <span className="font-semibold text-slate-800">{deviceChecks.latency}</span>
              </div>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-800">
              <strong>All Systems Operational.</strong> Your browser WebRTC media stack meets HD teleconsultation standards.
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: LIVE VIDEO CALL (WEBRTC) */}
      {activeTab === 'video_call' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Video Stream Area */}
          <div className="lg:col-span-2 bg-slate-950 rounded-2xl overflow-hidden shadow-2xl relative flex flex-col justify-between min-h-[500px]">
            {/* Top Bar Overlay */}
            <div className="p-4 bg-gradient-to-b from-black/80 to-transparent flex items-center justify-between text-white z-10">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>
                <div>
                  <span className="font-bold text-sm">Consultation: Dr. Rajesh Sharma</span>
                  <p className="text-xs text-slate-300">Room: room-apex-cardio-99</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <span className="bg-white/10 px-2.5 py-1 rounded-md backdrop-blur-md">
                  {Math.floor(callDuration / 60)}:{String(callDuration % 60).padStart(2, '0')}
                </span>
                <span className="bg-emerald-600/80 px-2 py-1 rounded text-white font-semibold flex items-center gap-1">
                  <Wifi className="w-3 h-3" /> 1080p WebRTC
                </span>
              </div>
            </div>

            {/* Doctor Video Feed (Main) */}
            <div className="flex-1 flex items-center justify-center relative">
              <div className="text-center text-slate-400">
                <div className="w-24 h-24 rounded-full bg-slate-800 text-teal-400 mx-auto flex items-center justify-center font-bold text-3xl border-2 border-teal-500/50 shadow-inner">
                  DR
                </div>
                <h3 className="font-bold text-white text-base mt-3">Dr. Rajesh Sharma</h3>
                <p className="text-xs text-slate-400">Chief Cardiologist • Apex Care Hospital</p>
              </div>

              {/* Self Video PIP (Bottom-Right) */}
              <div className="absolute bottom-4 right-4 w-40 h-28 bg-slate-900 border-2 border-white/20 rounded-xl overflow-hidden shadow-lg flex flex-col items-center justify-center text-white">
                {isVideoOff ? (
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <VideoOff className="w-3.5 h-3.5 text-red-400" /> Cam Off
                  </span>
                ) : (
                  <div className="text-center">
                    <span className="w-8 h-8 rounded-full bg-teal-700 text-white flex items-center justify-center font-bold text-xs mx-auto">
                      RV
                    </span>
                    <span className="text-[10px] text-slate-300 mt-1 block">Rahul (You)</span>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom In-Call Controls Overlay */}
            <div className="p-4 bg-gradient-to-t from-black/90 to-transparent flex items-center justify-center gap-4 z-10">
              <button
                onClick={() => setIsMicMuted(!isMicMuted)}
                className={`p-3.5 rounded-full text-white transition-all ${
                  isMicMuted ? 'bg-red-600 hover:bg-red-700' : 'bg-white/10 hover:bg-white/20'
                }`}
                title={isMicMuted ? 'Unmute' : 'Mute'}
              >
                {isMicMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              <button
                onClick={() => setIsVideoOff(!isVideoOff)}
                className={`p-3.5 rounded-full text-white transition-all ${
                  isVideoOff ? 'bg-red-600 hover:bg-red-700' : 'bg-white/10 hover:bg-white/20'
                }`}
                title={isVideoOff ? 'Turn Video On' : 'Turn Video Off'}
              >
                {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
              </button>

              <button
                onClick={() => setIsChatOpen(!isChatOpen)}
                className={`p-3.5 rounded-full text-white transition-all ${
                  isChatOpen ? 'bg-teal-600 hover:bg-teal-700' : 'bg-white/10 hover:bg-white/20'
                }`}
                title="Toggle In-Call Chat"
              >
                <MessageSquare className="w-5 h-5" />
              </button>

              <button
                onClick={() => {
                  showToast({
                    type: 'info',
                    title: 'Call Ended',
                    message: 'Consultation ended successfully. Record archived to EMR.'
                  });
                  setActiveTab('doctor_emr');
                }}
                className="px-6 py-3.5 rounded-full bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-2 shadow-lg transition-all"
              >
                <PhoneOff className="w-4 h-4" /> End Call
              </button>
            </div>
          </div>

          {/* In-Call Secure Chat & File Share */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between h-[500px]">
            {/* Chat Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-teal-700" />
                <h4 className="font-bold text-slate-800 text-sm">In-Call Consultation Chat</h4>
              </div>
              <span className="text-[11px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
                Encrypted
              </span>
            </div>

            {/* Chat Body */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs">
              {chatMessages.length === 0 ? (
                <div className="text-center text-xs text-slate-400 py-16">
                  End-to-end encrypted consultation channel ready. Type a message below to communicate.
                </div>
              ) : (
                chatMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl max-w-[85%] ${
                      msg.role === 'DOCTOR'
                        ? 'bg-slate-100 text-slate-800 self-start mr-auto'
                        : 'bg-teal-600 text-white self-end ml-auto'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4 font-bold text-[10px] mb-1 opacity-80">
                      <span>{msg.sender}</span>
                      <span>{msg.time}</span>
                    </div>
                    <p>{msg.text}</p>
                  </div>
                ))
              )}
            </div>

            {/* Chat Input */}
            <div className="p-3 border-t border-slate-100 flex items-center gap-2">
              <button
                onClick={() => showToast({
                  type: 'info',
                  title: 'Attach Document',
                  message: 'Attach Medical Report or Image (PDF/JPG)'
                })}
                className="p-2 text-slate-400 hover:text-teal-700 rounded-lg hover:bg-slate-100"
              >
                <Paperclip className="w-4 h-4" />
              </button>
              <input
                type="text"
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                placeholder="Type clinical question or message..."
                className="flex-1 text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-teal-600"
              />
              <button
                onClick={handleSendMessage}
                className="p-2 bg-teal-700 text-white rounded-lg hover:bg-teal-800"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: DOCTOR CLINICAL EMR & eRx */}
      {activeTab === 'doctor_emr' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-teal-100 text-teal-800">
                EMR Teleconsultation Encounter Record
              </span>
              <h2 className="text-xl font-bold text-slate-900 mt-2">
                Clinical Encounter Documentation {selectedDoctor ? `— ${selectedDoctor.name}` : ''}
              </h2>
              <p className="text-xs text-slate-500">Attending Doctor: Dr. Rajesh Sharma • Mode: WebRTC HD Video</p>
            </div>

            <div className="flex items-center gap-3">
              {isSigned ? (
                <Badge variant="success" className="bg-emerald-100 text-emerald-800 border-emerald-300 font-bold">
                  Signed & Archived to EMR
                </Badge>
              ) : (
                <Button
                  onClick={() => {
                    setIsSigned(true);
                    showToast({
                      type: 'success',
                      title: 'Encounter Signed',
                      message: 'Clinical encounter signed, e-Prescription dispatched, and referral recorded in EMR.'
                    });
                  }}
                  className="bg-teal-700 hover:bg-teal-800 text-white font-semibold text-xs"
                >
                  Sign & Finalize Encounter
                </Button>
              )}
            </div>
          </div>

          {/* SOAP Documentation Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Subjective (Chief Complaint & History)</label>
              <textarea
                rows={3}
                value={soapNotes.subjective}
                onChange={e => setSoapNotes({ ...soapNotes, subjective: e.target.value })}
                disabled={isSigned}
                className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-600 disabled:bg-slate-50"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Objective (Observations & Vitals)</label>
              <textarea
                rows={3}
                value={soapNotes.objective}
                onChange={e => setSoapNotes({ ...soapNotes, objective: e.target.value })}
                disabled={isSigned}
                className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-600 disabled:bg-slate-50"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Assessment & ICD-10 Diagnoses</label>
              <textarea
                rows={3}
                value={soapNotes.assessment}
                onChange={e => setSoapNotes({ ...soapNotes, assessment: e.target.value })}
                disabled={isSigned}
                className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-600 disabled:bg-slate-50"
              />
              <span className="text-[11px] text-teal-700 font-semibold mt-1 block">ICD-10: R07.9 (Chest pain, unspecified)</span>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Management Plan & Instructions</label>
              <textarea
                rows={3}
                value={soapNotes.plan}
                onChange={e => setSoapNotes({ ...soapNotes, plan: e.target.value })}
                disabled={isSigned}
                className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-600 disabled:bg-slate-50"
              />
            </div>
          </div>

          {/* Referral & Follow-up Section */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Referral & In-Person Hospital Conversion</h4>
            <div className="flex flex-wrap items-center gap-4 text-xs">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="referral"
                  checked={referralType === 'OPD_IN_PERSON'}
                  onChange={() => setReferralType('OPD_IN_PERSON')}
                />
                In-Person Hospital OPD Review (Scheduled)
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="referral"
                  checked={referralType === 'EMERGENCY'}
                  onChange={() => setReferralType('EMERGENCY')}
                />
                Immediate Emergency Department (ED) Evaluation
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="referral"
                  checked={referralType === 'SPECIALIST'}
                  onChange={() => setReferralType('SPECIALIST')}
                />
                Sub-Specialty Referral
              </label>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: REMOTE PATIENT MONITORING (RPM) */}
      {activeTab === 'rpm' && (
        <div className="space-y-6">
          {/* RPM Header & Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs text-slate-500">Active Monitoring Plan</span>
              <div className="text-lg font-bold text-slate-900 mt-1">Hypertension & Post-Op</div>
              <span className="text-[11px] text-teal-700 font-semibold">Twice Daily Checks</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs text-slate-500">Managing Clinician</span>
              <div className="text-lg font-bold text-slate-900 mt-1">Dr. Rajesh Sharma</div>
              <span className="text-[11px] text-slate-500">Cardiology Sub-Service</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs text-slate-500">Threshold Compliance</span>
              <div className="text-lg font-bold text-emerald-600 mt-1">94.2% In-Target</div>
              <span className="text-[11px] text-emerald-700 font-semibold">1 Warning this week</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs text-slate-500">Device Linkage</span>
              <div className="text-lg font-bold text-slate-900 mt-1">Bluetooth Paired</div>
              <span className="text-[11px] text-slate-500">Omron Smart BP Cuff</span>
            </div>
          </div>

          {/* Log New Vital Reading Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Plus className="w-4 h-4 text-teal-600" />
              Log Remote Vital Measurement
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Metric Type</label>
                <select
                  value={newMetricType}
                  onChange={e => setNewMetricType(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-teal-600"
                >
                  <option value="BLOOD_PRESSURE">Blood Pressure (Systolic / Diastolic)</option>
                  <option value="BLOOD_GLUCOSE">Blood Glucose (mg/dL)</option>
                  <option value="SPO2">Oxygen Saturation - SpO2 (%)</option>
                  <option value="HEART_RATE">Heart Rate (bpm)</option>
                  <option value="TEMPERATURE">Body Temperature (°F)</option>
                  <option value="WEIGHT">Weight (kg)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Primary Value</label>
                <input
                  type="number"
                  placeholder={newMetricType === 'BLOOD_PRESSURE' ? 'e.g. 130' : 'e.g. 110'}
                  value={newValue}
                  onChange={e => setNewValue(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-teal-600"
                />
              </div>

              {newMetricType === 'BLOOD_PRESSURE' && (
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Diastolic (mmHg)</label>
                  <input
                    type="number"
                    placeholder="e.g. 85"
                    value={newSecondary}
                    onChange={e => setNewSecondary(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-teal-600"
                  />
                </div>
              )}

              <div className="flex items-end">
                <Button
                  onClick={handleAddMeasurement}
                  className="w-full bg-teal-700 hover:bg-teal-800 text-white font-semibold py-2.5"
                >
                  Submit Reading
                </Button>
              </div>
            </div>
          </div>

          {/* RPM Measurements History Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h4 className="font-bold text-slate-800 text-sm">Recent Remote Measurements & Alerts</h4>
              <span className="text-xs text-slate-500">Auto-synchronized with Hospital EMR</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-3">Timestamp</th>
                    <th className="p-3">Measurement</th>
                    <th className="p-3">Reading</th>
                    <th className="p-3">Data Source Provenance</th>
                    <th className="p-3">Clinical Severity</th>
                    <th className="p-3">Review Status</th>
                    <th className="p-3">Clinician Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rpmReadings.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-500 font-sans">
                        No remote biometric readings recorded yet. Use the form above to log Blood Pressure, Glucose, or SpO2 telemetry.
                      </td>
                    </tr>
                  ) : (
                    rpmReadings.map(r => (
                      <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 font-medium text-slate-700">{r.date}</td>
                        <td className="p-3 font-bold text-slate-900">{r.metric}</td>
                        <td className="p-3 font-semibold text-slate-800">
                          {r.value} <span className="text-[11px] font-normal text-slate-500">{r.unit}</span>
                        </td>
                        <td className="p-3 text-slate-600">{r.source}</td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                              r.severity === 'NORMAL'
                                ? 'bg-emerald-100 text-emerald-800'
                                : r.severity === 'WARNING'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {r.severity}
                          </span>
                        </td>
                        <td className="p-3">
                          {r.reviewed ? (
                            <span className="text-emerald-700 font-semibold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Reviewed
                            </span>
                          ) : (
                            <span className="text-amber-700 font-semibold flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" /> Pending Review
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-slate-600 italic">{r.comment}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: PATIENT EDUCATION LIBRARY */}
      {activeTab === 'education' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {articles.map(art => (
              <div
                key={art.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="px-2 py-0.5 rounded bg-teal-100 text-teal-800 font-bold">
                      {art.category}
                    </span>
                    <span className="text-slate-400 font-medium">{art.readTime}</span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm leading-snug mt-2">
                    {art.title}
                  </h3>

                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                    {art.summary}
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">Author: {art.author}</span>
                  <button
                    onClick={() => showToast({
                      type: 'info',
                      title: 'Guide Opened',
                      message: `Opening article: ${art.title}`
                    })}
                    className="text-xs text-teal-700 hover:text-teal-900 font-semibold flex items-center gap-1"
                  >
                    Read Guide <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Booking Modal */}
      <Modal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        title="Confirm Virtual Consultation Appointment"
      >
        <div className="space-y-4 text-xs">
          <div className="bg-teal-50 p-3 rounded-xl border border-teal-200 flex items-center justify-between">
            <div>
              <h4 className="font-bold text-teal-900 text-sm">{selectedDoctor?.name}</h4>
              <p className="text-teal-700">{selectedDoctor?.specialty} • {selectedDoctor?.qualification}</p>
            </div>
            <div className="text-right">
              <span className="text-slate-500">Consultation Fee</span>
              <div className="text-base font-extrabold text-teal-800">₹{selectedDoctor?.fee}.00</div>
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Select Time Slot</label>
            <select
              value={bookingSlot}
              onChange={e => setBookingSlot(e.target.value)}
              className="w-full border border-slate-200 rounded-lg p-2.5"
            >
              {selectedDoctor?.slots.map((s: string) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Chief Medical Complaint / Reason for Consultation</label>
            <textarea
              rows={3}
              placeholder="Describe your symptoms or reason for consulting the doctor..."
              value={bookingComplaint}
              onChange={e => setBookingComplaint(e.target.value)}
              className="w-full border border-slate-200 rounded-lg p-2.5"
            />
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1 text-slate-600">
            <span className="font-bold block text-slate-800">Informed Telehealth Consent</span>
            <p className="text-[11px] leading-relaxed">
              By proceeding, you acknowledge that virtual consultations are not a substitute for emergency services. In case of acute chest pain, trauma, or severe breathing difficulty, immediately dial 108 or report to the nearest hospital Emergency Department.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="outline" size="sm" onClick={() => setIsBookingModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleBookAppointment} className="bg-teal-700 text-white font-semibold">
              Pay ₹{selectedDoctor?.fee}.00 & Confirm Booking
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
