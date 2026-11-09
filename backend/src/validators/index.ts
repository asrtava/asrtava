import { z } from 'zod';

// ============================================================
// ASRTAVA HMS - Centralized Zod Request Validators
// ============================================================

// 1. Authentication Validators
export const StaffLoginSchema = z.object({
  email: z.string().email('Invalid email address format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  targetPortal: z.string().optional(),
  mfaCode: z.string().length(6, 'MFA code must be exactly 6 digits').optional(),
});

export const SuperAdminLoginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  mfaCode: z.string().length(6, 'MFA code must be exactly 6 digits').optional(),
});

export const HospitalAdminLoginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  hospitalCode: z.string().optional(),
  mfaCode: z.string().length(6, 'MFA code must be exactly 6 digits').optional(),
});

export const PatientLoginSchema = z.object({
  phone: z.string().min(10, 'Valid phone number required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const PatientRegisterSchema = z.object({
  hospitalId: z.string().uuid('Valid hospital ID required'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().min(10, 'Valid phone number required'),
  email: z.string().email().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const MfaVerifySchema = z.object({
  code: z.string().length(6, 'MFA TOTP code must be 6 digits'),
});

export const MfaDisableSchema = z.object({
  password: z.string().min(6, 'Current password is required to disable MFA'),
  code: z.string().length(6, 'MFA code is required to confirm disable'),
});

export const MfaRecoverySchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  recoveryCode: z.string().min(8, '8-character recovery code required'),
});

export const ForgotPasswordSchema = z.object({
  email: z.string().email('Valid email address required'),
});

export const ResetPasswordSchema = z.object({
  token: z.string().min(16, 'Valid reset token required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(6, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

export const SwitchWorkspaceSchema = z.object({
  hospitalId: z.string().uuid('Valid hospital ID required'),
  targetPortal: z.string().min(2, 'Target portal identifier required'),
});

export const RegisterDeviceSchema = z.object({
  deviceId: z.string().min(1, 'Device unique ID is required'),
  deviceType: z.enum(['android', 'ios', 'web']),
  fcmPushToken: z.string().optional(),
  appVersion: z.string().optional(),
  isBiometricEnabled: z.boolean().default(false),
});

export const InviteUserSchema = z.object({
  hospitalId: z.string().uuid('Hospital ID is required'),
  email: z.string().email('Valid email required'),
  phone: z.string().optional(),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  roleIds: z.array(z.string().uuid()).min(1, 'At least one role ID must be assigned'),
});

export const ActivateAccountSchema = z.object({
  token: z.string().min(16, 'Activation token required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

// 2. Hospital & Department Validators
export const HospitalOnboardSchema = z.object({
  name: z.string().min(2, 'Hospital name is required'),
  code: z.string().min(2, 'Unique tenant code is required'),
  legalName: z.string().optional(),
  licenseNumber: z.string().optional(),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  subscriptionPlan: z.enum(['basic', 'professional', 'enterprise']).default('basic'),
});

export const DepartmentCreateSchema = z.object({
  name: z.string().min(2, 'Department name is required'),
  code: z.string().optional(),
  departmentType: z.enum(['clinical', 'diagnostic', 'administrative', 'support', 'pharmacy', 'emergency']).default('clinical'),
  description: z.string().optional(),
  displayOrder: z.number().int().default(0),
});

// 3. Patient & EMR Validators
export const PatientCreateSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  bloodGroup: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).optional(),
  phone: z.string().min(10, 'Primary phone number is required'),
  email: z.string().email().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
});

export const PatientAllergySchema = z.object({
  allergenType: z.enum(['drug', 'food', 'environmental', 'latex', 'other']),
  allergenName: z.string().min(1, 'Allergen name is required'),
  severity: z.enum(['mild', 'moderate', 'severe', 'life_threatening']).default('moderate'),
  reactionDescription: z.string().optional(),
  diagnosedDate: z.string().optional(),
});

// 4. Appointment & Scheduling Validators
export const AppointmentCreateSchema = z.object({
  patientId: z.string().uuid('Valid patient ID required'),
  doctorId: z.string().uuid('Valid doctor ID required'),
  departmentId: z.string().uuid().optional(),
  appointmentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  startTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Time must be HH:MM:SS'),
  endTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Time must be HH:MM:SS'),
  appointmentType: z.enum(['new', 'follow_up', 'walk_in', 'emergency', 'teleconsultation']).default('new'),
  reason: z.string().optional(),
});

// 5. Clinical Encounter & Prescription Validators
export const ConsultationCreateSchema = z.object({
  appointmentId: z.string().uuid().optional(),
  patientId: z.string().uuid('Patient ID is required'),
  doctorId: z.string().uuid('Doctor ID is required'),
  chiefComplaint: z.string().optional(),
  historyOfPresentIllness: z.string().optional(),
  examinationFindings: z.string().optional(),
  clinicalNotes: z.string().optional(),
  managementPlan: z.string().optional(),
  followUpDate: z.string().optional(),
  followUpInstructions: z.string().optional(),
  vitals: z.object({
    systolicBp: z.number().int().optional(),
    diastolicBp: z.number().int().optional(),
    pulse: z.number().int().optional(),
    temperature: z.number().optional(),
    respiratoryRate: z.number().int().optional(),
    spo2: z.number().optional(),
    weight: z.number().optional(),
    height: z.number().optional(),
    bloodSugar: z.number().optional(),
  }).optional(),
  diagnoses: z.array(z.object({
    diagnosisName: z.string().min(1),
    icd10Code: z.string().optional(),
    diagnosisType: z.enum(['provisional', 'confirmed', 'differential', 'secondary']).default('provisional'),
  })).optional(),
  prescriptions: z.array(z.object({
    medicineName: z.string().min(1),
    dosage: z.string().min(1),
    frequency: z.string().min(1),
    duration: z.string().min(1),
    route: z.enum(['oral', 'iv', 'im', 'subcutaneous', 'topical', 'inhalation', 'drops', 'rectal', 'other']).default('oral'),
    instructions: z.string().optional(),
    quantity: z.number().int().positive().default(1),
  })).optional(),
});

// 6. Inpatient & Bed Allocation Validators
export const AdmissionCreateSchema = z.object({
  patientId: z.string().uuid('Patient ID required'),
  admittingDoctorId: z.string().uuid('Admitting Doctor ID required'),
  departmentId: z.string().uuid().optional(),
  admissionType: z.enum(['emergency', 'planned', 'referral', 'day_care']).default('emergency'),
  initialDiagnosis: z.string().optional(),
  bedId: z.string().uuid().optional(), // Direct bed allocation at intake
});

export const BedAllocateSchema = z.object({
  admissionId: z.string().uuid('Admission ID required'),
  bedId: z.string().uuid('Bed ID required'),
  transferReason: z.string().optional(),
});

// 7. Pharmacy & Stock Validators
export const MedicineCreateSchema = z.object({
  categoryId: z.string().uuid().optional(),
  name: z.string().min(1, 'Medicine name required'),
  genericName: z.string().optional(),
  brandName: z.string().optional(),
  dosageForm: z.enum(['tablet', 'capsule', 'syrup', 'injection', 'ointment', 'drops', 'inhaler', 'powder', 'iv_fluid', 'other']).default('tablet'),
  strength: z.string().optional(),
  requiresPrescription: z.boolean().default(true),
  reorderLevel: z.number().int().default(50),
});

export const BatchCreateSchema = z.object({
  medicineId: z.string().uuid('Medicine ID required'),
  supplierId: z.string().uuid().optional(),
  batchNumber: z.string().min(1, 'Batch number required'),
  expiryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expiry date must be YYYY-MM-DD'),
  purchaseCostPerUnit: z.number().nonnegative(),
  sellingPricePerUnit: z.number().nonnegative(),
  mrp: z.number().nonnegative(),
  initialQuantity: z.number().int().positive(),
  storageBinLocation: z.string().optional(),
});

export const DispenseCreateSchema = z.object({
  prescriptionId: z.string().uuid().optional(),
  patientId: z.string().uuid().optional(),
  items: z.array(z.object({
    batchId: z.string().uuid('Batch ID required'),
    quantity: z.number().int().positive(),
  })).min(1, 'At least one item required for dispensing'),
});

// 8. Billing & Payments Validators
export const InvoiceCreateSchema = z.object({
  patientId: z.string().uuid('Patient ID required'),
  admissionId: z.string().uuid().optional(),
  billingCategory: z.enum(['opd', 'ipd', 'pharmacy', 'diagnostic', 'emergency', 'package']).default('opd'),
  items: z.array(z.object({
    serviceType: z.enum(['consultation', 'procedure', 'bed_charge', 'medicine', 'lab_test', 'radiology', 'nursing', 'equipment', 'other']),
    serviceDescription: z.string().min(1),
    serviceReferenceId: z.string().uuid().optional(),
    quantity: z.number().positive().default(1),
    unitRate: z.number().nonnegative(),
    taxRate: z.number().nonnegative().default(0),
  })).min(1, 'At least one invoice item is required'),
});

export const PaymentCreateSchema = z.object({
  invoiceId: z.string().uuid('Invoice ID required'),
  amountPaid: z.number().positive('Payment amount must be greater than zero'),
  paymentMethod: z.enum(['cash', 'upi', 'card', 'net_banking', 'cheque', 'tpa_insurance', 'wallet', 'other']),
  transactionReferenceId: z.string().optional(),
  idempotencyKey: z.string().min(6, 'Idempotency key required to prevent double-charging'),
  notes: z.string().optional(),
});

export const RefundRequestSchema = z.object({
  paymentId: z.string().uuid('Payment ID required'),
  invoiceId: z.string().uuid('Invoice ID required'),
  refundAmount: z.number().positive(),
  reasonCategory: z.enum(['overpayment', 'cancelled_service', 'billing_error', 'patient_discharge_adjustment']),
  justification: z.string().min(5, 'Justification is required for audit'),
});
