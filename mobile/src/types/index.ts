// ============================================
// ASRTAVA - Core TypeScript Types
// ============================================

// ---- Auth Types ----
export interface User {
  id: string;
  hospitalId: string | null;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  avatarUrl: string | null;
  userType: UserType;
  isActive: boolean;
  isEmailVerified: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type UserType = 'super_admin' | 'hospital_admin' | 'staff';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hospital: Hospital | null;
}

// ---- Hospital Types ----
export interface Hospital {
  id: string;
  name: string;
  code: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string;
  pincode: string | null;
  logoUrl: string | null;
  website: string | null;
  licenseNumber: string | null;
  establishedDate: string | null;
  subscriptionPlan: string;
  subscriptionStatus: SubscriptionStatus;
  maxUsers: number;
  maxDepartments: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type SubscriptionStatus = 'active' | 'suspended' | 'cancelled' | 'trial';

export interface HospitalSettings {
  id: string;
  hospitalId: string;
  currency: string;
  timezone: string;
  dateFormat: string;
  appointmentSlotDuration: number;
  workingHoursStart: string;
  workingHoursEnd: string;
  enableWhatsapp: boolean;
  enableSms: boolean;
  taxEnabled: boolean;
  defaultTaxRate: number;
  invoicePrefix: string;
  patientIdPrefix: string;
}

// ---- Department Types ----
export interface Department {
  id: string;
  hospitalId: string;
  name: string;
  code: string | null;
  description: string | null;
  headDoctorId: string | null;
  isActive: boolean;
  displayOrder: number;
}

// ---- Role & Permission Types ----
export interface Role {
  id: string;
  hospitalId: string | null;
  name: string;
  code: string;
  description: string | null;
  isSystemRole: boolean;
  isActive: boolean;
}

export interface Permission {
  id: string;
  module: string;
  subModule: string | null;
  action: PermissionAction;
  resource: string;
  description: string | null;
}

export type PermissionAction =
  | 'view'
  | 'create'
  | 'edit'
  | 'delete'
  | 'approve'
  | 'export'
  | 'print'
  | 'manage'
  | 'configure';

export interface UserPermission {
  id: string;
  userId: string;
  hospitalId: string;
  permissionId: string;
  isGranted: boolean;
  grantedBy: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
  reason: string | null;
  expiresAt: string | null;
  permission?: Permission;
}

export interface EffectivePermission {
  permissionId: string;
  module: string;
  subModule: string | null;
  action: PermissionAction;
  resource: string;
  isGranted: boolean;
  source: 'role' | 'individual';
}

// ---- Patient Types ----
export interface Patient {
  id: string;
  hospitalId: string;
  patientNumber: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string | null;
  gender: Gender | null;
  bloodGroup: BloodGroup | null;
  email: string | null;
  phone: string;
  alternatePhone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  nationality: string;
  maritalStatus: string | null;
  occupation: string | null;
  avatarUrl: string | null;
  registrationDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type Gender = 'male' | 'female' | 'other';
export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

export interface PatientMedicalHistory {
  id: string;
  patientId: string;
  conditionType: 'allergy' | 'chronic' | 'surgical' | 'family' | 'social';
  conditionName: string;
  description: string | null;
  severity: string | null;
  diagnosedDate: string | null;
  isCurrent: boolean;
  notes: string | null;
}

export interface PatientEmergencyContact {
  id: string;
  patientId: string;
  name: string;
  relationship: string | null;
  phone: string;
  alternatePhone: string | null;
  address: string | null;
  isPrimary: boolean;
}

// ---- Doctor Types ----
export interface Doctor {
  id: string;
  userId: string;
  hospitalId: string;
  departmentId: string | null;
  employeeNumber: string | null;
  specialization: string | null;
  qualification: string | null;
  experienceYears: number | null;
  licenseNumber: string | null;
  consultationFee: number | null;
  followUpFee: number | null;
  bio: string | null;
  isAvailable: boolean;
  user?: User;
  department?: Department;
}

export interface DoctorSchedule {
  id: string;
  doctorId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDuration: number;
  maxPatients: number | null;
  isActive: boolean;
}

// ---- Appointment Types ----
export interface Appointment {
  id: string;
  hospitalId: string;
  patientId: string;
  doctorId: string;
  departmentId: string | null;
  appointmentNumber: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  appointmentType: AppointmentType;
  status: AppointmentStatus;
  reason: string | null;
  notes: string | null;
  cancellationReason: string | null;
  patient?: Patient;
  doctor?: Doctor;
  department?: Department;
}

export type AppointmentType =
  | 'new'
  | 'follow_up'
  | 'walk_in'
  | 'emergency'
  | 'teleconsultation';

export type AppointmentStatus =
  | 'scheduled'
  | 'confirmed'
  | 'checked_in'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show'
  | 'rescheduled';

// ---- Consultation (OPD) Types ----
export interface Consultation {
  id: string;
  hospitalId: string;
  appointmentId: string | null;
  patientId: string;
  doctorId: string;
  consultationNumber: string;
  consultationDate: string;
  chiefComplaint: string | null;
  historyOfPresentIllness: string | null;
  examinationFindings: string | null;
  clinicalNotes: string | null;
  advice: string | null;
  followUpDate: string | null;
  followUpInstructions: string | null;
  status: 'in_progress' | 'completed' | 'referred';
  patient?: Patient;
  doctor?: Doctor;
}

export interface ConsultationVitals {
  id: string;
  consultationId: string;
  temperature: number | null;
  pulse: number | null;
  bloodPressureSystolic: number | null;
  bloodPressureDiastolic: number | null;
  respiratoryRate: number | null;
  oxygenSaturation: number | null;
  weight: number | null;
  height: number | null;
  bmi: number | null;
  bloodSugar: number | null;
  notes: string | null;
  recordedAt: string;
}

// ---- Admission (IPD) Types ----
export interface Admission {
  id: string;
  hospitalId: string;
  patientId: string;
  doctorId: string;
  departmentId: string | null;
  admissionNumber: string;
  admissionDate: string;
  expectedDischargeDate: string | null;
  actualDischargeDate: string | null;
  admissionType: 'emergency' | 'planned' | 'transfer' | 'referral';
  admissionReason: string | null;
  diagnosis: string | null;
  status: AdmissionStatus;
  dischargeSummary: string | null;
  patient?: Patient;
  doctor?: Doctor;
}

export type AdmissionStatus =
  | 'admitted'
  | 'under_treatment'
  | 'ready_for_discharge'
  | 'discharged'
  | 'transferred'
  | 'absconded';

// ---- Ward & Bed Types ----
export interface Ward {
  id: string;
  hospitalId: string;
  name: string;
  code: string | null;
  wardType: WardType;
  floor: string | null;
  totalBeds: number;
  description: string | null;
  isActive: boolean;
}

export type WardType =
  | 'general'
  | 'semi_private'
  | 'private'
  | 'icu'
  | 'nicu'
  | 'picu'
  | 'isolation'
  | 'emergency'
  | 'maternity';

export interface Room {
  id: string;
  wardId: string;
  hospitalId: string;
  roomNumber: string;
  roomType: 'single' | 'double' | 'multi' | 'suite' | 'icu';
  totalBeds: number;
  hasAc: boolean;
  hasBathroom: boolean;
  dailyRate: number | null;
  isActive: boolean;
}

export interface Bed {
  id: string;
  roomId: string;
  wardId: string;
  hospitalId: string;
  bedNumber: string;
  bedType: string;
  status: BedStatus;
  isActive: boolean;
}

export type BedStatus = 'available' | 'occupied' | 'reserved' | 'maintenance' | 'cleaning';

// ---- Pharmacy Types ----
export interface Medicine {
  id: string;
  hospitalId: string;
  categoryId: string | null;
  name: string;
  genericName: string | null;
  brand: string | null;
  manufacturer: string | null;
  composition: string | null;
  medicineType: string;
  strength: string | null;
  unit: string | null;
  requiresPrescription: boolean;
  isActive: boolean;
  category?: MedicineCategory;
}

export interface MedicineCategory {
  id: string;
  hospitalId: string;
  name: string;
  description: string | null;
  isActive: boolean;
}

export interface PharmacyBatch {
  id: string;
  medicineId: string;
  hospitalId: string;
  batchNumber: string;
  manufacturingDate: string | null;
  expiryDate: string;
  purchasePrice: number;
  sellingPrice: number;
  mrp: number | null;
  quantityReceived: number;
  quantityAvailable: number;
  isActive: boolean;
}

// ---- Billing Types ----
export interface Invoice {
  id: string;
  hospitalId: string;
  patientId: string;
  admissionId: string | null;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string | null;
  invoiceType: InvoiceType;
  subtotal: number;
  discountAmount: number;
  discountPercentage: number | null;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number | null;
  paymentStatus: PaymentStatus;
  notes: string | null;
  patient?: Patient;
  items?: InvoiceItem[];
}

export type InvoiceType = 'opd' | 'ipd' | 'pharmacy' | 'lab' | 'radiology' | 'general';
export type PaymentStatus = 'pending' | 'partial' | 'paid' | 'overdue' | 'cancelled' | 'refunded';

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  itemType: string;
  itemDescription: string;
  referenceId: string | null;
  quantity: number;
  unitPrice: number;
  discount: number;
  taxRate: number;
  taxAmount: number;
  total: number;
}

export interface Payment {
  id: string;
  hospitalId: string;
  invoiceId: string;
  patientId: string;
  paymentNumber: string;
  paymentDate: string;
  amount: number;
  paymentMethod: PaymentMethod;
  transactionReference: string | null;
  notes: string | null;
}

export type PaymentMethod =
  | 'cash'
  | 'card'
  | 'upi'
  | 'net_banking'
  | 'cheque'
  | 'insurance'
  | 'wallet'
  | 'other';

// ---- Notification Types ----
export interface Notification {
  id: string;
  hospitalId: string;
  userId: string | null;
  notificationType: string;
  title: string;
  message: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  isRead: boolean;
  readAt: string | null;
  actionUrl: string | null;
  createdAt: string;
}

// ---- API Response Types ----
export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ApiError {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
  statusCode: number;
}

// ---- Dashboard Types ----
export interface DashboardStats {
  totalPatients: number;
  todayAppointments: number;
  availableDoctors: number;
  totalDoctors: number;
  currentAdmissions: number;
  availableBeds: number;
  occupiedBeds: number;
  pharmacyAlerts: number;
  pendingBills: number;
  todayRevenue: number;
  monthlyRevenue: number;
}

export interface DashboardActivity {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  userId: string;
  userName: string;
}

// ---- Navigation Types ----
export type RootStackParamList = {
  Splash: undefined;
  Auth: undefined;
  SuperAdmin: undefined;
  HospitalAdmin: undefined;
  Staff: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  ForgotPassword: undefined;
  ResetPassword: { token: string };
};

export type SuperAdminTabParamList = {
  Dashboard: undefined;
  Hospitals: undefined;
  Users: undefined;
  Settings: undefined;
};

export type HospitalAdminDrawerParamList = {
  Dashboard: undefined;
  Patients: undefined;
  Appointments: undefined;
  Doctors: undefined;
  Staff: undefined;
  OPD: undefined;
  IPD: undefined;
  BedManagement: undefined;
  Pharmacy: undefined;
  Laboratory: undefined;
  Radiology: undefined;
  Billing: undefined;
  Inventory: undefined;
  Documents: undefined;
  Reports: undefined;
  Notifications: undefined;
  Settings: undefined;
  AuditLogs: undefined;
};

export type StaffDrawerParamList = {
  Dashboard: undefined;
  Patients: undefined;
  Appointments: undefined;
  OPD: undefined;
  IPD: undefined;
  Pharmacy: undefined;
  Laboratory: undefined;
  Billing: undefined;
  Notifications: undefined;
  Profile: undefined;
};

