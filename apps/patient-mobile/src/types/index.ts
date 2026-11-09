export interface HospitalSummary {
  id: string;
  name: string;
  code: string;
  city: string;
  phone?: string;
  address?: string;
  logoUrl?: string;
  isPrimary?: boolean;
}

export interface PatientProfile {
  id: string;
  uhid: string;
  name: string;
  age: number;
  gender: 'M' | 'F' | 'O';
  dob?: string;
  phone: string;
  email: string;
  bloodGroup: string;
  allergies: string[];
  chronicConditions?: string[];
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
}

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  department: string;
  qualification: string;
  experienceYears: number;
  consultationFee: number;
  hospitalName: string;
  availableDays: string[];
  nextSlot?: string;
}

export interface Appointment {
  id: string;
  tokenNumber: string;
  doctorName: string;
  specialty: string;
  hospitalName: string;
  hospitalId: string;
  date: string;
  time: string;
  type: 'In-Person' | 'Video Consultation';
  status: 'Confirmed' | 'Checked In' | 'In Consultation' | 'Completed' | 'Cancelled';
  queueEstimate?: string;
  checkInQrCode?: string;
}

export interface PrescriptionMedicine {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
  remainingDays?: string;
}

export interface Prescription {
  id: string;
  date: string;
  doctorName: string;
  hospitalName: string;
  diagnosis: string;
  medicines: PrescriptionMedicine[];
  followUpDate?: string;
}

export interface LabParameter {
  name: string;
  result: string;
  unit: string;
  referenceRange: string;
  isAbnormal: boolean;
}

export interface LabReport {
  id: string;
  testName: string;
  category: string;
  date: string;
  doctorName: string;
  hospitalName: string;
  status: 'Ready' | 'Processing' | 'Sample Collected';
  parameters: LabParameter[];
}

export interface RadiologyStudy {
  id: string;
  orderTitle: string;
  modality: 'X-Ray' | 'CT Scan' | 'MRI' | 'Ultrasound';
  date: string;
  radiologistName: string;
  hospitalName: string;
  status: 'Finalized' | 'Preliminary';
  findings: string;
  impression: string;
}

export interface PatientInvoice {
  id: string;
  invoiceNumber: string;
  date: string;
  category: string;
  hospitalName: string;
  totalAmount: number;
  paymentStatus: 'Paid' | 'Unpaid' | 'Partially Paid';
  paymentMethod?: string;
}

export interface AdmissionInfo {
  id: string;
  hospitalName: string;
  admissionDate: string;
  wardName: string;
  roomBedNumber: string;
  attendingDoctor: string;
  admissionDiagnosis: string;
  status: 'Admitted' | 'Discharge In Progress' | 'Discharged';
  dischargeSummary?: string;
}

export interface PatientNotification {
  id: string;
  title: string;
  message: string;
  date: string;
  type: 'appointment' | 'prescription' | 'lab' | 'billing' | 'system';
  isRead: boolean;
}

export interface FamilyMember {
  id: string;
  name: string;
  relationship: 'Spouse' | 'Child' | 'Parent' | 'Sibling';
  uhid: string;
  age: number;
  gender: string;
}

