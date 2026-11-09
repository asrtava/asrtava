// ============================================================
// ASRTAVA - Shared Core Type Definitions
// ============================================================

export type UserType = 'super_admin' | 'hospital_admin' | 'staff' | 'patient';

export type PortalType =
  | 'super-admin'
  | 'hospital-admin'
  | 'doctor'
  | 'nursing'
  | 'reception'
  | 'laboratory'
  | 'radiology'
  | 'pharmacy'
  | 'finance'
  | 'hr'
  | 'inventory'
  | 'patient';

export type SubscriptionPlan = 'basic' | 'professional' | 'enterprise';
export type SubscriptionStatus = 'active' | 'trial' | 'suspended' | 'cancelled';

export type Gender = 'male' | 'female' | 'other';
export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

export type AppointmentStatus =
  | 'scheduled'
  | 'confirmed'
  | 'checked_in'
  | 'in_consultation'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export type BedStatus = 'available' | 'occupied' | 'reserved' | 'maintenance' | 'cleaning';
export type PaymentStatus = 'pending' | 'partial' | 'paid' | 'refunded' | 'cancelled';
export type PaymentMethod = 'cash' | 'card' | 'upi' | 'net_banking' | 'cheque' | 'insurance';

export interface UserProfile {
  id: string;
  hospitalId: string | null;
  hospitalName?: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatarUrl?: string;
  userType: UserType;
  isActive: boolean;
  assignedRoles: string[];
  authorizedPortals: PortalType[];
  activePortal: PortalType;
}

export interface PermissionItem {
  id: string;
  module: string;
  subModule?: string;
  action: 'view' | 'create' | 'edit' | 'delete' | 'approve' | 'reject' | 'export' | 'print' | 'manage';
  resource: string;
  isGranted: boolean;
  source: 'role' | 'individual';
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthResponse {
  user: UserProfile;
  tokens: AuthTokens;
  permissions: string[];
}

export interface HospitalRecord {
  id: string;
  name: string;
  code: string;
  email?: string;
  phone?: string;
  city?: string;
  state?: string;
  subscriptionPlan: SubscriptionPlan;
  subscriptionStatus: SubscriptionStatus;
  maxUsers: number;
  maxDepartments: number;
  isActive: boolean;
  createdAt: string;
}

export interface PatientRecord {
  id: string;
  hospitalId: string;
  patientNumber: string;
  firstName: string;
  lastName: string;
  dob?: string;
  gender?: Gender;
  bloodGroup?: BloodGroup;
  phone: string;
  email?: string;
  address?: string;
  city?: string;
  registrationDate: string;
  isActive: boolean;
}

export interface AppointmentRecord {
  id: string;
  hospitalId: string;
  patientId: string;
  patientName: string;
  patientNumber: string;
  doctorId: string;
  doctorName: string;
  departmentId?: string;
  departmentName?: string;
  appointmentNumber: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  reason?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

