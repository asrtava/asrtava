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
    } else if (error.response?.status === 401) {
      // Clear invalid credentials from browser
      localStorage.removeItem('asrtava_token');
      localStorage.removeItem('asrtava_refresh_token');
      localStorage.removeItem('asrtava_user');
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
  inviteStaff: (data: { hospitalId: string; email: string; phone?: string; firstName: string; lastName: string; roleIds: string[] }) =>
    apiClient.post('/auth/users/invite', data),
  loginOnboardingPortal: (data: { email: string; password?: string; projectCode: string }) =>
    apiClient.post('/onboarding/portal/login', data),
  activateAccount: (data: { token: string; password: string }) =>
    apiClient.post('/auth/activate-account', data),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    apiClient.post('/auth/change-password', data),
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
  posSale: (data: any) => apiClient.post('/pharmacy/pos', data),
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

export const lisAdvancedApi = {
  createDepartment: (data: any) => apiClient.post('/diagnostics/lis/advanced/departments', data),
  registerTestParameter: (data: any) => apiClient.post('/diagnostics/lis/advanced/parameters', data),
  accessionSpecimen: (data: any) => apiClient.post('/diagnostics/lis/advanced/specimens/accession', data),
  rejectSpecimen: (id: string, reason: string, notes?: string) =>
    apiClient.post(`/diagnostics/lis/advanced/specimens/${id}/reject`, { reason, notes }),
  recordResult: (data: any) => apiClient.post('/diagnostics/lis/advanced/results', data),
  validateResult: (id: string) => apiClient.post(`/diagnostics/lis/advanced/results/${id}/validate`),
  authorizeReport: (id: string) => apiClient.post(`/diagnostics/lis/advanced/results/${id}/authorize`),
  amendReport: (id: string, newValue: any, reason: string) =>
    apiClient.post(`/diagnostics/lis/advanced/results/${id}/amend`, { newValue, reason }),
  recordQcMeasurement: (data: any) => apiClient.post('/diagnostics/lis/advanced/qc/measurements', data),
};

export const risAdvancedApi = {
  registerModality: (data: any) => apiClient.post('/diagnostics/ris/advanced/modalities', data),
  createImagingOrder: (data: any) => apiClient.post('/diagnostics/ris/advanced/orders', data),
  scheduleAppointment: (data: any) => apiClient.post('/diagnostics/ris/advanced/appointments', data),
  recordPatientScreening: (data: any) => apiClient.post('/diagnostics/ris/advanced/screenings', data),
  indexPACSStudy: (data: any) => apiClient.post('/diagnostics/ris/advanced/pacs/studies', data),
  createReport: (data: any) => apiClient.post('/diagnostics/ris/advanced/reports', data),
  authorizeReport: (id: string) => apiClient.post(`/diagnostics/ris/advanced/reports/${id}/authorize`),
  amendReport: (id: string, addendumNotes: string) =>
    apiClient.post(`/diagnostics/ris/advanced/reports/${id}/amend`, { addendumNotes }),
  recordContrast: (data: any) => apiClient.post('/diagnostics/ris/advanced/contrast', data),
};

// ============================================================
// Billing, Invoicing & Payments
// ============================================================
export const billingApi = {
  createInvoice: (data: any) => apiClient.post('/billing/invoices', data),
  collectPayment: (data: any) => apiClient.post('/billing/payments', data),
  requestRefund: (data: any) => apiClient.post('/billing/refunds', data),
};

export const rcmAdvancedApi = {
  captureCharge: (data: any) => apiClient.post('/rcm/charges/capture', data),
  submitClaim: (data: any) => apiClient.post('/rcm/insurance/claims', data),
  generateLedgerReport: () => apiClient.get('/rcm/accounting/ledger-report'),
  splitSettlePayment: (data: any) => apiClient.post('/rcm/payments/split-settle', data),
  closeCashierShift: (data: any) => apiClient.post('/rcm/cashier/close', data),
};

export const pharmacyAdvancedApi = {
  searchDrugs: (search?: string) => apiClient.get('/pharmacy/advanced/drugs', { params: { search } }),
  registerDrug: (data: any) => apiClient.post('/pharmacy/advanced/drugs', data),
  checkSafety: (data: any) => apiClient.post('/pharmacy/advanced/safety/check', data),
  dispensePrescription: (data: any) => apiClient.post('/pharmacy/advanced/dispense', data),
  logColdChainBreach: (data: any) => apiClient.post('/pharmacy/advanced/coldchain/breach', data),
  recordNarcoticTransaction: (data: any) => apiClient.post('/pharmacy/advanced/narcotics/transaction', data),
};

export const hrmsAdvancedApi = {
  getMetrics: (hospitalId?: string) => apiClient.get('/hr/advanced/metrics', { params: { hospitalId } }),
  createEmployee: (data: any) => apiClient.post('/hr/advanced/employees', data),
  recordAttendancePunch: (data: any) => apiClient.post('/hr/advanced/attendance/punch', data),
  assignRoster: (data: any) => apiClient.post('/hr/advanced/rosters/shifts', data),
};

export const procurementAdvancedApi = {
  getMetrics: (hospitalId?: string) => apiClient.get('/procurement/advanced/metrics', { params: { hospitalId } }),
  registerVendor: (data: any) => apiClient.post('/procurement/advanced/vendors', data),
  createPurchaseOrder: (data: any) => apiClient.post('/procurement/advanced/orders', data),
  recordGoodsReceipt: (data: any) => apiClient.post('/procurement/advanced/goods-receipt', data),
};

export const qualityAdvancedApi = {
  reportIncident: (data: any) => apiClient.post('/quality/incidents', data),
  assignInvestigation: (id: string, data: any) => apiClient.post(`/quality/incidents/${id}/investigate`, data),
  performRca: (id: string, data: any) => apiClient.post(`/quality/incidents/${id}/rca`, data),
  createCapaAction: (id: string, data: any) => apiClient.post(`/quality/incidents/${id}/capa`, data),
};

export const analyticsAdvancedApi = {
  getExecutiveKpis: (params?: { beds?: number; days?: number }) =>
    apiClient.get('/analytics/advanced/executive-kpis', { params }),
  predictLace: (data: any) => apiClient.post('/analytics/advanced/predict/lace', data),
  predictNoShow: (data: any) => apiClient.post('/analytics/advanced/predict/noshow', data),
  predictBedSurge: (data: any) => apiClient.post('/analytics/advanced/predict/bed-surge', data),
};

export const telemedicineAdvancedApi = {
  getServices: () => apiClient.get('/telemedicine/services'),
  getDoctors: (params?: any) => apiClient.get('/telemedicine/doctors/discovery', { params }),
  scheduleSession: (data: any) => apiClient.post('/telemedicine/sessions/schedule', data),
  recordConsent: (data: any) => apiClient.post('/telemedicine/consent', data),
};

export const interopApi = {
  ingestHl7: (data: any) => apiClient.post('/interop/hl7/ingest', data),
  getCapabilityStatement: () => apiClient.get('/interop/fhir/$metadata'),
  getDevices: () => apiClient.get('/interop/devices'),
  mapTerminology: (data: any) => apiClient.post('/interop/terminology/map', data),
  submitPreauthorization: (data: any) => apiClient.post('/interop/insurance/preauth', data),
  approveDeviceResults: (packetId: string, data?: any) => apiClient.post(`/interop/devices/results/${packetId}/approve`, data),
};

export const federatedNetworkApi = {
  getParticipatingHospitals: (params?: any) => apiClient.get('/federated-network/participating-hospitals', { params }),
  publishBedAvailability: (data: any) => apiClient.post('/federated-network/bed-availability/publish', data),
  createTransfer: (data: any) => apiClient.post('/federated-network/transfers', data),
};

export const groupApi = {
  getOrganizations: () => apiClient.get('/groups/organizations'),
  getHierarchyTree: (orgId: string) => apiClient.get(`/groups/hierarchy-nodes/${orgId}`),
  getDashboardTelemetry: (orgId: string, params?: any) => apiClient.get(`/groups/dashboard/${orgId}`, { params }),
  requestLicenseExpansion: (data: any) => apiClient.post('/groups/licenses/expansion-request', data),
  getFinancialConsolidation: (orgId: string) => apiClient.get(`/groups/financial-consolidation/${orgId}`),
  initiateTransfer: (data: any) => apiClient.post('/groups/transfers', data),
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

export const otAdvancedApi = {
  getTheatres: (hospitalId?: string) => apiClient.get('/ot/advanced/theatres', { params: { hospitalId } }),
  registerTheatre: (data: any) => apiClient.post('/ot/advanced/theatres', data),
  scheduleSurgery: (data: any) => apiClient.post('/ot/advanced/schedules', data),
  recordWhoChecklist: (data: any) => apiClient.post('/ot/advanced/who-checklist', data),
  reconcileCounts: (data: any) => apiClient.post('/ot/advanced/surgical-counts', data),
  admitToPacu: (data: any) => apiClient.post('/ot/advanced/pacu/admit', data),
  evaluateAldreteScore: (data: any) => apiClient.post('/ot/advanced/pacu/aldrete-score', data),
  dischargeFromPacu: (data: any) => apiClient.post('/ot/advanced/pacu/discharge', data),
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

export const emergencyAdvancedApi = {
  registerEncounter: (data: any) => apiClient.post('/emergency/advanced/encounters', data),
  performTriage: (data: any) => apiClient.post('/emergency/advanced/triage', data),
  activateTraumaTeam: (data: any) => apiClient.post('/emergency/advanced/trauma-activations', data),
  recordResuscitation: (data: any) => apiClient.post('/emergency/advanced/resuscitation-checklist', data),
  placeStatOrder: (data: any) => apiClient.post('/emergency/advanced/stat-orders', data),
  registerMedicoLegalCase: (data: any) => apiClient.post('/emergency/advanced/medico-legal', data),
  dispatchAmbulance: (data: any) => apiClient.post('/emergency/advanced/ambulances/dispatch', data),
  transmitMobilePcr: (data: any) => apiClient.post('/emergency/advanced/ambulances/pcr', data),
  recordDisposition: (data: any) => apiClient.post('/emergency/advanced/dispositions', data),
};

// ============================================================
// Advanced Nursing Operations (Nursing Advanced)
// ============================================================
export const nursingAdvancedApi = {
  assignNurse: (data: any) => apiClient.post('/nursing/advanced/assignments', data),
  getWorkload: (nurseId: string) => apiClient.get(`/nursing/advanced/workload/${nurseId}`),
  recordVitals: (data: any) => apiClient.post('/nursing/advanced/vitals', data),
  acknowledgeVitalAlert: (alertId: string, actionNotes: string) =>
    apiClient.post(`/nursing/advanced/vitals/alerts/${alertId}/acknowledge`, { actionNotes }),
  recordAssessment: (data: any) => apiClient.post('/nursing/advanced/assessments', data),
  administerEmar: (data: any) => apiClient.post('/nursing/advanced/emar/administer', data),
  recordFluidBalance: (data: any) => apiClient.post('/nursing/advanced/fluid-balance', data),
  submitSbarHandover: (data: any) => apiClient.post('/nursing/advanced/sbar-handover', data),
  acknowledgeSbarHandover: (handoverId: string) =>
    apiClient.post(`/nursing/advanced/sbar-handover/${handoverId}/acknowledge`),
};

// ============================================================
// Advanced Ward & Bed Management (Ward Advanced)
// ============================================================
export const wardAdvancedApi = {
  getAvailabilityGrid: (hospitalId?: string) =>
    apiClient.get('/inpatient/ward/advanced/beds/availability', { params: { hospitalId } }),
  createAdmissionRequest: (data: any) => apiClient.post('/inpatient/ward/advanced/admission-requests', data),
  reserveBed: (data: any) => apiClient.post('/inpatient/ward/advanced/beds/reserve', data),
  formalizeAdmission: (data: any) => apiClient.post('/inpatient/ward/advanced/admissions', data),
  transferPatientBed: (data: any) => apiClient.post('/inpatient/ward/advanced/transfers', data),
  createHousekeepingTask: (data: any) => apiClient.post('/inpatient/ward/advanced/housekeeping/tasks', data),
  completeCleaningTask: (taskId: string, cleaningNotes?: string) =>
    apiClient.post(`/inpatient/ward/advanced/housekeeping/tasks/${taskId}/complete`, { cleaningNotes }),
  inspectAndReleaseBed: (data: any) => apiClient.post('/inpatient/ward/advanced/housekeeping/inspect', data),
  upsertDischargePlan: (data: any) => apiClient.post('/inpatient/ward/advanced/discharge-plan', data),
  executeDischarge: (data: any) => apiClient.post('/inpatient/ward/advanced/discharge/execute', data),
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
  onboardTenant: (data: any) => apiClient.post('/saas/super-admin/tenants', data),
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

// ============================================================
// Enterprise Customer Onboarding & Implementation Management
// ============================================================
export const onboardingApi = {
  getDashboard: () => apiClient.get('/onboarding/dashboard'),
  registerCustomer: (data: any) => apiClient.post('/onboarding/customers', data),
  createProject: (data: any) => apiClient.post('/onboarding/projects', data),
  transitionStage: (id: string, targetStage: string, notes?: string) =>
    apiClient.post(`/onboarding/projects/${id}/stage`, { targetStage, notes }),
  recordAssessment: (id: string, assessmentData: any) =>
    apiClient.post(`/onboarding/projects/${id}/assessment`, assessmentData),
  addRequirement: (id: string, data: any) =>
    apiClient.post(`/onboarding/projects/${id}/requirements`, data),
  dryRunMigration: (id: string, data: any) =>
    apiClient.post(`/onboarding/projects/${id}/migration/dry-run`, data),
  approveMigration: (jobId: string) =>
    apiClient.post(`/onboarding/migration/${jobId}/approve`),
  executeMigration: (jobId: string) =>
    apiClient.post(`/onboarding/migration/${jobId}/execute`),
  bulkOnboardStaff: (id: string, data: any) =>
    apiClient.post(`/onboarding/projects/${id}/staff/bulk`, data),
  submitDiscoverySection: (data: { hospitalId?: string; sectionNumber: number; payload: any }) =>
    apiClient.post('/onboarding/discovery/section', data),
  getDiscoverySections: (hospitalId: string) =>
    apiClient.get(`/onboarding/discovery/${hospitalId}`),
  generateBlueprint: (hospitalId: string) =>
    apiClient.post(`/onboarding/blueprint/${hospitalId}/generate`),
  getBlueprint: (hospitalId: string) =>
    apiClient.get(`/onboarding/blueprint/${hospitalId}`),
  signBlueprint: (hospitalId: string, data: { role: string; notes?: string }) =>
    apiClient.post(`/onboarding/blueprint/${hospitalId}/sign`, data),
  provisionStaff: (data: { hospitalId?: string; implementationId?: string; staffList: any[] }) =>
    apiClient.post('/onboarding/staff/provision', data),
  getStaffManifest: (hospitalId: string) =>
    apiClient.get(`/onboarding/staff/manifest/${hospitalId}`),
  createTrainingProgram: (id: string, data: any) =>
    apiClient.post(`/onboarding/projects/${id}/training/programs`, data),
  recordAttendance: (programId: string, data: any) =>
    apiClient.post(`/onboarding/training/${programId}/attendance`, data),
  createUatTestCase: (id: string, data: any) =>
    apiClient.post(`/onboarding/projects/${id}/uat/test-cases`, data),
  recordUatResult: (testCaseId: string, data: any) =>
    apiClient.post(`/onboarding/uat/${testCaseId}/result`, data),
  getReadiness: (id: string) =>
    apiClient.get(`/onboarding/projects/${id}/readiness`),
  verifyChecklistItem: (id: string, checkItemCode: string, notes?: string) =>
    apiClient.post(`/onboarding/projects/${id}/checklist/verify`, { checkItemCode, notes }),
  executeGoLive: (id: string, data: any) =>
    apiClient.post(`/onboarding/projects/${id}/go-live`, data),
  createHypercareTicket: (id: string, data: any) =>
    apiClient.post(`/onboarding/projects/${id}/hypercare/tickets`, data),
  resolveHypercareTicket: (ticketId: string, resolutionSummary: string) =>
    apiClient.post(`/onboarding/hypercare/${ticketId}/resolve`, { resolutionSummary }),
  handoverToSupport: (id: string) =>
    apiClient.post(`/onboarding/projects/${id}/handover`),
  getHospitalProgress: () =>
    apiClient.get('/onboarding/my-hospital/progress'),
};
