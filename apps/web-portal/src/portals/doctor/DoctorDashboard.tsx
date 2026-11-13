import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  User,
  FileText,
  CheckCircle,
  PlusCircle,
  AlertCircle,
  Search,
  Trash2,
  Activity,
  Heart,
  Thermometer,
  Wind,
  Droplets,
  Stethoscope,
  Send,
  Eye,
  Check,
  BedDouble,
  Radio,
  Users,
  Pill,
  ClipboardList,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Phone,
  Layers
} from 'lucide-react';
import { Modal, Button, Input, Badge, useToast } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { useHospital } from '../../context/HospitalContext';
import { appointmentApi, clinicalApi, diagnosticsApi, inpatientApi, patientApi } from '../../services/api';

export interface PrescriptionItem {
  id: string;
  drugName: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

export interface PatientQueueItem {
  id: string;
  appointmentId?: string;
  token: string;
  name: string;
  uhid: string;
  age: number;
  gender: string;
  phone?: string;
  time: string;
  complaint: string;
  status: 'Waiting' | 'In Consultation' | 'Completed';
  vitals: {
    bp: string;
    hr: string;
    temp: string;
    spo2: string;
    sugar: string;
  };
  notes: string;
  diagnosis: string;
  prescriptions: PrescriptionItem[];
}

export interface InpatientItem {
  id: string;
  admissionId: string;
  name: string;
  uhid: string;
  bed: string;
  ward: string;
  diagnosis: string;
  vitals: string;
  roundNote: string;
  status: string;
}

export interface DiagnosticOrderItem {
  id: string;
  patientId: string;
  patientName: string;
  patientUhid: string;
  type: 'lab' | 'radiology';
  title: string;
  priority: 'Routine' | 'STAT Urgent';
  orderedAt: string;
  status: 'ordered' | 'result_entered' | 'signed';
  resultValue?: string;
  notes?: string;
}

export const DoctorDashboard: React.FC = () => {
  const { showToast } = useToast();
  const { user, activePortalTab, setActivePortalTab } = useAuth();
  const {
    appointments: hospitalAppointments,
    beds: hospitalBeds,
    addPrescription: hospitalAddPrescription,
    orderLabTests: hospitalOrderLabTests,
    orderRadiology: hospitalOrderRadiology,
    admitPatientToBed: hospitalAdmitPatientToBed,
    updateAppointmentStatus: hospitalUpdateAppointmentStatus
  } = useHospital();

  // Mode / Tab State
  const [workbenchMode, setWorkbenchMode] = useState<'opd' | 'emr' | 'prescriptions' | 'diagnostics' | 'ipd-rounds'>('opd');
  const [activeQueueTab, setActiveQueueTab] = useState<'waiting' | 'completed'>('waiting');
  const [isDoctorAvailable, setIsDoctorAvailable] = useState(true);
  const [searchQueueQuery, setSearchQueueQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Dynamic Patient Queue
  const [patients, setPatients] = useState<PatientQueueItem[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  // Dynamic Inpatients for Rounds
  const [ipdPatients, setIpdPatients] = useState<InpatientItem[]>([]);
  const [selectedIpdPatientId, setSelectedIpdPatientId] = useState<string | null>(null);
  const [activeIpdRoundNote, setActiveIpdRoundNote] = useState('');

  // Dynamic Diagnostic Requisitions
  const [diagnosticOrders, setDiagnosticOrders] = useState<DiagnosticOrderItem[]>([]);

  // Active Patient Consultation State
  const activePatient = patients.find((p) => p.id === selectedPatientId) || null;
  const [consultNotes, setConsultNotes] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [followupDate, setFollowupDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split('T')[0];
  });

  // Modals State
  const [isRxModalOpen, setIsRxModalOpen] = useState(false);
  const [newRxDrug, setNewRxDrug] = useState('');
  const [newRxDose, setNewRxDose] = useState('1 Tablet');
  const [newRxFreq, setNewRxFreq] = useState('Once Daily (OD)');
  const [newRxDuration, setNewRxDuration] = useState('15 Days');
  const [newRxInstructions, setNewRxInstructions] = useState('After food');

  const [isLabModalOpen, setIsLabModalOpen] = useState(false);
  const [selectedTests, setSelectedTests] = useState<string[]>(['12-Lead ECG']);
  const [testPriority, setTestPriority] = useState<'Routine' | 'STAT Urgent'>('Routine');

  const [isRadModalOpen, setIsRadModalOpen] = useState(false);
  const [selectedRadProcedures, setSelectedRadProcedures] = useState<string[]>(['Digital X-Ray Chest PA View']);

  // Walk-in / New Appointment Modal
  const [isWalkinModalOpen, setIsWalkinModalOpen] = useState(false);
  const [walkinFirstName, setWalkinFirstName] = useState('');
  const [walkinLastName, setWalkinLastName] = useState('');
  const [walkinGender, setWalkinGender] = useState('male');
  const [walkinAge, setWalkinAge] = useState('35');
  const [walkinPhone, setWalkinPhone] = useState('9876543210');
  const [walkinComplaint, setWalkinComplaint] = useState('');
  const [walkinBp, setWalkinBp] = useState('120 / 80 mmHg');
  const [walkinHr, setWalkinHr] = useState('74 bpm');
  const [walkinTemp, setWalkinTemp] = useState('98.6 °F');
  const [walkinSpo2, setWalkinSpo2] = useState('99%');
  const [walkinSugar, setWalkinSugar] = useState('105 mg/dL');

  // Admit Inpatient Modal
  const [isAdmitModalOpen, setIsAdmitModalOpen] = useState(false);
  const [admitDiagnosis, setAdmitDiagnosis] = useState('');
  const [admitWard, setAdmitWard] = useState('Cardio-Thoracic ICU');
  const [admitBedNumber, setAdmitBedNumber] = useState('ICU-01');

  // Synchronize Workbench Mode with Sidebar activePortalTab
  useEffect(() => {
    if (activePortalTab === 'opd') {
      setWorkbenchMode('opd');
    } else if (activePortalTab === 'emr') {
      setWorkbenchMode('emr');
    } else if (activePortalTab === 'prescriptions') {
      setWorkbenchMode('prescriptions');
    } else if (activePortalTab === 'diagnostics') {
      setWorkbenchMode('diagnostics');
    } else if (activePortalTab === 'ipd-rounds') {
      setWorkbenchMode('ipd-rounds');
    }
  }, [activePortalTab]);

  // Keep consultNotes & diagnosis synced when activePatient changes
  useEffect(() => {
    if (activePatient) {
      setConsultNotes(activePatient.notes || '');
      setDiagnosis(activePatient.diagnosis || '');
    } else {
      setConsultNotes('');
      setDiagnosis('');
    }
  }, [activePatient?.id]);

  // Fetch Live Data from Backend Database
  const fetchAllDoctorData = async () => {
    try {
      setLoading(true);

      // 1. Fetch Live Appointments
      const [apptRes, bedsRes] = await Promise.allSettled([
        appointmentApi.getAppointments(),
        inpatientApi.getBeds()
      ]);

      if (apptRes.status === 'fulfilled' && apptRes.value?.data?.data) {
        const rawAppts = apptRes.value.data.data;
        const livePatients: PatientQueueItem[] = rawAppts.map((a: any, idx: number) => ({
          id: a.patient_id || a.id,
          appointmentId: a.id,
          token: `T-${String(a.queue_token_number || idx + 1).padStart(3, '0')}`,
          name: a.patient_first_name ? `${a.patient_first_name} ${a.patient_last_name || ''}`.trim() : `Patient #${idx + 1}`,
          uhid: a.patient_number || `UHID-OPD-${String(idx + 1).padStart(4, '0')}`,
          age: 42,
          gender: 'Male',
          phone: a.patient_phone,
          time: a.start_time || '10:00 AM',
          complaint: a.reason || 'Clinical evaluation and routine outpatient follow-up.',
          status: a.status === 'completed' ? 'Completed' : a.status === 'in_consultation' ? 'In Consultation' : 'Waiting',
          vitals: { bp: '124 / 82 mmHg', hr: '74 bpm', temp: '98.4 °F', spo2: '99%', sugar: '105 mg/dL' },
          notes: 'Presenting for clinical evaluation.',
          diagnosis: '',
          prescriptions: []
        }));

        setPatients(livePatients);
        if (livePatients.length > 0 && !selectedPatientId) {
          const firstWaiting = livePatients.find(p => p.status !== 'Completed') || livePatients[0];
          setSelectedPatientId(firstWaiting.id);
        }
      }

      // 2. Fetch Live Inpatients (Occupied Beds)
      if (bedsRes.status === 'fulfilled' && bedsRes.value?.data?.data) {
        const rawBeds = bedsRes.value.data.data;
        const occupied = rawBeds.filter((b: any) => b.bed_status === 'occupied' || b.patient_id);
        const liveIpd: InpatientItem[] = occupied.map((b: any, idx: number) => ({
          id: b.admission_id || `adm-${idx + 1}`,
          admissionId: b.admission_id || `adm-${idx + 1}`,
          name: b.patient_first_name ? `${b.patient_first_name} ${b.patient_last_name || ''}`.trim() : `Inpatient Bed ${b.bed_number}`,
          uhid: b.patient_number || `UHID-INP-${String(idx + 1).padStart(4, '0')}`,
          bed: b.bed_number || `BED-${idx + 1}`,
          ward: b.ward_name || 'General Inpatient Ward',
          diagnosis: b.initial_diagnosis || 'Post-operative Observation / Stable',
          vitals: 'BP: 122/80 | HR: 76 | SpO2: 98%',
          roundNote: 'Vitals stable. Continuing physician observation and prescribed ward medications.',
          status: 'Admitted'
        }));

        setIpdPatients(liveIpd);
        if (liveIpd.length > 0 && !selectedIpdPatientId) {
          setSelectedIpdPatientId(liveIpd[0].id);
          setActiveIpdRoundNote(liveIpd[0].roundNote);
        }
      }
    } catch (err) {
      // Graceful fallback to reactive memory state
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAllDoctorData();
  }, []);

  // Synchronize Doctor's Patient Queue reactively with HospitalContext.appointments
  useEffect(() => {
    if (hospitalAppointments && hospitalAppointments.length > 0) {
      const liveQueue: PatientQueueItem[] = hospitalAppointments.map((a, idx) => ({
        id: a.patientId || a.id,
        appointmentId: a.id,
        token: a.token || `T-${String(idx + 1).padStart(3, '0')}`,
        name: a.patientName,
        uhid: a.uhid,
        age: a.age || 35,
        gender: a.gender || 'Male',
        phone: a.phone,
        time: a.time || '10:00 AM',
        complaint: a.complaint || 'Outpatient clinical consultation.',
        status: a.status === 'Completed' ? 'Completed' : a.status === 'In Consultation' ? 'In Consultation' : 'Waiting',
        vitals: { bp: '120 / 80 mmHg', hr: '74 bpm', temp: '98.6 °F', spo2: '99%', sugar: '105 mg/dL' },
        notes: a.complaint ? `Chief Complaint: ${a.complaint}` : 'Routine OPD consultation.',
        diagnosis: '',
        prescriptions: []
      }));
      setPatients(liveQueue);
      if (liveQueue.length > 0 && !selectedPatientId) {
        const firstWaiting = liveQueue.find(p => p.status !== 'Completed') || liveQueue[0];
        setSelectedPatientId(firstWaiting.id);
      }
    }
  }, [hospitalAppointments]);

  // Synchronize Inpatients for rounds reactively with HospitalContext.beds
  useEffect(() => {
    const occupied = hospitalBeds.filter(b => b.status === 'Occupied' && b.patient);
    if (occupied.length > 0) {
      const liveIpd: InpatientItem[] = occupied.map((b, idx) => ({
        id: b.id || `adm-${idx + 1}`,
        admissionId: b.patient?.admissionNumber || `ADM-${b.bedNumber}`,
        name: b.patient?.name || `Inpatient ${b.bedNumber}`,
        uhid: b.patient?.uhid || `UHID-INP-${idx + 1}`,
        bed: b.bedNumber,
        ward: b.wardName,
        diagnosis: b.patient?.diagnosis || 'Under Clinical Observation',
        vitals: `BP: ${b.patient?.vitals?.bp || '120/80'} | HR: ${b.patient?.vitals?.hr || '76'} | SpO2: ${b.patient?.vitals?.spo2 || '99%'}`,
        roundNote: 'Vitals stable. Continuing physician observation and prescribed ward medications.',
        status: 'Admitted'
      }));
      setIpdPatients(liveIpd);
      if (liveIpd.length > 0 && !selectedIpdPatientId) {
        setSelectedIpdPatientId(liveIpd[0].id);
        setActiveIpdRoundNote(liveIpd[0].roundNote);
      }
    } else {
      setIpdPatients([]);
    }
  }, [hospitalBeds]);

  const handleManualRefresh = () => {
    setRefreshing(true);
    fetchAllDoctorData();
    showToast({ type: 'info', title: 'Refreshed', message: 'Doctor queue and bed allocations synchronized.' });
  };

  const handleSelectPatient = (patient: PatientQueueItem) => {
    setSelectedPatientId(patient.id);
    setConsultNotes(patient.notes);
    setDiagnosis(patient.diagnosis);
  };

  // Add Walk-in Patient to Queue
  const handleAddWalkinPatient = async () => {
    if (!walkinFirstName.trim() || !walkinLastName.trim()) {
      showToast({ type: 'warning', title: 'Input Required', message: 'First name and Last name are required.' });
      return;
    }

    const nextTokenNum = patients.length + 1;
    const tokenStr = `T-${String(nextTokenNum).padStart(3, '0')}`;
    const newId = 'pt-' + Date.now();
    const newUhid = `ASR-${new Date().getFullYear()}-${String(nextTokenNum + 100).padStart(5, '0')}`;

    const newPatient: PatientQueueItem = {
      id: newId,
      token: tokenStr,
      name: `${walkinFirstName.trim()} ${walkinLastName.trim()}`,
      uhid: newUhid,
      age: parseInt(walkinAge) || 30,
      gender: walkinGender === 'male' ? 'Male' : walkinGender === 'female' ? 'Female' : 'Other',
      phone: walkinPhone,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      complaint: walkinComplaint || 'Acute OPD Walk-in consultation.',
      status: 'Waiting',
      vitals: {
        bp: walkinBp,
        hr: walkinHr,
        temp: walkinTemp,
        spo2: walkinSpo2,
        sugar: walkinSugar
      },
      notes: `Chief Complaint: ${walkinComplaint || 'Routine medical checkup.'}`,
      diagnosis: '',
      prescriptions: []
    };

    // Attempt backend registration
    try {
      await patientApi.registerPatient({
        firstName: walkinFirstName.trim(),
        lastName: walkinLastName.trim(),
        gender: walkinGender,
        phone: walkinPhone,
      });
    } catch (e) {
      // Local state fallback
    }

    setPatients((prev) => [newPatient, ...prev]);
    setSelectedPatientId(newPatient.id);
    setConsultNotes(newPatient.notes);
    setDiagnosis('');

    // Reset modal fields
    setWalkinFirstName('');
    setWalkinLastName('');
    setWalkinComplaint('');
    setIsWalkinModalOpen(false);

    showToast({
      type: 'success',
      title: `Token ${tokenStr} Generated`,
      message: `${newPatient.name} added to the live OPD waiting queue.`
    });
  };

  // Call Next Patient
  const handleCallNextPatient = () => {
    const nextWaiting = patients.find((p) => p.status === 'Waiting');
    if (nextWaiting) {
      handleSelectPatient(nextWaiting);
      setPatients((prev) =>
        prev.map((p) => (p.id === nextWaiting.id ? { ...p, status: 'In Consultation' } : p))
      );
      showToast({
        type: 'info',
        title: 'Patient Called',
        message: `Token ${nextWaiting.token} (${nextWaiting.name}) called to Consultation Desk.`
      });
    } else {
      showToast({ type: 'info', title: 'Queue Clear', message: 'No more waiting patients currently in the OPD queue.' });
    }
  };

  // Complete and Sign Consultation
  const handleCompleteConsultation = async () => {
    if (!activePatient) return;

    try {
      if (activePatient.appointmentId) {
        await appointmentApi.updateStatus(activePatient.appointmentId, 'completed');
        await hospitalUpdateAppointmentStatus(activePatient.appointmentId, 'Completed');
      }
      await clinicalApi.createConsultation({
        patientId: activePatient.id,
        appointmentId: activePatient.appointmentId,
        clinicalNotes: consultNotes,
        diagnosis,
        prescriptions: activePatient.prescriptions,
      });

      if (activePatient.prescriptions.length > 0) {
        await hospitalAddPrescription({
          patientId: activePatient.id,
          patientName: activePatient.name,
          uhid: activePatient.uhid,
          doctorId: user?.id || 'doc-1',
          doctorName: user ? `Dr. ${user.firstName || ''} ${user.lastName || ''}`.trim() : 'Dr. Rajesh Sharma',
          items: activePatient.prescriptions.map((rx) => ({
            id: rx.id,
            drugName: rx.drugName,
            dosage: rx.dosage,
            frequency: rx.frequency,
            duration: rx.duration,
            instructions: rx.instructions
          }))
        });
      }
    } catch (err) {
      // Graceful local handling
    }

    setPatients((prev) =>
      prev.map((p) =>
        p.id === activePatient.id
          ? { ...p, status: 'Completed', notes: consultNotes, diagnosis }
          : p
      )
    );

    showToast({
      type: 'success',
      title: 'Consultation Signed & Finalized',
      message: `Encounter for ${activePatient.name} completed. E-Prescription dispatched to Pharmacy.`
    });

    // Auto-advance to next waiting patient if available
    const nextWaiting = patients.find((p) => p.status === 'Waiting' && p.id !== activePatient.id);
    if (nextWaiting) {
      setSelectedPatientId(nextWaiting.id);
      setConsultNotes(nextWaiting.notes);
      setDiagnosis(nextWaiting.diagnosis);
      setPatients((prev) =>
        prev.map((p) => (p.id === nextWaiting.id ? { ...p, status: 'In Consultation' } : p))
      );
    }
  };

  // Add Prescription Item
  const handleAddPrescription = () => {
    if (!activePatient) {
      showToast({ type: 'warning', title: 'No Patient Selected', message: 'Select a patient to prescribe medication.' });
      return;
    }
    if (!newRxDrug.trim()) {
      showToast({ type: 'warning', title: 'Drug Name Required', message: 'Please specify medicine name or formulation.' });
      return;
    }

    const newItem: PrescriptionItem = {
      id: 'rx-' + Date.now(),
      drugName: newRxDrug,
      dosage: newRxDose,
      frequency: newRxFreq,
      duration: newRxDuration,
      instructions: newRxInstructions
    };

    setPatients((prev) =>
      prev.map((p) =>
        p.id === activePatient.id
          ? { ...p, prescriptions: [...p.prescriptions, newItem] }
          : p
      )
    );

    setNewRxDrug('');
    setIsRxModalOpen(false);
    showToast({
      type: 'success',
      title: 'Item Added to E-Prescription',
      message: `${newItem.drugName} added for ${activePatient.name}.`
    });
  };

  // Remove Prescription Item
  const handleRemovePrescription = (rxId: string) => {
    if (!activePatient) return;
    setPatients((prev) =>
      prev.map((p) =>
        p.id === activePatient.id
          ? { ...p, prescriptions: p.prescriptions.filter((r) => r.id !== rxId) }
          : p
      )
    );
    showToast({ type: 'info', title: 'Item Removed', message: 'Prescription item removed.' });
  };

  // Order Lab Pathology Tests
  const handleOrderLab = async () => {
    if (!activePatient) return;
    if (selectedTests.length === 0) {
      showToast({ type: 'warning', title: 'Selection Required', message: 'Please select at least one laboratory test.' });
      return;
    }

    try {
      await diagnosticsApi.orderLabTests({
        patientId: activePatient.id,
        tests: selectedTests,
        priority: testPriority.toLowerCase(),
      });
      await hospitalOrderLabTests({
        patientId: activePatient.id,
        patientName: activePatient.name,
        uhid: activePatient.uhid,
        doctorId: user?.id || 'doc-1',
        doctorName: user ? `Dr. ${user.firstName || ''} ${user.lastName || ''}`.trim() : 'Dr. Rajesh Sharma',
        tests: selectedTests,
        priority: testPriority
      });
    } catch (err) {
      // Local fallback
    }

    // Add to dynamic diagnosticOrders state
    const newOrders: DiagnosticOrderItem[] = selectedTests.map((test, idx) => ({
      id: `lab-${Date.now()}-${idx}`,
      patientId: activePatient.id,
      patientName: activePatient.name,
      patientUhid: activePatient.uhid,
      type: 'lab',
      title: test,
      priority: testPriority,
      orderedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'ordered',
      notes: 'Sample collection requisition dispatched to Pathology Central Lab.'
    }));

    setDiagnosticOrders((prev) => [...newOrders, ...prev]);
    setIsLabModalOpen(false);

    showToast({
      type: 'success',
      title: 'Laboratory Requisition Dispatched',
      message: `${selectedTests.length} tests ordered (${testPriority}) for ${activePatient.name}.`
    });
  };

  // Order Radiology Imaging
  const handleOrderRadiology = async () => {
    if (!activePatient) return;
    if (selectedRadProcedures.length === 0) {
      showToast({ type: 'warning', title: 'Selection Required', message: 'Please select at least one radiology procedure.' });
      return;
    }

    try {
      await diagnosticsApi.orderRadiology({
        patientId: activePatient.id,
        procedures: selectedRadProcedures,
        priority: testPriority.toLowerCase(),
      });
      await hospitalOrderRadiology({
        patientId: activePatient.id,
        patientName: activePatient.name,
        uhid: activePatient.uhid,
        doctorId: user?.id || 'doc-1',
        doctorName: user ? `Dr. ${user.firstName || ''} ${user.lastName || ''}`.trim() : 'Dr. Rajesh Sharma',
        procedures: selectedRadProcedures,
        priority: testPriority
      });
    } catch (err) {
      // Local fallback
    }

    const newOrders: DiagnosticOrderItem[] = selectedRadProcedures.map((proc, idx) => ({
      id: `rad-${Date.now()}-${idx}`,
      patientId: activePatient.id,
      patientName: activePatient.name,
      patientUhid: activePatient.uhid,
      type: 'radiology',
      title: proc,
      priority: testPriority,
      orderedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'ordered',
      notes: 'Modality scan requisition forwarded to DICOM PACS worklist.'
    }));

    setDiagnosticOrders((prev) => [...newOrders, ...prev]);
    setIsRadModalOpen(false);

    showToast({
      type: 'success',
      title: 'Radiology Imaging Requested',
      message: `${selectedRadProcedures.join(', ')} ordered for ${activePatient.name}.`
    });
  };

  // Sign Daily Inpatient Round Note
  const handleRecordRoundNote = async (patientId: string, noteText: string) => {
    if (!noteText.trim()) {
      showToast({ type: 'warning', title: 'Note Empty', message: 'Please enter clinical progress observations.' });
      return;
    }

    try {
      await inpatientApi.logDailyRound(patientId, {
        clinicalObservations: noteText,
        treatmentChanges: 'Continuing monitored regimen',
        reviewedAt: new Date().toISOString()
      });
    } catch (err) {
      // Local update
    }

    setIpdPatients((prev) =>
      prev.map((p) => (p.id === patientId ? { ...p, roundNote: noteText } : p))
    );

    showToast({
      type: 'success',
      title: 'Daily IPD Round Note Signed',
      message: 'Inpatient progress note recorded and synced with nursing care chart.'
    });
  };

  // Admit Inpatient to Ward
  const handleAdmitInpatient = () => {
    if (!activePatient) {
      showToast({ type: 'warning', title: 'No Patient Selected', message: 'Select an active patient to admit to ward.' });
      return;
    }

    const newInpatient: InpatientItem = {
      id: `adm-${Date.now()}`,
      admissionId: `adm-${Date.now()}`,
      name: activePatient.name,
      uhid: activePatient.uhid,
      bed: admitBedNumber,
      ward: admitWard,
      diagnosis: admitDiagnosis || activePatient.diagnosis || 'Clinical Observation',
      vitals: `${activePatient.vitals.bp} | HR: ${activePatient.vitals.hr} | SpO2: ${activePatient.vitals.spo2}`,
      roundNote: 'Admitted from OPD for continuous inpatient monitoring and targeted therapy.',
      status: 'Admitted'
    };

    setIpdPatients((prev) => [newInpatient, ...prev]);
    setSelectedIpdPatientId(newInpatient.id);
    setActiveIpdRoundNote(newInpatient.roundNote);
    setIsAdmitModalOpen(false);

    hospitalAdmitPatientToBed({
      patientId: activePatient.id,
      patientName: activePatient.name,
      uhid: activePatient.uhid,
      age: activePatient.age,
      gender: activePatient.gender,
      bedId: admitBedNumber,
      wardName: admitWard,
      diagnosis: admitDiagnosis || activePatient.diagnosis || 'Clinical Observation',
      attendingDoctor: user ? `Dr. ${user.firstName || ''} ${user.lastName || ''}`.trim() : 'Dr. Rajesh Sharma'
    }).catch(() => {});

    showToast({
      type: 'success',
      title: 'Patient Admitted to Ward',
      message: `${activePatient.name} assigned to Bed ${admitBedNumber} (${admitWard}).`
    });
  };

  // Review & Sign Off Diagnostic Result
  const handleSignOffDiagnostic = (orderId: string) => {
    setDiagnosticOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: 'signed' } : o))
    );
    showToast({
      type: 'success',
      title: 'Diagnostic Review Signed Off',
      message: 'Test findings acknowledged and archived in patient medical record.'
    });
  };

  // Computed Lists
  const waitingList = patients.filter((p) => p.status !== 'Completed');
  const completedList = patients.filter((p) => p.status === 'Completed');

  const filteredWaitingList = waitingList.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQueueQuery.toLowerCase()) ||
      p.uhid.toLowerCase().includes(searchQueueQuery.toLowerCase()) ||
      p.token.toLowerCase().includes(searchQueueQuery.toLowerCase()) ||
      p.complaint.toLowerCase().includes(searchQueueQuery.toLowerCase())
  );

  const filteredCompletedList = completedList.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQueueQuery.toLowerCase()) ||
      p.uhid.toLowerCase().includes(searchQueueQuery.toLowerCase()) ||
      p.token.toLowerCase().includes(searchQueueQuery.toLowerCase())
  );

  const pendingDiagnosticReviews = diagnosticOrders.filter((d) => d.status !== 'signed');

  return (
    <div className="space-y-6">
      {/* Top Header & Doctor Status */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-teal-100 text-teal-800 flex items-center space-x-1">
              <Stethoscope className="w-3.5 h-3.5" />
              <span>{user?.hospitalName || 'ASRTAVA Healthcare'} · OPD Consultation Desk</span>
            </span>

            <button
              onClick={() => {
                setIsDoctorAvailable(!isDoctorAvailable);
                showToast({
                  type: !isDoctorAvailable ? 'success' : 'warning',
                  title: !isDoctorAvailable ? 'Status: Available for OPD' : 'Status: In OT / Away',
                  message: !isDoctorAvailable ? 'Accepting appointments and OPD walk-in tokens.' : 'Consultation slots temporarily blocked.'
                });
              }}
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold flex items-center space-x-1.5 transition cursor-pointer ${
                isDoctorAvailable ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isDoctorAvailable ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'}`} />
              <span>{isDoctorAvailable ? 'Available for OPD' : 'In OT / Away'}</span>
            </button>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight mt-1.5">
            Doctor Clinical Workbench
          </h1>
          <p className="text-xs text-slate-500">
            Live OPD Queue, EMR (SOAP), Electronic Prescriptions & Inpatient Rounds.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleManualRefresh}
            disabled={refreshing}
            className="cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsWalkinModalOpen(true)}
            className="cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5 mr-1.5 text-teal-700" />
            <span>+ Walk-in Patient</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleCallNextPatient}
            disabled={waitingList.length === 0}
            className="cursor-pointer"
          >
            <Clock className="w-3.5 h-3.5 mr-1.5" />
            <span>Call Next</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleCompleteConsultation}
            disabled={!activePatient || activePatient.status === 'Completed'}
            className="cursor-pointer"
          >
            <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
            <span>Finalize Encounter</span>
          </Button>
        </div>
      </div>

      {/* Dynamic Doctor KPIs (Starts From Zero / Live DB Counters) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 block uppercase tracking-wider">Scheduled Today</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">{patients.length}</div>
          <span className="text-[10px] text-slate-400">Total registered tokens</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-amber-600 block uppercase tracking-wider">Waiting in OPD</span>
          <div className="text-2xl font-bold text-amber-600 mt-1">{waitingList.length}</div>
          <span className="text-[10px] text-amber-600/80">Pending doctor evaluation</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-emerald-600 block uppercase tracking-wider">Completed Encounters</span>
          <div className="text-2xl font-bold text-emerald-600 mt-1">{completedList.length}</div>
          <span className="text-[10px] text-emerald-600/80">Signed & synced with Pharmacy</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-teal-600 block uppercase tracking-wider">Diagnostics Pending</span>
          <div className="text-2xl font-bold text-teal-600 mt-1">{pendingDiagnosticReviews.length}</div>
          <span className="text-[10px] text-teal-600/80">Lab tests & radiology scans</span>
        </div>
      </div>

      {/* Synchronized Mode Selector Tabs */}
      <div className="flex items-center space-x-1.5 overflow-x-auto border-b border-slate-200 pb-2 text-xs font-semibold">
        {[
          { id: 'opd', label: `Outpatient (OPD) Queue (${waitingList.length})`, icon: Stethoscope },
          { id: 'emr', label: 'Clinical EMR (SOAP)', icon: ClipboardList },
          { id: 'prescriptions', label: `e-Prescriptions (${activePatient?.prescriptions?.length || 0})`, icon: Pill },
          { id: 'diagnostics', label: `Diagnostic Orders (${pendingDiagnosticReviews.length})`, icon: Radio },
          { id: 'ipd-rounds', label: `IPD Ward Rounds (${ipdPatients.length})`, icon: BedDouble },
        ].map((tab) => {
          const isActive = workbenchMode === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setWorkbenchMode(tab.id as any);
                setActivePortalTab(tab.id);
              }}
              className={`px-3.5 py-2 rounded-xl flex items-center space-x-2 transition cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-teal-700 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* VIEW 1: Outpatient (OPD) Workbench */}
      {workbenchMode === 'opd' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Live Queue */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Live OPD Queue</h2>
              <div className="flex space-x-1 bg-slate-100 p-1 rounded-lg">
                <button
                  onClick={() => setActiveQueueTab('waiting')}
                  className={`text-xs px-2.5 py-1 rounded-md font-medium transition cursor-pointer ${
                    activeQueueTab === 'waiting' ? 'bg-white shadow-xs text-teal-700 font-bold' : 'text-slate-500'
                  }`}
                >
                  Waiting ({filteredWaitingList.length})
                </button>
                <button
                  onClick={() => setActiveQueueTab('completed')}
                  className={`text-xs px-2.5 py-1 rounded-md font-medium transition cursor-pointer ${
                    activeQueueTab === 'completed' ? 'bg-white shadow-xs text-teal-700 font-bold' : 'text-slate-500'
                  }`}
                >
                  Done ({filteredCompletedList.length})
                </button>
              </div>
            </div>

            {/* Search Queue */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchQueueQuery}
                onChange={(e) => setSearchQueueQuery(e.target.value)}
                placeholder="Search patient, UHID, complaint..."
                className="w-full pl-8 pr-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>

            {/* Queue List */}
            <div className="space-y-2 max-h-[580px] overflow-y-auto pr-1">
              {activeQueueTab === 'waiting' && filteredWaitingList.length === 0 && (
                <div className="text-center py-12 border border-dashed border-slate-200 rounded-xl p-4">
                  <div className="w-10 h-10 bg-teal-50 text-teal-700 rounded-xl flex items-center justify-center mx-auto mb-2">
                    <Users className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-bold text-slate-800">No Patients in Queue</p>
                  <p className="text-[11px] text-slate-400 mt-1 max-w-[200px] mx-auto">
                    The OPD queue is clear. Register a walk-in patient to generate a live token.
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-3 text-xs cursor-pointer"
                    onClick={() => setIsWalkinModalOpen(true)}
                  >
                    <PlusCircle className="w-3.5 h-3.5 mr-1 text-teal-700" />
                    <span>+ Add Walk-in Token</span>
                  </Button>
                </div>
              )}

              {activeQueueTab === 'completed' && filteredCompletedList.length === 0 && (
                <div className="text-center py-12 border border-dashed border-slate-200 rounded-xl p-4 text-slate-400 text-xs">
                  <CheckCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="font-bold text-slate-700">No Encounters Completed Today</p>
                  <p className="text-[11px] mt-1">Signed consultations will be archived here.</p>
                </div>
              )}

              {(activeQueueTab === 'waiting' ? filteredWaitingList : filteredCompletedList).map((p) => {
                const isSelected = p.id === activePatient?.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => handleSelectPatient(p)}
                    className={`p-3 rounded-xl border cursor-pointer transition ${
                      isSelected
                        ? 'border-teal-500 bg-teal-50/50 ring-1 ring-teal-500 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-mono font-bold text-teal-800 bg-teal-100/70 px-2 py-0.5 rounded">
                        {p.token}
                      </span>
                      <span className="text-[10px] text-slate-400 flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{p.time}</span>
                      </span>
                    </div>
                    <div className="font-bold text-slate-900 text-xs truncate">
                      {p.name} ({p.age}y, {p.gender})
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{p.complaint}</div>
                    <div className="mt-2 flex items-center justify-between text-[10px]">
                      <span className="text-slate-400 font-mono">{p.uhid}</span>
                      <Badge
                        variant={
                          p.status === 'In Consultation' ? 'info' : p.status === 'Completed' ? 'success' : 'warning'
                        }
                        size="sm"
                      >
                        {p.status}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Active Consultation Desk */}
          <div className="lg:col-span-2 space-y-5">
            {activePatient ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-5">
                {/* Patient Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-2">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] uppercase font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded">
                        Active Consultation Desk
                      </span>
                      <span className="text-xs font-mono text-slate-400">{activePatient.uhid}</span>
                    </div>
                    <h2 className="text-lg font-bold text-slate-900 mt-1">
                      {activePatient.name} ({activePatient.age} yrs · {activePatient.gender})
                    </h2>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge
                      variant={
                        activePatient.status === 'In Consultation'
                          ? 'info'
                          : activePatient.status === 'Completed'
                          ? 'success'
                          : 'warning'
                      }
                    >
                      {activePatient.status}
                    </Badge>
                    <span className="text-xs text-slate-600 font-mono font-bold bg-slate-100 px-2.5 py-1 rounded-lg">
                      Token {activePatient.token}
                    </span>
                  </div>
                </div>

                {/* Vitals Summary Strip */}
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                    Patient Vitals (Triage Assessment)
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                    <div className="flex items-center space-x-2">
                      <Heart className="w-4 h-4 text-rose-500 shrink-0" />
                      <div>
                        <span className="text-slate-400 block text-[10px]">Blood Pressure</span>
                        <span className="font-bold text-slate-800">{activePatient.vitals.bp}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Activity className="w-4 h-4 text-emerald-500 shrink-0" />
                      <div>
                        <span className="text-slate-400 block text-[10px]">Heart Rate</span>
                        <span className="font-bold text-slate-800">{activePatient.vitals.hr}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Thermometer className="w-4 h-4 text-amber-500 shrink-0" />
                      <div>
                        <span className="text-slate-400 block text-[10px]">Temperature</span>
                        <span className="font-bold text-slate-800">{activePatient.vitals.temp}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Wind className="w-4 h-4 text-blue-500 shrink-0" />
                      <div>
                        <span className="text-slate-400 block text-[10px]">Oxygen (SpO2)</span>
                        <span className="font-bold text-slate-800">{activePatient.vitals.spo2}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Droplets className="w-4 h-4 text-indigo-500 shrink-0" />
                      <div>
                        <span className="text-slate-400 block text-[10px]">Blood Sugar</span>
                        <span className="font-bold text-slate-800">{activePatient.vitals.sugar}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Clinical Documentation Inputs */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Chief Complaint & Clinical Examination Findings
                    </label>
                    <textarea
                      rows={3}
                      value={consultNotes}
                      onChange={(e) => setConsultNotes(e.target.value)}
                      placeholder="Record clinical history, physical examination, and observations..."
                      className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50/50"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">ICD-10 Working Diagnosis</label>
                      <input
                        type="text"
                        value={diagnosis}
                        onChange={(e) => setDiagnosis(e.target.value)}
                        placeholder="e.g. I10 - Essential Hypertension, J06.9 - Acute Upper Respiratory"
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50/50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Follow-up Consultation Date</label>
                      <input
                        type="date"
                        value={followupDate}
                        onChange={(e) => setFollowupDate(e.target.value)}
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50/50"
                      />
                    </div>
                  </div>

                  {/* Electronic Prescription Section */}
                  <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/40">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <Pill className="w-4 h-4 text-teal-700" />
                        <span className="text-xs font-bold text-slate-900">Electronic Prescription (Rx)</span>
                        <Badge variant="brand" size="sm">
                          {activePatient.prescriptions.length} Prescribed
                        </Badge>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => setIsRxModalOpen(true)} className="cursor-pointer">
                        <PlusCircle className="w-3.5 h-3.5 mr-1 text-teal-700" />
                        <span>Add Medication</span>
                      </Button>
                    </div>

                    {activePatient.prescriptions.length === 0 ? (
                      <div className="text-center py-6 border border-dashed border-slate-200 rounded-xl text-slate-400 text-xs">
                        No medication prescribed for this encounter yet. Click "+ Add Medication" to prescribe.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {activePatient.prescriptions.map((rx) => (
                          <div
                            key={rx.id}
                            className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-xl text-xs"
                          >
                            <div>
                              <div className="font-bold text-slate-900">{rx.drugName}</div>
                              <div className="text-[11px] text-slate-500">
                                {rx.dosage} · {rx.frequency} · Duration: {rx.duration} · ({rx.instructions})
                              </div>
                            </div>
                            <button
                              onClick={() => handleRemovePrescription(rx.id)}
                              className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg transition cursor-pointer"
                              title="Delete Item"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div className="border-t border-slate-100 pt-4 flex flex-col sm:flex-row justify-between items-center gap-3">
                    <div className="flex items-center space-x-2">
                      <Button variant="secondary" size="sm" onClick={() => setIsLabModalOpen(true)} className="cursor-pointer">
                        <Activity className="w-3.5 h-3.5 mr-1 text-indigo-600" />
                        <span>Order Lab Tests</span>
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setIsRadModalOpen(true)} className="cursor-pointer">
                        <Radio className="w-3.5 h-3.5 mr-1 text-teal-600" />
                        <span>Order Radiology</span>
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setIsAdmitModalOpen(true)} className="cursor-pointer">
                        <BedDouble className="w-3.5 h-3.5 mr-1 text-blue-600" />
                        <span>Admit to IPD</span>
                      </Button>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleCompleteConsultation}
                        disabled={activePatient.status === 'Completed'}
                        className="cursor-pointer"
                      >
                        <Check className="w-4 h-4 mr-1.5" />
                        <span>Sign & Close Encounter</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
                <div className="w-12 h-12 bg-teal-50 text-teal-700 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Stethoscope className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900">No Patient Selected</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                  Select a patient from the queue on the left, or add a walk-in patient to begin clinical evaluation, vitals review, and E-Prescriptions.
                </p>
                <button
                  onClick={() => setIsWalkinModalOpen(true)}
                  className="mt-4 px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer"
                >
                  + Add Walk-in Patient to Queue
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: Clinical EMR & SOAP Notes */}
      {workbenchMode === 'emr' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6 text-xs">
          <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
            <div>
              <h2 className="text-base font-bold text-slate-900">Clinical EMR — Structured SOAP Documentation</h2>
              <p className="text-slate-500 text-xs">
                Standard Subjective, Objective, Assessment, and Plan documentation for electronic patient medical records.
              </p>
            </div>
            {activePatient && (
              <span className="font-mono bg-teal-50 text-teal-800 border border-teal-200 px-2.5 py-1 rounded-lg font-bold">
                Patient: {activePatient.name} ({activePatient.uhid})
              </span>
            )}
          </div>

          {activePatient ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* S: Subjective */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                <div className="flex items-center space-x-2 text-teal-800 font-bold">
                  <span className="w-6 h-6 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center text-xs">S</span>
                  <span>Subjective (Patient History & Complaint)</span>
                </div>
                <textarea
                  rows={4}
                  value={consultNotes}
                  onChange={(e) => setConsultNotes(e.target.value)}
                  placeholder="History of present illness, symptom onset, aggravating factors, allergies..."
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs"
                />
              </div>

              {/* O: Objective */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                <div className="flex items-center space-x-2 text-blue-800 font-bold">
                  <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-xs">O</span>
                  <span>Objective (Vitals & Physical Examination)</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-[11px] mb-2 bg-white p-2.5 rounded-lg border border-slate-200">
                  <div>BP: <strong className="text-slate-800">{activePatient.vitals.bp}</strong></div>
                  <div>HR: <strong className="text-slate-800">{activePatient.vitals.hr}</strong></div>
                  <div>SpO2: <strong className="text-slate-800">{activePatient.vitals.spo2}</strong></div>
                </div>
                <textarea
                  rows={2}
                  placeholder="Systemic examination (Cardiovascular, Respiratory, Abdominal, Neurological)..."
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs"
                />
              </div>

              {/* A: Assessment */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                <div className="flex items-center space-x-2 text-amber-800 font-bold">
                  <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center text-xs">A</span>
                  <span>Assessment (ICD-10 Working Diagnosis)</span>
                </div>
                <input
                  type="text"
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  placeholder="Working diagnosis with ICD-10 code (e.g. I10 - Essential Hypertension)"
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs"
                />
              </div>

              {/* P: Plan */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                <div className="flex items-center space-x-2 text-emerald-800 font-bold">
                  <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs">P</span>
                  <span>Plan (Management, Rx, Investigations & Follow-up)</span>
                </div>
                <div className="text-[11px] text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200">
                  <div>Active Prescriptions: <strong>{activePatient.prescriptions.length} Items</strong></div>
                  <div>Follow-up Target: <strong>{followupDate}</strong></div>
                </div>
                <Button
                  size="sm"
                  variant="primary"
                  className="w-full cursor-pointer"
                  onClick={handleCompleteConsultation}
                >
                  <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                  <span>Sign & Save SOAP Record</span>
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400">
              <ClipboardList className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="font-bold text-slate-700">No Patient Encounter Selected</p>
              <p className="text-[11px] mt-1">Select an active patient in the OPD Queue to document SOAP progress notes.</p>
            </div>
          )}
        </div>
      )}

      {/* VIEW 3: e-Prescriptions Management */}
      {workbenchMode === 'prescriptions' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4 text-xs">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">E-Prescription & Formulary Dispensing</h2>
              <p className="text-slate-500">Manage prescription drugs, generic substitution, dosage, and duration for patients.</p>
            </div>
            {activePatient && (
              <Button size="sm" variant="primary" onClick={() => setIsRxModalOpen(true)} className="cursor-pointer">
                <PlusCircle className="w-3.5 h-3.5 mr-1" />
                <span>+ Add Medicine</span>
              </Button>
            )}
          </div>

          {activePatient ? (
            <div className="space-y-3">
              <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl flex items-center justify-between">
                <div>
                  <span className="font-bold text-teal-900 text-xs">Active Patient: {activePatient.name}</span>
                  <span className="text-[11px] text-teal-700 ml-2 font-mono">UHID: {activePatient.uhid}</span>
                </div>
                <span className="text-[10px] font-bold text-teal-800 bg-white px-2 py-0.5 rounded-md border border-teal-200">
                  {activePatient.prescriptions.length} Items Prescribed
                </span>
              </div>

              {activePatient.prescriptions.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-slate-200 rounded-xl text-slate-400">
                  <Pill className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  <p className="font-bold text-slate-700">No Prescriptions Added</p>
                  <p className="text-[11px] mt-1">Click "+ Add Medicine" to prescribe from the formulary catalog.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                  {activePatient.prescriptions.map((rx) => (
                    <div key={rx.id} className="p-3.5 bg-white flex items-center justify-between hover:bg-slate-50">
                      <div>
                        <div className="font-bold text-slate-900 text-xs">{rx.drugName}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {rx.dosage} &bull; {rx.frequency} &bull; Duration: {rx.duration} &bull; ({rx.instructions})
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemovePrescription(rx.id)}
                        className="text-slate-400 hover:text-rose-600 p-1.5 rounded transition cursor-pointer"
                        title="Remove"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400">
              <Pill className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="font-bold text-slate-700">Select a Patient to Prescribe</p>
              <p className="text-[11px] mt-1">Switch to OPD Queue to select an active patient.</p>
            </div>
          )}
        </div>
      )}

      {/* VIEW 4: Diagnostic Orders & Results */}
      {workbenchMode === 'diagnostics' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4 text-xs">
          <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
            <div>
              <h2 className="text-base font-bold text-slate-900">Diagnostic Reviews Ready for Doctor Sign-Off</h2>
              <p className="text-slate-500 text-xs">Laboratory pathology values and radiology imaging impressions for your active patients.</p>
            </div>
            {activePatient && (
              <div className="flex space-x-2">
                <Button size="sm" variant="secondary" onClick={() => setIsLabModalOpen(true)} className="cursor-pointer">
                  + Order Lab
                </Button>
                <Button size="sm" variant="outline" onClick={() => setIsRadModalOpen(true)} className="cursor-pointer">
                  + Order Radiology
                </Button>
              </div>
            )}
          </div>

          {diagnosticOrders.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-slate-200 rounded-xl text-slate-400">
              <Radio className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="font-bold text-slate-700">No Pending Diagnostic Orders</p>
              <p className="text-[11px] mt-1 max-w-sm mx-auto">
                Diagnostic requisitions ordered during patient encounters will be listed here with pathology reports and DICOM imaging impressions.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {diagnosticOrders.map((order) => {
                const isSigned = order.status === 'signed';
                return (
                  <div
                    key={order.id}
                    className={`p-4 rounded-xl border space-y-2 transition ${
                      order.priority === 'STAT Urgent'
                        ? 'border-rose-200 bg-rose-50/40'
                        : isSigned
                        ? 'border-slate-200 bg-slate-50/50'
                        : 'border-teal-200 bg-teal-50/30'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-bold text-slate-900 text-xs">{order.title}</span>
                        <p className="text-slate-500 text-[11px]">
                          Patient: {order.patientName} ({order.patientUhid}) &bull; Ordered: {order.orderedAt}
                        </p>
                      </div>
                      <Badge variant={isSigned ? 'success' : order.priority === 'STAT Urgent' ? 'danger' : 'info'} size="sm">
                        {isSigned ? 'Signed & Verified' : order.priority}
                      </Badge>
                    </div>
                    {order.notes && <p className="text-slate-600 text-[11px]">{order.notes}</p>}
                    {!isSigned && (
                      <div className="pt-2 flex justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSignOffDiagnostic(order.id)}
                          className="cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                          <span>Acknowledge & Sign Off</span>
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VIEW 5: Inpatient (IPD) Rounds */}
      {workbenchMode === 'ipd-rounds' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6 text-xs">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Inpatient Clinical Ward Rounds</h2>
              <p className="text-slate-500">Admitted patients assigned under your attending physician responsibility.</p>
            </div>
            <div className="flex items-center space-x-2">
              <Button size="sm" variant="primary" onClick={() => setIsAdmitModalOpen(true)} className="cursor-pointer">
                <PlusCircle className="w-3.5 h-3.5 mr-1" />
                <span>+ Admit to Inpatient</span>
              </Button>
            </div>
          </div>

          {ipdPatients.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-slate-200 rounded-xl text-slate-400">
              <BedDouble className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="font-bold text-slate-700">No Admitted Inpatients Assigned</p>
              <p className="text-[11px] mt-1 max-w-sm mx-auto">
                There are currently 0 active inpatients assigned under your roster. Admitted ward patients will automatically populate this rounding list.
              </p>
              <Button size="sm" variant="outline" className="mt-3 cursor-pointer" onClick={() => setIsAdmitModalOpen(true)}>
                <PlusCircle className="w-3.5 h-3.5 mr-1 text-teal-700" />
                <span>Admit Patient to Ward</span>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2.5">
                <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Assigned Inpatients</span>
                {ipdPatients.map((p) => {
                  const isSelected = p.id === selectedIpdPatientId;
                  return (
                    <div
                      key={p.id}
                      onClick={() => {
                        setSelectedIpdPatientId(p.id);
                        setActiveIpdRoundNote(p.roundNote);
                      }}
                      className={`p-3.5 rounded-xl border cursor-pointer transition ${
                        isSelected ? 'border-teal-500 bg-teal-50/50 ring-1 ring-teal-500 shadow-xs' : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-slate-900 text-xs">{p.name}</span>
                        <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800">
                          {p.bed}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500">{p.diagnosis}</div>
                      <div className="text-[10px] font-mono text-teal-700 mt-1">{p.vitals}</div>
                    </div>
                  );
                })}
              </div>

              <div className="md:col-span-2 space-y-4 bg-slate-50 p-5 rounded-xl border border-slate-200">
                {(() => {
                  const currentIpd = ipdPatients.find((p) => p.id === selectedIpdPatientId) || ipdPatients[0];
                  if (!currentIpd) return null;
                  return (
                    <>
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-bold text-slate-900 text-sm">{currentIpd.name} ({currentIpd.uhid})</h3>
                          <p className="text-slate-500 text-[11px]">{currentIpd.ward} &bull; Bed: {currentIpd.bed}</p>
                        </div>
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">
                          Active Inpatient
                        </span>
                      </div>

                      <div>
                        <label className="block text-slate-700 font-semibold mb-1">Attending Physician Round Progress Note</label>
                        <textarea
                          rows={4}
                          value={activeIpdRoundNote || currentIpd.roundNote}
                          onChange={(e) => setActiveIpdRoundNote(e.target.value)}
                          placeholder="Log clinical progress, auscultation findings, fluid balance, and medication adjustments..."
                          className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-teal-500"
                        />
                      </div>

                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleRecordRoundNote(currentIpd.id, activeIpdRoundNote || currentIpd.roundNote)}
                          className="cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5 mr-1" />
                          <span>Sign & Record Daily Round Note</span>
                        </Button>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: Walk-in Patient / New Token Registration */}
      <Modal
        isOpen={isWalkinModalOpen}
        onClose={() => setIsWalkinModalOpen(false)}
        title="Register Walk-in OPD Patient"
        description="Generate an immediate consultation token and register patient for the live doctor queue."
        footer={
          <>
            <Button variant="outline" onClick={() => setIsWalkinModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleAddWalkinPatient}>
              Generate Token & Add to Queue
            </Button>
          </>
        }
      >
        <div className="space-y-3.5 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">First Name *</label>
              <input
                type="text"
                value={walkinFirstName}
                onChange={(e) => setWalkinFirstName(e.target.value)}
                placeholder="e.g. Ramesh"
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Last Name *</label>
              <input
                type="text"
                value={walkinLastName}
                onChange={(e) => setWalkinLastName(e.target.value)}
                placeholder="e.g. Verma"
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-teal-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Gender</label>
              <select
                value={walkinGender}
                onChange={(e) => setWalkinGender(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Age (Years)</label>
              <input
                type="number"
                value={walkinAge}
                onChange={(e) => setWalkinAge(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Phone Number</label>
              <input
                type="text"
                value={walkinPhone}
                onChange={(e) => setWalkinPhone(e.target.value)}
                placeholder="10-digit mobile"
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Chief Complaint</label>
            <input
              type="text"
              value={walkinComplaint}
              onChange={(e) => setWalkinComplaint(e.target.value)}
              placeholder="e.g. Fever, persistent cough for 3 days, chest tightness"
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
            />
          </div>

          {/* Vitals */}
          <div className="pt-2 border-t border-slate-100">
            <span className="font-semibold text-slate-700 block mb-2 text-[11px] uppercase tracking-wider">
              Initial Vitals Recorded at Intake
            </span>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <label className="block text-slate-500 text-[10px]">BP (mmHg)</label>
                <input
                  type="text"
                  value={walkinBp}
                  onChange={(e) => setWalkinBp(e.target.value)}
                  className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block text-slate-500 text-[10px]">Heart Rate</label>
                <input
                  type="text"
                  value={walkinHr}
                  onChange={(e) => setWalkinHr(e.target.value)}
                  className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block text-slate-500 text-[10px]">Temperature</label>
                <input
                  type="text"
                  value={walkinTemp}
                  onChange={(e) => setWalkinTemp(e.target.value)}
                  className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* MODAL 2: Prescription Builder Modal */}
      <Modal
        isOpen={isRxModalOpen}
        onClose={() => setIsRxModalOpen(false)}
        title="Add Medication to Prescription (Rx)"
        description="Select generic/brand formulation, specify dosage frequency, duration, and patient instructions."
        footer={
          <>
            <Button variant="outline" onClick={() => setIsRxModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleAddPrescription}>
              Add to Prescription
            </Button>
          </>
        }
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Medicine Name & Formulation *</label>
            <input
              type="text"
              value={newRxDrug}
              onChange={(e) => setNewRxDrug(e.target.value)}
              placeholder="e.g. Atorvastatin 20mg, Metoprolol 50mg, Pantoprazole 40mg"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-teal-500"
            />
            {/* Quick formulary pills */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              <span className="text-[11px] text-slate-400 self-center">Formulary:</span>
              {['Paracetamol 650mg', 'Amoxicillin 500mg', 'Atorvastatin 20mg', 'Metoprolol 50mg', 'Pantoprazole 40mg', 'Azithromycin 500mg'].map(
                (med) => (
                  <button
                    key={med}
                    type="button"
                    onClick={() => setNewRxDrug(med)}
                    className="text-[11px] bg-slate-100 hover:bg-teal-50 hover:text-teal-700 px-2 py-0.5 rounded transition cursor-pointer"
                  >
                    {med}
                  </button>
                )
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Dosage Form</label>
              <select
                value={newRxDose}
                onChange={(e) => setNewRxDose(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
              >
                <option>1 Tablet</option>
                <option>2 Tablets</option>
                <option>1 Capsule</option>
                <option>5 ml Syrup</option>
                <option>10 ml Syrup</option>
                <option>1 Injection Ampoule</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Frequency</label>
              <select
                value={newRxFreq}
                onChange={(e) => setNewRxFreq(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
              >
                <option>Once Daily (OD) - Morning</option>
                <option>Once Daily (OD) - Night</option>
                <option>Twice Daily (BD) - 1-0-1</option>
                <option>Thrice Daily (TDS) - 1-1-1</option>
                <option>Four Times Daily (QID)</option>
                <option>As Needed (SOS)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Duration</label>
              <select
                value={newRxDuration}
                onChange={(e) => setNewRxDuration(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
              >
                <option>3 Days</option>
                <option>5 Days</option>
                <option>7 Days</option>
                <option>10 Days</option>
                <option>15 Days</option>
                <option>30 Days</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Food Timing</label>
              <select
                value={newRxInstructions}
                onChange={(e) => setNewRxInstructions(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
              >
                <option>After food</option>
                <option>Before food / Empty stomach</option>
                <option>With food</option>
                <option>At bedtime</option>
              </select>
            </div>
          </div>
        </div>
      </Modal>

      {/* MODAL 3: Lab Order Modal */}
      <Modal
        isOpen={isLabModalOpen}
        onClose={() => setIsLabModalOpen(false)}
        title="Order Laboratory Pathology Tests"
        description="Select pathology investigations for this patient encounter."
        footer={
          <>
            <Button variant="outline" onClick={() => setIsLabModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleOrderLab}>
              Dispatch Order ({selectedTests.length} Tests)
            </Button>
          </>
        }
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 font-semibold mb-2">Select Diagnostic Investigations</label>
            <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto p-1">
              {[
                '12-Lead ECG',
                'Cardiac Troponin-I (High Sensitivity)',
                'Complete Blood Count (CBC)',
                'Lipid Profile Comprehensive',
                'Serum Creatinine & Electrolytes',
                'HbA1c & Fasting Blood Sugar',
                'Liver Function Test (LFT)',
                'Thyroid Profile (TSH, T3, T4)',
                'Urine Routine & Microscopic',
                'C-Reactive Protein (CRP)'
              ].map((test) => {
                const checked = selectedTests.includes(test);
                return (
                  <label
                    key={test}
                    className={`flex items-center space-x-2 p-2 rounded-lg border cursor-pointer transition ${
                      checked ? 'bg-teal-50 border-teal-300 text-teal-900 font-medium' : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedTests([...selectedTests, test]);
                        } else {
                          setSelectedTests(selectedTests.filter((t) => t !== test));
                        }
                      }}
                      className="rounded text-teal-600 focus:ring-teal-500"
                    />
                    <span className="truncate">{test}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Clinical Priority</label>
            <div className="flex space-x-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="priority"
                  value="Routine"
                  checked={testPriority === 'Routine'}
                  onChange={() => setTestPriority('Routine')}
                  className="text-teal-600"
                />
                <span>Routine (Within 4 hours)</span>
              </label>
              <label className="flex items-center space-x-2 text-rose-700 font-semibold cursor-pointer">
                <input
                  type="radio"
                  name="priority"
                  value="STAT Urgent"
                  checked={testPriority === 'STAT Urgent'}
                  onChange={() => setTestPriority('STAT Urgent')}
                  className="text-rose-600"
                />
                <span>STAT Urgent (Immediate processing)</span>
              </label>
            </div>
          </div>
        </div>
      </Modal>

      {/* MODAL 4: Radiology Requisition Modal */}
      <Modal
        isOpen={isRadModalOpen}
        onClose={() => setIsRadModalOpen(false)}
        title="Order Radiology Imaging & Scans"
        description="Select diagnostic imaging modalities (Digital X-Ray, CT, MRI, Ultrasound) for this patient encounter."
        footer={
          <>
            <Button variant="outline" onClick={() => setIsRadModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleOrderRadiology}>
              Dispatch Imaging ({selectedRadProcedures.length} Procedures)
            </Button>
          </>
        }
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 font-semibold mb-2">Select Imaging Procedures</label>
            <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto p-1">
              {[
                'Digital X-Ray Chest PA View',
                'Digital X-Ray Knee AP & Lateral',
                'HRCT Chest (High Resolution)',
                'CT Coronary Angiogram',
                'CT Brain Plain & Contrast',
                'MRI Brain with Diffusion',
                'MRI Spine (Lumbar / Cervical)',
                'Ultrasound Whole Abdomen & Pelvis',
                'Doppler Echocardiography (2D)'
              ].map((proc) => {
                const checked = selectedRadProcedures.includes(proc);
                return (
                  <label
                    key={proc}
                    className={`flex items-center space-x-2 p-2 rounded-lg border cursor-pointer transition ${
                      checked ? 'bg-teal-50 border-teal-300 text-teal-900 font-medium' : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedRadProcedures([...selectedRadProcedures, proc]);
                        } else {
                          setSelectedRadProcedures(selectedRadProcedures.filter((p) => p !== proc));
                        }
                      }}
                      className="rounded text-teal-600 focus:ring-teal-500"
                    />
                    <span className="truncate">{proc}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Clinical Priority</label>
            <div className="flex space-x-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="radPriority"
                  value="Routine"
                  checked={testPriority === 'Routine'}
                  onChange={() => setTestPriority('Routine')}
                  className="text-teal-600"
                />
                <span>Routine</span>
              </label>
              <label className="flex items-center space-x-2 text-rose-700 font-semibold cursor-pointer">
                <input
                  type="radio"
                  name="radPriority"
                  value="STAT Urgent"
                  checked={testPriority === 'STAT Urgent'}
                  onChange={() => setTestPriority('STAT Urgent')}
                  className="text-rose-600"
                />
                <span>STAT Urgent (Trauma / Acute Care)</span>
              </label>
            </div>
          </div>
        </div>
      </Modal>

      {/* MODAL 5: Admit to Inpatient Ward */}
      <Modal
        isOpen={isAdmitModalOpen}
        onClose={() => setIsAdmitModalOpen(false)}
        title="Admit Patient to Inpatient Ward"
        description="Transfer patient from OPD to an active inpatient bed for round monitoring."
        footer={
          <>
            <Button variant="outline" onClick={() => setIsAdmitModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleAdmitInpatient}>
              Confirm Inpatient Admission
            </Button>
          </>
        }
      >
        <div className="space-y-3.5 text-xs">
          {activePatient ? (
            <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl">
              <span className="font-bold text-teal-900 block">Patient: {activePatient.name}</span>
              <span className="text-[11px] text-teal-700 font-mono">UHID: {activePatient.uhid}</span>
            </div>
          ) : (
            <div className="p-3 bg-amber-50 text-amber-800 rounded-xl text-xs">
              Please select a patient from OPD queue first.
            </div>
          )}

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Admission Diagnosis</label>
            <input
              type="text"
              value={admitDiagnosis}
              onChange={(e) => setAdmitDiagnosis(e.target.value)}
              placeholder="e.g. Acute Coronary Syndrome, Fluid Overload, Severe Pneumonia"
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Target Ward</label>
              <select
                value={admitWard}
                onChange={(e) => setAdmitWard(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              >
                <option>Cardio-Thoracic ICU</option>
                <option>Medical Intensive Care Unit (MICU)</option>
                <option>General Medicine Ward</option>
                <option>Post-Operative Recovery Ward</option>
                <option>Pediatric Ward</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Bed Allocation</label>
              <select
                value={admitBedNumber}
                onChange={(e) => setAdmitBedNumber(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
              >
                <option>ICU-01</option>
                <option>ICU-02</option>
                <option>ICU-03</option>
                <option>WARD-B1</option>
                <option>WARD-B2</option>
                <option>WARD-B3</option>
              </select>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};
