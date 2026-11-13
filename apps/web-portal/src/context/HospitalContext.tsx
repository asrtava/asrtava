import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  patientApi,
  appointmentApi,
  clinicalApi,
  inpatientApi,
  pharmacyApi,
  diagnosticsApi,
  billingApi,
  hospitalAdminApi,
  emergencyApi,
  otApi
} from '../services/api';
import { useAuth } from './AuthContext';

export interface SharedPatient {
  id: string;
  uhid: string;
  name: string;
  firstName: string;
  lastName: string;
  age: number;
  gender: string;
  phone: string;
  bloodGroup?: string;
  address?: string;
  registeredDate: string;
  allergies?: string[];
}

export interface SharedAppointment {
  id: string;
  patientId: string;
  patientName: string;
  uhid: string;
  age: number;
  gender: string;
  phone: string;
  token: string;
  doctorId: string;
  doctorName: string;
  department: string;
  date: string;
  time: string;
  status: 'Checked In' | 'Waiting' | 'In Consultation' | 'Completed' | 'Cancelled';
  complaint: string;
  feePaid?: boolean;
  invoiceId?: string;
}

export interface SharedPrescriptionItem {
  id: string;
  drugName: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
  qty?: number;
  unitPrice?: number;
}

export interface SharedPrescription {
  id: string;
  rxNumber: string;
  patientId: string;
  patientName: string;
  uhid: string;
  doctorId: string;
  doctorName: string;
  date: string;
  time: string;
  items: SharedPrescriptionItem[];
  status: 'Pending' | 'Dispensed';
  dispensedAt?: string;
  invoiceId?: string;
}

export interface SharedLabOrder {
  id: string;
  orderNumber: string;
  patientId: string;
  patientName: string;
  uhid: string;
  doctorId: string;
  doctorName: string;
  tests: string[];
  priority: 'Routine' | 'STAT Urgent';
  orderedAt: string;
  status: 'Ordered' | 'Sample Collected' | 'Ready for Entry' | 'Awaiting Sign-Off' | 'Verified & Dispatched';
  barcode?: string;
  results?: Array<{
    parameter: string;
    value: string;
    unit: string;
    reference: string;
    flag?: 'Normal' | 'High' | 'Low' | 'Critical';
  }>;
  verifiedAt?: string;
  verifiedBy?: string;
}

export interface SharedRadiologyOrder {
  id: string;
  orderNumber: string;
  patientId: string;
  patientName: string;
  uhid: string;
  doctorId: string;
  doctorName: string;
  procedures: string[];
  priority: 'Routine' | 'STAT Urgent';
  orderedAt: string;
  pacsStudyId?: string;
  status: 'Scheduled' | 'Study Ready' | 'Reported & Signed';
  findings?: string;
  impression?: string;
  reportedBy?: string;
  reportedAt?: string;
  isCriticalAlert?: boolean;
}

export interface SharedBed {
  id: string;
  bedNumber: string;
  wardId: string;
  wardName: string;
  bedType: string;
  status: 'Available' | 'Occupied' | 'Cleaning' | 'Maintenance';
  dailyRate: number;
  patient?: {
    id: string;
    admissionId: string;
    admissionNumber: string;
    name: string;
    uhid: string;
    age: number;
    gender: string;
    admittedDate: string;
    diagnosis: string;
    attendingDoctor: string;
    vitals: {
      bp: string;
      hr: string;
      temp: string;
      spo2: string;
      sugar: string;
      alert?: boolean;
    };
    allergies?: string;
  };
}

export interface SharedInvoice {
  id: string;
  invoiceNumber: string;
  patientId: string;
  patientName: string;
  uhid: string;
  category: string;
  date: string;
  subtotal: number;
  tax: number;
  total: number;
  paid: number;
  balance: number;
  status: 'Paid' | 'Partially Paid' | 'Unpaid' | 'Insurance Pending';
  paymentMode?: string;
  receiptNumber?: string;
  items: Array<{
    description: string;
    quantity: number;
    unitRate: number;
    amount: number;
  }>;
}

export interface SharedInventoryItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  stock: number;
  unit: string;
  reorderLevel: number;
  unitPrice: number;
  batch?: string;
  expiry?: string;
  status: 'Healthy' | 'Low Stock' | 'Expiring Soon';
}

export interface SharedStaff {
  id: string;
  name: string;
  role: string;
  department: string;
  shift: string;
  status: 'On Duty' | 'Off Duty' | 'On Leave';
  phone: string;
  email: string;
  licenseNumber?: string;
}

export interface SharedEmergencyPatient {
  id: string;
  encounterNumber: string;
  patientName: string;
  uhid: string;
  isUnknownIdentity: boolean;
  age: number | string;
  gender: string;
  arrivalMode: 'WALK_IN' | 'AMBULANCE' | 'POLICE_BRING_IN' | 'HELICOPTER';
  presentingComplaint: string;
  esiLevel: number;
  zone: 'RED_RESUS' | 'YELLOW_ACUTE' | 'GREEN_FAST_TRACK';
  vitals: {
    hr: number;
    bp: string;
    rr: number;
    spo2: number;
    gcs: number;
  };
  arrivalTime: string;
  isMedicoLegal: boolean;
  status: 'TRIAGING' | 'IN_RESUS' | 'UNDER_OBSERVATION' | 'ADMITTED_ICU' | 'DISCHARGED';
}

export interface SharedOTSurgery {
  id: string;
  patientName: string;
  uhid: string;
  age: number;
  gender: string;
  procedureName: string;
  primarySurgeon: string;
  anaesthetist: string;
  theatreName: string;
  scheduledTime: string;
  priority: 'ELECTIVE' | 'URGENT' | 'STAT_EMERGENCY';
  status: 'SCHEDULED' | 'IN_PREOP' | 'IN_THEATRE' | 'RECOVERY' | 'COMPLETED';
}

interface HospitalContextType {
  // Data Collections
  patients: SharedPatient[];
  appointments: SharedAppointment[];
  prescriptions: SharedPrescription[];
  labOrders: SharedLabOrder[];
  radiologyOrders: SharedRadiologyOrder[];
  beds: SharedBed[];
  invoices: SharedInvoice[];
  inventory: SharedInventoryItem[];
  staff: SharedStaff[];
  emergencyPatients: SharedEmergencyPatient[];
  otSurgeries: SharedOTSurgery[];
  departments: string[];
  doctors: Array<{ id: string; name: string; dept: string; specialization?: string }>;

  // Operational State
  isLoading: boolean;
  refreshAllData: () => Promise<void>;

  // Actions & Cross-Portal Flow Triggers
  registerPatient: (data: {
    firstName: string;
    lastName: string;
    age: number;
    gender: string;
    phone: string;
    bloodGroup?: string;
    address?: string;
  }) => Promise<SharedPatient>;

  bookAppointment: (data: {
    patientId: string;
    patientName: string;
    uhid: string;
    age: number;
    gender: string;
    phone: string;
    doctorId: string;
    doctorName: string;
    department: string;
    date: string;
    time: string;
    complaint?: string;
  }) => Promise<SharedAppointment>;

  updateAppointmentStatus: (
    id: string,
    status: SharedAppointment['status'],
    reason?: string
  ) => Promise<void>;

  addPrescription: (data: {
    patientId: string;
    patientName: string;
    uhid: string;
    doctorId: string;
    doctorName: string;
    items: SharedPrescriptionItem[];
  }) => Promise<SharedPrescription>;

  dispensePrescription: (
    prescriptionId: string,
    collectedFee?: number,
    paymentMode?: string
  ) => Promise<void>;

  orderLabTests: (data: {
    patientId: string;
    patientName: string;
    uhid: string;
    doctorId: string;
    doctorName: string;
    tests: string[];
    priority: 'Routine' | 'STAT Urgent';
  }) => Promise<SharedLabOrder>;

  updateLabOrderResults: (
    orderId: string,
    results: SharedLabOrder['results'],
    status: SharedLabOrder['status'],
    verifiedBy?: string
  ) => Promise<void>;

  orderRadiology: (data: {
    patientId: string;
    patientName: string;
    uhid: string;
    doctorId: string;
    doctorName: string;
    procedures: string[];
    priority: 'Routine' | 'STAT Urgent';
  }) => Promise<SharedRadiologyOrder>;

  updateRadiologyReport: (
    orderId: string,
    findings: string,
    impression: string,
    reportedBy: string,
    isCritical?: boolean
  ) => Promise<void>;

  admitPatientToBed: (data: {
    patientId: string;
    patientName: string;
    uhid: string;
    age: number;
    gender: string;
    bedId: string;
    wardName: string;
    diagnosis: string;
    attendingDoctor: string;
    initialVitals?: SharedBed['patient']['vitals'];
  }) => Promise<void>;

  dischargePatientFromBed: (bedId: string, dischargeSummary?: string) => Promise<void>;
  updateBedVitals: (bedNumberOrId: string, vitals: { bp: string; hr: string; temp: string; spo2: string; sugar: string; alert?: boolean }) => void;

  createInvoice: (data: {
    patientId: string;
    patientName: string;
    uhid: string;
    category: string;
    items: Array<{ description: string; quantity: number; unitRate: number; amount: number }>;
  }) => Promise<SharedInvoice>;

  collectInvoicePayment: (
    invoiceId: string,
    amount: number,
    paymentMode: string
  ) => Promise<string>;

  registerEmergencyPatient: (data: {
    patientName: string;
    uhid?: string;
    isUnknownIdentity?: boolean;
    age: number | string;
    gender: string;
    arrivalMode: SharedEmergencyPatient['arrivalMode'];
    presentingComplaint: string;
    esiLevel: number;
    vitals: SharedEmergencyPatient['vitals'];
    isMedicoLegal?: boolean;
  }) => Promise<SharedEmergencyPatient>;

  scheduleSurgery: (data: {
    patientName: string;
    uhid: string;
    age: number;
    gender: string;
    procedureName: string;
    primarySurgeon: string;
    anaesthetist: string;
    theatreName: string;
    scheduledTime: string;
    priority: SharedOTSurgery['priority'];
  }) => Promise<SharedOTSurgery>;

  updateSurgeryStatus: (id: string, status: SharedOTSurgery['status']) => Promise<void>;

  transferInventoryStock: (
    itemId: string,
    qty: number,
    destination: string
  ) => Promise<void>;
}

const HospitalContext = createContext<HospitalContextType | undefined>(undefined);

export const HospitalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // Core Dynamic Collections
  const [patients, setPatients] = useState<SharedPatient[]>([]);
  const [appointments, setAppointments] = useState<SharedAppointment[]>([]);
  const [prescriptions, setPrescriptions] = useState<SharedPrescription[]>([]);
  const [labOrders, setLabOrders] = useState<SharedLabOrder[]>([]);
  const [radiologyOrders, setRadiologyOrders] = useState<SharedRadiologyOrder[]>([]);
  const [beds, setBeds] = useState<SharedBed[]>([]);
  const [invoices, setInvoices] = useState<SharedInvoice[]>([]);
  const [inventory, setInventory] = useState<SharedInventoryItem[]>([]);
  const [staff, setStaff] = useState<SharedStaff[]>([]);
  const [emergencyPatients, setEmergencyPatients] = useState<SharedEmergencyPatient[]>([]);
  const [otSurgeries, setOtSurgeries] = useState<SharedOTSurgery[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [doctors, setDoctors] = useState<Array<{ id: string; name: string; dept: string; specialization?: string }>>([]);

  // Load All Live Hospital Data from PostgreSQL API
  const refreshAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [
        patientRes,
        apptRes,
        bedsRes,
        deptRes,
        docRes,
        staffRes,
        medsRes,
        labCatalogRes
      ] = await Promise.allSettled([
        patientApi.getPatients(),
        appointmentApi.getAppointments(),
        inpatientApi.getBeds(),
        hospitalAdminApi.getDepartments(),
        hospitalAdminApi.getDoctors(),
        hospitalAdminApi.getStaff(),
        pharmacyApi.getMedicines(),
        diagnosticsApi.getLabCatalog()
      ]);

      // 1. Ingest Patients
      if (patientRes.status === 'fulfilled' && patientRes.value?.data?.data) {
        const raw = patientRes.value.data.data;
        const loadedPatients: SharedPatient[] = raw.map((p: any) => ({
          id: p.id,
          uhid: p.patient_number || `UHID-${p.id.slice(0, 6)}`,
          name: `${p.first_name} ${p.last_name || ''}`.trim(),
          firstName: p.first_name,
          lastName: p.last_name || '',
          age: p.age || 35,
          gender: p.gender === 'female' ? 'Female' : 'Male',
          phone: p.phone || '',
          bloodGroup: p.blood_group || 'O+',
          address: p.address,
          registeredDate: p.created_at ? p.created_at.slice(0, 10) : new Date().toISOString().slice(0, 10),
          allergies: p.allergies || []
        }));
        setPatients(loadedPatients);
      }

      // 2. Ingest Appointments (OPD Queue)
      if (apptRes.status === 'fulfilled' && apptRes.value?.data?.data) {
        const raw = apptRes.value.data.data;
        const loadedAppts: SharedAppointment[] = raw.map((a: any, idx: number) => ({
          id: a.id,
          patientId: a.patient_id,
          patientName: `${a.patient_first_name} ${a.patient_last_name || ''}`.trim(),
          uhid: a.patient_number || `UHID-OPD-${String(idx + 1).padStart(4, '0')}`,
          age: 40,
          gender: 'Male',
          phone: a.patient_phone || '',
          token: `T-${String(a.queue_token_number || idx + 1).padStart(3, '0')}`,
          doctorId: a.doctor_id || '',
          doctorName: `Dr. ${a.doctor_first_name || 'Staff'} ${a.doctor_last_name || 'Doctor'}`.trim(),
          department: a.department_name || 'General Medicine',
          date: a.appointment_date || new Date().toISOString().slice(0, 10),
          time: a.start_time || '10:00 AM',
          status:
            a.status === 'completed'
              ? 'Completed'
              : a.status === 'in_consultation'
              ? 'In Consultation'
              : a.status === 'checked_in'
              ? 'Checked In'
              : a.status === 'cancelled'
              ? 'Cancelled'
              : 'Waiting',
          complaint: a.reason || 'General clinical consultation'
        }));
        setAppointments(loadedAppts);
      }

      // 3. Ingest Inpatient Beds
      if (bedsRes.status === 'fulfilled' && bedsRes.value?.data?.data) {
        const raw = bedsRes.value.data.data;
        const loadedBeds: SharedBed[] = raw.map((b: any) => ({
          id: b.bed_id || b.id,
          bedNumber: b.bed_number || 'BED-01',
          wardId: b.ward_id || 'ward-1',
          wardName: b.ward_name || 'General Inpatient Ward',
          bedType: b.bed_type || 'Standard',
          status: b.bed_status === 'occupied' || b.patient_id ? 'Occupied' : 'Available',
          dailyRate: b.daily_rate ? Number(b.daily_rate) : 1500,
          patient: b.patient_id
            ? {
                id: b.patient_id,
                admissionId: b.admission_id || `adm-${b.id}`,
                admissionNumber: b.admission_number || `ADM-${b.id.slice(0, 5)}`,
                name: `${b.patient_first_name || ''} ${b.patient_last_name || ''}`.trim() || 'Inpatient',
                uhid: b.patient_number || `UHID-INP-${b.id.slice(0, 5)}`,
                age: 45,
                gender: 'Male',
                admittedDate: b.allocated_from ? b.allocated_from.slice(0, 10) : new Date().toISOString().slice(0, 10),
                diagnosis: b.initial_diagnosis || 'Under Inpatient Observation',
                attendingDoctor: b.attending_doctor || 'Attending Physician',
                vitals: {
                  bp: '122 / 80 mmHg',
                  hr: '76 bpm',
                  temp: '98.6 °F',
                  spo2: '98%',
                  sugar: '110 mg/dL'
                }
              }
            : undefined
        }));
        setBeds(loadedBeds);
      }

      // 4. Ingest Departments
      if (deptRes.status === 'fulfilled' && deptRes.value?.data?.data) {
        const deptNames = deptRes.value.data.data.map((d: any) => d.name);
        setDepartments(deptNames);
      }

      // 5. Ingest Doctors
      if (docRes.status === 'fulfilled' && docRes.value?.data?.data) {
        const docList = docRes.value.data.data.map((d: any) => ({
          id: d.id,
          name: `Dr. ${d.first_name} ${d.last_name || ''}`.trim(),
          dept: d.department_name || 'General Medicine',
          specialization: d.specialization
        }));
        setDoctors(docList);
      }

      // 6. Ingest Staff
      if (staffRes.status === 'fulfilled' && staffRes.value?.data?.data) {
        const staffList = staffRes.value.data.data.map((s: any, idx: number) => ({
          id: s.id,
          name: `${s.first_name || ''} ${s.last_name || ''}`.trim() || `Staff Member #${idx + 1}`,
          role: s.designation || s.user_type || 'Healthcare Professional',
          department: s.department_name || 'Clinical',
          shift: 'Morning (08:00 - 16:00)',
          status: s.is_active ? 'On Duty' : 'Off Duty',
          phone: s.phone || '+91 98765 00000',
          email: s.email || '',
          licenseNumber: s.license_no
        }));
        setStaff(staffList);
      }

      // 7. Ingest Medicines / Inventory
      if (medsRes.status === 'fulfilled' && medsRes.value?.data?.data) {
        const medList = medsRes.value.data.data.map((m: any) => ({
          id: m.id,
          name: m.brand_name || m.generic_name || 'Medication Item',
          sku: m.sku || `MED-${m.id.slice(0, 6)}`,
          category: m.category || 'Pharmaceutical',
          stock: m.current_stock || 100,
          unit: m.unit || 'Tablets',
          reorderLevel: m.reorder_level || 50,
          unitPrice: m.unit_mrp ? Number(m.unit_mrp) : 10,
          batch: m.batch_number || 'BAT-2026-01',
          expiry: m.expiry_date || '2027-12-31',
          status: (m.current_stock || 100) < 50 ? 'Low Stock' : 'Healthy'
        }));
        setInventory(medList);
      }
    } catch (err) {
      console.warn('HospitalBridge live sync fallback active:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshAllData();
  }, [refreshAllData]);

  // ==========================================
  // ACTION: Register New Patient
  // ==========================================
  const registerPatient = async (data: {
    firstName: string;
    lastName: string;
    age: number;
    gender: string;
    phone: string;
    bloodGroup?: string;
    address?: string;
  }): Promise<SharedPatient> => {
    const nextSeq = patients.length + 1;
    let uhid = `ASR-${new Date().getFullYear()}-${String(nextSeq + 100).padStart(5, '0')}`;
    let patientId = 'pt-' + Date.now();

    try {
      const res = await patientApi.registerPatient({
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        gender: data.gender.toLowerCase(),
        phone: data.phone.trim(),
        bloodGroup: data.bloodGroup || 'O+',
        address: data.address || 'Address On File'
      });
      if (res.data?.data) {
        patientId = res.data.data.id || patientId;
        uhid = res.data.data.patient_number || uhid;
      }
    } catch (e) {
      // Local state fallback
    }

    const newPatient: SharedPatient = {
      id: patientId,
      uhid,
      name: `${data.firstName.trim()} ${data.lastName.trim()}`,
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      age: data.age,
      gender: data.gender,
      phone: data.phone.trim(),
      bloodGroup: data.bloodGroup || 'O+',
      address: data.address,
      registeredDate: new Date().toISOString().slice(0, 10),
      allergies: []
    };

    setPatients((prev) => [newPatient, ...prev]);
    return newPatient;
  };

  // ==========================================
  // ACTION: Book Appointment / Generate Token
  // ==========================================
  const bookAppointment = async (data: {
    patientId: string;
    patientName: string;
    uhid: string;
    age: number;
    gender: string;
    phone: string;
    doctorId: string;
    doctorName: string;
    department: string;
    date: string;
    time: string;
    complaint?: string;
  }): Promise<SharedAppointment> => {
    const tokenNum = appointments.length + 1;
    const tokenStr = `T-${String(tokenNum).padStart(3, '0')}`;
    let apptId = 'apt-' + Date.now();

    try {
      const res = await appointmentApi.scheduleAppointment({
        patientId: data.patientId,
        doctorId: data.doctorId,
        appointmentDate: data.date,
        startTime: data.time.includes(':') ? data.time : '10:00:00',
        endTime: '10:30:00',
        reason: data.complaint || 'Outpatient consultation'
      });
      if (res.data?.data?.id) {
        apptId = res.data.data.id;
      }
    } catch (e) {
      // Local state fallback
    }

    const newAppt: SharedAppointment = {
      id: apptId,
      patientId: data.patientId,
      patientName: data.patientName,
      uhid: data.uhid,
      age: data.age,
      gender: data.gender,
      phone: data.phone,
      token: tokenStr,
      doctorId: data.doctorId,
      doctorName: data.doctorName,
      department: data.department,
      date: data.date,
      time: data.time,
      status: 'Waiting',
      complaint: data.complaint || 'Routine OPD Evaluation'
    };

    setAppointments((prev) => [newAppt, ...prev]);
    return newAppt;
  };

  // ==========================================
  // ACTION: Update Appointment Status
  // ==========================================
  const updateAppointmentStatus = async (
    id: string,
    status: SharedAppointment['status'],
    reason?: string
  ): Promise<void> => {
    try {
      const apiStatus =
        status === 'In Consultation'
          ? 'in_consultation'
          : status === 'Completed'
          ? 'completed'
          : status === 'Cancelled'
          ? 'cancelled'
          : 'waiting';
      await appointmentApi.updateStatus(id, apiStatus, reason);
    } catch (e) {}

    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status } : a))
    );
  };

  // ==========================================
  // ACTION: Doctor Issues Electronic Prescription (Rx)
  // ==========================================
  const addPrescription = async (data: {
    patientId: string;
    patientName: string;
    uhid: string;
    doctorId: string;
    doctorName: string;
    items: SharedPrescriptionItem[];
  }): Promise<SharedPrescription> => {
    const nextSeq = prescriptions.length + 1;
    const rxNumber = `RX-${new Date().getFullYear()}-${String(nextSeq + 100).padStart(5, '0')}`;
    const rxId = 'rx-' + Date.now();

    const newRx: SharedPrescription = {
      id: rxId,
      rxNumber,
      patientId: data.patientId,
      patientName: data.patientName,
      uhid: data.uhid,
      doctorId: data.doctorId,
      doctorName: data.doctorName,
      date: new Date().toISOString().slice(0, 10),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      items: data.items,
      status: 'Pending'
    };

    // Adds immediately to shared prescriptions store so Pharmacy sees it!
    setPrescriptions((prev) => [newRx, ...prev]);

    // Also creates an auto-generated pending Pharmacy invoice
    const totalAmount = data.items.reduce((sum, item) => sum + (item.qty || 1) * (item.unitPrice || 15), 0);
    if (totalAmount > 0) {
      createInvoice({
        patientId: data.patientId,
        patientName: data.patientName,
        uhid: data.uhid,
        category: 'Pharmacy Medication',
        items: data.items.map((item) => ({
          description: item.drugName,
          quantity: item.qty || 1,
          unitRate: item.unitPrice || 15,
          amount: (item.qty || 1) * (item.unitPrice || 15)
        }))
      });
    }

    return newRx;
  };

  // ==========================================
  // ACTION: Pharmacy Dispenses Prescription
  // ==========================================
  const dispensePrescription = async (
    prescriptionId: string,
    collectedFee?: number,
    paymentMode?: string
  ): Promise<void> => {
    setPrescriptions((prev) =>
      prev.map((rx) =>
        rx.id === prescriptionId
          ? {
              ...rx,
              status: 'Dispensed',
              dispensedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
          : rx
      )
    );

    // If payment was collected at pharmacy counter, register formal invoice receipt
    if (collectedFee && collectedFee > 0) {
      const inv = await createInvoice({
        patientId: prescriptionId,
        patientName: 'Pharmacy Outpatient',
        uhid: 'DISP-OTC',
        category: 'Pharmacy Dispensing POS',
        items: [{ description: 'Prescription Medication Dispensed', quantity: 1, unitRate: collectedFee, amount: collectedFee }]
      });
      await collectInvoicePayment(inv.id, collectedFee, paymentMode || 'Cash');
    }
  };

  // ==========================================
  // ACTION: Doctor Orders Laboratory Tests
  // ==========================================
  const orderLabTests = async (data: {
    patientId: string;
    patientName: string;
    uhid: string;
    doctorId: string;
    doctorName: string;
    tests: string[];
    priority: 'Routine' | 'STAT Urgent';
  }): Promise<SharedLabOrder> => {
    const nextSeq = labOrders.length + 1;
    const orderNumber = `LAB-${new Date().getFullYear()}-${String(nextSeq + 100).padStart(5, '0')}`;
    const orderId = 'lab-' + Date.now();
    const barcode = `BAR-LAB-${Math.floor(100000 + Math.random() * 900000)}`;

    try {
      await diagnosticsApi.orderLabTests({
        patientId: data.patientId,
        tests: data.tests,
        priority: data.priority.toLowerCase()
      });
    } catch (e) {}

    const newOrder: SharedLabOrder = {
      id: orderId,
      orderNumber,
      patientId: data.patientId,
      patientName: data.patientName,
      uhid: data.uhid,
      doctorId: data.doctorId,
      doctorName: data.doctorName,
      tests: data.tests,
      priority: data.priority,
      orderedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'Ordered',
      barcode,
      results: []
    };

    setLabOrders((prev) => [newOrder, ...prev]);

    // Automatically generates billing charge item in Finance
    const labFee = data.tests.length * 350;
    createInvoice({
      patientId: data.patientId,
      patientName: data.patientName,
      uhid: data.uhid,
      category: 'Diagnostic Pathology Lab',
      items: data.tests.map((t) => ({ description: t, quantity: 1, unitRate: 350, amount: 350 }))
    });

    return newOrder;
  };

  // ==========================================
  // ACTION: Laboratory Updates Test Results
  // ==========================================
  const updateLabOrderResults = async (
    orderId: string,
    results: SharedLabOrder['results'],
    status: SharedLabOrder['status'],
    verifiedBy?: string
  ): Promise<void> => {
    setLabOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              results: results || o.results,
              status,
              verifiedBy: verifiedBy || o.verifiedBy,
              verifiedAt:
                status === 'Verified & Dispatched'
                  ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : o.verifiedAt
            }
          : o
      )
    );
  };

  // ==========================================
  // ACTION: Doctor Orders Radiology Imaging
  // ==========================================
  const orderRadiology = async (data: {
    patientId: string;
    patientName: string;
    uhid: string;
    doctorId: string;
    doctorName: string;
    procedures: string[];
    priority: 'Routine' | 'STAT Urgent';
  }): Promise<SharedRadiologyOrder> => {
    const nextSeq = radiologyOrders.length + 1;
    const orderNumber = `RAD-${new Date().getFullYear()}-${String(nextSeq + 100).padStart(5, '0')}`;
    const orderId = 'rad-' + Date.now();
    const pacsStudyId = `DICOM-STUDY-${Math.floor(10000 + Math.random() * 90000)}`;

    try {
      await diagnosticsApi.orderRadiology({
        patientId: data.patientId,
        procedures: data.procedures,
        priority: data.priority.toLowerCase()
      });
    } catch (e) {}

    const newOrder: SharedRadiologyOrder = {
      id: orderId,
      orderNumber,
      patientId: data.patientId,
      patientName: data.patientName,
      uhid: data.uhid,
      doctorId: data.doctorId,
      doctorName: data.doctorName,
      procedures: data.procedures,
      priority: data.priority,
      orderedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      pacsStudyId,
      status: 'Scheduled'
    };

    setRadiologyOrders((prev) => [newOrder, ...prev]);

    // Automatically registers radiology imaging charge in Finance
    const radFee = data.procedures.length * 1200;
    createInvoice({
      patientId: data.patientId,
      patientName: data.patientName,
      uhid: data.uhid,
      category: 'Radiology & Modality Imaging',
      items: data.procedures.map((p) => ({ description: p, quantity: 1, unitRate: 1200, amount: 1200 }))
    });

    return newOrder;
  };

  // ==========================================
  // ACTION: Radiology Updates Report
  // ==========================================
  const updateRadiologyReport = async (
    orderId: string,
    findings: string,
    impression: string,
    reportedBy: string,
    isCritical?: boolean
  ): Promise<void> => {
    setRadiologyOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              findings,
              impression,
              reportedBy,
              reportedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              status: 'Reported & Signed',
              isCriticalAlert: isCritical
            }
          : o
      )
    );
  };

  // ==========================================
  // ACTION: Admit Patient to Inpatient Bed
  // ==========================================
  const admitPatientToBed = async (data: {
    patientId: string;
    patientName: string;
    uhid: string;
    age: number;
    gender: string;
    bedId: string;
    wardName: string;
    diagnosis: string;
    attendingDoctor: string;
    initialVitals?: SharedBed['patient']['vitals'];
  }): Promise<void> => {
    const admissionId = `adm-${Date.now()}`;
    const admissionNumber = `ADM-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    try {
      await inpatientApi.admitPatient({
        patientId: data.patientId,
        bedId: data.bedId,
        initialDiagnosis: data.diagnosis
      });
    } catch (e) {}

    setBeds((prev) =>
      prev.map((b) =>
        b.id === data.bedId || b.bedNumber === data.bedId
          ? {
              ...b,
              status: 'Occupied',
              patient: {
                id: data.patientId,
                admissionId,
                admissionNumber,
                name: data.patientName,
                uhid: data.uhid,
                age: data.age,
                gender: data.gender,
                admittedDate: new Date().toISOString().slice(0, 10),
                diagnosis: data.diagnosis,
                attendingDoctor: data.attendingDoctor,
                vitals: data.initialVitals || {
                  bp: '120 / 80 mmHg',
                  hr: '74 bpm',
                  temp: '98.6 °F',
                  spo2: '99%',
                  sugar: '105 mg/dL'
                }
              }
            }
          : b
      )
    );
  };

  // ==========================================
  // ACTION: Discharge Patient from Bed
  // ==========================================
  const dischargePatientFromBed = async (bedId: string, dischargeSummary?: string): Promise<void> => {
    const targetBed = beds.find((b) => b.id === bedId || b.bedNumber === bedId);
    if (targetBed?.patient?.admissionId) {
      try {
        await inpatientApi.dischargePatient(targetBed.patient.admissionId, {
          dischargeSummary: dischargeSummary || 'Recovered and clinically stable'
        });
      } catch (e) {}
    }

    setBeds((prev) =>
      prev.map((b) =>
        b.id === bedId || b.bedNumber === bedId
          ? { ...b, status: 'Available', patient: undefined }
          : b
      )
    );
  };

  const updateBedVitals = (
    bedNumberOrId: string,
    vitals: { bp: string; hr: string; temp: string; spo2: string; sugar: string; alert?: boolean }
  ) => {
    setBeds((prev) =>
      prev.map((b) =>
        (b.id === bedNumberOrId || b.bedNumber === bedNumberOrId) && b.patient
          ? {
              ...b,
              patient: {
                ...b.patient,
                vitals: { ...b.patient.vitals, ...vitals }
              }
            }
          : b
      )
    );
  };

  // ==========================================
  // ACTION: Create Consolidated Billing Invoice
  // ==========================================
  const createInvoice = async (data: {
    patientId: string;
    patientName: string;
    uhid: string;
    category: string;
    items: Array<{ description: string; quantity: number; unitRate: number; amount: number }>;
  }): Promise<SharedInvoice> => {
    const nextSeq = invoices.length + 1;
    const invNumber = `INV-${new Date().getFullYear()}-${String(nextSeq + 1000).padStart(5, '0')}`;
    const invId = 'inv-' + Date.now();

    const subtotal = data.items.reduce((s, it) => s + it.amount, 0);
    const tax = Math.round(subtotal * 0.05); // 5% GST on consumables / medicines
    const total = subtotal + tax;

    const newInvoice: SharedInvoice = {
      id: invId,
      invoiceNumber: invNumber,
      patientId: data.patientId,
      patientName: data.patientName,
      uhid: data.uhid,
      category: data.category,
      date: new Date().toISOString().slice(0, 10),
      subtotal,
      tax,
      total,
      paid: 0,
      balance: total,
      status: 'Unpaid',
      items: data.items
    };

    setInvoices((prev) => [newInvoice, ...prev]);
    return newInvoice;
  };

  // ==========================================
  // ACTION: Collect Payment against Invoice
  // ==========================================
  const collectInvoicePayment = async (
    invoiceId: string,
    amount: number,
    paymentMode: string
  ): Promise<string> => {
    const receiptNumber = `REC-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

    try {
      await billingApi.collectPayment({
        invoiceId,
        amountPaid: amount,
        paymentMethod: paymentMode.toLowerCase(),
        idempotencyKey: `pay-${invoiceId}-${Date.now()}`
      });
    } catch (e) {}

    setInvoices((prev) =>
      prev.map((inv) => {
        if (inv.id === invoiceId || inv.invoiceNumber === invoiceId) {
          const newPaid = inv.paid + amount;
          const newBalance = Math.max(0, inv.total - newPaid);
          const newStatus = newBalance === 0 ? 'Paid' : 'Partially Paid';
          return {
            ...inv,
            paid: newPaid,
            balance: newBalance,
            status: newStatus,
            paymentMode,
            receiptNumber
          };
        }
        return inv;
      })
    );

    return receiptNumber;
  };

  // ==========================================
  // ACTION: Register Emergency Triage Patient
  // ==========================================
  const registerEmergencyPatient = async (data: {
    patientName: string;
    uhid?: string;
    isUnknownIdentity?: boolean;
    age: number | string;
    gender: string;
    arrivalMode: SharedEmergencyPatient['arrivalMode'];
    presentingComplaint: string;
    esiLevel: number;
    vitals: SharedEmergencyPatient['vitals'];
    isMedicoLegal?: boolean;
  }): Promise<SharedEmergencyPatient> => {
    const encSeq = emergencyPatients.length + 1;
    const encounterNumber = `ED-${new Date().getFullYear()}-${String(encSeq + 100).padStart(4, '0')}`;
    const uhid = data.uhid || `TEMP-ED-${Math.floor(10000 + Math.random() * 90000)}`;
    const zone: SharedEmergencyPatient['zone'] =
      data.esiLevel === 1 ? 'RED_RESUS' : data.esiLevel <= 3 ? 'YELLOW_ACUTE' : 'GREEN_FAST_TRACK';

    const newEdPatient: SharedEmergencyPatient = {
      id: 'ed-' + Date.now(),
      encounterNumber,
      patientName: data.patientName,
      uhid,
      isUnknownIdentity: !!data.isUnknownIdentity,
      age: data.age,
      gender: data.gender,
      arrivalMode: data.arrivalMode,
      presentingComplaint: data.presentingComplaint,
      esiLevel: data.esiLevel,
      zone,
      vitals: data.vitals,
      arrivalTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMedicoLegal: !!data.isMedicoLegal,
      status: data.esiLevel === 1 ? 'IN_RESUS' : 'TRIAGING'
    };

    setEmergencyPatients((prev) => [newEdPatient, ...prev]);
    return newEdPatient;
  };

  // ==========================================
  // ACTION: Schedule OT Surgery
  // ==========================================
  const scheduleSurgery = async (data: {
    patientName: string;
    uhid: string;
    age: number;
    gender: string;
    procedureName: string;
    primarySurgeon: string;
    anaesthetist: string;
    theatreName: string;
    scheduledTime: string;
    priority: SharedOTSurgery['priority'];
  }): Promise<SharedOTSurgery> => {
    const newSurgery: SharedOTSurgery = {
      id: 'surg-' + Date.now(),
      patientName: data.patientName,
      uhid: data.uhid,
      age: data.age,
      gender: data.gender,
      procedureName: data.procedureName,
      primarySurgeon: data.primarySurgeon,
      anaesthetist: data.anaesthetist,
      theatreName: data.theatreName,
      scheduledTime: data.scheduledTime,
      priority: data.priority,
      status: 'SCHEDULED'
    };

    setOtSurgeries((prev) => [newSurgery, ...prev]);
    return newSurgery;
  };

  const updateSurgeryStatus = async (id: string, status: SharedOTSurgery['status']): Promise<void> => {
    setOtSurgeries((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status } : s))
    );
  };

  // ==========================================
  // ACTION: Transfer / Deduct Inventory Stock
  // ==========================================
  const transferInventoryStock = async (
    itemId: string,
    qty: number,
    destination: string
  ): Promise<void> => {
    setInventory((prev) =>
      prev.map((it) => {
        if (it.id === itemId || it.name === itemId) {
          const newStock = Math.max(0, it.stock - qty);
          return {
            ...it,
            stock: newStock,
            status: newStock < it.reorderLevel ? 'Low Stock' : 'Healthy'
          };
        }
        return it;
      })
    );
  };

  return (
    <HospitalContext.Provider
      value={{
        patients,
        appointments,
        prescriptions,
        labOrders,
        radiologyOrders,
        beds,
        invoices,
        inventory,
        staff,
        emergencyPatients,
        otSurgeries,
        departments,
        doctors,
        isLoading,
        refreshAllData,
        registerPatient,
        bookAppointment,
        updateAppointmentStatus,
        addPrescription,
        dispensePrescription,
        orderLabTests,
        updateLabOrderResults,
        orderRadiology,
        updateRadiologyReport,
        admitPatientToBed,
        dischargePatientFromBed,
        updateBedVitals,
        createInvoice,
        collectInvoicePayment,
        registerEmergencyPatient,
        scheduleSurgery,
        updateSurgeryStatus,
        transferInventoryStock
      }}
    >
      {children}
    </HospitalContext.Provider>
  );
};

export const useHospital = (): HospitalContextType => {
  const context = useContext(HospitalContext);
  if (!context) {
    throw new Error('useHospital must be used within a HospitalProvider');
  }
  return context;
};
