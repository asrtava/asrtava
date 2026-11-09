// ============================================
// ASRTAVA - API Configuration & Constants
// ============================================

export const API_CONFIG = {
  BASE_URL: __DEV__ ? 'http://10.0.2.2:3000/api/v1' : 'https://api.asrtava.com/api/v1',
  TIMEOUT: 30000,
  RETRY_COUNT: 3,
  RETRY_DELAY: 1000,
};

export const STORAGE_KEYS = {
  ACCESS_TOKEN: '@asrtava/access_token',
  REFRESH_TOKEN: '@asrtava/refresh_token',
  USER_DATA: '@asrtava/user_data',
  HOSPITAL_DATA: '@asrtava/hospital_data',
  THEME_MODE: '@asrtava/theme_mode',
  ONBOARDING_DONE: '@asrtava/onboarding_done',
};

export const APPOINTMENT_TYPES = [
  { label: 'New Visit', value: 'new' },
  { label: 'Follow Up', value: 'follow_up' },
  { label: 'Walk In', value: 'walk_in' },
  { label: 'Emergency', value: 'emergency' },
  { label: 'Teleconsultation', value: 'teleconsultation' },
] as const;

export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const;

export const GENDER_OPTIONS = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
  { label: 'Other', value: 'other' },
] as const;

export const PAYMENT_METHODS = [
  { label: 'Cash', value: 'cash' },
  { label: 'Card', value: 'card' },
  { label: 'UPI', value: 'upi' },
  { label: 'Net Banking', value: 'net_banking' },
  { label: 'Cheque', value: 'cheque' },
  { label: 'Insurance', value: 'insurance' },
  { label: 'Other', value: 'other' },
] as const;

export const WARD_TYPES = [
  { label: 'General', value: 'general' },
  { label: 'Semi Private', value: 'semi_private' },
  { label: 'Private', value: 'private' },
  { label: 'ICU', value: 'icu' },
  { label: 'NICU', value: 'nicu' },
  { label: 'PICU', value: 'picu' },
  { label: 'Isolation', value: 'isolation' },
  { label: 'Emergency', value: 'emergency' },
  { label: 'Maternity', value: 'maternity' },
] as const;

export const DAYS_OF_WEEK = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
] as const;

