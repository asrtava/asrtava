import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('asrtava_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor with automated refresh token rotation
let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: any) => void }> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && error.response?.data?.code === 'TOKEN_EXPIRED' && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const storedRefreshToken = localStorage.getItem('asrtava_refresh_token');
      if (!storedRefreshToken) {
        localStorage.removeItem('asrtava_token');
        localStorage.removeItem('asrtava_user');
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken: storedRefreshToken,
        });

        const newAccessToken = data.data.accessToken;
        const newRefreshToken = data.data.refreshToken;

        localStorage.setItem('asrtava_token', newAccessToken);
        localStorage.setItem('asrtava_refresh_token', newRefreshToken);

        apiClient.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
        processQueue(null, newAccessToken);
        isRefreshing = false;

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return apiClient(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        isRefreshing = false;
        localStorage.removeItem('asrtava_token');
        localStorage.removeItem('asrtava_refresh_token');
        localStorage.removeItem('asrtava_user');
        return Promise.reject(refreshErr);
      }
    }

    return Promise.reject(error);
  }
);

// ============================================================
// Authentication & Identity
// ============================================================
export const authApi = {
  superAdminLogin: (data: { email: string; password: string; mfaCode?: string }) =>
    apiClient.post('/auth/super-admin/login', data),
  hospitalAdminLogin: (data: { email: string; password: string; hospitalCode?: string; mfaCode?: string }) =>
    apiClient.post('/auth/hospital/login', data),
  hospitalLogin: (data: { email: string; password: string; hospitalCode?: string; mfaCode?: string }) =>
    apiClient.post('/auth/hospital/login', data),
  staffLogin: (data: { email: string; password: string; targetPortal?: string; mfaCode?: string }) =>
    apiClient.post('/auth/staff-login', data),
  patientLogin: (data: { phone: string; password: string }) =>
    apiClient.post('/auth/patient-login', data),
  patientRegister: (data: any) =>
    apiClient.post('/auth/patient-register', data),
  switchWorkspace: (data: { hospitalId: string; targetPortal: string }) =>
    apiClient.post('/auth/switch-workspace', data),
  getEffectivePermissions: () =>
    apiClient.get('/auth/effective-permissions'),
  getMe: () =>
    apiClient.get('/auth/me'),
  logout: () =>
    apiClient.post('/auth/logout'),
  logoutAll: () =>
    apiClient.post('/auth/logout-all'),
  enrollMfa: () =>
    apiClient.post('/auth/mfa/enroll'),
  verifyMfa: (code: string) =>
    apiClient.post('/auth/mfa/verify', { code }),
  disableMfa: (data: { password: string; code: string }) =>
    apiClient.post('/auth/mfa/disable', data),
};

// ============================================================
// Hospital Governance & Master Configuration
// ============================================================
export const hospitalAdminApi = {
  getProfile: () => apiClient.get('/hospitals/profile'),
  updateSettings: (data: any) => apiClient.put('/hospitals/settings', data),
  getBranches: () => apiClient.get('/hospitals/branches'),
  createBranch: (data: any) => apiClient.post('/hospitals/branches', data),
  getDepartments: () => apiClient.get('/hospitals/departments'),
  createDepartment: (data: any) => apiClient.post('/hospitals/departments', data),
  getWards: () => apiClient.get('/hospitals/wards'),
  createWard: (data: any) => apiClient.post('/hospitals/wards', data),
  createRoom: (data: any) => apiClient.post('/hospitals/rooms', data),
  createBed: (data: any) => apiClient.post('/hospitals/beds', data),
  getBeds: () => apiClient.get('/hospitals/beds'),
  getStaff: () => apiClient.get('/hospitals/staff'),
  onboardStaff: (data: any) => apiClient.post('/hospitals/staff', data),
  updateStaffStatus: (id: string, data: { status?: string; isActive?: boolean }) =>
    apiClient.patch(`/hospitals/staff/${id}/status`, data),
  resetStaffAccess: (id: string, data?: { temporaryPassword?: string }) =>
    apiClient.post(`/hospitals/staff/${id}/reset-access`, data || {}),
  revokeStaffSessions: (id: string) =>
    apiClient.post(`/hospitals/staff/${id}/revoke-sessions`),
  updateStaffRoles: (id: string, roles: string[]) =>
    apiClient.put(`/hospitals/staff/${id}/roles`, { roles }),
  getDoctors: (departmentId?: string) => apiClient.get('/hospitals/doctors', { params: { departmentId } }),
  getAdminMetrics: () => apiClient.get('/hospitals/admin-metrics'),
  updateDepartment: (id: string, data: any) => apiClient.put(`/hospitals/departments/${id}`, data),
  createDoctor: (data: any) => apiClient.post('/hospitals/doctors', data),
  updateDoctor: (id: string, data: any) => apiClient.put(`/hospitals/doctors/${id}`, data),
  updateBedStatus: (id: string, status: string) => apiClient.patch(`/hospitals/beds/${id}/status`, { status }),
  getBillingCatalog: () => apiClient.get('/hospitals/billing-catalog'),
  createBillingItem: (data: any) => apiClient.post('/hospitals/billing-catalog', data),
  getNotificationSettings: () => apiClient.get('/hospitals/notification-settings'),
  updateNotificationSettings: (data: any) => apiClient.put('/hospitals/notification-settings', data),
  getRoles: () => apiClient.get('/permissions/roles'),
  createRole: (data: any) => apiClient.post('/permissions/roles', data),
  savePermissionOverride: (data: any) => apiClient.post('/permissions/user-overrides', data),
  getAuditLogs: (params?: any) => apiClient.get('/hospitals/audit-logs', { params }),
};

// ============================================================
// Patient Management & EMR
// ============================================================
export const patientApi = {
  getPatients: (params?: any) => apiClient.get('/patients', { params }),
  registerPatient: (data: any) => apiClient.post('/patients', data),
  get360Profile: (id: string) => apiClient.get(`/patients/${id}/360-profile`),
  detectDuplicates: (data: any) => apiClient.post('/patients/detect-duplicates', data),
  mergePatients: (data: { sourcePatientId: string; targetPatientId: string; mergeReason: string }) =>
    apiClient.post('/patients/merge', data),
  recordAllergy: (patientId: string, data: any) =>
    apiClient.post(`/patients/${patientId}/allergies`, data),
};

// ============================================================
// Appointments & OPD Scheduling Engine
// ============================================================
export const appointmentApi = {
  getAppointments: (params?: any) => apiClient.get('/appointments', { params }),
  scheduleAppointment: (data: any) => apiClient.post('/appointments', data),
  updateStatus: (id: string, status: string, cancellationReason?: string) =>
    apiClient.patch(`/appointments/${id}/status`, { status, cancellationReason }),
  reschedule: (id: string, data: any) =>
    apiClient.post(`/appointments/${id}/reschedule`, data),
};

// ============================================================
// Clinical Consultations & E-Prescriptions
// ============================================================
export const clinicalApi = {
  createConsultation: (data: any) => apiClient.post('/clinical/consultations', data),
  amendConsultation: (id: string, data: { amendmentReason: string; amendedClinicalNotes: string }) =>
    apiClient.post(`/clinical/consultations/${id}/amend`, data),
  getPatientPrescriptions: (patientId: string) =>
    apiClient.get(`/clinical/patients/${patientId}/prescriptions`),
};

// ============================================================
// Inpatient (IPD) & Bed Management
// ============================================================
export const inpatientApi = {
  getBeds: () => apiClient.get('/inpatient/beds'),
  admitPatient: (data: any) => apiClient.post('/inpatient/admissions', data),
  transferBed: (data: { admissionId: string; bedId: string; transferReason: string }) =>
    apiClient.post('/inpatient/bed-transfers', data),
  logDailyRound: (admissionId: string, data: any) =>
    apiClient.post(`/inpatient/admissions/${admissionId}/rounds`, data),
  dischargePatient: (admissionId: string, data: any) =>
    apiClient.post(`/inpatient/admissions/${admissionId}/discharge`, data),
};

// ============================================================
// Inpatient Nursing Workflows
// ============================================================
export const nursingApi = {
  getStationOverview: (wardId?: string) =>
    apiClient.get('/nursing/station-overview', { params: { wardId } }),
  administerMedication: (data: any) =>
    apiClient.post('/nursing/medications/administer', data),
  logIntakeOutput: (data: any) =>
    apiClient.post('/nursing/intake-output', data),
  submitShiftHandover: (data: any) =>
    apiClient.post('/nursing/shift-handovers', data),
  createCarePlan: (data: any) =>
    apiClient.post('/nursing/care-plans', data),
};

// ============================================================
// Pharmacy & Dispensary
// ============================================================
export const pharmacyApi = {
  getMedicines: (params?: any) => apiClient.get('/pharmacy/medicines', { params }),
  createMedicine: (data: any) => apiClient.post('/pharmacy/medicines', data),
  receiveBatch: (data: any) => apiClient.post('/pharmacy/batches', data),
  dispense: (data: any) => apiClient.post('/pharmacy/dispense', data),
};

// ============================================================
// Laboratory & Radiology Diagnostics
// ============================================================
export const diagnosticsApi = {
  getLabCatalog: () => apiClient.get('/diagnostics/lab/catalog'),
  orderLabTests: (data: any) => apiClient.post('/diagnostics/lab/orders', data),
  enterLabResult: (itemId: string, data: any) =>
    apiClient.post(`/diagnostics/lab/order-items/${itemId}/result`, data),
  getRadiologyOrders: () => apiClient.get('/diagnostics/radiology/orders'),
  orderRadiology: (data: any) => apiClient.post('/diagnostics/radiology/orders', data),
  recordRadiologyReport: (data: any) => apiClient.post('/diagnostics/radiology/reports', data),
};

// ============================================================
// Billing, Invoicing & Payments
// ============================================================
export const billingApi = {
  createInvoice: (data: any) => apiClient.post('/billing/invoices', data),
  collectPayment: (data: any) => apiClient.post('/billing/payments', data),
  requestRefund: (data: any) => apiClient.post('/billing/refunds', data),
};

// ============================================================
// Operation Theatre (OT)
// ============================================================
export const otApi = {
  getTheatres: () => apiClient.get('/ot/theatres'),
  createTheatre: (data: any) => apiClient.post('/ot/theatres', data),
  scheduleProcedure: (data: any) => apiClient.post('/ot/schedules', data),
  finalizeOperativeNotes: (id: string, data: any) =>
    apiClient.patch(`/ot/schedules/${id}/operative-notes`, data),
};

// ============================================================
// Emergency Department (ED)
// ============================================================
export const emergencyApi = {
  getQueue: () => apiClient.get('/emergency/queue'),
  triagePatient: (data: any) => apiClient.post('/emergency/triage', data),
  updateDisposition: (id: string, data: any) =>
    apiClient.patch(`/emergency/${id}/disposition`, data),
};

// ============================================================
// Notifications & Alerts
// ============================================================
export const notificationsApi = {
  getMyNotifications: () => apiClient.get('/notifications/my-notifications'),
  markAsRead: (id: string) => apiClient.patch(`/notifications/${id}/read`),
  dispatchNotification: (data: any) => apiClient.post('/notifications/dispatch', data),
};

// ============================================================
// Hospital Reports & Analytics
// ============================================================
export const reportsApi = {
  getExecutiveOverview: (params?: any) =>
    apiClient.get('/reports/executive-overview', { params }),
};

// ============================================================
// SaaS Platform & Multi-Tenant Administration
// ============================================================
export const saasApi = {
  // Public Hospital Registration & Onboarding
  registerHospital: (data: any) => apiClient.post('/saas/public/register-hospital', data),
  getPublicPlans: () => apiClient.get('/saas/public/plans'),
  getOnboardingProgress: (token: string) => apiClient.get(`/saas/public/onboarding/${token}`),
  saveOnboardingStep: (token: string, stepNumber: number, stepData: any) =>
    apiClient.post(`/saas/public/onboarding/${token}/step`, { stepNumber, stepData }),
  completeOnboarding: (token: string) => apiClient.post(`/saas/public/onboarding/${token}/complete`),

  // Super Admin SaaS Console
  getSuperAdminDashboard: () => apiClient.get('/saas/super-admin/dashboard'),
  getTenants: (params?: { status?: string; plan?: string; search?: string }) =>
    apiClient.get('/saas/super-admin/tenants', { params }),
  getTenantDetails: (id: string) => apiClient.get(`/saas/super-admin/tenants/${id}`),
  updateTenantStatus: (id: string, status: string, reason: string) =>
    apiClient.put(`/saas/super-admin/tenants/${id}/status`, { status, reason }),
  getSuperAdminPlans: () => apiClient.get('/saas/super-admin/plans'),
  getSuperAdminInvoices: () => apiClient.get('/saas/super-admin/invoices'),
  requestJitAccess: (data: { hospitalId: string; ticketId: string; justification: string; durationMinutes: number; scope: string }) =>
    apiClient.post('/saas/super-admin/jit-access/request', data),
  getJitRequests: () => apiClient.get('/saas/super-admin/jit-access/requests'),
  createAnnouncement: (data: any) => apiClient.post('/saas/super-admin/announcements', data),
  getAnnouncements: () => apiClient.get('/saas/super-admin/announcements'),

  // Hospital Admin SaaS Subscription & Billing
  getTenantSubscription: () => apiClient.get('/saas/tenant/subscription'),
  getTenantUsage: () => apiClient.get('/saas/tenant/usage'),
  getTenantInvoices: () => apiClient.get('/saas/tenant/invoices'),
  approveJitAccess: (requestId: string) => apiClient.post(`/saas/tenant/jit-access/${requestId}/approve`),
  requestDataExport: (data?: { format?: string; scope?: string }) => apiClient.post('/saas/tenant/data-export', data),
};
